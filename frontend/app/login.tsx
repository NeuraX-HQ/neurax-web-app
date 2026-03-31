import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { signIn, fetchAuthSession, signInWithRedirect } from "aws-amplify/auth";
import { useAuthStore } from '../src/store/authStore';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

const MOCK_LOGIN = {
    email: 'demo@neurax.app',
    password: '123456',
    userId: 'mock-user-001',
    token: 'mock-token-dev-login'
};

function GoogleIcon({ size = 20 }: { size?: number }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </Svg>
    );
}

export default function LoginScreen() {

    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useAppLanguage();
    const { login } = useAuthStore();

    const [email, setEmail] = useState(params.email as string || "");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async () => {

        try {

            setLoading(true);

            const isMockCredential =
                email.trim().toLowerCase() === MOCK_LOGIN.email &&
                password === MOCK_LOGIN.password;

            if (isMockCredential) {
                await login(MOCK_LOGIN.email, MOCK_LOGIN.userId, MOCK_LOGIN.token);
                router.replace("/(tabs)/home");
                return;
            }

            const result = await signIn({
                username: email,
                password: password
            });

            if (result.isSignedIn) {

                const session = await fetchAuthSession();

                const userId = session.tokens?.idToken?.payload?.sub;
                const token = session.tokens?.accessToken?.toString();

                if (!userId || !token) {
                    throw new Error("Invalid session");
                }

                await login(email, userId, token);
                
                // Kiểm tra trạng thái onboarding từ store (vừa sync xong trong login action)
                // Hoặc fetch trực tiếp từ userService nếu cần chắc chắn
                const { fetchUserProfile } = require('../src/services/userService');
                const userProfile = await fetchUserProfile(userId);
                
                if (userProfile && userProfile.onboarding_status) {
                    router.replace("/(tabs)/home");
                } else {
                    router.replace("/onboarding/step1");
                }
            }
        } catch (error) {
            console.log("Login error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            await signInWithRedirect({ provider: 'Google' });
        } catch (error) {
            console.log("Google login error:", error);
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                <Text style={styles.title}>{t('login.title')}</Text>

                <TextInput
                    style={styles.input}
                    placeholder={t('login.email')}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder={t('login.password')}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <Text style={styles.mockHint}>
                    {t('login.demoHint', { email: MOCK_LOGIN.email, password: MOCK_LOGIN.password })}
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleEmailLogin}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? t('login.signingIn') : t('login.signIn')}
                    </Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>{t('login.or')}</Text>
                    <View style={styles.divider} />
                </View>

                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                >
                    <View style={styles.googleIcon}>
                        <GoogleIcon size={24} />
                    </View>
                    <Text style={styles.googleButtonText}>{t('login.google')}</Text>
                </TouchableOpacity>

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>{t('login.noAccount')} </Text>
                    <TouchableOpacity onPress={() => router.push('/signup')}>
                        <Text style={styles.footerLink}>{t('login.signUpNow')}</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#F5F7F2"
    },

    safeArea: {
        flex: 1,
        padding: 24
    },

    title: {
        fontSize: 30,
        fontWeight: "800",
        marginBottom: 40
    },

    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 14,
        borderRadius: 10,
        marginBottom: 16
    },

    button: {
        backgroundColor: "#1E2B22",
        padding: 16,
        borderRadius: 12,
        alignItems: "center"
    },

    buttonText: {
        color: "white",
        fontWeight: "700",
        fontSize: 16
    },

    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#ddd'
    },
    dividerText: {
        marginHorizontal: 16,
        color: '#666',
        fontWeight: '600'
    },
    googleButton: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 30, // fully rounded pill shape
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#D4D4D4'
    },
    googleIcon: {
        marginRight: 10
    },
    googleButtonText: {
        color: '#444444',
        fontWeight: '600',
        fontSize: 16
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 32
    },
    footerText: {
        color: '#666',
        fontSize: 15
    },
    footerLink: {
        color: '#1E2B22',
        fontWeight: '700',
        fontSize: 15
    },
    mockHint: {
        marginTop: -6,
        marginBottom: 12,
        color: '#6B7280',
        fontSize: 12
    }
});