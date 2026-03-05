import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/constants/colors';

export default function EditIngredientsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();

    // Parse ingredients from params
    const initialIngredients = params.ingredients
        ? JSON.parse(params.ingredients as string)
        : [];

    const [ingredients, setIngredients] = useState<string[]>(initialIngredients);
    const [editingText, setEditingText] = useState(initialIngredients.join('\n'));

    const handleSave = () => {
        // Parse text into array
        const newIngredients = editingText
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);

        if (newIngredients.length === 0) {
            Alert.alert('Lỗi', 'Vui lòng nhập ít nhất một nguyên liệu');
            return;
        }

        // Navigate back with updated ingredients
        router.back();
        // In real app, you would pass this data back or update store
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ingredients</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Section Label */}
                <Text style={styles.sectionLabel}>NỘI DUNG NGUYÊN LIỆU</Text>

                {/* Text Input */}
                <TextInput
                    style={styles.textInput}
                    value={editingText}
                    onChangeText={setEditingText}
                    multiline
                    placeholder="Nhập nguyên liệu, mỗi dòng một nguyên liệu..."
                    placeholderTextColor="#999"
                    autoFocus
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    closeButton: {
        padding: 4,
        marginLeft: -4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    saveButton: {
        backgroundColor: '#1E293B',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        padding: 24,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 0.5,
        marginBottom: 16,
        textTransform: 'uppercase',
    },
    textInput: {
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 24,
        paddingTop: 24,
        fontSize: 16,
        color: '#374151',
        minHeight: 300,
        textAlignVertical: 'top',
        lineHeight: 28,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
});
