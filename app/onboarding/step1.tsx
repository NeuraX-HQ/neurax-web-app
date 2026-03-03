import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { saveOnboardingData } from '../../src/store/userStore';
import { Ionicons } from '@expo/vector-icons';

export default function Step1() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleNext = async () => {
        await saveOnboardingData({ name });
        router.push('/onboarding/step2');
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                    <View style={styles.stepIndicator}>
                        {Array.from({ length: 9 }).map((_, i) => (
                            <View key={i} style={[styles.stepDot, i === 0 && styles.stepDotActive]} />
                        ))}
                    </View>
                </View>

                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Ionicons name="person-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                        <Text style={styles.title}>Tên bạn là gì?</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        Chúng mình sẽ gọi bạn bằng tên thân mật này để hành trình thêm gần gũi nhé.
                    </Text>

                    <Text style={styles.label}>Tên của bạn</Text>
                    <TextInput
                        style={[
                            styles.input,
                            (isFocused || name.length > 0) && styles.inputActive
                        ]}
                        placeholder="Ví dụ: Minh Bảo"
                        placeholderTextColor={Colors.textLight}
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        autoFocus
                    />
                </View>

                <View style={styles.footer}>
                    <View style={styles.infoBox}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                        <Text style={styles.infoText}>
                            Tên của bạn chỉ hiển thị trong app và hoàn toàn bảo mật.
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, !name && styles.buttonDisabled]}
                        onPress={handleNext}
                        disabled={!name}
                    >
                        <Text style={styles.buttonText}>Tiếp tục  →</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6F8',
    },
    stepIndicator: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    stepDot: {
        width: 12,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
        width: 20,
    },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleIcon: {
        marginRight: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 32,
    },
    label: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        fontSize: 20,
        color: Colors.primary,
        fontWeight: '600',
        paddingVertical: 10,
        borderWidth: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: '#E0E0E0',
    },
    inputActive: {
        borderBottomColor: Colors.primary,
        borderBottomWidth: 2,
    },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F5F6F8',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 10,
        alignItems: 'center',
    },
    infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
