import { useEffect, useState } from 'react';
import { getCurrentUser, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { View, StyleSheet, Platform, AppState, AppStateStatus, ActivityIndicator, Text } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { useAuthStore } from '../src/store/authStore';
import BiometricPrompt from '../src/components/BiometricPrompt';
import 'react-native-get-random-values';
import "../src/lib/amplify";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LanguageProvider, useAppLanguage } from '../src/i18n/LanguageProvider';
import { useSettingsStore } from '../src/store/settingsStore';

export default function RootLayout() {
    return (
        <LanguageProvider>
            <RootLayoutShell />
        </LanguageProvider>
    );
}

function RootLayoutShell() {
    const router = useRouter();
    const segments = useSegments();
    const { t, targetLanguage, isSwitchingLanguage } = useAppLanguage();
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
        useSettingsStore.getState().loadPreferences();
    }, []);

    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === '(tabs)';
        if (!isAuthenticated && inAuthGroup) {
            // Not logged in but trying to access a secure screen
            router.replace('/welcome');
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
                let email = currentUser.signInDetails?.loginId || '';
                if (!email || email === currentUser.userId) {
                    try {
                        const attrs = await fetchUserAttributes();
                        email = attrs.email || attrs.name || 'User';
                    } catch {
                        email = 'User';
                    }
                }
                await login(email, userId, token);
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
        <GestureHandlerRootView style={{ flex: 1 }}>
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
                <Stack.Screen name="signup" />
                <Stack.Screen name="verify-otp" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen name="(tabs)" options={{ animation: 'fade', contentStyle: { backgroundColor: '#FFFFFF' } }} />
                <Stack.Screen name="scanner" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
                <Stack.Screen name="food-detail" options={{ presentation: 'modal' }} />
                <Stack.Screen name="add-hydration" options={{ presentation: 'modal' }} />
                <Stack.Screen name="add-to-fridge" options={{ presentation: 'modal' }} />
                <Stack.Screen name="edit-ingredients" options={{ presentation: 'modal' }} />
                <Stack.Screen name="recipe-ingredients" />
                <Stack.Screen name="recipe-cooking" />
                <Stack.Screen name="recipe-complete" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="profile" />
                <Stack.Screen name="profile-personal-info" />
                <Stack.Screen name="profile-health-goal" />
                <Stack.Screen name="profile-activity-level" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="achievements" />
                <Stack.Screen name="privacy-policy" />
                <Stack.Screen name="terms-of-service" />
            </Stack>

            <BiometricPrompt
                visible={showBiometric}
                onSuccess={handleBiometricSuccess}
                onCancel={handleBiometricCancel}
                message={t('auth.biometricPrompt')}
            />

            {isSwitchingLanguage ? (
                <View style={styles.languageOverlay} pointerEvents="auto">
                    <View style={styles.languageOverlayCard}>
                        <ActivityIndicator size="large" color="#2ECC71" />
                        <Text style={styles.languageOverlayTitle}>{t('language.switchingTitle')}</Text>
                        <Text style={styles.languageOverlaySubtitle}>
                            {t('language.switchingSubtitle', {
                                language: targetLanguage === 'vi' ? t('language.name.vi') : t('language.name.en'),
                            })}
                        </Text>
                    </View>
                </View>
            ) : null}
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    languageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(17, 24, 39, 0.25)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        zIndex: 1000,
    },
    languageOverlayCard: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        paddingVertical: 22,
        paddingHorizontal: 18,
        alignItems: 'center',
    },
    languageOverlayTitle: {
        marginTop: 12,
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    languageOverlaySubtitle: {
        marginTop: 6,
        fontSize: 14,
        color: '#4B5563',
        textAlign: 'center',
    },
});
