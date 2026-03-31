import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

const AI_COACH_SYSTEM_PROMPT = `You are an AI Nutrition Coach integrated inside a nutrition and health application named NutriTrack.
Your role is to act as a professional nutrition advisor that helps users improve their eating habits and health.

═══════════════════════════════════════
SCOPE RESTRICTION — CRITICAL
═══════════════════════════════════════
You ONLY answer questions and perform tasks related to:
- Nutrition, food, and healthy eating
- Exercise and physical activity for health goals
- Health statistics, calorie tracking, and nutrient intake
- General wellness advice (sleep, hydration) when directly related to the above

If a user asks about anything outside this scope (e.g. coding, news, finance, relationships),
politely decline and redirect them to nutrition/health topics.

═══════════════════════════════════════
CORE RESPONSIBILITIES
═══════════════════════════════════════
- Answer nutrition questions
- Recommend healthy meals with specific suggestions
- Suggest recipes based on ingredients
- Analyze nutrition data and identify gaps
- Provide guidance for balanced meals
- Design exercise routines

═══════════════════════════════════════
MEAL SUGGESTION RULES
═══════════════════════════════════════
1. ALWAYS suggest 1–3 specific meals.
2. If ingredients are provided -> suggest meals using those.
3. Always include a FOOD_CARD JSON block for EACH suggested meal.

[FOOD_CARD: {"name": "Tên món", "description": "Mô tả ngắn", "calories": 450, "emoji": "🍱"}]

═══════════════════════════════════════
LANGUAGE RULE
═══════════════════════════════════════
Respond in the SAME LANGUAGE used by the user. Default to Vietnamese if unclear.`;

export const handler = async (event: any) => {
    const { action, payload } = event.arguments || {};
    const data = payload ? JSON.parse(payload) : {};
    
    // Default model: Claude 3 Haiku
    const modelId = "anthropic.claude-3.5-haiku-20240307-v1:0";

    try {
        if (action === 'analyzeFoodImage') {
            const { imageBase64 } = data;
            let cleanBase64 = imageBase64;
            if (imageBase64.includes('base64,')) {
                cleanBase64 = imageBase64.split('base64,')[1];
            }

            const prompt = `Phân tích hình ảnh món ăn này. Xác định TÊN MÓN, TỪNG NGUYÊN LIỆU THÀNH PHẦN kèm KHỐI LƯỢNG ƯỚC TÍNH (gram) và GIÁ TRỊ DINH DƯỠNG ước tính.
Chỉ trả về DUY NHẤT một đối tượng JSON hợp lệ:
{
    "meal_name": "Tên món ăn bằng tiếng Việt",
    "portion_size": "small | medium | large",
    "total_calories": 520,
    "total_protein_g": 32,
    "total_carbs_g": 68,
    "total_fat_g": 12,
    "ingredients": [
        { "name": "tên nguyên liệu (tiếng Việt)", "estimated_g": 150, "calories": 200, "protein_g": 15, "carbs_g": 0, "fat_g": 10 }
    ]
}`;

            const body = JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "image",
                                source: {
                                    type: "base64",
                                    media_type: "image/jpeg",
                                    data: cleanBase64,
                                },
                            },
                            {
                                type: "text",
                                text: prompt,
                            },
                        ],
                    },
                ],
            });

            const command = new InvokeModelCommand({
                modelId,
                contentType: "application/json",
                accept: "application/json",
                body,
            });

            const response = await bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            return JSON.stringify({ success: true, text: responseBody.content[0].text });
        }

        if (action === 'generateCoachResponse') {
            const { userMessage, chatHistory, contextString } = data;
            
            const messages = chatHistory.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.parts[0].text
            }));
            
            messages.push({
                role: "user",
                content: `${AI_COACH_SYSTEM_PROMPT}\n\nUSER CONTEXT:\n${contextString}\n\nUser: ${userMessage}`
            });

            const body = JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 1000,
                messages: messages
            });

            const command = new InvokeModelCommand({
                modelId,
                contentType: "application/json",
                accept: "application/json",
                body,
            });

            const response = await bedrockClient.send(command);
            const responseBody = JSON.parse(new TextDecoder().decode(response.body));
            return JSON.stringify({ success: true, text: responseBody.content[0].text });
        }

        return JSON.stringify({ success: false, error: `Unknown action: ${action}` });

    } catch (error: any) {
        console.error('Bedrock Lambda Error:', error);
        return JSON.stringify({ success: false, error: error.message });
    }
};
