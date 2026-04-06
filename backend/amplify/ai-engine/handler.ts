import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { TranscribeClient, StartTranscriptionJobCommand, GetTranscriptionJobCommand, DeleteTranscriptionJobCommand } from "@aws-sdk/client-transcribe";
import { S3Client, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient, ListTablesCommand } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const REGION = "ap-southeast-2";
const bedrockClient = new BedrockRuntimeClient({ region: REGION });
const transcribeClient = new TranscribeClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });
const dbClient = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(dbClient);

const QWEN_MODEL_ID = process.env.QWEN_MODEL_ID || "qwen.qwen3-vl-235b-a22b";
const STORAGE_BUCKET = process.env.STORAGE_BUCKET_NAME || "";
const IS_DEBUG = process.env.DEBUG === "true" || process.env.NODE_ENV === "development";

// Simple debug logger - respects DEBUG env var
const debug = (message: string, data?: any) => {
  if (IS_DEBUG) {
    console.log(`[ai-engine] ${message}`, data || "");
  }
};

// ═══════════════════════════════════════════════════════════════
// PROMPTS (from docs/prompts)
// ═══════════════════════════════════════════════════════════════

const GEN_FOOD_SYSTEM_PROMPT = `You are Ollie, an expert AI nutrition assistant for the NutriTrack app.
A user has searched for a food, dish, or meal that is NOT in our local database, or provided an image. Your job is to analyze the food and estimate its ingredients, standard portion size, macros, and micronutrients.

RULES:
1. Break down the meal into its core raw ingredients. (e.g., "Boiled Potatoes and Pan seared chicken" -> Potatoes, Chicken Breast, Olive Oil, etc.).
2. Estimate a standard, medium portion size for the ENTIRE dish/meal.
3. Provide estimated macros and micronutrients reflecting that portion size.
4. CALORIES: Ensure (Protein*4 + Carbs*4 + Fat*9) roughly matches the total calories.
5. Provide the food name and ingredients in BOTH Vietnamese (name_vi) and English (name_en).
6. Tone: Vietnamese casual (ê, nhé, nha), encouraging, practical. Use emojis sparingly (💪🔥).
7. Output STRICT JSON format only. NO markdown blocks (\`\`\`json), no conversational text.

EDGE CASE:
- If the input is clearly NOT a food, beverage, or edible item: return exactly:
{"error": "not_food", "message_vi": "Vui lòng nhập một món ăn hoặc nguyên liệu hợp lệ.", "message_en": "Please enter a valid food or ingredient."}

OUTPUT SCHEMA:
{
  "food_id": "custom_gen_temp",
  "name_vi": "Tên tiếng Việt",
  "name_en": "English Name",
  "macros": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "saturated_fat_g": 0, "polyunsaturated_fat_g": 0, "monounsaturated_fat_g": 0, "fiber_g": 0, "sugar_g": 0, "sodium_mg": 0, "cholesterol_mg": 0, "potassium_mg": 0 },
  "micronutrients": { "calcium_mg": 0, "iron_mg": 0, "vitamin_a_ug": 0, "vitamin_c_mg": 0 },
  "serving": { "default_g": 0, "unit": "bowl | plate | serving | piece", "portions": { "small": 0.7, "medium": 1.0, "large": 1.3 } },
  "ingredients": [ { "name_vi": "Tên nguyên liệu", "name_en": "Ingredient Name", "weight_g": 0 } ],
  "verified": false, "source": "AI Generated"
}`;

const FIX_FOOD_SYSTEM_PROMPT = `You are Ollie, an expert AI nutritionist for NutriTrack.
Your task is to correct a logged food item based on user instructions.

RULES:
1. ARITHMETIC: If ingredients or weights change, recalculate ALL macros/micronutrients.
2. CALORIES: Ensure (Protein*4 + Carbs*4 + Fat*9) roughly matches the new total.
3. PERSONALITY: Cool, Gen-Z Vietnamese (ê, nhé, nha).
4. Output STRICT JSON format only. NO markdown blocks (\`\`\`json).

EDGE CASE:
- If request is nonsense/non-food: return {"error": "not_food", "message_vi": "Nhập yêu cầu sửa món cho đúng nè!", "message_en": "Please enter a valid correction request!"}

OUTPUT SCHEMA: Same as GEN_FOOD (with "source": "AI Fixed").`;

