import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

type MealTypeEnum = 'breakfast' | 'lunch' | 'dinner' | 'snack';
type InputMethodEnum = 'voice' | 'photo' | 'manual' | 'barcode';

export interface CreateFoodLogInput {
    date: string;                 // YYYY-MM-DD
    food_name: string;
    meal_type: MealTypeEnum;
    food_id?: string;
    portion?: number;
    portion_unit?: string;
    additions?: string[];
    ingredients?: any[];
    macros?: {
        calories?: number;
        protein_g?: number;
        carbs_g?: number;
        fat_g?: number;
        fiber_g?: number;
        sugar_g?: number;
        sodium_mg?: number;
    };
    input_method?: InputMethodEnum;
    image_key?: string;
}

/**
 * Create a food log entry in DynamoDB
 */
export const createFoodLog = async (input: CreateFoodLogInput) => {
    try {
        const { data, errors } = await client.models.FoodLog.create({
            date: input.date,
            timestamp: new Date().toISOString(),
            food_name: input.food_name,
            meal_type: input.meal_type,
            food_id: input.food_id,
            portion: input.portion ?? 1.0,
            portion_unit: input.portion_unit,
            additions: input.additions,
            ingredients: input.ingredients,
            macros: input.macros,
            input_method: input.input_method ?? 'manual',
            image_key: input.image_key,
        });

        if (errors) {
            console.error('Error creating food log:', errors);
            return null;
        }
        return data;
    } catch (error) {
        console.error('createFoodLog error:', error);
        return null;
    }
};

/**
 * Fetch all food logs for a specific date (uses GSI on date field)
 */
export const fetchFoodLogsByDate = async (date: string) => {
    try {
        const { data, errors } = await client.models.FoodLog.list({
            filter: { date: { eq: date } },
        });

        if (errors) {
            console.error('Error fetching food logs:', errors);
            return [];
        }
        return data ?? [];
    } catch (error) {
        console.error('fetchFoodLogsByDate error:', error);
        return [];
    }
};

/**
 * Fetch food logs for a date range (e.g., weekly insights)
 */
export const fetchFoodLogsByDateRange = async (startDate: string, endDate: string) => {
    try {
        const { data, errors } = await client.models.FoodLog.list({
            filter: {
                and: [
                    { date: { ge: startDate } },
                    { date: { le: endDate } },
                ],
            },
        });

        if (errors) {
            console.error('Error fetching food logs range:', errors);
            return [];
        }
        return data ?? [];
    } catch (error) {
        console.error('fetchFoodLogsByDateRange error:', error);
        return [];
    }
};

/**
 * Update a food log entry
 */
export const updateFoodLog = async (id: string, updates: Partial<CreateFoodLogInput>) => {
    try {
        const { data, errors } = await client.models.FoodLog.update({
            id,
            ...updates,
        });

        if (errors) {
            console.error('Error updating food log:', errors);
            return null;
        }
        return data;
    } catch (error) {
        console.error('updateFoodLog error:', error);
        return null;
    }
};

/**
 * Delete a food log entry
 */
export const deleteFoodLog = async (id: string) => {
    try {
        const { data, errors } = await client.models.FoodLog.delete({ id });

        if (errors) {
            console.error('Error deleting food log:', errors);
            return false;
        }
        return true;
    } catch (error) {
        console.error('deleteFoodLog error:', error);
        return false;
    }
};
