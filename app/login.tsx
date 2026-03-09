import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { signIn, fetchAuthSession } from "aws-amplify/auth";
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
    }
});