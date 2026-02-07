import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { MOCK_USER, User } from '../data/mockData';

interface OnboardingData {
    goals: string[];
    weight: number;
    height: number;
    age: number;
    gender: 'male' | 'female' | 'other';
    activityLevel: 'sedentary' | 'moderate' | 'active';
    targetWeight?: number;
    dietaryRestrictions: string[];
    allergies: string[];
    notificationPreferences: {
        mealReminders: boolean;
        streakAlerts: boolean;
        challengeUpdates: boolean;
        dailyTips: boolean;
    };
    reminderTimes: {
        morning: string;
        lunch: string;
        dinner: string;
    };
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    isOnboarded: boolean;
    isGuest: boolean;
    user: User | null;
    onboardingData: OnboardingData | null;
    signInWithApple: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    continueAsGuest: () => Promise<void>;
    signOut: () => Promise<void>;
    completeOnboarding: (data: OnboardingData) => Promise<void>;
    updateOnboardingStep: (step: number, data: Partial<OnboardingData>) => void;
}

const defaultOnboardingData: OnboardingData = {
    goals: [],
    weight: 60,
    height: 165,
    age: 25,
    gender: 'female',
    activityLevel: 'moderate',
    dietaryRestrictions: [],
    allergies: [],
    notificationPreferences: {
        mealReminders: true,
        streakAlerts: true,
        challengeUpdates: true,
        dailyTips: false,
    },
    reminderTimes: {
        morning: '08:00',
        lunch: '12:00',
        dinner: '18:00',
    },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'nutritrack_auth_token';
const ONBOARDING_KEY = 'nutritrack_onboarding';
const USER_KEY = 'nutritrack_user';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isOnboarded, setIsOnboarded] = useState(false);
    const [isGuest, setIsGuest] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [onboardingData, setOnboardingData] = useState<OnboardingData>(defaultOnboardingData);

    // Check auth status on mount
    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
            const onboarded = await SecureStore.getItemAsync(ONBOARDING_KEY);
            const userData = await SecureStore.getItemAsync(USER_KEY);

            if (token) {
                setIsAuthenticated(true);
                setIsGuest(token === 'guest');
                setIsOnboarded(onboarded === 'true');

                if (userData) {
                    setUser(JSON.parse(userData));
                } else {
                    setUser(MOCK_USER);
                }
            }
        } catch (error) {
            console.log('Error checking auth status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithApple = async () => {
        setIsLoading(true);
        try {
            // Simulate OAuth - in production, use expo-apple-authentication
            await new Promise(resolve => setTimeout(resolve, 1500));

            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'apple_mock_token');
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(MOCK_USER));

            setUser(MOCK_USER);
            setIsAuthenticated(true);
            setIsGuest(false);

            // Check if user has completed onboarding before
            const onboarded = await SecureStore.getItemAsync(ONBOARDING_KEY);
            setIsOnboarded(onboarded === 'true');
        } catch (error) {
            console.error('Apple sign in error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        setIsLoading(true);
        try {
            // Simulate OAuth - in production, use expo-auth-session
            await new Promise(resolve => setTimeout(resolve, 1500));

            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'google_mock_token');
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(MOCK_USER));

            setUser(MOCK_USER);
            setIsAuthenticated(true);
            setIsGuest(false);

            const onboarded = await SecureStore.getItemAsync(ONBOARDING_KEY);
            setIsOnboarded(onboarded === 'true');
        } catch (error) {
            console.error('Google sign in error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const continueAsGuest = async () => {
        setIsLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 500));

            const guestUser: User = {
                ...MOCK_USER,
                id: 'guest-' + Date.now(),
                name: 'Guest',
                email: '',
            };

            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, 'guest');
            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(guestUser));

            setUser(guestUser);
            setIsAuthenticated(true);
            setIsGuest(true);
            setIsOnboarded(false);
        } catch (error) {
            console.error('Guest mode error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        setIsLoading(true);
        try {
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_KEY);
            // Keep onboarding data for returning users

            setUser(null);
            setIsAuthenticated(false);
            setIsGuest(false);
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateOnboardingStep = (step: number, data: Partial<OnboardingData>) => {
        setOnboardingData(prev => ({ ...prev, ...data }));
    };

    const completeOnboarding = async (data: OnboardingData) => {
        setIsLoading(true);
        try {
            // Calculate TDEE based on onboarding data
            const tdee = calculateTDEE(data);
            const macros = calculateMacros(tdee, data.goals);

            const updatedUser: User = {
                ...MOCK_USER,
                ...user,
                goals: data.goals,
                weight: data.weight,
                height: data.height,
                age: data.age,
                gender: data.gender,
                activityLevel: data.activityLevel,
                targetWeight: data.targetWeight,
                tdee,
                macroTargets: macros,
            };

            await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
            await SecureStore.setItemAsync(ONBOARDING_KEY, 'true');

            setUser(updatedUser);
            setOnboardingData(data);
            setIsOnboarded(true);
        } catch (error) {
            console.error('Complete onboarding error:', error);
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading,
                isOnboarded,
                isGuest,
                user,
                onboardingData,
                signInWithApple,
                signInWithGoogle,
                continueAsGuest,
                signOut,
                completeOnboarding,
                updateOnboardingStep,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Helper functions for TDEE and macro calculation
function calculateTDEE(data: OnboardingData): number {
    // Mifflin-St Jeor Equation
    let bmr: number;

    if (data.gender === 'male') {
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age + 5;
    } else {
        bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age - 161;
    }

    const activityMultipliers = {
        sedentary: 1.2,
        moderate: 1.55,
        active: 1.725,
    };

    return Math.round(bmr * activityMultipliers[data.activityLevel]);
}

function calculateMacros(tdee: number, goals: string[]): { calories: number; protein: number; carbs: number; fat: number } {
    let adjustedCalories = tdee;

    // Adjust based on goals
    if (goals.includes('lose_weight')) {
        adjustedCalories = tdee - 300;
    } else if (goals.includes('muscle_gain')) {
        adjustedCalories = tdee + 200;
    }

    // Macro split: 30% protein, 40% carbs, 30% fat (for muscle gain)
    const proteinCalories = adjustedCalories * 0.30;
    const carbCalories = adjustedCalories * 0.40;
    const fatCalories = adjustedCalories * 0.30;

    return {
        calories: adjustedCalories,
        protein: Math.round(proteinCalories / 4), // 4 cal per gram
        carbs: Math.round(carbCalories / 4),
        fat: Math.round(fatCalories / 9), // 9 cal per gram
    };
}
