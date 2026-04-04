import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TouchableWithoutFeedback, Animated, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/constants/colors';
import { recipes } from '../../src/data/recipes';
import { useFridgeStore, FridgeItem } from '../../src/store/fridgeStore';
import { useMealStore } from '../../src/store/mealStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';
import { Recipe } from '../../src/data/recipes';

export default function KitchenScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [tab, setTab] = useState<'fridge' | 'recipes'>('fridge');
    const [recipeSubTab, setRecipeSubTab] = useState<'system' | 'personal'>('system');
    const [search, setSearch] = useState('');
    const [recipeSearch, setRecipeSearch] = useState('');
    const { items, loadItems, removeItem, isLoading, syncWithCloud, syncPendingItems } = useFridgeStore();
    const { personalRecipes, loadRecipes } = useRecipeStore();
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadItems().then(() => {
            syncPendingItems();
            syncWithCloud();
        });
        loadRecipes();
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadItems();
            await syncPendingItems();
            await syncWithCloud();
        } finally {
            setRefreshing(false);
        }
    }, [loadItems, syncPendingItems, syncWithCloud]);

    const filtered = items.filter(i =>
        search.trim() === '' || i.name.toLowerCase().includes(search.toLowerCase())
    );

    const useSoon   = filtered.filter(i => i.daysLeft <= 3);
    const thisWeek  = filtered.filter(i => i.daysLeft > 3 && i.daysLeft <= 7);
    const longTerm  = filtered.filter(i => i.daysLeft > 7);

    const handleOpenAddMenu = () => {
        // Use the global FAB menu instead of local modal
        useMealStore.setState({ isAddMenuOpen: true });
    };


    const openRecipeFlow = (recipeId: string) => {
        router.push({ pathname: '/recipe-ingredients', params: { recipeId } });
    };

    const handleUseNow = (item: FridgeItem) => {
        Alert.alert(
            t('kitchen.useNowConfirmTitle'),
            `${t('kitchen.useNowConfirmDesc')} (${item.name})`,
            [
                { text: t('common.cancel'), style: 'cancel' },
                { 
                    text: t('kitchen.useNow'), 
                    style: 'default',
                    onPress: async () => {
                        try {
                            const { useMealStore } = require('../../src/store/mealStore');
                            await useMealStore.getState().addMeal({
                                name: item.name,
                                type: 'SNACK', // Mặc định log vào Snack
                                calories: (item as any).calories || 0,
                                protein: (item as any).protein || 0,
                                carbs: (item as any).carbs || 0,
                                fat: (item as any).fat || 0,
                                servingSize: item.amount,
                                image: item.emoji || '🍽️'
                            });
                            await removeItem(item.id);
                        } catch (error) {
                            console.error('Lỗi khi dùng ngay món ăn:', error);
                            Alert.alert(t('common.error'), t('kitchen.useNowError'));
                        }
                    }
                }
            ]
        );
    };

    const EmptyHint = ({ text }: { text: string }) => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{text}</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerSub}>{t('kitchen.headerSub')}</Text>
                    <Text style={styles.title}>{t('kitchen.title')}</Text>
                </View>
                <TouchableOpacity
                    style={styles.addBtn}
                    onPress={handleOpenAddMenu}
                >
                    <Text style={styles.addBtnText}>＋</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, tab === 'fridge' && styles.tabActive]} onPress={() => setTab('fridge')}>
                    <Text style={[styles.tabText, tab === 'fridge' && styles.tabTextActive]}>{t('kitchen.tab.fridge')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === 'recipes' && styles.tabActive]} onPress={() => setTab('recipes')}>
                    <Text style={[styles.tabText, tab === 'recipes' && styles.tabTextActive]}>{t('kitchen.tab.recipes')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
                {tab === 'fridge' ? (
                    <View style={styles.content}>
                        {/* Search */}
                        <View style={styles.searchRow}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.search}
                                placeholder={t('kitchen.searchIngredient')}
                                placeholderTextColor={Colors.textLight}
                                value={search}
                                onChangeText={setSearch}
                            />
                            {search.length > 0 && (
                                <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
                                    <Text style={styles.clearBtnText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {isLoading && items.length === 0 ? (
                            <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
                        ) : items.length === 0 ? (
                            <View style={styles.emptyFridge}>
                                <Text style={styles.emptyFridgeEmoji}>🧊</Text>
                                <Text style={styles.emptyFridgeTitle}>{t('kitchen.empty.title')}</Text>
                                <Text style={styles.emptyFridgeDesc}>{t('kitchen.empty.desc')}</Text>
                                <TouchableOpacity style={styles.emptyAddBtn} onPress={handleOpenAddMenu}>
                                    <Text style={styles.emptyAddBtnText}>{t('kitchen.empty.addIngredient')}</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {/* ── Group 1: Use Soon (≤3 ngày) ── */}
                                <View style={styles.sectionHeader}>
                                    <View style={styles.urgentDot} />
                                    <Text style={styles.sectionTitle}>{t('kitchen.section.useSoon')}</Text>
                                </View>
                                {useSoon.length === 0
                                    ? <EmptyHint text={t('kitchen.empty.useSoon')} />
                                    : useSoon.map((item) => (
                                        <UseSoonCard key={item.id} item={item} onRemove={removeItem} onUseNow={handleUseNow} t={t} />
                                    ))
                                }

                                {/* ── Group 2: This Week (4-7 ngày) ── */}
                                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                                    <Text style={styles.sectionTitle}>{t('kitchen.section.thisWeek')}</Text>
                                </View>
                                {thisWeek.length === 0
                                    ? <EmptyHint text={t('kitchen.empty.thisWeek')} />
                                    : thisWeek.map((item) => (
                                        <ThisWeekCard key={item.id} item={item} onUseNow={handleUseNow} t={t} />
                                    ))
                                }

                                {/* ── Group 3: Long-term (>7 ngày) ── */}
                                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                                    <Text style={styles.sectionTitle}>{t('kitchen.section.longTerm')}</Text>
                                </View>
                                {longTerm.length === 0
                                    ? <EmptyHint text={t('kitchen.empty.longTerm')} />
                                    : (
                                        <View style={styles.gridRow}>
                                            {longTerm.map((item) => (
                                                <LongTermCard key={item.id} item={item} />
                                            ))}
                                        </View>
                                    )
                                }
                            </>
                        )}
                    </View>
                ) : (
                    <View style={styles.content}>
                        <View style={styles.recipeSubTabs}>
                            <TouchableOpacity style={[styles.subTab, recipeSubTab === 'system' && styles.subTabActive]} onPress={() => setRecipeSubTab('system')}>
                                <Text style={[styles.subTabText, recipeSubTab === 'system' && styles.subTabTextActive]}>{t('kitchen.tab.system')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.subTab, recipeSubTab === 'personal' && styles.subTabActive]} onPress={() => setRecipeSubTab('personal')}>
                                <Text style={[styles.subTabText, recipeSubTab === 'personal' && styles.subTabTextActive]}>{t('kitchen.tab.personal')}</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.searchRow}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.search}
                                placeholder={t('kitchen.searchRecipe')}
                                placeholderTextColor={Colors.textLight}
                                value={recipeSearch}
                                onChangeText={setRecipeSearch}
                            />
                            {recipeSearch.length > 0 && (
                                <TouchableOpacity onPress={() => setRecipeSearch('')} style={styles.clearBtn}>
                                    <Text style={styles.clearBtnText}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {recipeSubTab === 'system' ? (
                            <View style={styles.recipeList}>
                                {recipes
                                    .filter(r => r.name.toLowerCase().includes(recipeSearch.toLowerCase()))
                                    .map((recipe) => (
                                        <RecipeCardHorizontal key={recipe.id} recipe={recipe} onPress={() => openRecipeFlow(recipe.id)} t={t} />
                                ))}
                            </View>
                        ) : (
                            <View style={styles.recipeList}>
                                {personalRecipes.length === 0 ? (
                                    <EmptyHint text={t('kitchen.emptyPersonal')} />
                                ) : (
                                    personalRecipes
                                        .filter(r => r.name.toLowerCase().includes(recipeSearch.toLowerCase()))
                                        .map((recipe) => (
                                            <RecipeCardHorizontal key={recipe.id} recipe={recipe} onPress={() => openRecipeFlow(recipe.id)} t={t} />
                                        ))
                                )}
                            </View>
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
            <View style={{ height: 100 }} />
        </SafeAreaView>
    );
}

/* ─── Sub-components ─── */

function UseSoonCard({
    item,
    onRemove,
    onUseNow,
    t,
}: {
    item: FridgeItem;
    onRemove: (id: string) => Promise<void>;
    onUseNow: (item: FridgeItem) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    return (
        <View style={[styles.useSoonCard, Shadows.small]}>
            {/* Expiry ribbon */}
            <View style={styles.expiryRibbon}>
                <Text style={styles.expiryRibbonText}>{t('kitchen.expiryInDays', { days: item.daysLeft })}</Text>
            </View>

            <View style={styles.useSoonRow}>
                {/* Emoji thumb */}
                <View style={styles.useSoonThumb}>
                    <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                </View>

                {/* Info */}
                <View style={styles.useSoonInfo}>
                    <Text style={styles.fridgeName}>{item.name}</Text>
                    <Text style={styles.fridgeDetail}>{item.amount} • {item.location}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.btnUseNow} onPress={() => onUseNow(item)}>
                            <Text style={styles.btnUseNowText}>{t('kitchen.useNow')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnRemove} onPress={() => onRemove(item.id)}>
                            <Text style={styles.btnRemoveText}>{t('kitchen.remove')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
}

function ThisWeekCard({
    item,
    onUseNow,
    t,
}: {
    item: FridgeItem;
    onUseNow: (item: FridgeItem) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    return (
        <TouchableOpacity style={[styles.thisWeekCard, Shadows.small]} activeOpacity={0.8} onPress={() => onUseNow(item)}>
            <View style={styles.thisWeekThumb}>
                <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
            </View>
            <View style={styles.thisWeekInfo}>
                <Text style={styles.fridgeName}>{item.name}</Text>
                <Text style={styles.fridgeDetail}>{item.amount} • {t('kitchen.remainingDays', { days: item.daysLeft })}</Text>
            </View>
            <View style={[styles.expiryBadge, { backgroundColor: Colors.accentLight }]}>
                <Text style={[styles.expiryText, { color: Colors.accent }]}>{item.daysLeft}d</Text>
            </View>
        </TouchableOpacity>
    );
}

function LongTermCard({ item }: { item: FridgeItem }) {
    return (
        <View style={styles.longTermCard}>
            <View style={styles.longTermThumb}>
                <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
            </View>
            <Text style={styles.longTermName} numberOfLines={1}>{item.name}</Text>
        </View>
    );
}

function RecipeCardHorizontal({ recipe, onPress, t }: { recipe: Recipe, onPress: () => void, t: (key: string, params?: any) => string }) {
    return (
        <TouchableOpacity style={[styles.recipeCardHorizontal, Shadows.small]} activeOpacity={0.8} onPress={onPress}>
            <View style={styles.recipeCardHThumb}>
                <Text style={{ fontSize: 36 }}>{recipe.emoji || '🍽️'}</Text>
            </View>
            <View style={styles.recipeCardHInfo}>
                <Text style={styles.recipeCardHName} numberOfLines={1}>{recipe.name}</Text>
                <Text style={styles.recipeCardHDesc} numberOfLines={2}>{recipe.description}</Text>
                <View style={styles.recipeCardHMetaDetails}>
                    <Text style={styles.recipeCardHLabel}>🥘 {recipe.ingredients?.length || 0} {t('kitchen.recipeIngredients')}</Text>
                    <Text style={styles.recipeCardHLabel}>👨‍🍳 {recipe.steps?.length || 0} {t('kitchen.recipeSteps')} • ⏱ {recipe.time || '15 min'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    /* ── Layout ── */
    container: { flex: 1, backgroundColor: Colors.background },
    content: { paddingHorizontal: 20 },

    /* ── Header ── */
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    headerSub: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1.5, marginBottom: 2 },
    title: { fontSize: 26, fontWeight: '800', color: Colors.primary },
    addBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnText: { fontSize: 22, color: '#FFFFFF', fontWeight: '300', lineHeight: 24 },
    addMethodBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 90,
    },
    addMethodPopup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 20,
        width: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    addMethodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    addMethodTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    addMethodCloseBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addMethodOptionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    addMethodOptionCard: {
        flex: 1,
        backgroundColor: '#F7F8FA',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 6,
    },
    addMethodOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EDEDEF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    addMethodOptionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    addMethodOptionDesc: {
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
    },

    /* ── Tabs ── */
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: '#FFFFFF' },
    tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
    tabTextActive: { color: Colors.primary, fontWeight: '700' },

    /* ── Search ── */
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingHorizontal: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        height: 48,
    },
    searchIcon: { fontSize: 16, marginRight: 8 },
    search: { flex: 1, fontSize: 15, color: Colors.text },
    clearBtn: { padding: 4 },
    clearBtnText: { fontSize: 14, color: Colors.textSecondary },

    /* ── Section headers ── */
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.red, marginRight: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },

    /* ── Empty states ── */
    emptyContainer: { paddingVertical: 16, paddingHorizontal: 12 },
    emptyText: { fontSize: 14, color: Colors.textSecondary, fontStyle: 'italic' },
    emptyFridge: { alignItems: 'center', paddingTop: 60, paddingBottom: 40, gap: 10 },
    emptyFridgeEmoji: { fontSize: 56 },
    emptyFridgeTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
    emptyFridgeDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
    emptyAddBtn: {
        marginTop: 10,
        backgroundColor: Colors.primary,
        borderRadius: 14,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    emptyAddBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

    /* ── Use Soon card ── */
    useSoonCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#FEE2E2',
        overflow: 'hidden',
    },
    expiryRibbon: {
        backgroundColor: Colors.red,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-end',
        borderBottomLeftRadius: 10,
    },
    expiryRibbonText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.8 },
    useSoonRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
    useSoonThumb: {
        width: 60,
        height: 60,
        borderRadius: 14,
        backgroundColor: '#FFF5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    useSoonInfo: { flex: 1 },
    actionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
    btnUseNow: {
        backgroundColor: Colors.accent,
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    btnUseNowText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    btnRemove: {
        backgroundColor: '#F0F0F0',
        borderRadius: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    btnRemoveText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },

    /* ── This Week card ── */
    thisWeekCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        marginBottom: 8,
        gap: 12,
    },
    thisWeekThumb: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#FFF9EC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thisWeekInfo: { flex: 1 },

    /* ── Shared fridge text ── */
    fridgeName: { fontSize: 15, fontWeight: '600', color: Colors.text },
    fridgeDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    expiryBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
    expiryText: { fontSize: 12, fontWeight: '700' },

    /* ── Long-term grid ── */
    gridRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
    longTermCard: { width: '30%', alignItems: 'center', marginBottom: 4 },
    longTermThumb: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#F5F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    longTermName: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },

    /* ── Recipes tab ── */
    recipeSubTabs: {
        flexDirection: 'row',
        marginBottom: 16,
        gap: 12,
    },
    subTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
    },
    subTabActive: {
        backgroundColor: Colors.primary,
    },
    subTabText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    subTabTextActive: {
        color: '#FFFFFF',
    },
    recipeList: {
        paddingBottom: 20,
    },
    recipeCardHorizontal: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
        gap: 12,
    },
    recipeCardHThumb: {
        width: 70,
        height: 70,
        borderRadius: 14,
        backgroundColor: '#F7F8FA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recipeCardHInfo: {
        flex: 1,
    },
    recipeCardHName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    recipeCardHDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 8,
        lineHeight: 18,
    },
    recipeCardHMetaDetails: {
        flexDirection: 'row',
        columnGap: 12,
        rowGap: 4,
        flexWrap: 'wrap',
    },
    recipeCardHLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        overflow: 'hidden',
    },
});
