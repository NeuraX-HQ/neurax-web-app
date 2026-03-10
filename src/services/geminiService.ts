import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface IngredientItem {
    name: string;
    amount: string;
}

export interface NutritionInfo {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    ingredients?: IngredientItem[];
}

export interface FoodAnalysisResult {
    success: boolean;
    data?: NutritionInfo;
    error?: string;
}

export interface CoachResponse {
    success: boolean;
    text?: string;
    foodSuggestion?: {
        name: string;
        description: string;
        calories: number;
        emoji: string;
    };
    error?: string;
}

/**
 * Analyze food image using Gemini Vision through AWS Lambda
 */
export async function analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult> {
    try {
        const result = await client.queries.askGemini({
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

        // Clean response - remove markdown code blocks if present
        const cleanedText = responseObj.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const nutritionData = JSON.parse(cleanedText);

        return {
            success: true,
            data: nutritionData,
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
        const result = await client.queries.askGemini({
            action: 'transcribeAudio',
            payload: JSON.stringify({ audioBase64 })
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
export async function parseVoiceToFood(transcript: string): Promise<FoodAnalysisResult> {
    try {
        const result = await client.queries.askGemini({
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

        const cleanedText = responseObj.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const nutritionData = JSON.parse(cleanedText);

        return {
            success: true,
            data: nutritionData,
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
 * Search for food in database and get nutrition info through AWS Lambda
 */
export async function searchFoodNutrition(foodName: string): Promise<FoodAnalysisResult> {
    try {
        const result = await client.queries.askGemini({
            action: 'searchFoodNutrition',
            payload: JSON.stringify({ foodName })
        });

        if (result.errors || !result.data) {
            console.error('Amplify GraphQL Errors:', result.errors);
            return { success: false, error: 'GraphQL error occurred' };
        }

        const responseObj = JSON.parse(result.data);
        if (!responseObj.success) {
            return { success: false, error: responseObj.error };
        }

        const cleanedText = responseObj.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const nutritionData = JSON.parse(cleanedText);

        return {
            success: true,
            data: nutritionData,
        };
    } catch (error) {
        console.error('Gemini food search error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to search food',
        };
    }
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
        const result = await client.queries.askGemini({
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

        // Extract food card if present
        let foodSuggestion;
        const cardMatch = text.match(/\[FOOD_CARD: (\{.*?\})\]/);
        if (cardMatch) {
            try {
                foodSuggestion = JSON.parse(cardMatch[1]);
            } catch (e) {
                console.error('Failed to parse food card JSON', e);
            }
        }

        // Clean text (remove the food card tag)
        const cleanedText = text.replace(/\[FOOD_CARD: \{.*?\}\]/g, '').trim();

        return {
            success: true,
            text: cleanedText,
            foodSuggestion,
        };
    } catch (error) {
        console.error('Gemini coach error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get coach response',
        };
    }
}
