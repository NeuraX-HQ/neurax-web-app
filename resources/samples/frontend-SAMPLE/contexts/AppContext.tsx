import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    MOCK_TODAYS_MEALS,
    MOCK_CHALLENGES,
    MOCK_FRIDGE_ITEMS,
    MOCK_RECIPES,
    MOCK_USER,
    MealLog,
    Challenge,
    FridgeItem,
    Recipe,
    FoodItem,
    VIETNAMESE_FOODS,
} from '../data/mockData';

interface AppContextType {
    // Meals
    todaysMeals: MealLog[];
    addMealLog: (meal: MealLog) => void;
    removeMealLog: (id: string) => void;
    updateMealLog: (id: string, updates: Partial<MealLog>) => void;

    // Macros for today
    todaysMacros: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    macroTargets: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };

    // Streak
    currentStreak: number;
    weekData: { date: string; logged: boolean }[];

    // Challenges
    challenges: Challenge[];
    addChallenge: (challenge: Challenge) => void;

    // Kitchen
    fridgeItems: FridgeItem[];
    addFridgeItem: (item: FridgeItem) => void;
    removeFridgeItem: (id: string) => void;
    recipes: Recipe[];

    // Food database
    searchFoods: (query: string) => FoodItem[];
    recentFoods: FoodItem[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [todaysMeals, setTodaysMeals] = useState<MealLog[]>(MOCK_TODAYS_MEALS);
    const [challenges, setChallenges] = useState<Challenge[]>(MOCK_CHALLENGES);
    const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>(MOCK_FRIDGE_ITEMS);
    const [recipes] = useState<Recipe[]>(MOCK_RECIPES);
    const [recentFoods] = useState<FoodItem[]>(VIETNAMESE_FOODS.slice(0, 5));

    const [weekData] = useState([
        { date: '2026-02-01', logged: true },
        { date: '2026-02-02', logged: true },
        { date: '2026-02-03', logged: true },
        { date: '2026-02-04', logged: true },
        { date: '2026-02-05', logged: true }, // today, partial
        { date: '2026-02-06', logged: false },
        { date: '2026-02-07', logged: false },
    ]);

    // Calculate today's macros from meals
    const todaysMacros = React.useMemo(() => {
        return todaysMeals.reduce(
            (acc, meal) => {
                const multiplier = meal.grams / meal.food.servingGrams;
                return {
                    calories: acc.calories + Math.round(meal.food.calories * multiplier),
                    protein: acc.protein + Math.round(meal.food.protein * multiplier),
                    carbs: acc.carbs + Math.round(meal.food.carbs * multiplier),
                    fat: acc.fat + Math.round(meal.food.fat * multiplier),
                };
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
    }, [todaysMeals]);

    const macroTargets = MOCK_USER.macroTargets;
    const currentStreak = MOCK_USER.streak;

    const addMealLog = useCallback((meal: MealLog) => {
        setTodaysMeals(prev => [...prev, meal]);
    }, []);

    const removeMealLog = useCallback((id: string) => {
        setTodaysMeals(prev => prev.filter(m => m.id !== id));
    }, []);

    const updateMealLog = useCallback((id: string, updates: Partial<MealLog>) => {
        setTodaysMeals(prev =>
            prev.map(m => (m.id === id ? { ...m, ...updates } : m))
        );
    }, []);

    const addChallenge = useCallback((challenge: Challenge) => {
        setChallenges(prev => [...prev, challenge]);
    }, []);

    const addFridgeItem = useCallback((item: FridgeItem) => {
        setFridgeItems(prev => [...prev, item]);
    }, []);

    const removeFridgeItem = useCallback((id: string) => {
        setFridgeItems(prev => prev.filter(i => i.id !== id));
    }, []);

    const searchFoods = useCallback((query: string): FoodItem[] => {
        if (!query.trim()) return VIETNAMESE_FOODS.slice(0, 8);

        const lowercaseQuery = query.toLowerCase();
        return VIETNAMESE_FOODS.filter(
            food =>
                food.name.toLowerCase().includes(lowercaseQuery) ||
                food.nameVi.toLowerCase().includes(lowercaseQuery)
        );
    }, []);

    return (
        <AppContext.Provider
            value={{
                todaysMeals,
                addMealLog,
                removeMealLog,
                updateMealLog,
                todaysMacros,
                macroTargets,
                currentStreak,
                weekData,
                challenges,
                addChallenge,
                fridgeItems,
                addFridgeItem,
                removeFridgeItem,
                recipes,
                searchFoods,
                recentFoods,
            }}
        >
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}
