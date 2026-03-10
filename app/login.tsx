import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signIn, fetchAuthSession, signInWithRedirect } from "aws-amplify/auth";
import { useAuthStore } from '../src/store/authStore';

export default function LoginScreen() {

    const router = useRouter();
    const { login } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async () => {

        try {

            setLoading(true);

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
                router.replace("/(tabs)/home");
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

                <Text style={styles.title}>Login</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleEmailLogin}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? "Signing in..." : "Sign In"}
                    </Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>OR</Text>
                    <View style={styles.divider} />
                </View>

                <TouchableOpacity
                    style={styles.googleButton}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                >
                    <Ionicons name="logo-google" size={24} color="#000" style={styles.googleIcon} />
                    <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>

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
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#ddd'
    },
    googleIcon: {
        marginRight: 12
    },
    googleButtonText: {
        color: '#000',
        fontWeight: '700',
        fontSize: 16
    }
});