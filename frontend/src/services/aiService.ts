import { generateClient } from 'aws-amplify/data';
import { uploadData } from 'aws-amplify/storage';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Platform } from 'react-native';
import type { Schema } from '../../../backend/amplify/data/resource';
import { secureLogger } from '../security/SecureLogger';

// Upload a food image to S3 incoming/ path, return resolved s3Key.
// Native: pass file URI (file://) — read via fetch() (works on iOS + Android).
// Web canvas: pass raw base64 string (no data: prefix) — converted via atob.
export async function uploadFoodImage(
    source: { uri: string; contentType?: string } | { base64: string; contentType?: string }
): Promise<string> {
    const contentType = source.contentType || 'image/jpeg';
    const ext = contentType.includes('png') ? 'png' : 'jpg';
    const fileName = `${Date.now()}.${ext}`;

    let data: Uint8Array;
    if ('uri' in source) {
        // Use fetch to get a blob from the URI
        const response = await fetch(source.uri);
        const blob = await response.blob();
        
        // Use FileReader to get ArrayBuffer (more compatible with RN/Hermes)
        data = await new Promise<Uint8Array>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const arrayBuffer = reader.result as ArrayBuffer;
                resolve(new Uint8Array(arrayBuffer));
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
        });
    } else {
        // Web canvas: raw base64 string (no data: prefix)
        data = Uint8Array.from(atob(source.base64), c => c.charCodeAt(0));
    }

    const session = await fetchAuthSession();
    const identityId = session.identityId;
    if (!identityId) throw new Error('No identityId — cannot upload image');

    const imgPath = `incoming/${identityId}/${fileName}`;
    const result = await uploadData({
        path: imgPath,
        data,
        options: { contentType },
    }).result;
    return (result as any).path || imgPath;
}

function extractAndParseJSON(text: string): any {
    // Try to find code block first
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
       return JSON.parse(jsonMatch[1]);
    }
    // Try to find the first { and last } or first [ and last ]
    const startObj = text.indexOf('{');
    const endObj = text.lastIndexOf('}');
    const startArr = text.indexOf('[');
    const endArr = text.lastIndexOf(']');

    if (startObj !== -1 && endObj !== -1 && (startArr === -1 || startObj < startArr)) {
        return JSON.parse(text.substring(startObj, endObj + 1));
    }
    if (startArr !== -1 && endArr !== -1) {
        return JSON.parse(text.substring(startArr, endArr + 1));
    }
    // Fallback: remove backticks
    const cleaned = text.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
}

let client: ReturnType<typeof generateClient<Schema>>;

function getClient() {
    if (!client) {
        client = generateClient<Schema>();
    }
    return client;
}

export interface IngredientItem {
    name: string; // Keep legacy name for backward compatibility
    name_en?: string;
    name_vi?: string;
    note_en?: string;
    note_vi?: string;
    amount?: string;
    estimated_g?: number;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    food_id?: string | null;
    matched?: boolean;
    source?: 'database' | 'ai_estimated';
}

export interface NutritionInfo {
    name: string; // Keep legacy name for backward compatibility
    name_en?: string;
    name_vi?: string;
    category_en?: string;
    category_vi?: string;
    cooking_method_en?: string;
    cooking_method_vi?: string;
    allergens_en?: string[];
    allergens_vi?: string[];
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize?: string;
    portion_size?: string;
    ingredients?: IngredientItem[];
    db_match_count?: number;
    ai_fallback_count?: number;
}

export interface FoodAnalysisResult {
    success: boolean;
    data?: NutritionInfo;
    error?: string;
}

export interface VoiceAnalysisData {
    intent: 'log_food' | 'ask_coach' | 'log_water' | 'unknown';
    food_data?: NutritionInfo;
    water_ml?: number;
    coach_query?: string;
    message?: string;
}

export interface VoiceAnalysisResult {
    success: boolean;
    data?: VoiceAnalysisData;
    error?: string;
}

export interface FoodSuggestion {
    name: string;
    description: string;
    calories: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
    time?: string;
    ingredients?: { name: string; amount: string }[];
    steps?: { title: string; instruction: string }[];
    emoji: string;
}

