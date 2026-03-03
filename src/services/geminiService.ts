import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export interface NutritionInfo {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    ingredients?: string[];
}

export interface FoodAnalysisResult {
    success: boolean;
    data?: NutritionInfo;
    error?: string;
}

/**
 * Analyze food image using Gemini Vision
 */
export async function analyzeFoodImage(imageBase64: string): Promise<FoodAnalysisResult> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Analyze this food image and provide detailed nutritional information in JSON format.
        
Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
    "name": "Vietnamese name of the dish",
    "calories": estimated total calories (number),
    "protein": grams of protein (number),
    "carbs": grams of carbohydrates (number),
    "fat": grams of fat (number),
    "servingSize": "description of portion size",
    "ingredients": ["ingredient 1", "ingredient 2", ...]
}

Be as accurate as possible with nutritional estimates based on visible portion size.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: 'image/jpeg',
                },
            },
        ]);

        const response = await result.response;
        const text = response.text();
        
        // Clean response - remove markdown code blocks if present
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
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
 * Parse voice text to extract food information
 */
export async function parseVoiceToFood(transcript: string): Promise<FoodAnalysisResult> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `User said: "${transcript}"

Extract the food information and provide nutritional data in JSON format.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
    "name": "Vietnamese name of the food/dish mentioned",
    "calories": estimated calories (number),
    "protein": grams of protein (number),
    "carbs": grams of carbohydrates (number),
    "fat": grams of fat (number),
    "servingSize": "estimated serving size",
    "ingredients": ["main ingredients"]
}

If multiple foods are mentioned, combine them into one meal entry.
Use typical Vietnamese portion sizes for estimates.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean response
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
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
 * Search for food in database and get nutrition info
 */
export async function searchFoodNutrition(foodName: string): Promise<FoodAnalysisResult> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `Provide nutritional information for: "${foodName}"

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
    "name": "Vietnamese name",
    "calories": typical calories per serving (number),
    "protein": grams of protein (number),
    "carbs": grams of carbohydrates (number),
    "fat": grams of fat (number),
    "servingSize": "typical serving size",
    "ingredients": ["main ingredients"]
}

Use standard Vietnamese portion sizes.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
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
