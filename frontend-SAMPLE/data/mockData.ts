// Mock data for NutriTrack 2.0
// Vietnamese dishes and realistic nutrition data

export interface FoodItem {
    id: string;
    name: string;
    nameVi: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    servingSize: string;
    servingGrams: number;
    image?: string;
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface MealLog {
    id: string;
    food: FoodItem;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    timestamp: Date;
    grams: number;
    loggedVia: 'voice' | 'photo' | 'manual';
}

export interface DayLog {
    date: string; // YYYY-MM-DD
    meals: MealLog[];
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
}

export interface Challenge {
    id: string;
    title: string;
    description: string;
    type: 'protein' | 'streak' | 'consistency' | 'macro';
    duration: number; // days
    currentDay: number;
    targetDays: number;
    opponent?: {
        name: string;
        avatar: string;
        progress: number;
    };
    userProgress: number;
    stakes?: string;
    endsAt: Date;
    messages: ChatMessage[];
}

export interface ChatMessage {
    id: string;
    sender: 'user' | 'opponent' | 'bao';
    message: string;
    timestamp: Date;
}

export interface FridgeItem {
    id: string;
    name: string;
    nameVi: string;
    quantity: string;
    grams?: number;
    expiresAt: Date;
    addedAt: Date;
    category: 'produce' | 'meat' | 'dairy' | 'condiment' | 'dry' | 'other';
}

export interface Recipe {
    id: string;
    name: string;
    nameVi: string;
    description: string;
    prepTime: number;
    cookTime: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    ingredients: string[];
    matchedFromFridge: number;
    image?: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    goals: string[];
    weight: number;
    targetWeight?: number;
    height: number;
    age: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'moderate' | 'active';
    streak: number;
    tdee: number;
    macroTargets: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

// ===== MOCK DATA =====

export const MOCK_USER: User = {
    id: 'user-001',
    name: 'Sarina',
    email: 'sarina@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    goals: ['muscle_gain', 'eat_healthy'],
    weight: 55,
    targetWeight: 52,
    height: 165,
    age: 25,
    gender: 'female',
    activityLevel: 'moderate',
    streak: 12,
    tdee: 1800,
    macroTargets: {
        calories: 1800,
        protein: 120,
        carbs: 180,
        fat: 60,
    },
};

export const VIETNAMESE_FOODS: FoodItem[] = [
    {
        id: 'pho-bo',
        name: 'Beef Pho',
        nameVi: 'Phở bò',
        calories: 450,
        protein: 35,
        carbs: 65,
        fat: 12,
        servingSize: '1 bowl',
        servingGrams: 350,
        category: 'breakfast',
        image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400',
    },
    {
        id: 'com-tam-suon',
        name: 'Broken Rice with Pork Chop',
        nameVi: 'Cơm tấm sườn',
        calories: 680,
        protein: 38,
        carbs: 72,
        fat: 28,
        servingSize: '1 plate',
        servingGrams: 400,
        category: 'lunch',
        image: 'https://images.unsplash.com/photo-1569058242567-93de6f36f8e6?w=400',
    },
    {
        id: 'banh-mi',
        name: 'Vietnamese Sandwich',
        nameVi: 'Bánh mì',
        calories: 320,
        protein: 15,
        carbs: 45,
        fat: 10,
        servingSize: '1 sandwich',
        servingGrams: 200,
        category: 'breakfast',
        image: 'https://images.unsplash.com/photo-1600688640154-9619e002df30?w=400',
    },
    {
        id: 'bun-cha',
        name: 'Grilled Pork with Noodles',
        nameVi: 'Bún chả',
        calories: 650,
        protein: 42,
        carbs: 58,
        fat: 25,
        servingSize: '1 serving',
        servingGrams: 450,
        category: 'lunch',
        image: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400',
    },
    {
        id: 'com-ga',
        name: 'Chicken Rice',
        nameVi: 'Cơm gà',
        calories: 550,
        protein: 40,
        carbs: 70,
        fat: 12,
        servingSize: '1 plate',
        servingGrams: 380,
        category: 'lunch',
        image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400',
    },
    {
        id: 'goi-cuon',
        name: 'Fresh Spring Rolls',
        nameVi: 'Gỏi cuốn',
        calories: 180,
        protein: 12,
        carbs: 22,
        fat: 5,
        servingSize: '2 rolls',
        servingGrams: 150,
        category: 'snack',
        image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400',
    },
    {
        id: 'thit-kho-trung',
        name: 'Braised Pork with Eggs',
        nameVi: 'Thịt kho trứng',
        calories: 420,
        protein: 35,
        carbs: 15,
        fat: 28,
        servingSize: '1 serving',
        servingGrams: 250,
        category: 'dinner',
        image: 'https://images.unsplash.com/photo-1623689046286-01f2390a7659?w=400',
    },
    {
        id: 'canh-chua',
        name: 'Sour Soup',
        nameVi: 'Canh chua',
        calories: 180,
        protein: 18,
        carbs: 12,
        fat: 8,
        servingSize: '1 bowl',
        servingGrams: 300,
        category: 'dinner',
    },
];

export const MOCK_TODAYS_MEALS: MealLog[] = [
    {
        id: 'log-001',
        food: VIETNAMESE_FOODS[0], // Phở bò
        mealType: 'breakfast',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        grams: 350,
        loggedVia: 'voice',
    },
    {
        id: 'log-002',
        food: VIETNAMESE_FOODS[4], // Cơm gà
        mealType: 'lunch',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        grams: 380,
        loggedVia: 'photo',
    },
];

export const MOCK_WEEK_DATA: { date: string; logged: boolean }[] = [
    { date: '2026-02-03', logged: true },
    { date: '2026-02-04', logged: true },
    { date: '2026-02-05', logged: true },
    { date: '2026-02-06', logged: false }, // today
    { date: '2026-02-07', logged: false },
];

export const MOCK_CHALLENGES: Challenge[] = [
    {
        id: 'challenge-001',
        title: 'Protein Battle',
        description: 'Hit protein goal 5 out of 7 days',
        type: 'protein',
        duration: 7,
        currentDay: 5,
        targetDays: 5,
        userProgress: 4,
        opponent: {
            name: 'John',
            avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=100',
            progress: 3,
        },
        stakes: 'Loser buys winner a protein shake 🥤',
        endsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        messages: [
            {
                id: 'msg-001',
                sender: 'opponent',
                message: "Gonna catch up today! 💪",
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            },
            {
                id: 'msg-002',
                sender: 'user',
                message: "Bring it on! 😎",
                timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
            },
        ],
    },
    {
        id: 'challenge-002',
        title: '7-Day Streak',
        description: 'Log meals every day for 7 days',
        type: 'streak',
        duration: 7,
        currentDay: 6,
        targetDays: 7,
        userProgress: 5,
        opponent: {
            name: 'Sarah',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
            progress: 6,
        },
        endsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        messages: [],
    },
];

export const MOCK_FRIDGE_ITEMS: FridgeItem[] = [
    {
        id: 'fridge-001',
        name: 'Pork Belly',
        nameVi: 'Thịt ba chỉ',
        quantity: '500g',
        grams: 500,
        expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        category: 'meat',
    },
    {
        id: 'fridge-002',
        name: 'Eggs',
        nameVi: 'Trứng gà',
        quantity: '6 quả',
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        addedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        category: 'dairy',
    },
    {
        id: 'fridge-003',
        name: 'Morning Glory',
        nameVi: 'Rau muống',
        quantity: '1 bó',
        grams: 200,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        category: 'produce',
    },
    {
        id: 'fridge-004',
        name: 'Tomatoes',
        nameVi: 'Cà chua',
        quantity: '3 quả',
        grams: 250,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        category: 'produce',
    },
    {
        id: 'fridge-005',
        name: 'Fish Sauce',
        nameVi: 'Nước mắm',
        quantity: '1 bottle',
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        addedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        category: 'condiment',
    },
    {
        id: 'fridge-006',
        name: 'Rice',
        nameVi: 'Gạo',
        quantity: '2kg',
        grams: 2000,
        expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        category: 'dry',
    },
];

export const MOCK_RECIPES: Recipe[] = [
    {
        id: 'recipe-001',
        name: 'Braised Pork with Eggs',
        nameVi: 'Thịt kho trứng',
        description: 'Classic Vietnamese comfort food. Perfect for using your pork belly!',
        prepTime: 15,
        cookTime: 45,
        calories: 420,
        protein: 35,
        carbs: 15,
        fat: 28,
        ingredients: ['Pork Belly', 'Eggs', 'Fish Sauce', 'Sugar', 'Coconut Water'],
        matchedFromFridge: 3,
        difficulty: 'easy',
        image: 'https://images.unsplash.com/photo-1623689046286-01f2390a7659?w=400',
    },
    {
        id: 'recipe-002',
        name: 'Stir-fried Morning Glory',
        nameVi: 'Rau muống xào tỏi',
        description: 'Quick and healthy veggie side dish',
        prepTime: 5,
        cookTime: 5,
        calories: 80,
        protein: 4,
        carbs: 8,
        fat: 4,
        ingredients: ['Morning Glory', 'Garlic', 'Fish Sauce', 'Oil'],
        matchedFromFridge: 2,
        difficulty: 'easy',
    },
    {
        id: 'recipe-003',
        name: 'Tomato Egg Drop Soup',
        nameVi: 'Canh cà chua trứng',
        description: 'Simple, nutritious soup in 15 minutes',
        prepTime: 5,
        cookTime: 10,
        calories: 120,
        protein: 8,
        carbs: 10,
        fat: 6,
        ingredients: ['Tomatoes', 'Eggs', 'Fish Sauce', 'Green Onion'],
        matchedFromFridge: 3,
        difficulty: 'easy',
    },
];

export const AI_BAO_MESSAGES = {
    morning: [
        "Sáng rồi! Hôm nay ăn gì? Nhớ đạm đủ đó 🍗",
        "Good morning! Ready to crush those macros today? 💪",
        "Ê, dậy chưa? Log cái breakfast đi! 🌅",
    ],
    praise: [
        "45g protein rồi! Over-delivered! Respect ✊",
        "Ê, consistency king/queen nè! Keep going! 🔥",
        "Macro on point! Bảo proud of you 😎",
    ],
    encouragement: [
        "Hôm nay thiếu đạm. Không sao, tối ăn thêm trứng luộc là đủ. Ez game! 😎",
        "Streak sắp mất! Log 1 meal thôi là safe. You got this! 🛡️",
        "Còn 35g protein nữa thôi. Chicken breast = ez win! 🍗",
    ],
};
