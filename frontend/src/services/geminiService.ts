import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { Platform } from 'react-native';

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

/**
 * Analyze food image using Gemini Vision through AWS Lambda
 */
export async function analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult> {
    try {
        const result = await getClient().queries.askGemini({
            action: 'analyzeFoodImage',
            payload: JSON.stringify({ imageBase64 })
        });

        if (result.errors || !result.data) {
            console.error('Amplify GraphQL Errors:', result.errors);
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        // Robust JSON extraction
        const rawData = extractAndParseJSON(responseObj.text);

        return {
            success: true,
            data: convertAiToNutritionInfo(rawData),
        };
    } catch (error) {
        console.error('Gemini image analysis error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to analyze image',
        };
    }
}

/**
 * Transcribe audio to text using Gemini through AWS Lambda
 */
export async function transcribeAudio(audioBase64: string): Promise<{ success: boolean; text?: string; error?: string }> {
    try {
        const mimeType = Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a';
        const result = await getClient().queries.askGemini({
            action: 'transcribeAudio',
            payload: JSON.stringify({ audioBase64, mimeType })
        });

        if (result.errors || !result.data) {
            console.error('Amplify GraphQL Errors:', result.errors);
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        return {
            success: true,
            text: responseObj.text.trim(),
        };
    } catch (error) {
        console.error('Gemini audio transcription error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to transcribe audio',
        };
    }
}

/**
 * Parse voice text to extract food information through AWS Lambda
 */
export async function parseVoiceToFood(transcript: string): Promise<VoiceAnalysisResult> {
    try {
        const result = await getClient().queries.askGemini({
            action: 'parseVoiceToFood',
            payload: JSON.stringify({ transcript })
        });

        if (result.errors || !result.data) {
            console.error('Amplify GraphQL Errors:', result.errors);
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const rawData = extractAndParseJSON(responseObj.text);
        
        let voiceData: VoiceAnalysisData = {
            intent: rawData.intent || 'unknown',
            message: rawData.message || ''
        };

        if (rawData.intent === 'log_food' && rawData.food_items && rawData.food_items.length > 0) {
            voiceData.food_data = convertAiToNutritionInfo(rawData.food_items[0]);
        } else if (rawData.intent === 'log_water') {
            voiceData.water_ml = rawData.water_ml;
        } else if (rawData.intent === 'ask_coach' || rawData.intent === 'unknown') {
            voiceData.coach_query = rawData.coach_query || transcript;
        }

        return {
            success: true,
            data: voiceData,
        };
    } catch (error) {
        console.error('Gemini voice parsing error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to parse voice input',
        };
    }
}

/**
 * Search for food and get enriched nutrition info through AI + DB verification
 * Tối ưu Fast Path: Thử query trực tiếp trong Food DB trước khi gọi suy luận AI (Gemini).
 */
export async function searchFoodNutrition(foodName: string): Promise<FoodAnalysisResult> {
    try {
        // Step 1: FAST PATH - Search DB directly (Tránh delay 3-5s của AI)
        try {
            const fastResult = await getClient().queries.processNutrition({
                payload: JSON.stringify({ action: 'directSearch', query: foodName })
            });

            if (!fastResult.errors && fastResult.data) {
                const fastResponse = JSON.parse(fastResult.data);
                // Nếu tìm thấy mờ / chính xác trong DB, convert và return luôn
                if (fastResponse.success && fastResponse.items?.length > 0) {
                    console.log(`⚡ Fast path: Found "${foodName}" in DB directly.`);
                    return formatProcessedResult(fastResponse.items[0]);
                }
            }
        } catch (fastErr) {
            console.warn('Fast DB search failed, falling back to AI.', fastErr);
        }

        console.log(`🐢 Slow path: "${foodName}" not found exactly in DB, asking AI...`);

        // Step 2: NORMAL PATH - Ask Gemini for ingredient breakdown + estimated nutrition
        const aiResult = await getClient().queries.askGemini({
            action: 'searchFoodNutrition',
            payload: JSON.stringify({ foodName })
        });

        if (aiResult.errors || !aiResult.data) {
            console.error('Amplify GraphQL Errors:', aiResult.errors);
            return { success: false, error: 'GraphQL error occurred' };
        }

        const aiResponse = JSON.parse(aiResult.data);
        if (!aiResponse.success) {
            return { success: false, error: aiResponse.error };
        }

        const aiData = extractAndParseJSON(aiResponse.text);

        // Step 2: Send AI data to processNutrition Lambda for DB verification
        const processResult = await getClient().queries.processNutrition({
            payload: JSON.stringify(aiData)
        });

        if (processResult.errors || !processResult.data) {
            console.log('processNutrition failed, falling back to AI data');
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

        // Convert processed data to NutritionInfo format
        return formatProcessedResult(processedResponse.items[0]);
    } catch (error) {
        console.error('Search food nutrition error:', error);
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
 */
function convertAiToNutritionInfo(aiData: any): NutritionInfo {
    return {
        name: aiData.meal_name || aiData.name || 'Unknown',
        calories: aiData.total_calories || aiData.calories || 0,
        protein: aiData.total_protein_g || aiData.protein || 0,
        carbs: aiData.total_carbs_g || aiData.carbs || 0,
        fat: aiData.total_fat_g || aiData.fat || 0,
        portion_size: aiData.portion_size,
        ingredients: (aiData.ingredients || []).map((ing: any) => ({
            name: ing.name,
            amount: ing.estimated_g ? `${ing.estimated_g}g` : ing.amount,
            estimated_g: ing.estimated_g,
            calories: ing.calories,
            protein_g: ing.protein_g,
            carbs_g: ing.carbs_g,
            fat_g: ing.fat_g,
            source: 'ai_estimated' as const,
        })),
    };
}

/**
 * Generate AI Coach response through AWS Lambda
 */
export async function generateCoachResponse(
    userMessage: string,
    chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[],
    contextString: string
): Promise<CoachResponse> {
    try {
        const result = await getClient().queries.askGemini({
            action: 'generateCoachResponse',
            payload: JSON.stringify({ userMessage, chatHistory, contextString })
        });

        if (result.errors || !result.data) {
            console.error('Amplify GraphQL Errors:', result.errors);
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const text = responseObj.text;

        // Extract all FOOD_CARDs
        const foodSuggestions: FoodSuggestion[] = [];
        const foodMatches = text.matchAll(/\[FOOD_CARD: (\{.*?\})\]/g);
        for (const match of foodMatches) {
            try {
                foodSuggestions.push(JSON.parse(match[1]));
            } catch (e) {
                console.error('Failed to parse food card JSON', e);
            }
        }

        // Extract all EXERCISE_CARDs
        const exerciseSuggestions: ExerciseSuggestion[] = [];
        const exerciseMatches = text.matchAll(/\[EXERCISE_CARD: (\{.*?\})\]/g);
        for (const match of exerciseMatches) {
            try {
                exerciseSuggestions.push(JSON.parse(match[1]));
            } catch (e) {
                console.error('Failed to parse exercise card JSON', e);
            }
        }

        // Extract STATS_CARD (only one per response)
        let statsCard: StatsCard | undefined;
        const statsMatch = text.match(/\[STATS_CARD: (\{.*?\})\]/);
        if (statsMatch) {
            try {
                statsCard = JSON.parse(statsMatch[1]);
            } catch (e) {
                console.error('Failed to parse stats card JSON', e);
            }
        }

        // Clean text (remove all card tags)
        const cleanedText = text
            .replace(/\[FOOD_CARD: \{.*?\}\]/g, '')
            .replace(/\[EXERCISE_CARD: \{.*?\}\]/g, '')
            .replace(/\[STATS_CARD: \{.*?\}\]/g, '')
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
        console.error('Gemini coach error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get coach response',
        };
    }
}
