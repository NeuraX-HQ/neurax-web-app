import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authService from '../services/authService';
import * as userService from '../services/userService';

// Keys used by all stores — must be cleared on logout to isolate user data
const USER_DATA_KEYS = [
    'onboarding_data',
    'user_data',
    '@nutritrack_meals',
    '@nutritrack_activities',
    '@nutritrack_fridge',
];

interface AuthState {
    isAuthenticated: boolean;
    userId: string | null;
    email: string | null;
    biometricEnabled: boolean;
    biometricSupported: boolean;
    biometricEnrolled: boolean;

    // Actions
    login: (email: string, userId: string, token: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<boolean>;
    setBiometricEnabled: (enabled: boolean) => Promise<void>;
    checkBiometricAvailability: () => Promise<void>;
    authenticateWithBiometric: (message?: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    userId: null,
    email: null,
    biometricEnabled: false,
    biometricSupported: false,
    biometricEnrolled: false,

    login: async (email: string, userId: string, token: string) => {
        const session: authService.AuthSession = {
            userId,
            email,
            token,
            loginTime: Date.now(),
        };

        await authService.saveSession(session);

        set({
            isAuthenticated: true,
            userId,
            email,
        });

        // Sync data with DB after login (non-blocking — don't delay navigation)
        userService.syncOnboardingWithDB(userId, email).catch((e) => {
            console.warn('[AUTH] syncOnboardingWithDB failed:', e);
        });
    },

    logout: async () => {
        // Clear local data FIRST — on web, amplifySignOut redirects the page
        // so anything after clearSession() may never execute
        await AsyncStorage.multiRemove(USER_DATA_KEYS);

        const { useMealStore } = require('./mealStore');
        const { useFridgeStore } = require('./fridgeStore');
        useMealStore.setState({ meals: [], activities: [], currentFoodItem: null });
        useFridgeStore.setState({ items: [] });
        const { useFriendStore } = require('./friendStore');
        useFriendStore.setState({ friends: [], pendingRequests: [], sentRequests: [], myFriendCode: null, leaderboard: [], sendingRequest: false, acceptingId: null, decliningId: null, removingId: null, error: null });

        set({
            isAuthenticated: false,
            userId: null,
            email: null,
        });

        // This MUST be last — on web it triggers a full page redirect to Cognito logout
        await authService.clearSession();
    },

    checkSession: async () => {
        const session = await authService.getSession();

        if (session) {
            set({
                isAuthenticated: true,
                userId: session.userId,
                email: session.email,
            });
            return true;
        }

        return false;
    },

    setBiometricEnabled: async (enabled: boolean) => {
        await authService.setBiometricEnabled(enabled);
        set({ biometricEnabled: enabled });
    },

    checkBiometricAvailability: async () => {
        const supported = await authService.isBiometricSupported();
        const enrolled = await authService.isBiometricEnrolled();
        const enabled = await authService.isBiometricEnabled();

        set({
            biometricSupported: supported,
            biometricEnrolled: enrolled,
            biometricEnabled: enabled,
        });
    },

    authenticateWithBiometric: async (message?: string) => {
        const { biometricEnabled, biometricSupported, biometricEnrolled } = get();

        if (!biometricEnabled || !biometricSupported || !biometricEnrolled) {
            return true; // Skip if not enabled or not available
        }

        return await authService.authenticateWithBiometric(message);
    },
}));
