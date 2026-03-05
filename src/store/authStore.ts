import { create } from 'zustand';
import * as authService from '../services/authService';

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
    },

    logout: async () => {
        await authService.clearSession();

        set({
            isAuthenticated: false,
            userId: null,
            email: null,
        });
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
