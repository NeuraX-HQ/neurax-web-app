import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { confirmSignUp, resendSignUpCode } from "aws-amplify/auth";

export default function VerifyOtpScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const email = params.email as string;

    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);

    const handleVerify = async () => {
        if (!code) {
            Alert.alert("Lỗi", "Vui lòng nhập mã xác nhận.");
            return;
        }

        try {
            setLoading(true);

            const { isSignUpComplete } = await confirmSignUp({
                username: email,
                confirmationCode: code
            });

            if (isSignUpComplete) {
                Alert.alert("Thành công", "Xác thực thành công! Vui lòng đăng nhập.");
                router.replace('/login');
            }

        } catch (error: any) {
            console.log("Verify error:", error);
            Alert.alert("Lỗi xác thực", error.message || "Mã không hợp lệ hoặc đã hết hạn.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        try {
            setResendLoading(true);
            await resendSignUpCode({ username: email });
            Alert.alert("Thành công", "Đã gửi lại mã xác nhận qua email.");
        } catch (error: any) {
            console.log("Resend code error:", error);
            Alert.alert("Lỗi", error.message || "Không thể gửi lại mã vào lúc này.");
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                <Text style={styles.title}>Xác thực Email</Text>
                <Text style={styles.subtitle}>
                    Chúng tôi đã gửi mã gồm 6 chữ số tới email:{"\n"}
                    <Text style={{ fontWeight: 'bold' }}>{email}</Text>
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Nhập mã xác nhận (Ví dụ: 123456)"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                />

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.buttonText}>Xác thực</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.resendContainer} 
                    onPress={handleResendCode}
                    disabled={resendLoading}
                >
                    {resendLoading ? (
                        <ActivityIndicator color="#1E2B22" size="small" />
                    ) : (
                        <Text style={styles.resendText}>Chưa nhận được mã? Gửi lại</Text>
                    )}
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
        marginBottom: 40,
        lineHeight: 24
    },
    input: {
        borderWidth: 1,
        borderColor: "#ddd",
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        backgroundColor: "#fff",
        fontSize: 16,
        textAlign: 'center',
        letterSpacing: 4
    },
    button: {
        backgroundColor: "#1E2B22",
        padding: 16,
        borderRadius: 12,
        alignItems: "center"
    },
    buttonDisabled: {
        opacity: 0.7
    },
    buttonText: {
        color: "white",
        fontWeight: "700",
        fontSize: 16
    },
    resendContainer: {
        marginTop: 24,
        alignItems: 'center'
    },
    resendText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 15,
        textDecorationLine: 'underline'
    }
});
