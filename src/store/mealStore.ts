import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as mealService from '../services/mealService';
import * as friendService from '../services/friendService';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

// Map frontend MealType to backend enum
const mealTypeToBackend = (type: MealType): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    return type.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack';
};

export interface Meal {
    id: string;
    name: string;
    type: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    ingredients?: any[];
    time: string;
    date: string; // YYYY-MM-DD format
    image?: string; // emoji or base64
    syncStatus?: 'synced' | 'pending' | 'error'; // DynamoDB sync status
    remoteId?: string; // DynamoDB record id (different from local id)
}

export interface Activity {
    id: string;
    name: string;
    caloriesBurned: number;
    durationMinutes: number;
    time: string;
    date: string;
}

interface MealState {
    meals: Meal[];
    activities: Activity[];
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
    addActivity: (activity: Omit<Activity, 'id' | 'time' | 'date'>) => Promise<void>;
    removeMeal: (id: string) => Promise<void>;
    updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
    getMealsByDate: (date: string) => Meal[];
    getActivitiesByDate: (date: string) => Activity[];
    getTodayMeals: () => Meal[];
    getTodayActivities: () => Activity[];
    getTodayStats: () => {
        totalCalories: number;
        totalProtein: number;
        totalCarbs: number;
        totalFat: number;
        totalBurnedCalories: number;
    };
    loadMeals: () => Promise<void>;
    syncWithCloud: () => Promise<void>;
    syncPendingMeals: () => Promise<void>;
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
    activities: [],
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
                date: get().selectedDateStr,
                syncStatus: 'pending',
            };

            // Optimistic update: instant UI
            const updatedMeals = [...get().meals, newMeal];
            set({ meals: updatedMeals });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));

            // Sync to DynamoDB — awaited so remoteId is set before navigation
            try {
                const remote = await mealService.createFoodLog({
                    date: newMeal.date,
                    food_name: newMeal.name,
                    meal_type: mealTypeToBackend(newMeal.type),
                    macros: {
                        calories: newMeal.calories,
                        protein_g: newMeal.protein,
                        carbs_g: newMeal.carbs,
                        fat_g: newMeal.fat,
                    },
                    ingredients: newMeal.ingredients,
                });
                const status = remote ? 'synced' as const : 'error' as const;
                const meals = get().meals.map(m =>
                    m.id === newMeal.id ? { ...m, syncStatus: status, remoteId: remote?.id } : m
                );
                set({ meals });
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
            } catch {
                // Leave as pending — will retry via syncPendingMeals
            }

            // Update PublicStats for leaderboard (fire-and-forget)
            try {
                const { useAuthStore } = require('./authStore');
                const authState = useAuthStore.getState();
                if (authState.userId) {
                    const allMeals = get().meals;
                    const totalDays = new Set(allMeals.map(m => m.date)).size;
                    const petLevel = totalDays <= 0 ? 1 : Math.min(5, Math.floor((totalDays - 1) / 36) + 1);
                    friendService.updateMyPublicStats({
                        user_id: authState.userId,
                        display_name: authState.email?.split('@')[0] || 'User',
                        current_streak: totalDays,
                        pet_score: totalDays * 20,
                        pet_level: petLevel,
                        total_log_days: totalDays,
                        last_log_date: newMeal.date,
                    }).catch(() => {});
                }
            } catch {
                // Non-critical — don't block meal logging
            }

            set({ isLoading: false });
        } catch (error) {
            console.error('Error adding meal:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to add meal',
                isLoading: false
            });
        }
    },

    addActivity: async (activityData) => {
        try {
            set({ isLoading: true, error: null });

            const newActivity: Activity = {
                ...activityData,
                id: generateId(),
                time: getCurrentTime(),
                date: get().selectedDateStr,
            };

            const updatedActivities = [...get().activities, newActivity];
            set({ activities: updatedActivities });

            // Using the same storage key and parsing logic might be complex if we are mixed.
            // But let's save meals and activities in separate keys to be clean.
            const ACTIVITY_STORAGE_KEY = '@nutritrack_activities';
            await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(updatedActivities));

            set({ isLoading: false });
        } catch (error) {
            console.error('Error adding activity:', error);
            set({
                error: error instanceof Error ? error.message : 'Failed to add activity',
                isLoading: false
            });
        }
    },

    removeMeal: async (id) => {
        try {
            set({ isLoading: true, error: null });

            const meal = get().meals.find(m => m.id === id);
            const updatedMeals = get().meals.filter(m => m.id !== id);
            set({ meals: updatedMeals });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
            set({ isLoading: false });

            // Background: delete from DynamoDB if synced
            if (meal?.remoteId) {
                mealService.deleteFoodLog(meal.remoteId);
            }
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

            // Background: update in DynamoDB if synced
            const meal = updatedMeals.find(m => m.id === id);
            if (meal?.remoteId) {
                mealService.updateFoodLog(meal.remoteId, {
                    food_name: meal.name,
                    meal_type: mealTypeToBackend(meal.type),
                    macros: {
                        calories: meal.calories,
                        protein_g: meal.protein,
                        carbs_g: meal.carbs,
                        fat_g: meal.fat,
                    },
                });
            }
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

    getActivitiesByDate: (date) => {
        return get().activities.filter(activity => activity.date === date);
    },

    getTodayMeals: () => {
        const today = getTodayDate();
        return get().meals.filter(meal => meal.date === today);
    },

    getTodayActivities: () => {
        const today = getTodayDate();
        return get().activities.filter(activity => activity.date === today);
    },

    getTodayStats: () => {
        const todayMeals = get().getTodayMeals();
        const todayActivities = get().getTodayActivities();

        const mealStats = todayMeals.reduce(
            (acc, meal) => ({
                totalCalories: acc.totalCalories + meal.calories,
                totalProtein: acc.totalProtein + meal.protein,
                totalCarbs: acc.totalCarbs + meal.carbs,
                totalFat: acc.totalFat + meal.fat,
            }),
            { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
        );

        const totalBurnedCalories = todayActivities.reduce((sum, act) => sum + act.caloriesBurned, 0);

        return {
            ...mealStats,
            totalBurnedCalories,
        };
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

            const ACTIVITY_STORAGE_KEY = '@nutritrack_activities';
            const storedActivities = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
            if (storedActivities) {
                const activities = JSON.parse(storedActivities);
                set({ activities });
            } else {
                set({ activities: [] });
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


    syncWithCloud: async () => {
        try {
            const today = getTodayDate();
            const remoteLogs = await mealService.fetchFoodLogsByDate(today);
            if (remoteLogs.length === 0) return;

            const existingIds = new Set(get().meals.map(m => m.remoteId).filter(Boolean));
            const newMeals: Meal[] = remoteLogs
                .filter(log => !existingIds.has(log.id))
                .map(log => ({
                    id: generateId(),
                    remoteId: log.id,
                    name: log.food_name,
                    type: (log.meal_type?.toUpperCase() || 'SNACK') as MealType,
                    calories: (log.macros as any)?.calories ?? 0,
                    protein: (log.macros as any)?.protein_g ?? 0,
                    carbs: (log.macros as any)?.carbs_g ?? 0,
                    fat: (log.macros as any)?.fat_g ?? 0,
                    servingSize: log.portion_unit || '1 phần',
                    ingredients: log.ingredients as any[] | undefined,
                    time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '',
                    date: log.date,
                    syncStatus: 'synced' as const,
                }));

            if (newMeals.length > 0) {
                const merged = [...get().meals, ...newMeals];
                set({ meals: merged });
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            }
        } catch (error) {
            console.error('Error syncing with cloud:', error);
        }
    },

    syncPendingMeals: async () => {
        const pending = get().meals.filter(m => m.syncStatus === 'pending' || m.syncStatus === 'error');
        for (const meal of pending) {
            const remote = await mealService.createFoodLog({
                date: meal.date,
                food_name: meal.name,
                meal_type: mealTypeToBackend(meal.type),
                macros: {
                    calories: meal.calories,
                    protein_g: meal.protein,
                    carbs_g: meal.carbs,
                    fat_g: meal.fat,
                },
                ingredients: meal.ingredients,
            });
            if (remote) {
                const meals = get().meals.map(m =>
                    m.id === meal.id ? { ...m, syncStatus: 'synced' as const, remoteId: remote.id } : m
                );
                set({ meals });
            }
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().meals));
    },

    clearAllMeals: async () => {
        try {
            set({ isLoading: true, error: null });

            await AsyncStorage.removeItem(STORAGE_KEY);
            await AsyncStorage.removeItem('@nutritrack_activities');
            set({ meals: [], activities: [] });

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
