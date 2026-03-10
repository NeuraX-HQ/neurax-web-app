import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { signUp } from "aws-amplify/auth";

export default function SignUpScreen() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!email || !password || !confirmPassword) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Lỗi", "Mật khẩu xác nhận không khớp.");
            return;
        }

        try {
            setLoading(true);

            const { isSignUpComplete, nextStep } = await signUp({
                username: email,
                password,
                options: {
                    userAttributes: {
                        email
                    }
                }
            });

            if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
                // Navigate to OTP verification screen, passing the email
                router.push({
                    pathname: '/verify-otp',
                    params: { email: email }
                });
            } else if (isSignUpComplete) {
                Alert.alert("Thành công", "Đăng ký thành công!");
                router.replace('/login');
            }

        } catch (error: any) {
            console.log("Sign up error:", error);
            Alert.alert("Lỗi đăng ký", error.message || "Đã xảy ra lỗi khi đăng ký.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                <Text style={styles.title}>Đăng ký</Text>
                <Text style={styles.subtitle}>Tạo tài khoản NutriTrack mới</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />

                <TextInput
                    style={styles.input}
                    placeholder="Mật khẩu"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Xác nhận Mật khẩu"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleSignUp}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Đăng ký</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>Đã có tài khoản? </Text>
                    <TouchableOpacity onPress={() => router.push('/login')}>
                        <Text style={styles.footerLink}>Đăng nhập</Text>
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
        padding: 24,
        justifyContent: 'center'
    },
    title: {
        fontSize: 32,
        fontWeight: "800",
        marginBottom: 8,
        color: "#1E2B22"
    },
    subtitle: {
        fontSize: 16,
        color: "#666",
        marginBottom: 40
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        backgroundColor: "#fff",
        fontSize: 16
    },
    button: {
        backgroundColor: "#1E2B22",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8
    },
    buttonDisabled: {
        opacity: 0.7
    },
    buttonText: {
        color: "white",
        fontWeight: "700",
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
    }
});
