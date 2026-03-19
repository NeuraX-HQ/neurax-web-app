import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface Meal {
    id: string;
    name: string;
    type: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    ingredients?: any[]; // Keep any[] or IngredientItem[] depending on usage, let's use any for Meal
    time: string;
    date: string; // YYYY-MM-DD format
    image?: string; // emoji or base64
}

interface MealState {
    meals: Meal[];
    isLoading: boolean;
    error: string | null;

    // Shared date & context state
    selectedDateStr: string; // YYYY-MM-DD – the date currently viewed on Home
    selectedMealType: MealType | null; // Pre-filled meal type when opening the FAB menu from Home
    isAddMenuOpen: boolean; // Controls the global FAB menu visibility

    // Shared state for food detail & edit ingredients
    currentFoodItem: any | null;

    // Actions
    setCurrentFoodItem: (item: any | null) => void;
    setSelectedDateStr: (date: string) => void;
    setSelectedMealType: (type: MealType | null) => void;
    setAddMenuOpen: (open: boolean) => void;
    addMeal: (meal: Omit<Meal, 'id' | 'time' | 'date'>) => Promise<void>;
    removeMeal: (id: string) => Promise<void>;
    updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
    getMealsByDate: (date: string) => Meal[];
    getTodayMeals: () => Meal[];
    getTodayStats: () => {
        totalCalories: number;
        totalProtein: number;
        totalCarbs: number;
        totalFat: number;
    };
    loadMeals: () => Promise<void>;
    clearAllMeals: () => Promise<void>;
}

const STORAGE_KEY = '@nutritrack_meals';

// Helper to get today's date in YYYY-MM-DD format
const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get current time in HH:MM AM/PM format
const getCurrentTime = (): string => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
};

// Helper to generate unique ID
const generateId = (): string => {
    return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const useMealStore = create<MealState>((set, get) => ({
    meals: [],
    isLoading: false,
    error: null,
    selectedDateStr: getTodayDate(),
    selectedMealType: null,
    isAddMenuOpen: false,
    currentFoodItem: null,

    setCurrentFoodItem: (item) => set({ currentFoodItem: item }),
    setSelectedDateStr: (date) => set({ selectedDateStr: date }),
    setSelectedMealType: (type) => set({ selectedMealType: type }),
    setAddMenuOpen: (open) => set({ isAddMenuOpen: open }),

    addMeal: async (mealData) => {
        try {
            set({ isLoading: true, error: null });

            const newMeal: Meal = {
                ...mealData,
                id: generateId(),
                time: getCurrentTime(),
                date: get().selectedDateStr, // Use the globally selected date
            };

            const updatedMeals = [...get().meals, newMeal];
            set({ meals: updatedMeals });

            // Persist to storage
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));

            set({ isLoading: false });
        } catch (error) {
            console.error('Error adding meal:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to add meal',
                isLoading: false
            });
        }
    },

    removeMeal: async (id) => {
        try {
            set({ isLoading: true, error: null });

            const updatedMeals = get().meals.filter(meal => meal.id !== id);
            set({ meals: updatedMeals });

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));

            set({ isLoading: false });
        } catch (error) {
            console.error('Error removing meal:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to remove meal',
                isLoading: false
            });
        }
    },

    updateMeal: async (id, updates) => {
        try {
            set({ isLoading: true, error: null });

            const updatedMeals = get().meals.map(meal =>
                meal.id === id ? { ...meal, ...updates } : meal
            );
            set({ meals: updatedMeals });

            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));

            set({ isLoading: false });
        } catch (error) {
            console.error('Error updating meal:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to update meal',
                isLoading: false
            });
        }
    },

    getMealsByDate: (date) => {
        return get().meals.filter(meal => meal.date === date);
    },

    getTodayMeals: () => {
        const today = getTodayDate();
        return get().meals.filter(meal => meal.date === today);
    },

    getTodayStats: () => {
        const todayMeals = get().getTodayMeals();

        return todayMeals.reduce(
            (acc, meal) => ({
                totalCalories: acc.totalCalories + meal.calories,
                totalProtein: acc.totalProtein + meal.protein,
                totalCarbs: acc.totalCarbs + meal.carbs,
                totalFat: acc.totalFat + meal.fat,
            }),
            { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
        );
    },

    loadMeals: async () => {
        try {
            set({ isLoading: true, error: null });

            const storedMeals = await AsyncStorage.getItem(STORAGE_KEY);

            if (storedMeals) {
                const meals = JSON.parse(storedMeals);
                set({ meals });
            } else {
                set({ meals: [] });
            }

            set({ isLoading: false });
        } catch (error) {
            console.error('Error loading meals:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to load meals',
                isLoading: false
            });
        }
    },


    clearAllMeals: async () => {
        try {
            set({ isLoading: true, error: null });

            await AsyncStorage.removeItem(STORAGE_KEY);
            set({ meals: [] });

            set({ isLoading: false });
        } catch (error) {
            console.error('Error clearing meals:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to clear meals',
                isLoading: false
            });
        }
    },
}));
