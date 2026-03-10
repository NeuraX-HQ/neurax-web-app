import { useEffect, useState } from 'react';
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { View, StyleSheet, Platform, AppState, AppStateStatus } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../src/store/authStore';
import BiometricPrompt from '../src/components/BiometricPrompt';
import 'react-native-get-random-values';
import "../src/lib/amplify";

export default function RootLayout() {
    const router = useRouter();
    const segments = useSegments();
    const { isAuthenticated, checkSession, checkBiometricAvailability } = useAuthStore();
    const [showBiometric, setShowBiometric] = useState(false);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const setupNavigationBar = async () => {
            if (Platform.OS === 'android') {
                // Set to transparent/absolute for more robust full-screen on Android
                await NavigationBar.setBackgroundColorAsync('transparent');
                await NavigationBar.setPositionAsync('absolute');
                await NavigationBar.setVisibilityAsync('hidden');
                await NavigationBar.setBehaviorAsync('overlay-swipe');
            }
        };

        setupNavigationBar();

        // Re-setup the navigation bar when the app returns from the background
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                setupNavigationBar();
            }
        });

        return () => {
            subscription.remove();
        };
    }, []);

    useEffect(() => {
        initializeAuth();
    }, []);

    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === '(tabs)';

        if (!isAuthenticated && inAuthGroup) {
            router.replace('/login');
        }
    }, [isAuthenticated, segments, isReady]);

    const checkAndSetAuth = async () => {
        try {
            const currentUser = await getCurrentUser();
            const session = await fetchAuthSession();

            const userId = session.tokens?.idToken?.payload?.sub;
            const token = session.tokens?.accessToken?.toString();

            if (userId && token) {
                const { login } = useAuthStore.getState();
                await login(
                    currentUser.signInDetails?.loginId || currentUser.userId || 'User',
                    userId,
                    token
                );
                return true;
            }
        } catch (e) {
            // User not authenticated
            return false;
        }
        return false;
    };

    const initializeAuth = async () => {
        await checkBiometricAvailability();
        
        // Handle Google OAuth and standard sessions
        let hasSession = await checkSession();
        if (!hasSession) {
             hasSession = await checkAndSetAuth();
        }

        if (hasSession) {
            // Check if biometric is required
            const { biometricEnabled } = useAuthStore.getState();
            if (biometricEnabled) {
                setShowBiometric(true);
            }
        }

        setIsReady(true);
    };

    const handleBiometricSuccess = () => {
        setShowBiometric(false);
    };

    const handleBiometricCancel = async () => {
        setShowBiometric(false);
        const { logout } = useAuthStore.getState();
        await logout();
        router.replace('/login');
    };

    return (
        <View style={styles.root}>
            <StatusBar hidden />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                    contentStyle: { backgroundColor: '#FFFFFF' },
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="welcome" options={{ contentStyle: { backgroundColor: '#000000' } }} />
                <Stack.Screen name="login" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade', contentStyle: { backgroundColor: '#FFFFFF' } }} />
                <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="food-detail" options={{ presentation: 'modal' }} />
                <Stack.Screen name="add-hydration" options={{ presentation: 'modal' }} />
                <Stack.Screen name="add-to-fridge" options={{ presentation: 'modal' }} />
                <Stack.Screen name="edit-ingredients" options={{ presentation: 'modal' }} />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="settings" />
            </Stack>

            <BiometricPrompt
                visible={showBiometric}
                onSuccess={handleBiometricSuccess}
                onCancel={handleBiometricCancel}
                message="Authenticate to access NutriTrack"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
});
