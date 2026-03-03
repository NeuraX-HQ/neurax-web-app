import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useFoodStore } from '../src/store/foodStore';

export default function EditIngredientsScreen() {
    const router = useRouter();
    const { ingredients, parseIngredientsFromText } = useFoodStore();

    // Chuyển đổi ingredients sang text
    const initialText = ingredients.map((ing: any) => `${ing.name} ${ing.amount}${ing.unit}`).join('\n');
    const [text, setText] = useState(initialText);

    const handleSave = () => {
        parseIngredientsFromText(text);
        router.back();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="close" size={28} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Ingredients</Text>
                    <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
                        <Text style={styles.saveBtnText}>Save</Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <Text style={styles.label}>Nội dung nguyên liệu</Text>
                        <View style={styles.inputContainer}>
                            <TextInput
                                style={styles.textInput}
                                multiline
                                value={text}
                                onChangeText={setText}
                                placeholder="Ví dụ:&#10;Bánh phở 150g&#10;Thịt bò 50g&#10;Nước dùng 300ml"
                                placeholderTextColor="#C7C7CD"
                                autoFocus
                                underlineColorAndroid="transparent"
                            />
                        </View>

                        <View style={styles.aiTip}>
                            <Ionicons name="sparkles" size={16} color={Colors.primary} />
                            <Text style={styles.aiTipText}>
                                AI Bảo sẽ tự động phân tích và tính toán lại dinh dưỡng sau khi bạn lưu.
                            </Text>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1C1C1E',
    },
    saveBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
    },
    saveBtnText: {
        color: '#FFF',
        fontWeight: '800',
        fontSize: 14,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#8E8E93',
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    inputContainer: {
        backgroundColor: '#F8F9FB',
        borderRadius: 20,
        padding: 16,
        minHeight: 300,
    },
    textInput: {
        fontSize: 16,
        color: '#1C1C1E',
        lineHeight: 24,
        textAlignVertical: 'top',
        minHeight: 260,
        borderWidth: 0,
        padding: 0,
        // @ts-ignore
        outlineStyle: 'none',
    } as any,
    aiTip: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        backgroundColor: '#F4F7FF',
        padding: 12,
        borderRadius: 12,
        gap: 8,
    },
    aiTipText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '600',
        flex: 1,
    },
});
