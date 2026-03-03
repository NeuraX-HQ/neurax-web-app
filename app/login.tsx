import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';

const { width } = Dimensions.get('window');

export default function LoginOptionsScreen() {
    const router = useRouter();
    const { login } = useAuthStore();

    const socialOptions = [
        { name: 'Google', icon: 'logo-google', color: '#DB4437', bgColor: '#FFFFFF' },
        { name: 'Apple', icon: 'logo-apple', color: '#000000', bgColor: '#FFFFFF' },
        { name: 'Facebook', icon: 'logo-facebook', color: '#4267B2', bgColor: '#FFFFFF' },
    ];

    const handleSocialLogin = async (provider: string) => {
        // Simulate login - replace with actual OAuth implementation
        const mockUserId = `user_${Date.now()}`;
        const mockEmail = `user@${provider.toLowerCase()}.com`;
        const mockToken = `token_${Math.random().toString(36).substr(2, 9)}`;
        
        await login(mockEmail, mockUserId, mockToken);
        router.replace('/(tabs)/home');
    };

    const handleEmailLogin = async () => {
        // Simulate email login - replace with actual implementation
        const mockEmail = 'user@nutritrack.com';
        const mockUserId = `user_${Date.now()}`;
        const mockToken = `token_${Math.random().toString(36).substr(2, 9)}`;
        
        await login(mockEmail, mockUserId, mockToken);
        router.replace('/(tabs)/home');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Back Button */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1E2B22" />
                </TouchableOpacity>

                <View style={styles.content}>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>
                        Choose your preferred way to sign in and continue your health journey.
                    </Text>

                    {/* Social Login Options Block */}
                    <View style={styles.optionsBlock}>
                        {socialOptions.map((option, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.optionButton, { backgroundColor: option.bgColor }]}
                                onPress={() => handleSocialLogin(option.name)}
                            >
                                <View style={styles.iconWrapper}>
                                    <Ionicons name={option.icon as any} size={24} color={option.color} />
                                </View>
                                <Text style={styles.optionText}>Continue with {option.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.divider} />
                    </View>

                    {/* Email Login Placeholder */}
                    <TouchableOpacity
                        style={styles.emailButton}
                        onPress={handleEmailLogin}
                    >
                        <Ionicons name="mail-outline" size={24} color="#FFFFFF" style={styles.emailIcon} />
                        <Text style={styles.emailButtonText}>Sign in with Email</Text>
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.replace('/onboarding/step1')}>
                            <Text style={styles.footerLink}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7F2',
    },
    safeArea: {
        flex: 1,
    },
    backButton: {
        padding: 20,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: '#1A241B',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#5C6B5E',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
        paddingHorizontal: 20,
    },
    optionsBlock: {
        width: '100%',
        gap: 16,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E6EAE2',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    iconWrapper: {
        width: 32,
        alignItems: 'center',
    },
    optionText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#1A241B',
        marginRight: 32, // To balance the icon width
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 30,
        width: '100%',
    },
    divider: {
        flex: 1,
        height: 1,
        backgroundColor: '#DDE3D8',
    },
    dividerText: {
        paddingHorizontal: 15,
        color: '#8A9A8C',
        fontSize: 14,
    },
    emailButton: {
        width: '100%',
        backgroundColor: '#1E2B22',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 20,
    },
    emailIcon: {
        marginRight: 10,
    },
    emailButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        flexDirection: 'row',
        marginTop: 'auto',
        marginBottom: 30,
    },
    footerText: {
        fontSize: 15,
        color: '#5C6B5E',
    },
    footerLink: {
        fontSize: 15,
        color: '#1E2B22',
        fontWeight: '700',
    },
});