const VOICE_SYSTEM_PROMPT = `You are Ollie, a cool AI nutrition assistant for NutriTrack.
You understand both Vietnamese (casual) and English.

YOUR TASK:
When the user describes a meal via voice/text transcription, analyze and log it.

RULES:
1. DETECT language (vi or en).
2. IDENTIFY food items, ingredients, and estimated weight in grams.
3. PORTION: small | medium | large. Default: "medium".
4. RESPONSE: If user speaks Vietnamese → respond/clarify in casual Vietnamese (nha, nhé, nè).
5. DATABASE: If food matches NutriTrack DB → set "in_database": true.
6. CLARIFICATION: Ask ONE short question if ambiguous (e.g. "Phở bò hay phở gà nè?").
7. Output STRICT JSON format only. NO markdown blocks (\`\`\`json).

ERROR HANDLING:
- Unintelligible or Non-food input: return action="clarify". NEVER log non-food.
- Example: "Cho tớ cái máy bay" -> action="clarify", clarification_question_vi="Máy bay hông ăn được nha! Log món khác đi nè."

OUTPUT SCHEMA:
{
  "action": "log" | "clarify",
  "detected_language": "vi" | "en",
  "meal_type": "breakfast | lunch | dinner | snack",
  "in_database": true/false,
  "confidence": 0.0 to 1.0,
  "clarification_question_vi": "Câu hỏi tiếng Việt hoặc null",
  "clarification_question_en": "English question or null",
  "food_data": {
      "food_id": "ID or custom_gen_temp",
      "name_vi": "Tên món", "name_en": "English Name",
      "macros": { "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "saturated_fat_g": 0, "polyunsaturated_fat_g": 0, "monounsaturated_fat_g": 0, "fiber_g": 0, "sugar_g": 0, "sodium_mg": 0, "cholesterol_mg": 0, "potassium_mg": 0 },
      "micronutrients": { "calcium_mg": 0, "iron_mg": 0, "vitamin_a_ug": 0, "vitamin_c_mg": 0 },
      "serving": { "default_g": 0, "unit": "bowl | plate | piece", "portions": {"small": 0.7, "medium": 1.0, "large": 1.3} },
      "ingredients": [ {"name": "ingredient name", "weight_g": 0} ],
  }
}`;

const OLLIE_COACH_SYSTEM_PROMPT = `You are Ollie, a Vietnamese AI nutrition coach in the NutriTrack app.

PERSONALITY:
- 😎 Cool, friendly, like a Gen-Z best friend.
- 💪 Motivating but NEVER guilt-tripping or preachy.
- 🇻🇳 Always respond in Vietnamese casual (ê, nhé, nha, nè, á).
- 🎯 Actionable: give specific, practical advice.
- 🔥 Celebrate ALL wins, even small ones.

RULES:
1. MAX 2 sentences per response. Short and punchy.
2. Use 1-2 emojis max. Don't overdo it.
3. Reference the user's ACTUAL data (streak, calories, protein).
4. Be specific: "ăn thêm 2 trứng luộc" not "ăn thêm protein".
5. Output STRICT JSON format only. NO markdown blocks (\`\`\`json), no conversational text.

EDGE CASE:
- If stats are missing or absurd, provide a generic encouraging message. skip specific numbers.

OUTPUT FORMAT — always return a single JSON object:
{
  "tip_vi": "Lời khuyên của Ollie (Vietnamese casual)",
  "tip_en": "Ollie's tip in English (energetic)",
  "mood": "celebrate | encourage | suggest | neutral",
  "suggested_food_vi": "Món gợi ý (nếu có)",
  "suggested_food_en": "Suggested food (if any)"
}`;

