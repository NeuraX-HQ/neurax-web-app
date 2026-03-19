import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMealStore } from '../src/store/mealStore';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

export default function EditIngredientsScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const currentFoodItem = useMealStore(state => state.currentFoodItem);
    const setCurrentFoodItem = useMealStore(state => state.setCurrentFoodItem);

    const [editingText, setEditingText] = useState('');

    useEffect(() => {
        if (currentFoodItem && currentFoodItem.ingredients) {
            const rawIngredients = currentFoodItem.ingredients;
            const textLines = rawIngredients.map((ing: any, idx: number) => {
                if (typeof ing === 'string') {
                    // Fallback for old data format
                    const amountMap = ['150 g', '50 g', '300 ml', '30 g'];
                    return `${ing} ${amountMap[idx] || t('editIngredients.defaultAmount')}`;
                }
                if (ing.name && ing.amount && ing.amount !== t('editIngredients.defaultAmount')) {
                    return `${ing.name} ${ing.amount}`;
                } else if (ing.name) {
                    return ing.name;
                }
                return '';
            }).filter((line: string) => line.length > 0);

            setEditingText(textLines.join('\n'));
        }
    }, [currentFoodItem]);

    const handleSave = () => {
        const lines = editingText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length === 0) {
            Alert.alert(t('common.error'), t('editIngredients.errorEmpty'));
            return;
        }

        const validIngredients = lines.map(line => {
            // Regex to find amount at the end of string: Space + (Number[.,]Number) + (optional text)
            // Example: "Trứng gà 150g" -> [1]: "Trứng gà", [2]: "150g"
            // Example: "Cá thu 2 lạng" -> [1]: "Cá thu", [2]: "2 lạng"
            const match = line.match(/^(.*?)\s+((?:\d+[\.,]?\d*)\s*[a-zA-ZÀ-ỹ]*.*)$/i);
            if (match) {
                return { name: match[1].trim(), amount: match[2].trim() };
            }

            // Fallback generic pattern (just any digit towards the end)
            const matchGeneric = line.match(/^(.*?)\s+(\d.*)$/);
            if (matchGeneric) {
                return { name: matchGeneric[1].trim(), amount: matchGeneric[2].trim() };
            }

            // Defaults if no number is found
            return { name: line, amount: t('editIngredients.defaultAmount') };
        });

        if (currentFoodItem) {
            setCurrentFoodItem({
                ...currentFoodItem,
                ingredients: validIngredients
            });
        }

        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('editIngredients.title')}</Text>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                    <Text style={styles.saveButtonText}>{t('editIngredients.save')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content}>
                {/* Section Label */}
                <Text style={styles.sectionLabel}>{t('editIngredients.sectionLabel')}</Text>

                {/* Text Input */}
                <TextInput
                    style={styles.textInput}
                    value={editingText}
                    onChangeText={setEditingText}
                    multiline
                    placeholder={t('editIngredients.placeholder')}
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