export interface ExerciseSuggestion {
    name: string;
    description: string;
    duration_minutes: number;
    calories_burned: number;
    emoji: string;
}

export interface StatsCard {
    calories_consumed: number;
    calories_target: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    summary: string;
}

export interface CoachResponse {
    success: boolean;
    text?: string;
    foodSuggestions?: FoodSuggestion[];
    exerciseSuggestions?: ExerciseSuggestion[];
    statsCard?: StatsCard;
    /** @deprecated Use foodSuggestions array instead */
    foodSuggestion?: FoodSuggestion;
    error?: string;
}

export interface OllieTipResponse {
    success: boolean;
    data?: {
        tip_vi: string;
        tip_en: string;
        mood: 'celebrate' | 'encourage' | 'suggest' | 'neutral';
        suggested_food_vi?: string;
        suggested_food_en?: string;
    };
    error?: string;
}

export interface RecipeItem {
    dish_name_vi: string;
    dish_name_en: string;
    why_this_vi: string;
    why_this_en: string;
    cooking_time_min: number;
    difficulty: 'easy' | 'medium' | 'hard';
    ingredients_from_fridge: { name: string; weight_g: number }[];
    need_to_buy: string[];
    macros: { calories: number; protein_g: number; carbs_g: number; fat_g: number };
    steps_vi: string[];
    steps_en: string[];
    tip_vi: string;
    tip_en: string;
}

export interface RecipeResponse {
    success: boolean;
    data?: {
        recipes: RecipeItem[];
        overall_tip_vi: string;
        overall_tip_en: string;
    };
    error?: string;
}

export interface MacroTargets {
    daily_calories: number;
    daily_protein_g: number;
    daily_carbs_g: number;
    daily_fat_g: number;
    reasoning_vi: string;
    reasoning_en: string;
}

export interface MacroResponse {
    success: boolean;
    data?: MacroTargets;
    error?: string;
}

export interface WeeklyInsightResponse {
    success: boolean;
    data?: {
        insight_vi: string;
        insight_en: string;
        status: 'success' | 'insufficient_data';
        summary?: string;
        insight?: string;
    };
    error?: string;
}

/**
 * Analyze food image using Bedrock Vision through AWS Lambda.
 * Accepts an s3Key (already uploaded) — image never travels through AppSync.
 */