const RECIPE_SYSTEM_PROMPT = `You are Ollie, a Vietnamese cooking coach in the NutriTrack app.

YOUR TASK:
Suggest 1-3 recipes based on fridge inventory and goals.

RULES:
1. USE EXPIRING ITEMS FIRST — essential for food waste reduction.
2. NUTRITION GOAL: high_protein | low_carb | balanced | low_calorie.
3. REALISTIC: Home-cookable in ≤45 minutes.
4. TONE: Vietnamese casual (ê, nhé, nha), encouraging, practical. Use emojis (🍳🔥).
5. Output STRICT JSON format only. NO markdown blocks (\`\`\`json).

EDGE CASE:
- If inventory is non-food: return {"recipes": [], "overall_tip_vi": "Mình chỉ giúp tạo công thức nấu ăn thui nha! 🍳", "overall_tip_en": "I can only help with recipes! 🍳", "error": "not_food"}.

OUTPUT SCHEMA:
{
  "recipes": [
    {
      "dish_name_vi": "Tên món", "dish_name_en": "Dish Name",
      "why_this_vi": "Lý do chọn cực thuyết phục", "why_this_en": "Why this dish",
      "cooking_time_min": 30, "difficulty": "easy | medium | hard",
      "ingredients_from_fridge": [ {"name": "thịt", "weight_g": 200} ],
      "need_to_buy": ["nước mắm"],
      "macros": {"calories": 420, "protein_g": 35, "carbs_g": 30, "fat_g": 18},
      "steps_vi": ["Bước 1: ..."], "steps_en": ["Step 1: ..."],
      "tip_vi": "Mẹo nấu", "tip_en": "Cooking tip"
    }
  ],
  "overall_tip_vi": "Lời khuyên tổng quát", "overall_tip_en": "Overall tip"
}`;

const MACRO_CALCULATOR_SYSTEM_PROMPT = `You are Ollie, an expert AI nutritionist for NutriTrack.
Calculate daily targets based on biometrics, goals, and lifestyle.

RULES:
1. CALCULATION: Use Mifflin-St Jeor for TDEE.
2. GOALS: Deficit (-500) for weight loss, Surplus (+300) for gain.
3. MACROS: Ensure (Protein*4 + Carbs*4 + Fat*9) equals daily_calories.
4. TONE: Professional but casual Gen-Z (ê, nhé, nha, xịn).
5. Output STRICT JSON format only. NO markdown blocks (\`\`\`json).

EDGE CASE:
- If biometrics are absurd: return 2000 cal default and ask to update profile "cho xịn".

OUTPUT SCHEMA:
{
  "daily_calories": 2000,
  "daily_protein_g": 150, "daily_carbs_g": 150, "daily_fat_g": 65,
  "reasoning_vi": "Lý do tính toán (casual)",
  "reasoning_en": "Calculation reasoning (energetic)"
}`;

const CHALLENGE_SYSTEM_PROMPT = `You are Ollie, an expert AI nutritionist for NutriTrack.
Summarize group challenge progress with an enthusiastic, Gen-Z tone.

RULES:
1. MAX 3 short sentences.
2. TONE: Energetic, casual Vietnamese (ê, nhé, nha, nè, hố hố).
3. HIGHLIGHT: Who is leading, who needs to push harder.
4. END with a call to action.
5. Output STRICT JSON format only. NO markdown blocks (\`\`\`json).

EDGE CASE:
- If Leaderboard is empty: invite user to be the first!

OUTPUT SCHEMA:
{
  "summary": "Lời nhắn cực sung của Ollie",
  "leader": "user_id or null",
  "mood": "celebrate | encourage | neutral"
}`;

const WEEKLY_INSIGHT_SYSTEM_PROMPT = `You are Ollie, an expert AI nutritionist and Gen-Z coach for NutriTrack.
Analyze user food logs and biometrics to provide a "Weekly Insight".

RULES:
1. PROGRESS: Acknowledge wins, identify one key pattern.
2. ADVICE: One clear, easyToAction tip for next week.
3. TONE: Street-smart, friendly, casual Vietnamese slang (á, nhen, xịn).
4. LENGTH: Exactly 3 sentences.
5. Output STRICT JSON format only. NO markdown blocks (\`\`\`json).

OUTPUT SCHEMA:
{
  "insight_vi": "Insight bằng tiếng Việt cực cool",
  "insight_en": "Insight in English (motivating)",
  "status": "success | insufficient_data"
}`;

