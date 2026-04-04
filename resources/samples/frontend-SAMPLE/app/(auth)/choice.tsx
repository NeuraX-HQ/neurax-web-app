import React, { useState } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { Colors, Shadows } from "../../constants/Theme";

export default function ChoiceScreen() {
    const { signInWithApple, signInWithGoogle, continueAsGuest, isLoading } =
        useAuth();
    const [loadingMethod, setLoadingMethod] = useState<string | null>(null);

    const handleAppleSignIn = async () => {
        setLoadingMethod("apple");
        try {
            await signInWithApple();
            // Navigation is handled by the root layout based on auth state
        } catch (error) {
            console.error("Apple sign in failed:", error);
        } finally {
            setLoadingMethod(null);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoadingMethod("google");
        try {
            await signInWithGoogle();
        } catch (error) {
            console.error("Google sign in failed:", error);
        } finally {
            setLoadingMethod(null);
        }
    };

    const handleGuestMode = async () => {
        setLoadingMethod("guest");
        try {
            await continueAsGuest();
        } catch (error) {
            console.error("Guest mode failed:", error);
        } finally {
            setLoadingMethod(null);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                    <Text style={styles.logoEmoji}>🥗</Text>
                </View>
                <Text style={styles.logoText}>NutriTrack</Text>
                <Text style={styles.tagline}>Chào mừng đến với NutriTrack! 🌿</Text>
            </View>

            {/* Auth buttons */}
            <View style={styles.buttonsContainer}>
                {/* Apple Sign In */}
                <Pressable
                    style={[styles.authButton, styles.appleButton]}
                    onPress={handleAppleSignIn}
                    disabled={isLoading}
                >
                    {loadingMethod === "apple" ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <>
                            <Ionicons name="logo-apple" size={20} color="#FFFFFF" />
                            <Text style={[styles.authButtonText, styles.appleButtonText]}>
                                Tiếp tục với Apple
                            </Text>
                        </>
                    )}
                </Pressable>

                {/* Google Sign In */}
                <Pressable
                    style={[styles.authButton, styles.googleButton]}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    {loadingMethod === "google" ? (
                        <ActivityIndicator color={Colors.textDark} />
                    ) : (
                        <>
                            <Text style={styles.googleIcon}>G</Text>
                            <Text style={[styles.authButtonText, styles.googleButtonText]}>
                                Tiếp tục với Google
                            </Text>
                        </>
                    )}
                </Pressable>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>hoặc</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Guest Mode */}
                <Pressable
                    style={[styles.authButton, styles.guestButton]}
                    onPress={handleGuestMode}
                    disabled={isLoading}
                >
                    {loadingMethod === "guest" ? (
                        <ActivityIndicator color={Colors.primary} />
                    ) : (
                        <>
                            <Text style={styles.guestIcon}>👻</Text>
                            <Text style={[styles.authButtonText, styles.guestButtonText]}>
                                Dùng thử không đăng ký
                            </Text>
                        </>
                    )}
                </Pressable>
            </View>

            {/* Terms */}
            <View style={styles.termsContainer}>
                <Text style={styles.termsText}>
                    Bằng việc tiếp tục, bạn đồng ý với{" "}
                    <Text style={styles.termsLink}>Điều khoản sử dụng</Text> và{" "}
                    <Text style={styles.termsLink}>Chính sách Olly mật</Text> của chúng
                    tôi.
                </Text>
            </View>

            {/* Language selector */}
            <Pressable style={styles.languageSelector}>
                <Text style={styles.languageIcon}>🌐</Text>
                <Text style={styles.languageText}>Tiếng Việt ▼</Text>
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 24,
    },
    logoContainer: {
        alignItems: "center",
        marginTop: 60,
        marginBottom: 48,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: Colors.primaryLight,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
        ...Shadows.soft,
    },
    logoEmoji: {
        fontSize: 50,
    },
    logoText: {
        fontSize: 32,
        fontWeight: "700",
        color: Colors.primary,
        marginBottom: 8,
        fontFamily: "Playfair Display",
    },
    tagline: {
        fontSize: 18,
        color: Colors.textMedium,
        textAlign: "center",
    },
    buttonsContainer: {
        gap: 12,
    },
    authButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        borderRadius: 16,
        gap: 12,
    },
    appleButton: {
        backgroundColor: "#000000",
    },
    googleButton: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        ...Shadows.soft,
    },
    guestButton: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: "dashed",
    },
    authButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    appleButtonText: {
        color: "#FFFFFF",
    },
    googleButtonText: {
        color: Colors.textDark,
    },
    guestButtonText: {
        color: Colors.primary,
    },
    googleIcon: {
        fontSize: 18,
        fontWeight: "700",
        color: "#4285F4",
    },
    guestIcon: {
        fontSize: 20,
    },
    divider: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#E5E7EB",
    },
    dividerText: {
        paddingHorizontal: 16,
        fontSize: 13,
        color: Colors.textLight,
    },
    termsContainer: {
        marginTop: 32,
        paddingHorizontal: 16,
    },
    termsText: {
        fontSize: 12,
        color: Colors.textLight,
        textAlign: "center",
        lineHeight: 18,
    },
    termsLink: {
        color: Colors.primary,
        textDecorationLine: "underline",
    },
    languageSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: "auto",
        paddingBottom: 24,
    },
    languageIcon: {
        fontSize: 18,
    },
    languageText: {
        fontSize: 14,
        color: Colors.textMedium,
    },
});
