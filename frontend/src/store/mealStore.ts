import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as mealService from '../services/mealService';
import * as friendService from '../services/friendService';
import { getUserData } from './userStore';
import { getCurrentStreak } from '../utils/streak';
import { getUrl } from 'aws-amplify/storage';

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

// Map frontend MealType to backend enum
const mealTypeToBackend = (type: MealType): 'breakfast' | 'lunch' | 'dinner' | 'snack' => {
    return type.toLowerCase() as 'breakfast' | 'lunch' | 'dinner' | 'snack';
};

export interface Meal {
    id: string;
    name: string;
    name_en?: string;
    name_vi?: string;
    type: MealType;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    ingredients?: any[];
    time: string;
    date: string; // YYYY-MM-DD format
    image?: string; // emoji or presigned URL for local display
    image_key?: string; // S3 key for persistent reference (e.g. "incoming/us-east-1:xxx/photo.jpg")
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
    addMeal: (meal: Omit<Meal, 'id' | 'time' | 'date'> & { date?: string }) => Promise<void>;
    addActivity: (activity: Omit<Activity, 'id' | 'time' | 'date'>) => Promise<void>;
    removeMeal: (id: string) => Promise<void>;
    updateMeal: (id: string, updates: Partial<Meal>) => Promise<void>;
    getMealsByDate: (date: string) => Meal[];
    getActivitiesByDate: (date: string) => Activity[];
    getTodayMeals: () => Meal[];
    getTodayActivities: () => Activity[];
    getStatsByDate: (date: string) => {
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
export const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper to get current time in HH:MM AM/PM format
export const getCurrentTime = (): string => {
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
export const generateId = (): string => {
    return `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper: YYYY-MM-DD for N days ago
const getDateNDaysAgo = (n: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Retry helper: attempt fn up to `attempts` times with exponential backoff
const retryAsync = async (fn: () => Promise<void>, attempts = 3): Promise<void> => {
    for (let i = 0; i < attempts; i++) {
        try { await fn(); return; } catch {
            if (i < attempts - 1) await new Promise(r => setTimeout(r, 2000 * (i + 1)));
        }
    }
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

            // Safety net: only allow logging for today and yesterday
            const logDate = mealData.date || get().selectedDateStr;
            const today = getTodayDate();
            const yesterday = getDateNDaysAgo(1);
            if (logDate > today || logDate < yesterday) {
                set({ isLoading: false, error: 'Cannot log meals for this date' });
                return;
            }

            const newMeal: Meal = {
                ...mealData,
                id: generateId(),
                time: getCurrentTime(),
                date: mealData.date || get().selectedDateStr,
                syncStatus: 'pending',
            };

            // Optimistic update: instant UI
            const updatedMeals = [...get().meals, newMeal];
            set({ meals: updatedMeals });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));

            // Sync to DynamoDB — fire-and-forget, không block UI
            mealService.createFoodLog({
                date: newMeal.date,
                food_name: newMeal.name,
                meal_type: mealTypeToBackend(newMeal.type),
                macros: {
                    calories: newMeal.calories,
                    protein_g: newMeal.protein,
                    carbs_g: newMeal.carbs,
                    fat_g: newMeal.fat,
                },
                ingredients: newMeal.ingredients?.map(ing => JSON.stringify(ing)),
                image_key: newMeal.image_key,
                input_method: newMeal.image_key ? 'photo' : 'manual',
            }).then(remote => {
                const status = remote ? 'synced' as const : 'error' as const;
                const meals = get().meals.map(m =>
                    m.id === newMeal.id ? { ...m, syncStatus: status, remoteId: remote?.id } : m
                );
                set({ meals });
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
            }).catch(() => {
                // Leave as pending — will retry via syncPendingMeals
            });

            // Update PublicStats for leaderboard (fire-and-forget with retry)
            try {
                const { useAuthStore } = require('./authStore');
                const authState = useAuthStore.getState();
                if (authState.userId) {
                    const allMeals = get().meals;
                    const mealDateSet = new Set(allMeals.map(m => m.date));
                    const totalDays = mealDateSet.size;
                    const currentStreak = getCurrentStreak(mealDateSet, getTodayDate());
                    const petLevel = totalDays <= 0 ? 1 : Math.min(5, Math.floor((totalDays - 1) / 36) + 1);
                    getUserData().then(userData => {
                        const displayName = userData?.name && userData.name !== 'Admin'
                            ? userData.name
                            : authState.email?.split('@')[0] || 'User';
                        retryAsync(() => friendService.updateMyPublicStats({
                            user_id: authState.userId,
                            display_name: displayName,
                            current_streak: currentStreak,
                            pet_score: totalDays * 20,
                            pet_level: petLevel,
                            total_log_days: totalDays,
                            last_log_date: newMeal.date,
                        }));
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

    getStatsByDate: (date) => {
        const dateMeals = get().getMealsByDate(date);
        const dateActivities = get().getActivitiesByDate(date);

        const mealStats = dateMeals.reduce(
            (acc, meal) => ({
                totalCalories: acc.totalCalories + meal.calories,
                totalProtein: acc.totalProtein + meal.protein,
                totalCarbs: acc.totalCarbs + meal.carbs,
                totalFat: acc.totalFat + meal.fat,
            }),
            { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
        );

        const totalBurnedCalories = dateActivities.reduce((sum, act) => sum + act.caloriesBurned, 0);

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
            const startDate = getDateNDaysAgo(30);

            // Pull remote meals from last 30 days
            const remoteLogs = await mealService.fetchFoodLogsByDateRange(startDate, today);

            if (remoteLogs.length > 0) {
                const existingRemoteIds = new Set(get().meals.map(m => m.remoteId).filter(Boolean));
                const newMeals: Meal[] = remoteLogs
                    .filter(log => !existingRemoteIds.has(log.id))
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
                        image_key: log.image_key ?? undefined,
                        syncStatus: 'synced' as const,
                    }));

                if (newMeals.length > 0) {
                    // Resolve S3 image keys → presigned URLs for thumbnail display
                    await Promise.all(newMeals.map(async (m) => {
                        if (m.image_key) {
                            try {
                                const { url } = await getUrl({ path: m.image_key });
                                m.image = url.toString();
                            } catch { /* leave image undefined */ }
                        }
                    }));
                    const merged = [...get().meals, ...newMeals];
                    set({ meals: merged });
                    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
                }
            }

            // Push any local pending meals up to cloud
            await get().syncPendingMeals();
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