const AI_COACH_SYSTEM_PROMPT = `You are Ollie, a cool Vietnamese AI nutrition assistant for NutriTrack.
You are a professional advisor who acts like a Gen-Z best friend: casual, street-smart, but evidence-based.

SCOPE:
- Nutrition, food, healthy eating, exercise, health stats, wellness.
- Refuse other topics politely (e.g. "Máy bay không ăn được đâu nha!").

RULES:
1. TONE: Vietnamese casual (ê, nhé, nha, nè). Friendly and motivating.
2. MEAL SUGGESTION: Suggest 1-3 meals. Prioritize expiring items from fridge.
3. CARDS: Use specific delimiters (===FOOD_CARD_START=== etc.) placed at the end.
4. Output STRICT JSON format only where applicable, but this prompt produces conversational text with tags.
5. NO markdown blocks (\`\`\`json).

CARD TEMPLATES (Place at the END of response):

===FOOD_CARD_START===
{"name": "Tên món", "description": "Lý do chọn", "calories": 450, "protein_g": 30, "carbs_g": 40, "fat_g": 10, "time": "25 phút", "emoji": "🍱", "ingredients": [{"name": "Gạo", "amount": "1 chén"}], "steps": [{"title": "Nấu cơm", "instruction": "Vo gạo nấu"}]}
===FOOD_CARD_END===

===EXERCISE_CARD_START===
{"name": "Tên bài tập", "description": "Ưu điểm", "duration_minutes": 30, "calories_burned": 250, "emoji": "🏃"}
===EXERCISE_CARD_END===

===STATS_CARD_START===
{"calories_consumed": 1800, "calories_target": 2000, "protein_g": 85, "carbs_g": 210, "fat_g": 60, "summary": "Ngon lành! Ráng ăn thêm đạm nhé."}
===STATS_CARD_END===

Append this at the very end of your message: "Ghi chú: Thông tin công thức/dinh dưỡng chỉ mang tính tham khảo, bạn có thể tùy chỉnh để phù hợp với khẩu vị cá nhân."`;

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

