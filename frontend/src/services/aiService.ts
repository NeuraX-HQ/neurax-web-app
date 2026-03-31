import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { NutritionInfo, FoodAnalysisResult } from './geminiService';

const getHostUri = () => {
    // Web browsers running on the PC itself should hit localhost to avoid firewall/CORS issues
    if (Platform.OS === 'web') return 'http://127.0.0.1:8000';

    // We explicitly use your Windows PC's IPv4 address for physical iOS testing.
    return 'http://192.168.1.19:8000';
};

const API_BASE_URL = `${getHostUri()}/api/ai`;

export async function uploadImageToAi(endpoint: string, uri: string, base64Fallback: string | null): Promise<any> {
    try {
        const formData = new FormData();
        
        if (Platform.OS === 'web' && base64Fallback) {
            // On web we construct a Blob from the base64 string
            const response = await fetch(`data:image/jpeg;base64,${base64Fallback}`);
            const blob = await response.blob();
            formData.append('file', blob, 'upload.jpg');
        } else {
            // React Native handles { uri, type, name } cleanly
            formData.append('file', {
                uri,
                name: 'upload.jpg',
                type: 'image/jpeg',
            } as any);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`AI Server Error: ${response.status} - ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error uploading to ${endpoint}:`, error);
        throw error;
    }
}

export async function analyzeFoodAPI(uri: string, base64Data: string | null): Promise<FoodAnalysisResult> {
    try {
        const result = await uploadImageToAi(`/analyze-food`, uri, base64Data);
        if (!result.success) return { success: false, error: result.message };
        
        const data = result.data;
        const dishes = data.dishes || [];
        if (dishes.length === 0) return { success: false, error: "AI could not detect any food." };
        
        const mealName = dishes.map((d: any) => d.name).join(' & ');
        const mealName_en = dishes.map((d: any) => d.name_en || d.name).join(' & ');
        const mealName_vi = dishes.map((d: any) => d.name_vi || d.name).join(' & ');
        const cooking_method_en = dishes.map((d: any) => d.cooking_method_en || d.cooking_method).join(' & ');
        const cooking_method_vi = dishes.map((d: any) => d.cooking_method_vi || d.cooking_method).join(' & ');

        let calories = 0, protein = 0, carbs = 0, fat = 0;
        let ingredients: any[] = [];
        
        for (const dish of dishes) {
            const n = dish.nutritions || {};
            calories += n.calories || 0;
            protein += n.protein || 0;
            carbs += n.carbs || 0;
            fat += n.fat || 0;
            
            for (const ing of (dish.ingredients || [])) {
                ingredients.push({
                    name: ing.name,
                    name_en: ing.name_en || ing.name,
                    name_vi: ing.name_vi || ing.name,
                    note_en: ing.note_en || ing.note,
                    note_vi: ing.note_vi || ing.note,
                    amount: `${ing.weight || 0}g`,
                    estimated_g: ing.weight || 0,
                    calories: ing.nutritions?.calories,
                    protein_g: ing.nutritions?.protein,
                    carbs_g: ing.nutritions?.carbs,
                    fat_g: ing.nutritions?.fat,
                    source: 'ai_estimated'
                });
            }
        }

        const nutritionInfo: NutritionInfo = {
            name: mealName,
            name_en: mealName_en,
            name_vi: mealName_vi,
            cooking_method_en: cooking_method_en,
            cooking_method_vi: cooking_method_vi,
            calories,
            protein,
            carbs,
            fat,
            ingredients
        };

        return { success: true, data: nutritionInfo };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function scanBarcodeAPI(uri: string, base64Data: string | null): Promise<FoodAnalysisResult> {
    try {
        const result = await uploadImageToAi(`/scan-barcode`, uri, base64Data);
        if (!result.success || !result.data?.food) return { success: false, error: result.message || "Barcode not found" };
        
        const food = result.data.food;
        const n = food.nutritions || {};
        
        const ingredients = (food.ingredients || []).map((ing: string, i: number) => ({
            name: ing,
            name_en: (food.ingredients_en && food.ingredients_en[i]) || ing,
            name_vi: (food.ingredients_vi && food.ingredients_vi[i]) || ing,
            source: 'database'
        }));

        const nutritionInfo: NutritionInfo = {
            name: food.product_name || "Unknown Product",
            name_en: food.product_name || "Unknown Product",
            name_vi: food.product_name || "Unknown Product",
            category_en: food.category_en || food.category,
            category_vi: food.category_vi || food.category,
            allergens_en: food.allergens_en || food.allergens,
            allergens_vi: food.allergens_vi || food.allergens,
            calories: n.calories || 0,
            protein: n.protein || 0,
            carbs: n.carbs || 0,
            fat: n.fat || 0,
            servingSize: food.quantity,
            ingredients: ingredients as any
        };
        return { success: true, data: nutritionInfo };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function analyzeLabelAPI(uri: string, base64Data: string | null): Promise<FoodAnalysisResult> {
    try {
        const result = await uploadImageToAi(`/analyze-label`, uri, base64Data);
        if (!result.success || !result.data?.labels?.length) return { success: false, error: result.message || "No label detected" };
        
        const label = result.data.labels[0];
        
        let calories = 0, protein = 0, carbs = 0, fat = 0;
        for (const nut of (label.nutrition || [])) {
            const nutrient = nut.nutrient.toLowerCase();
            const val = nut.value || 0;
            if (nutrient.includes('năng lượng') || nutrient.includes('energy') || nutrient.includes('calories') || nutrient.includes('kcal')) calories = val;
            if (nutrient.includes('chất béo') || nutrient.includes('fat')) fat = val;
            if (nutrient.includes('carbohydrate') || nutrient.includes('carb')) carbs = val;
            if (nutrient.includes('chất đạm') || nutrient.includes('protein')) protein = val;
        }

        const ingredients = (label.ingredients || []).map((ing: string) => ({
            name: ing,
            name_en: ing, // Assuming ingredients from label scanner don't have dual translation yet, but we populate it natively
            name_vi: ing, 
            note_en: label.note_en || label.note,
            note_vi: label.note_vi || label.note,
            source: 'ai_estimated'
        }));

        const nutritionInfo: NutritionInfo = {
            name: label.name || "Nutrition Label",
            name_en: label.name || "Nutrition Label",
            name_vi: label.name || "Nutrition Label",
            allergens_en: label.allergens_en || label.allergens,
            allergens_vi: label.allergens_vi || label.allergens,
            calories,
            protein,
            carbs,
            fat,
            servingSize: `${label.serving_value} ${label.serving_unit}`,
            ingredients: ingredients as any
        };
        return { success: true, data: nutritionInfo };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