export async function analyzeFoodImage(s3Key: string): Promise<FoodAnalysisResult> {
    try {
        const result = await getClient().queries.scanImage({
            action: 'analyzeFoodImage',
            payload: JSON.stringify({ s3Key })
        });

        if (result.errors || !result.data) {
            secureLogger.error('Amplify GraphQL Errors:', { errors: result.errors });
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const rawData = extractAndParseJSON(responseObj.text);

        return {
            success: true,
            data: convertAiToNutritionInfo(rawData),
        };
    } catch (error) {
        secureLogger.error('Bedrock image analysis error', { error: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to analyze image',
        };
    }
}

export async function analyzeFoodLabel(s3Key: string): Promise<FoodAnalysisResult> {
    try {
        const result = await getClient().queries.scanImage({
            action: 'analyzeFoodLabel',
            payload: JSON.stringify({ s3Key })
        });

        if (result.errors || !result.data) {
            secureLogger.error('Amplify GraphQL Errors:', { errors: result.errors });
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const rawData = extractAndParseJSON(responseObj.text);
        return { success: true, data: convertAiToNutritionInfo(rawData) };
    } catch (error) {
        secureLogger.error('Food label analysis error', { error: error instanceof Error ? error.message : String(error) });
        return { success: false, error: error instanceof Error ? error.message : 'Failed to analyze label' };
    }
}

export async function scanBarcode(s3Key: string): Promise<FoodAnalysisResult> {
    try {
        const result = await getClient().queries.scanImage({
            action: 'scanBarcode',
            payload: JSON.stringify({ s3Key })
        });

        if (result.errors || !result.data) {
            secureLogger.error('Amplify GraphQL Errors:', { errors: result.errors });
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const rawData = extractAndParseJSON(responseObj.text);
        return { success: true, data: convertAiToNutritionInfo(rawData) };
    } catch (error) {
        secureLogger.error('Barcode scan error', { error: error instanceof Error ? error.message : String(error) });
        return { success: false, error: error instanceof Error ? error.message : 'Failed to scan barcode' };
    }
}

/** Convert webm base64 → wav base64 using Web Audio API (for Transcribe compatibility) */
async function convertWebmToWav(base64Webm: string): Promise<string> {
    const bin = atob(base64Webm);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
    const ch = audioBuffer.getChannelData(0);
    const sr = audioBuffer.sampleRate;
    const pcmLen = ch.length * 2; // 16-bit PCM
    const buf = new ArrayBuffer(44 + pcmLen);
    const v = new DataView(buf);

    const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    ws(0, 'RIFF'); v.setUint32(4, 36 + pcmLen, true);
    ws(8, 'WAVE'); ws(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true);
    v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    ws(36, 'data'); v.setUint32(40, pcmLen, true);

    let off = 44;
    for (let i = 0; i < ch.length; i++, off += 2) {
        const s = Math.max(-1, Math.min(1, ch[i]));
        v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }

    const wavBytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < wavBytes.length; i++) binary += String.fromCharCode(wavBytes[i]);
    ctx.close();
    return btoa(binary);
}

/**
 * Upload audio to S3, transcribe with AWS Transcribe, parse with Qwen on Bedrock.
 * Returns transcript + nutrition data in one call.
 */
export async function voiceToFood(audioUri: string): Promise<FoodAnalysisResult & { transcript?: string }> {
    try {
        // Step 1: Read audio file via fetch to get a Blob (works for file:// on Native and blob: on Web)
        const response = await fetch(audioUri);
        const blob = await response.blob();
        
        // Step 2: Convert Blob to Uint8Array for Amplify Storage
        const data = await new Promise<Uint8Array>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const arrayBuffer = reader.result as ArrayBuffer;
                resolve(new Uint8Array(arrayBuffer));
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
        });

        // Step 3: Determine format — web records webm, native records m4a
        const isWeb = Platform.OS === 'web';
        const ext = isWeb ? 'webm' : 'm4a';
        const contentType = isWeb ? 'audio/webm' : 'audio/mp4';
        const fileName = `${Date.now()}.${ext}`;
        const voicePath = `voice/${fileName}`;
        const uploadResult = await uploadData({
            path: voicePath,
            data,
            options: { contentType },
        }).result;

        const resolvedKey = (uploadResult as any).path || voicePath;

        // Step 3: Call Lambda — Transcribe + Qwen in one shot
        const result = await getClient().queries.aiEngine({
            action: 'voiceToFood',
            payload: JSON.stringify({ s3Key: resolvedKey }),
        });

        if (result.errors || !result.data) {
            secureLogger.error('Amplify GraphQL Errors:', { errors: result.errors });
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const rawData = extractAndParseJSON(responseObj.text);

        // Voice response wraps food in food_data; fall back to items[] or root for other formats
        let aiData = rawData;
        if (rawData.food_data && typeof rawData.food_data === 'object') {
            aiData = rawData.food_data;
        } else if (rawData.items && Array.isArray(rawData.items) && rawData.items.length > 0) {
            aiData = rawData.items[0];
        }

        // Handle clarification: AI muốn hỏi thêm nhưng vẫn có food_data tạm → dùng luôn
        if (rawData.action === 'clarify') {
            const hasFoodData = rawData.food_data && typeof rawData.food_data === 'object';
            if (hasFoodData) {
                return {
                    success: true,
                    transcript: responseObj.transcript,
                    data: convertAiToNutritionInfo(aiData),
                };
            }
            return {
                success: false,
                transcript: responseObj.transcript,
                error: rawData.clarification_question_vi || rawData.clarification_question_en || 'Vui lòng nói rõ hơn món ăn bạn muốn ghi nhận.',
            };
        }

        return {
            success: true,
            transcript: responseObj.transcript,
            data: convertAiToNutritionInfo(aiData),
        };
    } catch (error) {
        secureLogger.error('Voice to food error', { error: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to process voice input',
        };
    }
}

/**
 * Search for food and get enriched nutrition info through AI + DB verification
 * Fast Path: query Food DB first, fallback to Bedrock AI.
 */
export async function generateFood(foodName: string): Promise<FoodAnalysisResult> {
    try {
        // Step 1: FAST PATH - Search DB directly
        try {
            const fastResult = await getClient().queries.processNutrition({
                payload: JSON.stringify({ action: 'directSearch', query: foodName })
            });

            if (!fastResult.errors && fastResult.data) {
                const fastResponse = JSON.parse(fastResult.data);
                if (fastResponse.success && fastResponse.items?.length > 0) {
                    secureLogger.debug(`Fast path: Found food in DB directly`);
                    return formatProcessedResult(fastResponse.items[0]);
                }
            }
        } catch (fastErr) {
            secureLogger.warning('Fast DB search failed, falling back to AI');
        }

        secureLogger.debug(`Slow path: food not found in DB, asking Bedrock`);

        // Step 2: Ask Bedrock for ingredient breakdown + estimated nutrition
        const aiResult = await getClient().queries.aiEngine({
            action: 'generateFood',
            payload: JSON.stringify({ foodName })
        });

        if (aiResult.errors || !aiResult.data) {
            secureLogger.error('Amplify GraphQL Errors:', { errors: aiResult.errors });
            return { success: false, error: 'GraphQL error occurred' };
        }

        const aiResponse = JSON.parse(aiResult.data);
        if (!aiResponse.success) {
            return { success: false, error: aiResponse.error };
        }

        const aiData = extractAndParseJSON(aiResponse.text);

        // Step 3: Send AI data to processNutrition Lambda for DB verification
        const processResult = await getClient().queries.processNutrition({
            payload: JSON.stringify(aiData)
        });

        if (processResult.errors || !processResult.data) {
            secureLogger.debug('processNutrition failed, falling back to AI data');
            return {
                success: true,
                data: convertAiToNutritionInfo(aiData),
            };
        }

        const processedResponse = JSON.parse(processResult.data);
        if (!processedResponse.success || !processedResponse.items?.length) {
            return {
                success: true,
                data: convertAiToNutritionInfo(aiData),
            };
        }

        return formatProcessedResult(processedResponse.items[0]);
    } catch (error) {
        secureLogger.error('Search food nutrition error', { error: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search food',
        };
    }
}

/**
 * Helper: format processed DB item to NutritionInfo format
 */
function formatProcessedResult(item: any): FoodAnalysisResult {
    return {
        success: true,
        data: {
            name: item.meal_name,
            calories: item.total_calories,
            protein: item.total_protein_g,
            carbs: item.total_carbs_g,
            fat: item.total_fat_g,
            portion_size: item.portion_size,
            ingredients: item.ingredients.map((ing: any) => ({
                name: ing.name,
                amount: `${ing.estimated_g}g`,
                estimated_g: ing.estimated_g,
                calories: ing.calories,
                protein_g: ing.protein_g,
                carbs_g: ing.carbs_g,
                fat_g: ing.fat_g,
                food_id: ing.food_id,
                matched: ing.matched,
                source: ing.source,
            })),
            db_match_count: item.db_match_count,
            ai_fallback_count: item.ai_fallback_count,
        },
    };
}

/**
 * Helper: convert raw AI response to NutritionInfo format (fallback)
 * Handles both processNutrition format (flat) and Qwen direct format (macros.*. name_vi/name_en)
 */
function convertAiToNutritionInfo(aiData: any): NutritionInfo {
    const macros = aiData.macros || {};
    const serving = aiData.serving || {};
    return {
        name: aiData.meal_name || aiData.name || aiData.name_vi || aiData.name_en || 'Unknown',
        name_vi: aiData.name_vi,
        name_en: aiData.name_en,
        calories: aiData.total_calories || aiData.calories || macros.calories || 0,
        protein: aiData.total_protein_g || aiData.protein || macros.protein_g || 0,
        carbs: aiData.total_carbs_g || aiData.carbs || macros.carbs_g || 0,
        fat: aiData.total_fat_g || aiData.fat || macros.fat_g || 0,
        portion_size: aiData.portion_size || (serving.default_g ? `${serving.default_g}g` : undefined),
        ingredients: (aiData.ingredients || []).map((ing: any) => ({
            name: ing.name_vi || ing.name_en || ing.name || '',
            name_vi: ing.name_vi,
            name_en: ing.name_en,
            amount: ing.weight_g ? `${ing.weight_g}g` : ing.estimated_g ? `${ing.estimated_g}g` : ing.amount,
            estimated_g: ing.weight_g || ing.estimated_g,
            calories: ing.calories,
            protein_g: ing.protein_g,
            carbs_g: ing.carbs_g,
            fat_g: ing.fat_g,
            source: 'ai_estimated' as const,
        })),
    };
}

/**
 * Fix/correct a logged food item based on user instructions
 */
export async function fixFood(currentFoodJson: any, correctionQuery: string): Promise<FoodAnalysisResult> {
    try {
        const result = await getClient().queries.aiEngine({
            action: 'fixFood',
            payload: JSON.stringify({ currentFoodJson, correctionQuery }),
        });

        if (result.errors || !result.data) {
            secureLogger.error('Amplify GraphQL Errors:', { errors: result.errors });
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const rawData = extractAndParseJSON(responseObj.text);
        if (rawData.error === 'not_food') {
            return { success: false, error: rawData.message_en || rawData.message_vi };
        }

        return { success: true, data: convertAiToNutritionInfo(rawData) };
    } catch (error) {
        secureLogger.error('Fix food error', { error: error instanceof Error ? error.message : String(error) });
        return { success: false, error: error instanceof Error ? error.message : 'Failed to fix food' };
    }
}

/**
 * Get a quick Ollie coach tip based on user context
 */
export async function getOllieTip(context: string): Promise<OllieTipResponse> {
    try {
        const result = await getClient().queries.aiEngine({
            action: 'ollieCoachTip',
            payload: JSON.stringify({ context }),
        });

        if (result.errors || !result.data) {
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const data = extractAndParseJSON(responseObj.text);
        return { success: true, data };
    } catch (error) {
        secureLogger.error('Ollie tip error', { error: error instanceof Error ? error.message : String(error) });
        return { success: false, error: error instanceof Error ? error.message : 'Failed to get tip' };
    }
}

/**
 * Generate recipes from fridge inventory and nutrition goals
 */
export async function generateRecipe(
    inventoryText: string,
    expiringText: string,
    nutritionGoal: string,
    servings: number
): Promise<RecipeResponse> {
    try {
        const result = await getClient().queries.aiEngine({
            action: 'generateRecipe',
            payload: JSON.stringify({ inventoryText, expiringText, nutritionGoal, servings }),
        });

        if (result.errors || !result.data) {
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const data = extractAndParseJSON(responseObj.text);
        return { success: true, data };
    } catch (error) {
        secureLogger.error('Generate recipe error', { error: error instanceof Error ? error.message : String(error) });
        return { success: false, error: error instanceof Error ? error.message : 'Failed to generate recipes' };
    }
}

/**
 * Calculate daily macro targets from user profile
 */
export async function calculateMacros(userProfileJson: any): Promise<MacroResponse> {
    try {
        const result = await getClient().queries.aiEngine({
            action: 'calculateMacros',
            payload: JSON.stringify({ userProfileJson }),
        });

        if (result.errors || !result.data) {
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const data = extractAndParseJSON(responseObj.text);
        return { success: true, data };
    } catch (error) {
        secureLogger.error('Calculate macros error', { error: error instanceof Error ? error.message : String(error) });
        return { success: false, error: error instanceof Error ? error.message : 'Failed to calculate macros' };
    }
}

/**
 * Generate weekly nutrition insight
 */
export async function getWeeklyInsight(
    userProfileJson: any,
    weeklySummaryJson: any,
    notablePatterns: string
): Promise<WeeklyInsightResponse> {
    try {
        const result = await getClient().queries.aiEngine({
            action: 'weeklyInsight',
            payload: JSON.stringify({ userProfileJson, weeklySummaryJson, notablePatterns }),
        });

        if (result.errors || !result.data) {
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const data = extractAndParseJSON(responseObj.text);
        return { success: true, data };
    } catch (error) {
        secureLogger.error('Weekly insight error', { error: error instanceof Error ? error.message : String(error) });
        return { success: false, error: error instanceof Error ? error.message : 'Failed to get weekly insight' };
    }
}

/**
 * Generate AI Coach response through Bedrock Lambda
 */
export async function generateCoachResponse(
    userMessage: string,
    chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
    contextString: string
): Promise<CoachResponse> {
    try {
        const result = await getClient().queries.aiEngine({
            action: 'generateCoachResponse',
            payload: JSON.stringify({ userMessage, chatHistory, contextString })
        });

        if (result.errors || !result.data) {
            secureLogger.error('Amplify GraphQL Errors:', { errors: result.errors });
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const text = responseObj.text;

        // Extract all FOOD_CARDs
        const foodSuggestions: FoodSuggestion[] = [];
        const foodMatches = text.matchAll(/(?:\[FOOD_CARD:\s*(\{[\s\S]*?\})\s*\]|===FOOD_CARD_START===\s*([\s\S]*?)\s*===FOOD_CARD_END===)/g);
        for (const match of foodMatches) {
            try {
                const rawJson = match[1] || match[2];
                if (!rawJson) continue;
                const cleanJson = rawJson.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
                foodSuggestions.push(JSON.parse(cleanJson));
            } catch (e) {
                secureLogger.error('Failed to parse food card JSON');
            }
        }

        // Extract all EXERCISE_CARDs
        const exerciseSuggestions: ExerciseSuggestion[] = [];
        const exerciseMatches = text.matchAll(/(?:\[EXERCISE_CARD:\s*(\{[\s\S]*?\})\s*\]|===EXERCISE_CARD_START===\s*([\s\S]*?)\s*===EXERCISE_CARD_END===)/g);
        for (const match of exerciseMatches) {
            try {
                const rawJson = match[1] || match[2];
                if (!rawJson) continue;
                const cleanJson = rawJson.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
                exerciseSuggestions.push(JSON.parse(cleanJson));
            } catch (e) {
                secureLogger.error('Failed to parse exercise card JSON');
            }
        }

        // Extract STATS_CARD (only one per response)
        let statsCard: StatsCard | undefined;
        const statsMatch = text.match(/(?:\[STATS_CARD:\s*(\{[\s\S]*?\})\s*\]|===STATS_CARD_START===\s*([\s\S]*?)\s*===STATS_CARD_END===)/);
        if (statsMatch) {
            try {
                const rawJson = statsMatch[1] || statsMatch[2];
                if (rawJson) {
                    const cleanJson = rawJson.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
                    statsCard = JSON.parse(cleanJson);
                }
            } catch (e) {
                secureLogger.error('Failed to parse stats card JSON');
            }
        }

        // Clean text (remove all card tags + stray JSON/markdown artifacts)
        const cleanedText = text
            .replace(/\[FOOD_CARD:\s*\{[\s\S]*?\}\s*\]/g, '')
            .replace(/===FOOD_CARD_START===[\s\S]*?===FOOD_CARD_END===/g, '')
            .replace(/\[EXERCISE_CARD:\s*\{[\s\S]*?\}\s*\]/g, '')
            .replace(/===EXERCISE_CARD_START===[\s\S]*?===EXERCISE_CARD_END===/g, '')
            .replace(/\[STATS_CARD:\s*\{[\s\S]*?\}\s*\]/g, '')
            .replace(/===STATS_CARD_START===[\s\S]*?===STATS_CARD_END===/g, '')
            // Strip markdown code fences (```json ... ``` or ``` ... ```)
            .replace(/```(?:json|javascript|js)?\s*\n?([\s\S]*?)```/g, '')
            // Strip standalone JSON objects that Qwen sometimes outputs raw
            .replace(/^\s*\{[\s\S]*\}\s*$/gm, '')
            .trim();

        return {
            success: true,
            text: cleanedText,
            foodSuggestions: foodSuggestions.length > 0 ? foodSuggestions : undefined,
            exerciseSuggestions: exerciseSuggestions.length > 0 ? exerciseSuggestions : undefined,
            statsCard,
            foodSuggestion: foodSuggestions[0], // backward compat
        };
    } catch (error) {
        secureLogger.error('Bedrock coach error', { error: error instanceof Error ? error.message : String(error) });
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get coach response',
        };
    }
}
