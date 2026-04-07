import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const REGION = "ap-southeast-2";
const s3Client = new S3Client({ region: REGION });

const STORAGE_BUCKET = process.env.STORAGE_BUCKET_NAME || "";
const ECS_BASE_URL = process.env.ECS_BASE_URL || "http://nutritrack-api-vpc-alb-1060755902.ap-southeast-2.elb.amazonaws.com";
const IS_DEBUG = process.env.DEBUG === "true" || process.env.NODE_ENV === "development";

const debug = (message: string, data?: any) => {
  if (IS_DEBUG) {
    console.log(`[scan-image] ${message}`, data || "");
  }
};

const ACTION_TO_ENDPOINT: Record<string, string> = {
  analyzeFoodImage: "/analyze-food?method=tools",
  analyzeFoodLabel: "/analyze-label",
  scanBarcode: "/scan-barcode",
};

interface GENFOODMacros {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  saturated_fat_g: number;
  polyunsaturated_fat_g: number;
  monounsaturated_fat_g: number;
  fiber_g: number;
  sugar_g: number;
  sodium_mg: number;
  cholesterol_mg: number;
  potassium_mg: number;
}

interface GENFOODMicronutrients {
  calcium_mg: number;
  iron_mg: number;
  vitamin_a_ug: number;
  vitamin_c_mg: number;
}

interface GENFOODServing {
  default_g: number;
  unit: string;
  portions?: Record<string, number>;
}

interface GENFOODIngredient {
  name_vi: string;
  name_en: string;
  weight_g: number;
}

interface GENFOOD {
  food_id: string;
  name_vi: string;
  name_en: string;
  macros: GENFOODMacros;
  micronutrients: GENFOODMicronutrients;
  serving: GENFOODServing;
  ingredients: GENFOODIngredient[];
  verified: boolean;
  source: string;
}

// Normalize ECS response to GEN_FOOD schema
function normalizeToGENFOOD(ecsBody: any): GENFOOD {
  const dish = ecsBody?.data?.dishes?.[0];
  if (!dish) {
    throw new Error("No food detected in image");
  }

  const n = dish.nutritions || {};
  return {
    food_id: "custom_gen_temp",
    name_vi: dish.name || "Unknown Food",
    name_en: dish.name || "Unknown Food",
    macros: {
      calories: Number(n.calories) || 0,
      protein_g: Number(n.protein) || 0,
      carbs_g: Number(n.carbs) || 0,
      fat_g: Number(n.fat) || 0,
      saturated_fat_g: 0,
      polyunsaturated_fat_g: 0,
      monounsaturated_fat_g: 0,
      fiber_g: 0,
      sugar_g: 0,
      sodium_mg: 0,
      cholesterol_mg: 0,
      potassium_mg: 0,
    },
    micronutrients: {
      calcium_mg: 0,
      iron_mg: 0,
      vitamin_a_ug: 0,
      vitamin_c_mg: 0,
    },
    serving: {
      default_g: Number(dish.weight || dish.serving_value) || 0,
      unit: dish.serving_unit || "serving",
      portions: { small: 0.7, medium: 1.0, large: 1.3 },
    },
    ingredients: (dish.ingredients || []).map((ing: any) => ({
      name_vi: ing.name || "Ingredient",
      name_en: ing.name || "Ingredient",
      weight_g: Number(ing.weight) || 0,
    })),
    verified: false,
    source: "ECS Scan",
  };
}

export const handler = async (event: any) => {
  try {
    const { action, payload } = event.arguments;

    debug("Handler invoked", { action, hasPayload: !!payload });

    // Validate action
    if (!ACTION_TO_ENDPOINT[action]) {
      return JSON.stringify({
        success: false,
        error: `Unknown action: ${action}`,
      });
    }

    // Parse payload
    let s3Key: string;
    try {
      const parsed = JSON.parse(payload || "{}");
      s3Key = parsed.s3Key;
    } catch (e) {
      return JSON.stringify({
        success: false,
        error: "Invalid payload JSON",
      });
    }

    // Validate s3Key
    if (!s3Key || typeof s3Key !== "string") {
      return JSON.stringify({
        success: false,
        error: "Missing or invalid s3Key in payload",
      });
    }

    if (s3Key.includes("..")) {
      return JSON.stringify({
        success: false,
        error: "Invalid s3Key: path traversal not allowed",
      });
    }

    debug("Downloading image from S3", { s3Key });

    // Download image from S3
    const s3Response = await s3Client.send(
      new GetObjectCommand({
        Bucket: STORAGE_BUCKET,
        Key: s3Key,
      })
    );

    // Stream body to buffer
    const chunks: Uint8Array[] = [];
    const stream = s3Response.Body;
    if (!stream) {
      throw new Error("Failed to read S3 object");
    }

    for await (const chunk of stream as any) {
      chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk));
    }

    const imageBuffer = Buffer.concat(chunks);
    const contentType = s3Response.ContentType || "image/jpeg";

    debug("Image downloaded", {
      size: imageBuffer.length,
      contentType,
    });

    // Build FormData with Blob
    const blob = new Blob([imageBuffer], { type: contentType });
    const form = new FormData();
    form.append("file", blob, "upload.jpg");

    // Call ECS
    const endpoint = ACTION_TO_ENDPOINT[action];
    const ecsUrl = `${ECS_BASE_URL}${endpoint}`;

    debug("Calling ECS", { ecsUrl });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 140_000); // 140s timeout

    let ecsResponse: Response;
    try {
      ecsResponse = await fetch(ecsUrl, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!ecsResponse.ok) {
      const errorBody = await ecsResponse.text();
      let errorDetail = "Analysis failed";
      try {
        const errorJson = JSON.parse(errorBody);
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // Ignore parse errors, use generic message
      }
      return JSON.stringify({
        success: false,
        error: `ECS error: ${errorDetail}`,
      });
    }

    const ecsBody = await ecsResponse.json();

    debug("ECS response received", { success: ecsBody.success });

    // Normalize response
    const genfood = normalizeToGENFOOD(ecsBody);

    return JSON.stringify({
      success: true,
      text: JSON.stringify(genfood),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[scan-image] Error:", errorMessage, error);

    if (errorMessage.includes("NoSuchKey")) {
      return JSON.stringify({
        success: false,
        error: "Image not found in S3",
      });
    }

    if (
      errorMessage.includes("AbortError") ||
      errorMessage.includes("timeout")
    ) {
      return JSON.stringify({
        success: false,
        error: "Image processing service unavailable (timeout)",
      });
    }

    if (errorMessage.includes("ECONNREFUSED")) {
      return JSON.stringify({
        success: false,
        error: "Image processing service unavailable (connection refused)",
      });
    }

    return JSON.stringify({
      success: false,
      error: errorMessage,
    });
  }
};
