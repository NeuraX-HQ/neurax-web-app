import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { signOut as amplifySignOut } from 'aws-amplify/auth';
import { secureLogger } from '../security/SecureLogger';

const AUTH_TOKEN_KEY = 'auth_token';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const SESSION_KEY = 'user_session';

export interface AuthSession {
    userId: string;
    email: string;
    token: string;
    loginTime: number;
}

// Check if device supports biometric authentication
export const isBiometricSupported = async (): Promise<boolean> => {
    try {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        return compatible;
    } catch (error) {
        secureLogger.error('Error checking biometric support', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
};

// Check if biometric is enrolled
export const isBiometricEnrolled = async (): Promise<boolean> => {
    try {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        return enrolled;
    } catch (error) {
        secureLogger.error('Error checking biometric enrollment', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
};

// Get available biometric types
export const getBiometricTypes = async (): Promise<LocalAuthentication.AuthenticationType[]> => {
    try {
        return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
        secureLogger.error('Error getting biometric types', { error: error instanceof Error ? error.message : String(error) });
        return [];
    }
};

// Authenticate with biometric
export const authenticateWithBiometric = async (
    promptMessage: string = 'Authenticate to continue'
): Promise<boolean> => {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage,
            fallbackLabel: 'Use passcode',
            disableDeviceFallback: false,
        });
        return result.success;
    } catch (error) {
        secureLogger.error('Biometric authentication error', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
};

// Save auth token securely
export const saveAuthToken = async (token: string): Promise<void> => {
    try {
        if (Platform.OS === 'web') {
            await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
        } else {
            await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
        }
    } catch (error) {
        secureLogger.error('Error saving auth token', { error: error instanceof Error ? error.message : String(error) });
    }
};

// Get auth token
export const getAuthToken = async (): Promise<string | null> => {
    try {
        if (Platform.OS === 'web') {
            return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        }
        return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch (error) {
        secureLogger.error('Error getting auth token', { error: error instanceof Error ? error.message : String(error) });
        return null;
    }
};

// Delete auth token
export const deleteAuthToken = async (): Promise<void> => {
    try {
        if (Platform.OS === 'web') {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
        } else {
            await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        }
    } catch (error) {
        secureLogger.error('Error deleting auth token', { error: error instanceof Error ? error.message : String(error) });
    }
};

// Save session
export const saveSession = async (session: AuthSession): Promise<void> => {
    try {
        await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
        await saveAuthToken(session.token);
    } catch (error) {
        secureLogger.error('Error saving session', { error: error instanceof Error ? error.message : String(error) });
    }
};

// Get session
export const getSession = async (): Promise<AuthSession | null> => {
    try {
        const sessionData = await AsyncStorage.getItem(SESSION_KEY);
        return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
        secureLogger.error('Error getting session', { error: error instanceof Error ? error.message : String(error) });
        return null;
    }
};

// Clear session (logout)
export const clearSession = async (): Promise<void> => {
    try {
        // Sign out from Amplify/Cognito first (clears tokens, cookies, OAuth session)
        // Use timeout to prevent hanging on Expo Go when session is invalid
        try {
            await Promise.race([
                amplifySignOut({ global: true }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('signOut timeout')), 5000)),
            ]);
        } catch {}
        await AsyncStorage.removeItem(SESSION_KEY);
        await deleteAuthToken();
    } catch (error) {
        secureLogger.error('Error clearing session', { error: error instanceof Error ? error.message : String(error) });
    }
};

// Check if user is logged in
export const isLoggedIn = async (): Promise<boolean> => {
    const session = await getSession();
    return session !== null;
};

// Biometric settings
export const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
    try {
        await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
        secureLogger.error('Error setting biometric enabled', { error: error instanceof Error ? error.message : String(error) });
    }
};

export const isBiometricEnabled = async (): Promise<boolean> => {
    try {
        const value = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
        return value ? JSON.parse(value) : false;
    } catch (error) {
        secureLogger.error('Error getting biometric enabled', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
};