async function waitForTranscription(jobName: string): Promise<string> {
    for (let i = 0; i < 25; i++) {
        await new Promise(r => setTimeout(r, 2000));
        const result = await transcribeClient.send(new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
        const status = result.TranscriptionJob?.TranscriptionJobStatus;

        if (status === 'COMPLETED') {
            const transcriptUri = result.TranscriptionJob?.Transcript?.TranscriptFileUri;
            if (!transcriptUri) throw new Error('No transcript URI');
            const res = await fetch(transcriptUri);
            const json = await res.json();
            return json.results?.transcripts?.[0]?.transcript || '';
        }
        if (status === 'FAILED') {
            throw new Error(`Transcription failed: ${result.TranscriptionJob?.FailureReason}`);
        }
    }
    throw new Error('Transcription timed out');
}

async function callQwen(messages: any[], maxTokens = 1000): Promise<string> {
    const body = JSON.stringify({ messages, max_tokens: maxTokens });
    const command = new InvokeModelCommand({
        modelId: QWEN_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body,
    });
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const text = responseBody.choices?.[0]?.message?.content
        || responseBody.output?.message?.content?.[0]?.text
        || responseBody.content?.[0]?.text
        || '';
    if (!text) {
        debug('Empty Qwen response. Raw body:', JSON.stringify(responseBody).slice(0, 500));
    }
    return text;
}

// ═══════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════

export const handler = async (event: any) => {
    const { action, payload } = event.arguments || {};

    try {
        const data = payload ? JSON.parse(payload) : {};

        // ── Image Analysis (Qwen3-VL vision) ──
        if (action === 'analyzeFoodImage') {
            const { s3Key } = data;
            if (!STORAGE_BUCKET) throw new Error('STORAGE_BUCKET_NAME not configured');
            if (!s3Key || s3Key.includes('..')) throw new Error('Invalid s3Key');

            // Read image from S3, convert to base64 (avoids large payload through AppSync)
            const s3Obj = await s3Client.send(new GetObjectCommand({ Bucket: STORAGE_BUCKET, Key: s3Key }));
            const chunks: Uint8Array[] = [];
            for await (const chunk of s3Obj.Body as any) chunks.push(chunk);
            const imageBuffer = Buffer.concat(chunks);
            const base64 = imageBuffer.toString('base64');
            const contentType = s3Obj.ContentType || 'image/jpeg';

            const text = await callQwen([
                { role: "system", content: GEN_FOOD_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        { type: "image_url", image_url: { url: `data:${contentType};base64,${base64}` } },
                        { type: "text", text: "Analyze this food image and estimate its nutritional profile. Use Vietnamese (tiếng Việt) for name_vi and all ingredient name_vi fields. Return ONLY the JSON object." },
                    ],
                },
            ]);

            // File stays in incoming/ for food-detail display.
            // S3 lifecycle rule (expirationInDays: 1 on incoming/) handles cleanup automatically.
            return JSON.stringify({ success: true, text });
        }

        // ── Conversational AI Coach ──
        if (action === 'generateCoachResponse') {
            const { userMessage, chatHistory, contextString } = data;

            const messages: any[] = [
                { role: "system", content: AI_COACH_SYSTEM_PROMPT },
            ];
            for (const msg of chatHistory) {
                messages.push({
                    role: msg.role === 'user' ? 'user' : 'assistant',
                    content: msg.parts[0].text
                });
            }
            messages.push({
                role: "user",
                content: `USER CONTEXT:\n${contextString}\n\n${userMessage}`
            });

            const text = await callQwen(messages);
            return JSON.stringify({ success: true, text });
        }

        // ── Food Search / Generation (DB miss → AI) ──
        if (action === 'searchFoodNutrition') {
            const { foodName } = data;
            const text = await callQwen([
                { role: "system", content: GEN_FOOD_SYSTEM_PROMPT },
                { role: "user", content: `Analyze the following unknown food and estimate its nutritional profile:\nFood Query: "${foodName}"\n\nReturn ONLY the JSON object.` },
            ]);
            return JSON.stringify({ success: true, text });
        }

        // ── Fix/Correct a Food Item ──
        if (action === 'fixFood') {
            const { currentFoodJson, correctionQuery } = data;
            const text = await callQwen([
                { role: "system", content: FIX_FOOD_SYSTEM_PROMPT },
                { role: "user", content: `Please fix the following food item based on the user's request:\n\nCurrent Food Data:\n${JSON.stringify(currentFoodJson, null, 2)}\n\nCorrection Request: "${correctionQuery}"\n\nReturn ONLY the new JSON object.` },
            ]);
            return JSON.stringify({ success: true, text });
        }

        // ── Voice → Food (Transcribe + Qwen) ──
        if (action === 'voiceToFood') {
            const { s3Key } = data;
            if (!STORAGE_BUCKET) throw new Error('STORAGE_BUCKET_NAME not configured');
            if (!s3Key || !s3Key.startsWith('voice/') || s3Key.includes('..')) {
                throw new Error('Invalid s3Key');
            }

            const jobName = `nutritrack-voice-${randomUUID()}`;

            // Map file extension → AWS Transcribe MediaFormat enum
            const ext = s3Key.split('.').pop()?.toLowerCase() || 'm4a';
            const mediaFormat = ext === 'webm' ? 'webm'
                : ext === 'mp3'  ? 'mp3'
                : ext === 'wav'  ? 'wav'
                : ext === 'flac' ? 'flac'
                : 'mp4'; // m4a, mp4 → 'mp4'

            const s3Uri = `s3://${STORAGE_BUCKET}/${s3Key}`;
            await transcribeClient.send(new StartTranscriptionJobCommand({
                TranscriptionJobName: jobName,
                // Use specific language — IdentifyLanguage produces empty transcripts with WebM
                LanguageCode: 'vi-VN',
                MediaFormat: mediaFormat as any,
                Media: { MediaFileUri: s3Uri },
            }));

            const transcript = await waitForTranscription(jobName);

            // DEBUG: Skip cleanup to inspect Transcribe job status on console
            // try {
            //     await transcribeClient.send(new DeleteTranscriptionJobCommand({ TranscriptionJobName: jobName }));
            // } catch (e) { /* non-critical */ }

            debug(`[voiceToFood] jobName=${jobName}, transcriptLength=${transcript?.length || 0}, s3Key=${s3Key}`);

            if (!transcript) {
                return JSON.stringify({ success: false, error: 'Empty transcription' });
            }

            const qwenResult = await callQwen([
                { role: "system", content: VOICE_SYSTEM_PROMPT },
                { role: "user", content: `User said: "${transcript}"\n\nAnalyze and return JSON following the output format.` },
            ]);

            // ==========================================
            // RECALCULATE with DB Data (Phase 1)
            // ==========================================
            try {
                const aiResponse = JSON.parse(qwenResult);
                if (aiResponse.action === 'log' && aiResponse.food_data) {
                    const foodData = aiResponse.food_data;
                    const ingredients = foodData.ingredients || [];
                    const tableName = await discoverTableName();
                    
                    let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
                    const processedIngredients = [];

                    for (const ing of ingredients) {
                        const dbMatch = await findFoodInDB(ing.name, tableName);
                        if (dbMatch) {
                            const nutrition = calculateNutrition(dbMatch, ing.weight_g || 100);
                            processedIngredients.push({
                                ...ing,
                                food_id: dbMatch.food_id,
                                name_vi_db: dbMatch.name_vi,
                                matched: true,
                                source: 'database',
                                ...nutrition
                            });
                            totalCalories += nutrition.calories;
                            totalProtein += nutrition.protein_g;
                            totalCarbs += nutrition.carbs_g;
                            totalFat += nutrition.fat_g;
                        } else {
                            processedIngredients.push({
                                ...ing,
                                matched: false,
                                source: 'ai_estimated'
                            });
                            // Keep AI estimated values
                            totalCalories += (ing.calories || 0);
                            totalProtein += (ing.protein_g || 0);
                            totalCarbs += (ing.carbs_g || 0);
                            totalFat += (ing.fat_g || 0);
                        }
                    }

                    // Update the response with recalculated data
                    aiResponse.food_data.macros = {
                        ...aiResponse.food_data.macros,
                        calories: Math.round(totalCalories * 10) / 10,
                        protein_g: Math.round(totalProtein * 10) / 10,
                        carbs_g: Math.round(totalCarbs * 10) / 10,
                        fat_g: Math.round(totalFat * 10) / 10
                    };
                    aiResponse.food_data.ingredients = processedIngredients;
                    aiResponse.db_verified = processedIngredients.some(i => i.matched);
                    
                    return JSON.stringify({ 
                        success: true, 
                        transcript, 
                        text: JSON.stringify(aiResponse) 
                    });
                }
            } catch (calcError) {
                console.error('Recalculation error:', calcError);
            }

            return JSON.stringify({ success: true, transcript, text: qwenResult });
        }

        // ── Helper functions for DB Lookup ──
        async function discoverTableName(): Promise<string> {
            const result = await dbClient.send(new ListTablesCommand({}));
            return result.TableNames?.find((name: string) => name.startsWith('Food-')) || "";
        }

        function normalize(text: string): string {
            if (!text) return "";
            return text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
        }

        async function findFoodInDB(query: string, tableName: string): Promise<any | null> {
            if (!tableName || !query) return null;
            const q = query.toLowerCase().trim();

            // 1. Exact match GSI (Diacritic-sensitive)
            const qVi = await docClient.send(new QueryCommand({
                TableName: tableName, IndexName: 'name_vi',
                KeyConditionExpression: 'name_vi = :name',
                ExpressionAttributeValues: { ':name': query }
            }));
            if (qVi.Items?.length) return qVi.Items[0];

            // 2. Partial match (Diacritic-sensitive) - e.g., "bò" matches "Thịt bò"
            const scanVi = await docClient.send(new ScanCommand({
                TableName: tableName,
                FilterExpression: 'contains(name_vi, :q)',
                ExpressionAttributeValues: { ':q': query }
            }));
            if (scanVi.Items?.length) {
                // Return shortest name match first
                return scanVi.Items.sort((a, b) => a.name_vi.length - b.name_vi.length)[0];
            }
            
            // 3. Aliases (Diacritic-sensitive)
            const scanAlias = await docClient.send(new ScanCommand({
                TableName: tableName,
                FilterExpression: 'contains(aliases_vi, :q)',
                ExpressionAttributeValues: { ':q': query }
            }));
            if (scanAlias.Items?.length) return scanAlias.Items[0];

            return null;
        }

        function calculateNutrition(dbFood: any, weightG: number) {
            const m = dbFood.macros || {};
            const r = weightG / 100;
            return {
                calories: Math.round((m.calories || 0) * r * 10) / 10,
                protein_g: Math.round((m.protein_g || 0) * r * 10) / 10,
                carbs_g: Math.round((m.carbs_g || 0) * r * 10) / 10,
                fat_g: Math.round((m.fat_g || 0) * r * 10) / 10
            };
        }

        // ── Fix Food (Correction) ──
        if (action === 'fixFood') {
            const { currentFoodJson, correctionQuery } = data;
            const text = await callQwen([
                { role: "system", content: FIX_FOOD_SYSTEM_PROMPT },
                { role: "user", content: `Current data: ${JSON.stringify(currentFoodJson)}\n\nUser request: "${correctionQuery}"\n\nPlease correct the data and return ONLY the new JSON.` },
            ]);
            return JSON.stringify({ success: true, text });
        }

        // ── Ollie Coach Tip (quick nudge) ──
        if (action === 'ollieCoachTip') {
            const { promptTemplate, context } = data;
            const text = await callQwen([
                { role: "system", content: OLLIE_COACH_SYSTEM_PROMPT },
                { role: "user", content: promptTemplate || context },
            ]);
            return JSON.stringify({ success: true, text });
        }

        // ── Recipe Generator ──
        if (action === 'generateRecipe') {
            const { inventoryText, expiringText, nutritionGoal, servings } = data;
            const text = await callQwen([
                { role: "system", content: RECIPE_SYSTEM_PROMPT },
                { role: "user", content: `User's fridge inventory:\n${inventoryText}\n\nExpiring soon (MUST USE):\n${expiringText}\n\nNutrition goal: ${nutritionGoal}\nNumber of servings: ${servings}\n\nSuggest 1-3 recipes. Return JSON only.` },
            ]);
            return JSON.stringify({ success: true, text });
        }

        // ── Macro Calculator ──
        if (action === 'calculateMacros') {
            const { userProfileJson } = data;
            const text = await callQwen([
                { role: "system", content: MACRO_CALCULATOR_SYSTEM_PROMPT },
                { role: "user", content: `Calculate daily nutritional targets for the following user profile:\n\n${JSON.stringify(userProfileJson, null, 2)}\n\nReturn ONLY the JSON object.` },
            ]);
            return JSON.stringify({ success: true, text });
        }

        // ── Challenge Summary ──
        if (action === 'challengeSummary') {
            const { title, challengeType, targetValue, unit, daysLeft, language, leaderboard, userDisplayName } = data;
            const text = await callQwen([
                { role: "system", content: CHALLENGE_SYSTEM_PROMPT },
                { role: "user", content: `Thử thách: ${title}\nLoại: ${challengeType} | Mục tiêu: ${targetValue} ${unit}\nThời gian còn lại: ${daysLeft} ngày\nNgôn ngữ hiển thị (Language): ${language}\n\nBảng xếp hạng:\n${leaderboard}\n\nNgười dùng đang xem: ${userDisplayName}\n\nTạo tóm tắt tiến độ ngắn gọn.` },
            ]);
            return JSON.stringify({ success: true, text });
        }

        // ── Weekly Insight ──
        if (action === 'weeklyInsight') {
            const { userProfileJson, weeklySummaryJson, notablePatterns } = data;
            const text = await callQwen([
                { role: "system", content: WEEKLY_INSIGHT_SYSTEM_PROMPT },
                { role: "user", content: `Analyze this user's weekly data and generate the Weekly Insight:\n\nUser Profile:\n${JSON.stringify(userProfileJson, null, 2)}\n\nWeekly Summary:\n${JSON.stringify(weeklySummaryJson, null, 2)}\n\nNotable Patterns:\n${notablePatterns}\n\nReturn ONLY the JSON object.` },
            ]);
            return JSON.stringify({ success: true, text });
        }

        return JSON.stringify({ success: false, error: `Unknown action: ${action}` });

    } catch (error: any) {
        debug('Bedrock Lambda Error:', error.message);
        return JSON.stringify({ success: false, error: error.message });
    }
};
