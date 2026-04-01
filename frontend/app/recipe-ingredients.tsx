import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Shadows } from '../src/constants/colors';
import { getRecipeById } from '../src/data/recipes';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

export default function RecipeIngredientsScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const params = useLocalSearchParams<{ recipeId?: string }>();
    const recipeId = params.recipeId || '1';
    const recipe = getRecipeById(recipeId);

    const initialCheckedMap = useMemo(() => {
        if (!recipe) return {} as Record<string, boolean>;
        return recipe.ingredients.reduce((acc, ingredient) => {
            acc[ingredient.id] = Boolean(ingredient.defaultChecked);
            return acc;
        }, {} as Record<string, boolean>);
    }, [recipe]);

    const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>(initialCheckedMap);

    if (!recipe) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerState}>
                    <Text style={styles.emptyTitle}>{t('recipeIngredients.notFound')}</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backSimpleBtn}>
                        <Text style={styles.backSimpleText}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const toggleIngredient = (ingredientId: string) => {
        setCheckedMap((prev) => ({ ...prev, [ingredientId]: !prev[ingredientId] }));
    };

    const selectedIngredientIds = Object.entries(checkedMap)
        .filter(([, checked]) => checked)
        .map(([id]) => id);

    const startCooking = () => {
        router.push({
            pathname: '/recipe-cooking',
            params: {
                recipeId,
                checked: JSON.stringify(selectedIngredientIds),
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('recipeIngredients.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.recipeCard, Shadows.small]}>
                    <View style={styles.recipeInfo}>
                        <Text style={styles.recipeBadge}>{t('recipeIngredients.todayDish')}</Text>
                        <Text style={styles.recipeName}>{recipe.name}</Text>
                        <Text style={styles.recipeDesc}>{recipe.description}</Text>
                        <View style={styles.recipeMetaRow}>
                            <Text style={styles.recipeMeta}>⏱ {recipe.shortMeta}</Text>
                            <Text style={styles.recipeMeta}>🔥 {recipe.calories} kcal</Text>
                        </View>
                    </View>
                    <Image source={{ uri: recipe.image }} style={styles.recipeImage} contentFit="cover" />
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('recipeIngredients.listTitle')}</Text>
                    <Text style={styles.sectionCount}>{t('recipeIngredients.listCount', { count: recipe.ingredients.length })}</Text>
                </View>

                <View style={styles.listCard}>
                    {recipe.ingredients.map((ingredient) => {
                        const checked = Boolean(checkedMap[ingredient.id]);
                        return (
                            <TouchableOpacity
                                key={ingredient.id}
                                style={styles.ingredientRow}
                                activeOpacity={0.85}
                                onPress={() => toggleIngredient(ingredient.id)}
                            >
                                <Ionicons
                                    name={checked ? 'checkbox' : 'square-outline'}
                                    size={24}
                                    color={checked ? Colors.accent : '#B9C2CF'}
                                />
                                <View style={styles.ingredientMain}>
                                    <Text style={styles.ingredientName}>{ingredient.name}</Text>
                                    {ingredient.note ? <Text style={styles.ingredientNote}>{ingredient.note}</Text> : null}
                                </View>
                                <Text style={styles.ingredientAmount}>{ingredient.amount}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.tipCard}>
                    <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
                    <Text style={styles.tipText}>{t('recipeIngredients.tip')}</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.startBtn} onPress={startCooking}>
                    <Ionicons name="restaurant-outline" size={20} color="#FFFFFF" />
                    <Text style={styles.startBtnText}>{t('recipeIngredients.start')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: '#EDF1F5',
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 120, gap: 14 },
    recipeCard: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EBF0F4',
        padding: 12,
        flexDirection: 'row',
        gap: 12,
    },
    recipeInfo: { flex: 1 },
    recipeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(46, 204, 113, 0.12)',
        color: Colors.accent,
        fontSize: 11,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    recipeName: { marginTop: 8, fontSize: 22, fontWeight: '800', color: Colors.text },
    recipeDesc: { marginTop: 6, fontSize: 13, lineHeight: 19, color: Colors.textSecondary },
    recipeMetaRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
    recipeMeta: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    recipeImage: { width: 96, height: 96, borderRadius: 12 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    sectionCount: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.accent,
        backgroundColor: 'rgba(46, 204, 113, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        overflow: 'hidden',
        textTransform: 'uppercase',
    },
    listCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#EDF1F5',
        overflow: 'hidden',
    },
    ingredientRow: {
        minHeight: 70,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F5F8',
    },
    ingredientMain: { flex: 1 },
    ingredientName: { fontSize: 15, color: Colors.text, fontWeight: '700' },
    ingredientNote: { marginTop: 2, fontSize: 12, color: Colors.textSecondary },
    ingredientAmount: { fontSize: 14, color: Colors.accent, fontWeight: '800' },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(46, 204, 113, 0.08)',
        borderColor: 'rgba(46, 204, 113, 0.25)',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    tipText: { flex: 1, color: Colors.textSecondary, fontSize: 12, lineHeight: 18 },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 22,
        borderTopWidth: 1,
        borderTopColor: '#E9EEF2',
        backgroundColor: 'rgba(255,255,255,0.97)',
    },
    startBtn: {
        height: 54,
        borderRadius: 14,
        backgroundColor: Colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    startBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    backSimpleBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
    backSimpleText: { color: '#FFFFFF', fontWeight: '700' },
});
