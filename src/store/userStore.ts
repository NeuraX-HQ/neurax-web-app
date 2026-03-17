import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_data';
const USER_KEY = 'user_data';

export interface OnboardingData {
    name: string;
    gender: string;
    goal: string;
    height: number;
    currentWeight: number;
    targetWeight: number;
    weightChangeSpeed: number;
    activityLevel: string;
    dietaryRestrictions: string[];
    completed: boolean;
}

export interface UserData {
    name: string;
    email: string;
    weight: number;
    goalWeight: number;
    streak: number;
    dailyCalories: number;
    waterIntake: number;
    waterGoal: number;
}

const defaultOnboarding: OnboardingData = {
    name: '',
    gender: '',
    goal: '',
    height: 170,
    currentWeight: 65,
    targetWeight: 55,
    weightChangeSpeed: 0.5,
    activityLevel: '',
    dietaryRestrictions: [],
    completed: false,
};

const defaultUser: UserData = {
    name: 'Admin',
    email: 'admin@nutritrack.com',
    weight: 75,
    goalWeight: 70,
    streak: 14,
    dailyCalories: 1800,
    waterIntake: 800,
    waterGoal: 2500,
};

export const saveOnboardingData = async (data: Partial<OnboardingData>) => {
    try {
        const existing = await getOnboardingData();
        const updated = { ...existing, ...data };
        await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Error saving onboarding data:', e);
        return { ...defaultOnboarding, ...data };
    }
};

export const getOnboardingData = async (): Promise<OnboardingData> => {
    try {
        const data = await AsyncStorage.getItem(ONBOARDING_KEY);
        return data ? JSON.parse(data) : defaultOnboarding;
    } catch (e) {
        return defaultOnboarding;
    }
};

export const getUserData = async (): Promise<UserData> => {
    try {
        const data = await AsyncStorage.getItem(USER_KEY);
        return data ? JSON.parse(data) : defaultUser;
    } catch (e) {
        return defaultUser;
    }
};

export const saveUserData = async (data: Partial<UserData>) => {
    try {
        const existing = await getUserData();
        const updated = { ...existing, ...data };
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(updated));
        return updated;
    } catch (e) {
        console.error('Error saving user data:', e);
    }
};

export const clearAllData = async () => {
    await AsyncStorage.multiRemove([ONBOARDING_KEY, USER_KEY]);
};
