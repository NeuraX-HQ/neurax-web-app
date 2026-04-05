import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Recipe } from '../data/recipes';

interface RecipeState {
    personalRecipes: Recipe[];
    isLoading: boolean;
    error: string | null;
    loadRecipes: () => Promise<void>;
    addRecipe: (recipe: Recipe) => Promise<void>;
    removeRecipe: (id: string) => Promise<void>;
}

const STORAGE_KEY = '@nutritrack_personal_recipes';

export const useRecipeStore = create<RecipeState>((set, get) => ({
    personalRecipes: [],
    isLoading: false,
    error: null,
    
    loadRecipes: async () => {
        try {
            set({ isLoading: true, error: null });
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                set({ personalRecipes: JSON.parse(stored) });
            }
            set({ isLoading: false });
        } catch (error) {
            console.error('Error loading recipes:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to load recipes', isLoading: false });
        }
    },
    
    addRecipe: async (recipe) => {
        try {
            set({ isLoading: true, error: null });
            const updated = [recipe, ...get().personalRecipes];
            set({ personalRecipes: updated });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            set({ isLoading: false });
        } catch (error) {
            console.error('Error saving recipe:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to save recipe', isLoading: false });
        }
    },
    
    removeRecipe: async (id) => {
        try {
            set({ isLoading: true, error: null });
            const updated = get().personalRecipes.filter(r => r.id !== id);
            set({ personalRecipes: updated });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            set({ isLoading: false });
        } catch (error) {
            console.error('Error removing recipe:', error);
            set({ error: error instanceof Error ? error.message : 'Failed to remove recipe', isLoading: false });
        }
    }
}));
