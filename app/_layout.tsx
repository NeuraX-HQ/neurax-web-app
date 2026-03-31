import { useEffect, useState, useRef } from 'react';
import { getCurrentUser, fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { View, StyleSheet, Platform, ActivityIndicator, Text, Animated, Easing } from 'react-native';
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
    const oauthHandled = useRef(false);
    const hasNavigated = useRef(false);
    const pendingRoute = useRef<string | null>(null);

    // Listen for OAuth sign-in completion (e.g. Google redirect back)
    useEffect(() => {
        const unsubscribe = Hub.listen('auth', async ({ payload }) => {
            if (payload.event === 'signInWithRedirect' && !oauthHandled.current) {
                oauthHandled.current = true;
                console.log('OAuth signInWithRedirect completed — syncing session...');
                const result = await checkAndSetAuth();
                if (result.authenticated) {
                    hasNavigated.current = true;
                    router.replace(result.needsOnboarding ? '/onboarding/step1' : '/(tabs)/home');
                }
            }
            if (payload.event === 'signInWithRedirect_failure') {
                console.log('OAuth signInWithRedirect failed:', payload.data);
                oauthHandled.current = false;
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        // Edge-to-edge is enabled — only setVisibilityAsync is supported.
        // setBackgroundColorAsync, setPositionAsync, setBehaviorAsync are no-ops
        // with edge-to-edge and spam warnings, so they are removed.
        if (Platform.OS === 'android') {
            NavigationBar.setVisibilityAsync('hidden').catch(() => {});
        }
    }, []);

    useEffect(() => {
        initializeAuth().catch((err) => {
            console.error('[AUTH] initializeAuth crashed:', err);
            // Fallback: still show the app, go to welcome
            pendingRoute.current = '/welcome';
            setIsReady(true);
        });
        useSettingsStore.getState().loadPreferences();
    }, []);

    // Navigate AFTER Stack is mounted (isReady = true triggers re-render → Stack renders → then navigate)
    useEffect(() => {
        if (isReady && pendingRoute.current) {
            const route = pendingRoute.current;
            pendingRoute.current = null;
            router.replace(route as any);
        }
    }, [isReady]);

    useEffect(() => {
        if (!isReady) return;

        const inAuthGroup = segments[0] === '(tabs)';
        if (!isAuthenticated && inAuthGroup) {
            // Not logged in but trying to access a secure screen
            router.replace('/welcome');
        }
    }, [isAuthenticated, segments, isReady]);

    const checkAndSetAuth = async (): Promise<{ authenticated: boolean; needsOnboarding: boolean }> => {
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

                // Check onboarding status
                const { fetchUserProfile } = require('../src/services/userService');
                const userProfile = await fetchUserProfile(userId);
                const needsOnboarding = !userProfile || !userProfile.onboarding_status;

                return { authenticated: true, needsOnboarding };
            }
        } catch (e) {
            // User not authenticated
            return { authenticated: false, needsOnboarding: false };
        }
        return { authenticated: false, needsOnboarding: false };
    };

    const initializeAuth = async () => {
        console.log('[AUTH] initializeAuth started');
        await checkBiometricAvailability();

        // Handle Google OAuth and standard sessions
        let hasSession = await checkSession();
        let needsOnboarding = false;
        console.log('[AUTH] checkSession:', hasSession);

        if (hasSession) {
            // Validate that Cognito actually has valid tokens
            console.log('[AUTH] Validating Cognito tokens...');
            const result = await checkAndSetAuth();
            console.log('[AUTH] checkAndSetAuth result:', result);
            if (!result.authenticated) {
                console.log('[AUTH] Stale local session detected. Clearing...');
                await useAuthStore.getState().logout();
                hasSession = false;
            } else {
                needsOnboarding = result.needsOnboarding;
            }
        } else {
            // No local session — check if Amplify has a valid session (e.g. OAuth callback)
            console.log('[AUTH] No local session, checking Amplify...');
            const result = await checkAndSetAuth();
            console.log('[AUTH] checkAndSetAuth result:', result);
            hasSession = result.authenticated;
            needsOnboarding = result.needsOnboarding;
        }

        // Skip if Hub listener already handled OAuth navigation
        if (hasNavigated.current) {
            console.log('[AUTH] Hub already navigated, skipping');
            setIsReady(true);
            return;
        }

        if (hasSession && needsOnboarding) {
            console.log('[AUTH] → onboarding/step1');
            hasNavigated.current = true;
            pendingRoute.current = '/onboarding/step1';
            setIsReady(true);
            return;
        }

        if (hasSession) {
            const { biometricEnabled } = useAuthStore.getState();
            if (biometricEnabled) {
                console.log('[AUTH] → biometric prompt');
                setShowBiometric(true);
                setIsReady(true);
                return;
            }
            console.log('[AUTH] → home');
            hasNavigated.current = true;
            pendingRoute.current = '/(tabs)/home';
            setIsReady(true);
            return;
        }

        // Not authenticated → welcome
        console.log('[AUTH] → welcome');
        hasNavigated.current = true;
        pendingRoute.current = '/welcome';
        setIsReady(true);
        useAuthStore.getState().setAuthReady(true);
    };

    const handleBiometricSuccess = () => {
        setShowBiometric(false);
        hasNavigated.current = true;
        router.replace('/(tabs)/home');
    };

    const handleBiometricCancel = async () => {
        setShowBiometric(false);
        const { logout } = useAuthStore.getState();
        await logout();
        router.replace('/login');
    };

    if (!isReady) {
        return (
            <GestureHandlerRootView style={{ flex: 1 }}>
                <View style={styles.splash}>
                    <StatusBar hidden />
                    <View style={styles.splashLogoBox}>
                        <View style={styles.splashLogoInner}>
                            <View style={styles.barLeft} />
                            <View style={styles.barCenter} />
                            <View style={styles.barRight} />
                        </View>
                    </View>
                    <Text style={styles.splashTitle}>NutriTrack 2.0</Text>
                    <SpinnerRing />
                </View>
            </GestureHandlerRootView>
        );
    }

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

function SpinnerRing() {
    const spin = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 1000,
                easing: Easing.linear,
                useNativeDriver: true,
            }),
        ).start();
    }, []);
    const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    return (
        <Animated.View style={[styles.spinnerRing, { transform: [{ rotate }] }]} />
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#FFFFFF' },
    splash: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    splashLogoBox: {
        width: 120,
        height: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    splashLogoInner: {
        width: 70,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    barLeft: {
        width: 14,
        height: 50,
        backgroundColor: '#1B2838',
        borderRadius: 7,
    },
    barCenter: {
        width: 14,
        height: 40,
        backgroundColor: '#2ECC71',
        borderRadius: 7,
        transform: [{ rotate: '-30deg' }],
    },
    barRight: {
        width: 14,
        height: 50,
        backgroundColor: '#1B2838',
        borderRadius: 7,
    },
    splashTitle: {
        marginTop: 20,
        fontSize: 18,
        fontWeight: '500',
        color: '#7F8C9B',
    },
    spinnerRing: {
        marginTop: 32,
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 3,
        borderColor: '#E0E0E0',
        borderTopColor: '#2ECC71',
    },
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
