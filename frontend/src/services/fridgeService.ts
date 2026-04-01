import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../../backend/amplify/data/resource';

const client = generateClient<Schema>();

type CategoryEnum = 'meat' | 'vegetable' | 'fruit' | 'dairy' | 'pantry' | 'other';

export interface CreateFridgeItemInput {
    name: string;
    food_id?: string;
    quantity?: number;
    unit?: string;
    expiry_date?: string;       // YYYY-MM-DD
    category?: CategoryEnum;
    emoji?: string;
}

/**
 * Add an item to the fridge in DynamoDB
 */
export const createFridgeItem = async (input: CreateFridgeItemInput) => {
    try {
        const { data, errors } = await client.models.FridgeItem.create({
            name: input.name,
            food_id: input.food_id,
            quantity: input.quantity ?? 1,
            unit: input.unit,
            added_date: new Date().toISOString(),
            expiry_date: input.expiry_date,
            category: input.category ?? 'other',
            emoji: input.emoji,
        });

        if (errors) {
            console.error('Error creating fridge item:', errors);
            return null;
        }
        return data;
    } catch (error) {
        console.error('createFridgeItem error:', error);
        return null;
    }
};

/**
 * Fetch all fridge items for the current user
 */
export const fetchFridgeItems = async () => {
    try {
        const { data, errors } = await client.models.FridgeItem.list();

        if (errors) {
            console.error('Error fetching fridge items:', errors);
            return [];
        }
        return data ?? [];
    } catch (error) {
        console.error('fetchFridgeItems error:', error);
        return [];
    }
};

/**
 * Update a fridge item (e.g., change quantity)
 */
export const updateFridgeItem = async (id: string, updates: Partial<CreateFridgeItemInput>) => {
    try {
        const { data, errors } = await client.models.FridgeItem.update({
            id,
            ...updates,
        });

        if (errors) {
            console.error('Error updating fridge item:', errors);
            return null;
        }
        return data;
    } catch (error) {
        console.error('updateFridgeItem error:', error);
        return null;
    }
};

/**
 * Delete a fridge item
 */
export const deleteFridgeItem = async (id: string) => {
    try {
        const { data, errors } = await client.models.FridgeItem.delete({ id });

        if (errors) {
            console.error('Error deleting fridge item:', errors);
            return false;
        }
        return true;
    } catch (error) {
        console.error('deleteFridgeItem error:', error);
        return false;
    }
};