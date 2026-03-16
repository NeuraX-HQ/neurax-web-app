import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../src/constants/colors';
import { getRecipeById } from '../src/data/mockData';
import { useMealStore } from '../src/store/mealStore';
import { useFridgeStore } from '../src/store/fridgeStore';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

const toNumber = (value: string) => {
    const matched = value.match(/\d+/);
    return matched ? Number(matched[0]) : 0;
};

const formatDuration = (seconds: number) => {
    const safe = Math.max(0, seconds);
    const mins = Math.floor(safe / 60);
    const secs = safe % 60;
    return `${mins}p ${String(secs).padStart(2, '0')}s`;
};

const normalize = (value: string) =>
    value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();

export default function RecipeCompleteScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const params = useLocalSearchParams<{ recipeId?: string; checked?: string; elapsedSec?: string }>();
    const recipeId = params.recipeId || '1';
    const recipe = getRecipeById(recipeId);
    const addMeal = useMealStore((state) => state.addMeal);
    const fridgeItems = useFridgeStore((state) => state.items);
    const loadItems = useFridgeStore((state) => state.loadItems);
    const removeItem = useFridgeStore((state) => state.removeItem);

    const [isSavingMeal, setIsSavingMeal] = useState(false);
    const [isUpdatingFridge, setIsUpdatingFridge] = useState(false);
    const [mealSaved, setMealSaved] = useState(false);
    const [fridgeUpdated, setFridgeUpdated] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2200);
    };

    const selectedIngredientIds = useMemo(() => {
        if (!params.checked) return [] as string[];
        try {
            return JSON.parse(params.checked) as string[];
        } catch {
            return [] as string[];
        }
    }, [params.checked]);

    const elapsedSec = Number(params.elapsedSec || '0');

    const selectedIngredients = useMemo(() => {
        if (!recipe) return [];
        const selectedSet = new Set(selectedIngredientIds);
        return recipe.ingredients.filter((ingredient) => selectedSet.has(ingredient.id));
    }, [recipe, selectedIngredientIds]);

    if (!recipe) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerState}>
                    <Text style={styles.emptyTitle}>{t('recipeComplete.notFound')}</Text>
                    <TouchableOpacity onPress={() => router.replace('/(tabs)/kitchen')} style={styles.primaryBtn}>
                        <Text style={styles.primaryBtnText}>{t('recipeComplete.backKitchen')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const saveMeal = async () => {
        if (mealSaved || isSavingMeal) return;
        setIsSavingMeal(true);
        try {
            await addMeal({
                name: recipe.name,
                type: 'LUNCH',
                calories: recipe.calories,
                protein: toNumber(recipe.protein),
                carbs: Math.round(recipe.calories * 0.11),
                fat: Math.round(recipe.calories * 0.04),
                servingSize: '1 phan',
                ingredients: selectedIngredients,
                image: recipe.emoji,
            });
            setMealSaved(true);
            showToast(t('recipeComplete.toastMealSaved'), 'success');
        } catch {
            showToast(t('recipeComplete.toastMealError'), 'error');
        } finally {
            setIsSavingMeal(false);
        }
    };

    const updateFridge = async () => {
        if (fridgeUpdated || isUpdatingFridge) return;
        setIsUpdatingFridge(true);
        try {
            await loadItems();
            const selectedNames = selectedIngredients.map((i) => normalize(i.name));
            let removedCount = 0;

            for (const item of fridgeItems) {
                const itemName = normalize(item.name);
                const isMatched = selectedNames.some((selectedName) =>
                    itemName.includes(selectedName) || selectedName.includes(itemName)
                );
                if (isMatched) {
                    await removeItem(item.id);
                    removedCount += 1;
                }
            }

            setFridgeUpdated(true);
            showToast(t('recipeComplete.toastFridgeSaved', { count: removedCount }), 'success');
        } catch {
            showToast(t('recipeComplete.toastFridgeError'), 'error');
        } finally {
            setIsUpdatingFridge(false);
        }
    };

    const finishFlow = () => {
        router.replace('/(tabs)/kitchen');
    };

    return (
        <SafeAreaView style={styles.container}>
            {toast ? (
                <View style={[styles.toastWrap, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
                    <Ionicons name={toast.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={16} color={toast.type === 'success' ? Colors.accent : Colors.red} />
                    <Text style={toast.type === 'success' ? styles.toastTextSuccess : styles.toastTextError}>{toast.message}</Text>
                </View>
            ) : null}

            <View style={styles.content}>
                <View style={[styles.card, Shadows.small]}>
                    <View style={styles.successIconWrap}>
                        <Ionicons name="checkmark-circle" size={48} color={Colors.accent} />
                    </View>
                    <Text style={styles.title}>{t('recipeComplete.title', { name: recipe.name })}</Text>
                    <Text style={styles.subtitle}>{t('recipeComplete.subtitle', { duration: formatDuration(elapsedSec) })}</Text>

                    <View style={styles.statRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>{t('recipeComplete.stepDone')}</Text>
                            <Text style={styles.statValue}>{recipe.steps.length}/{recipe.steps.length}</Text>
                        </View>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>{t('recipeComplete.ingredientsPicked')}</Text>
                            <Text style={styles.statValue}>{selectedIngredients.length}/{recipe.ingredients.length}</Text>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.actionBtn, mealSaved && styles.actionBtnDone]}
                    onPress={saveMeal}
                    disabled={mealSaved || isSavingMeal}
                >
                    <Ionicons name={mealSaved ? 'checkmark-circle' : 'restaurant-outline'} size={18} color={mealSaved ? Colors.accent : '#FFFFFF'} />
                    <Text style={[styles.actionBtnText, mealSaved && styles.actionBtnTextDone]}>
                        {mealSaved ? t('recipeComplete.mealSaved') : isSavingMeal ? t('recipeComplete.mealSaving') : t('recipeComplete.mealSave')}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtnSecondary, fridgeUpdated && styles.actionBtnDone]}
                    onPress={updateFridge}
                    disabled={fridgeUpdated || isUpdatingFridge}
                >
                    <Ionicons name={fridgeUpdated ? 'checkmark-circle' : 'cube-outline'} size={18} color={fridgeUpdated ? Colors.accent : Colors.text} />
                    <Text style={[styles.actionBtnSecondaryText, fridgeUpdated && styles.actionBtnTextDone]}>
                        {fridgeUpdated ? t('recipeComplete.fridgeUpdated') : isUpdatingFridge ? t('recipeComplete.fridgeUpdating') : t('recipeComplete.fridgeUpdate')}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.primaryBtn} onPress={finishFlow}>
                    <Text style={styles.primaryBtnText}>{t('recipeComplete.finish')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FDFB' },
    toastWrap: {
        marginTop: 10,
        marginHorizontal: 16,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    toastSuccess: {
        backgroundColor: '#F2FAF6',
        borderColor: 'rgba(46, 204, 113, 0.35)',
    },
    toastError: {
        backgroundColor: '#FDECEC',
        borderColor: 'rgba(231, 76, 60, 0.35)',
    },
    toastTextSuccess: { flex: 1, color: '#1D7F4D', fontSize: 13, fontWeight: '600' },
    toastTextError: { flex: 1, color: '#A53B31', fontSize: 13, fontWeight: '600' },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8EEF3',
        padding: 16,
    },
    successIconWrap: { alignItems: 'center', marginBottom: 8 },
    title: { fontSize: 22, fontWeight: '800', color: Colors.text, textAlign: 'center' },
    subtitle: { marginTop: 8, fontSize: 14, lineHeight: 21, color: Colors.textSecondary, textAlign: 'center' },
    statRow: { marginTop: 14, flexDirection: 'row', gap: 10 },
    statBox: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E8EEF3',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 10,
        backgroundColor: '#FBFDFE',
    },
    statLabel: { fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', fontWeight: '700' },
    statValue: { marginTop: 4, fontSize: 18, color: Colors.text, fontWeight: '800' },
    actionBtn: {
        height: 52,
        borderRadius: 12,
        backgroundColor: Colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 12,
    },
    actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
    actionBtnSecondary: {
        height: 52,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#DDE5EC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 12,
    },
    actionBtnSecondaryText: { color: Colors.text, fontSize: 14, fontWeight: '700' },
    actionBtnDone: {
        backgroundColor: '#F2FAF6',
        borderColor: 'rgba(46, 204, 113, 0.35)',
    },
    actionBtnTextDone: { color: Colors.accent },
    footer: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 22,
        borderTopWidth: 1,
        borderTopColor: '#E6ECF2',
        backgroundColor: '#FFFFFF',
    },
    primaryBtn: {
        height: 52,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, textAlign: 'center' },
});
