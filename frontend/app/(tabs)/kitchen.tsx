import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TouchableWithoutFeedback, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { Colors, Shadows } from '../../src/constants/colors';
import { mockRecipes } from '../../src/data/mockData';
import { useFridgeStore, FridgeItem } from '../../src/store/fridgeStore';
import { useMealStore } from '../../src/store/mealStore';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

export default function KitchenScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [tab, setTab] = useState<'fridge' | 'recipes'>('fridge');
    const [search, setSearch] = useState('');
    const [recipeSearch, setRecipeSearch] = useState('');
    const [showMealModal, setShowMealModal] = useState(false);
    const [pendingItem, setPendingItem] = useState<FridgeItem | null>(null);
    const searchRef = useRef<TextInput>(null);
    const { items, loadItems, removeItem, isLoading } = useFridgeStore();
    const addMeal = useMealStore((state) => state.addMeal);

    const { matchedRecipes, bestMatch } = useMemo(() => {
        if (!items || items.length === 0) {
            return {
                matchedRecipes: mockRecipes.map(r => ({ ...r, matchPercent: 0 })),
                bestMatch: { ...mockRecipes[0], matchPercent: 0 }
            };
        }

        const fridgeNames = items.map(i => i.name.toLowerCase());
        
        const scoredRecipes = mockRecipes.map(recipe => {
            let matchCount = 0;
            const totalIngredients = recipe.ingredients.length;
            
            recipe.ingredients.forEach(ing => {
                const ingName = ing.name.toLowerCase();
                const hasMatch = fridgeNames.some(f => f.includes(ingName) || ingName.includes(f));
                if (hasMatch) matchCount++;
            });

            const matchPercent = totalIngredients > 0 ? Math.round((matchCount / totalIngredients) * 100) : 0;
            return { ...recipe, matchPercent };
        });

        scoredRecipes.sort((a, b) => b.matchPercent - a.matchPercent);

        return {
            matchedRecipes: scoredRecipes,
            bestMatch: scoredRecipes[0]
        };
    }, [items]);

    const filteredRecipes = useMemo(() => {
        return matchedRecipes.filter(r => 
            recipeSearch.trim() === '' || r.name.toLowerCase().includes(recipeSearch.toLowerCase())
        );
    }, [matchedRecipes, recipeSearch]);

    useEffect(() => {
        loadItems();
    }, []);

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

    const handleUseItem = (item: FridgeItem) => {
        setPendingItem(item);
        setShowMealModal(true);
    };

    const confirmUseItem = async (mealType: string) => {
        if (!pendingItem) return;
        
        try {
            await addMeal({
                name: pendingItem.name,
                type: mealType as any,
                calories: pendingItem.calories || 150,
                protein: pendingItem.protein || 5,
                carbs: pendingItem.carbs || 15,
                fat: pendingItem.fat || 5,
                servingSize: pendingItem.amount,
                image: pendingItem.emoji,
            });
            await removeItem(pendingItem.id);
            setShowMealModal(false);
            setPendingItem(null);
        } catch (error) {
            console.error('Lỗi khi dùng thực phẩm:', error);
        }
    };


    const openRecipeFlow = (recipeId: string) => {
        router.push({ pathname: '/recipe-ingredients', params: { recipeId } });
    };

    const getMockNutrition = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('phở')) return { calories: 450, protein: 30, carbs: 60, fat: 12 };
        if (lower.includes('bò') || lower.includes('beef')) return { calories: 250, protein: 26, carbs: 0, fat: 15 };
        if (lower.includes('gà') || lower.includes('chicken')) return { calories: 165, protein: 31, carbs: 0, fat: 3 };
        if (lower.includes('com') || lower.includes('cơm')) return { calories: 350, protein: 10, carbs: 60, fat: 5 };
        if (lower.includes('salad') || lower.includes('cải') || lower.includes('rau')) return { calories: 50, protein: 2, carbs: 10, fat: 0 };
        if (lower.includes('trứng') || lower.includes('egg')) return { calories: 70, protein: 6, carbs: 1, fat: 5 };
        if (lower.includes('sữa') || lower.includes('milk')) return { calories: 120, protein: 8, carbs: 12, fat: 5 };
        if (lower.includes('chuối') || lower.includes('banana')) return { calories: 105, protein: 1, carbs: 27, fat: 0 };
        if (lower.includes('táo') || lower.includes('apple')) return { calories: 95, protein: 0, carbs: 25, fat: 0 };
        return { calories: 150, protein: 10, carbs: 20, fat: 5 };
    };

    const handleCardPress = (item: FridgeItem) => {
        const macros = getMockNutrition(item.name);
        const payload = {
            name: item.name,
            servingSize: item.amount,
            calories: macros.calories,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            ingredients: []
        };
        router.push({
            pathname: '/food-detail',
            params: { 
                foodData: JSON.stringify(payload),
                source: 'fridge'
            },
        });
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
                    <Text style={[styles.tabText, tab === 'fridge' && styles.tabTextActive]}>🧊 {t('kitchen.tab.fridge')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === 'recipes' && styles.tabActive]} onPress={() => setTab('recipes')}>
                    <Text style={[styles.tabText, tab === 'recipes' && styles.tabTextActive]}>👨‍🍳 {t('kitchen.tab.recipes')}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
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
                                        <UseSoonCard key={item.id} item={item} onRemove={removeItem} onUse={handleUseItem} onCardPress={handleCardPress} t={t} />
                                    ))
                                }

                                {/* ── Group 2: This Week (4-7 ngày) ── */}
                                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                                    <Text style={styles.sectionTitle}>{t('kitchen.section.thisWeek')}</Text>
                                </View>
                                {thisWeek.length === 0
                                    ? <EmptyHint text={t('kitchen.empty.thisWeek')} />
                                    : thisWeek.map((item) => (
                                        <ThisWeekCard key={item.id} item={item} onRemove={removeItem} onUse={handleUseItem} onCardPress={handleCardPress} t={t} />
                                    ))
                                }

                                {/* ── Group 3: Long-term (>7 ngày) ── */}
                                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                                    <Text style={styles.sectionTitle}>{t('kitchen.section.longTerm')}</Text>
                                </View>
                                {longTerm.length === 0
                                    ? <EmptyHint text={t('kitchen.empty.longTerm')} />
                                    : (
                                        <View style={{ gap: 8 }}>
                                            {longTerm.map((item) => (
                                                <LongTermCard key={item.id} item={item} onRemove={removeItem} onUse={handleUseItem} onCardPress={handleCardPress} t={t} />
                                            ))}
                                        </View>
                                    )
                                }
                            </>
                        )}
                    </View>
                ) : (
                    <View style={styles.content}>
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

                        {/* Featured Recipe */}
                        <Text style={styles.sectionTitle}>{t('kitchen.basedOnFridge')}</Text>
                        <TouchableOpacity
                            style={[styles.featuredRecipe, Shadows.medium]}
                            activeOpacity={0.9}
                            onPress={() => openRecipeFlow(bestMatch.id)}
                        >
                            <Text style={styles.featuredEmoji}>{bestMatch.emoji || '🍲'}</Text>
                            <View style={styles.featuredOverlay}>
                                <View style={styles.matchBadge}>
                                    <Text style={styles.matchText}>{t('kitchen.matchPercent', { percent: bestMatch.matchPercent || bestMatch.match })}</Text>
                                </View>
                                <Text style={styles.featuredName}>{bestMatch.name}</Text>
                                <Text style={styles.featuredDesc}>{bestMatch.description}</Text>
                                <View style={styles.featuredMeta}>
                                    <Text style={styles.metaItem}>🔥 {bestMatch.calories} kcal</Text>
                                    <Text style={styles.metaItem}>💪 {bestMatch.protein}</Text>
                                    <Text style={styles.metaItem}>⏱ {bestMatch.time}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Quick & Easy */}
                        <Text style={styles.sectionTitle}>{t('kitchen.quickEasy')}</Text>
                        {filteredRecipes.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesScroll}>
                                {filteredRecipes.filter(r => r.id !== bestMatch.id).map((recipe) => (
                                    <TouchableOpacity
                                        key={recipe.id}
                                        style={[styles.recipeCard, Shadows.small]}
                                        activeOpacity={0.85}
                                        onPress={() => openRecipeFlow(recipe.id)}
                                    >
                                        <Text style={styles.recipeEmoji}>{recipe.emoji || '🍲'}</Text>
                                        <Text style={styles.recipeName}>{recipe.name}</Text>
                                        <Text style={styles.recipeMeta}>🔥 {recipe.calories} kcal • ⏱ {recipe.time}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        ) : (
                            <EmptyHint text="Không tìm thấy công thức nào." />
                        )}
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
            <View style={{ height: 100 }} />

            {/* Meal Type Selection Modal */}
            <Modal transparent visible={showMealModal} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.mealModalContent}>
                        <Text style={styles.mealModalTitle}>{t('kitchen.selectMeal') || "Dùng cho bữa nào?"}</Text>
                        <Text style={styles.mealModalSub}>{pendingItem?.name}</Text>
                        
                        <View style={styles.mealOptions}>
                            {[
                                { id: 'BREAKFAST', label: t('foodDetail.mealType.breakfast'), icon: '🌅' },
                                { id: 'LUNCH', label: t('foodDetail.mealType.lunch'), icon: '☀️' },
                                { id: 'DINNER', label: t('foodDetail.mealType.dinner'), icon: '🌙' },
                                { id: 'SNACK', label: t('foodDetail.mealType.snack'), icon: '🍎' },
                            ].map((opt) => (
                                <TouchableOpacity 
                                    key={opt.id} 
                                    style={styles.mealOptionBtn}
                                    onPress={() => confirmUseItem(opt.id)}
                                >
                                    <Text style={styles.mealOptionIcon}>{opt.icon}</Text>
                                    <Text style={styles.mealOptionText}>{opt.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={styles.cancelBtn} 
                            onPress={() => {
                                setShowMealModal(false);
                                setPendingItem(null);
                            }}
                        >
                            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

/* ─── Sub-components ─── */

function UseSoonCard({
    item,
    onRemove,
    onUse,
    onCardPress,
    t,
}: {
    item: FridgeItem;
    onRemove: (id: string) => Promise<void>;
    onUse: (item: FridgeItem) => void | Promise<void>;
    onCardPress: (item: FridgeItem) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    const renderRightActions = () => {
        return (
            <View style={{ flexDirection: 'row', height: '100%', alignItems: 'stretch' }}>
                <GHTouchableOpacity style={styles.deleteActionBtn} onPress={() => onRemove(item.id)}>
                    <Text style={styles.actionBtnText}>{t('kitchen.remove')}</Text>
                </GHTouchableOpacity>
            </View>
        );
    };

    return (
        <Swipeable rightThreshold={10} renderRightActions={renderRightActions} containerStyle={{ marginBottom: 12 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => onCardPress(item)}>
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
                                <TouchableOpacity style={styles.btnUseNow} onPress={() => onUse(item)}>
                                    <Text style={styles.btnUseNowText}>{t('kitchen.useNow')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
}

function ThisWeekCard({
    item,
    onRemove,
    onUse,
    onCardPress,
    t,
}: {
    item: FridgeItem;
    onRemove: (id: string) => Promise<void>;
    onUse: (item: FridgeItem) => void | Promise<void>;
    onCardPress: (item: FridgeItem) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    const renderRightActions = () => {
        return (
            <View style={{ flexDirection: 'row', height: '100%', alignItems: 'stretch' }}>
                <GHTouchableOpacity style={styles.deleteActionBtn} onPress={() => onRemove(item.id)}>
                    <Text style={styles.actionBtnText}>{t('kitchen.remove')}</Text>
                </GHTouchableOpacity>
            </View>
        );
    };

    return (
        <Swipeable rightThreshold={10} renderRightActions={renderRightActions} containerStyle={{ marginBottom: 8 }}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => onCardPress(item)}>
        <View style={[styles.thisWeekCard, Shadows.small]}>
            <View style={styles.thisWeekThumb}>
                <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
            </View>
            <View style={styles.thisWeekInfo}>
                <Text style={styles.fridgeName}>{item.name}</Text>
                <Text style={styles.fridgeDetail}>{item.amount} • {t('kitchen.remainingDays', { days: item.daysLeft })}</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.btnUseNowSmall} onPress={() => onUse(item)}>
                        <Text style={styles.btnUseNowTextSmall}>{t('kitchen.useNow')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={[styles.expiryBadge, { backgroundColor: Colors.accentLight }]}>
                <Text style={[styles.expiryText, { color: Colors.accent }]}>{item.daysLeft}d</Text>
            </View>
        </View>
        </TouchableOpacity>
        </Swipeable>
    );
}

function LongTermCard({
    item,
    onRemove,
    onUse,
    onCardPress,
    t,
}: {
    item: FridgeItem;
    onRemove: (id: string) => Promise<void>;
    onUse: (item: FridgeItem) => void | Promise<void>;
    onCardPress: (item: FridgeItem) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    const renderRightActions = () => {
        return (
            <View style={{ flexDirection: 'row', height: '100%', alignItems: 'stretch' }}>
                <GHTouchableOpacity style={styles.deleteActionBtn} onPress={() => onRemove(item.id)}>
                    <Text style={styles.actionBtnText}>{t('kitchen.remove')}</Text>
                </GHTouchableOpacity>
            </View>
        );
    };

    return (
        <Swipeable rightThreshold={10} renderRightActions={renderRightActions} containerStyle={{ marginBottom: 8 }}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => onCardPress(item)}>
            <View style={[styles.thisWeekCard, Shadows.small]}>
                <View style={styles.thisWeekThumb}>
                    <Text style={{ fontSize: 26 }}>{item.emoji}</Text>
                </View>
                <View style={styles.thisWeekInfo}>
                    <Text style={styles.fridgeName}>{item.name}</Text>
                    <Text style={styles.fridgeDetail}>{item.amount} • {t('kitchen.remainingDays', { days: item.daysLeft })}</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity style={styles.btnUseNowSmall} onPress={() => onUse(item)}>
                            <Text style={styles.btnUseNowTextSmall}>{t('kitchen.useNow')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={[styles.expiryBadge, { backgroundColor: Colors.accentLight }]}>
                    <Text style={[styles.expiryText, { color: Colors.accent }]}>{item.daysLeft}d</Text>
                </View>
            </View>
            </TouchableOpacity>
        </Swipeable>
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
        backgroundColor: Colors.accent,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
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
        backgroundColor: Colors.accent,
        borderRadius: 14,
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    emptyAddBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },

    /* ── Use Soon card ── */
    useSoonCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
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

    /* ── Swipe Actions ── */
    editActionBtn: {
        backgroundColor: Colors.orange,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        borderRadius: 14,
        marginLeft: 8,
        height: '100%',
    },
    deleteActionBtn: {
        backgroundColor: Colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        borderRadius: 14,
        marginLeft: 8,
        height: '100%',
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },

    /* ── Recipes tab ── */
    featuredRecipe: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        marginTop: 8,
        overflow: 'hidden',
    },
    featuredEmoji: { fontSize: 64, alignSelf: 'center', marginBottom: 16 },
    featuredOverlay: {},
    matchBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(46, 204, 113, 0.25)',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginBottom: 8,
    },
    matchText: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
    featuredName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
    featuredDesc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 20, marginBottom: 12 },
    featuredMeta: { flexDirection: 'row', gap: 16 },
    metaItem: { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
    recipesScroll: { marginBottom: 20 },
    recipeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        width: 170,
        marginRight: 12,
        alignItems: 'center',
    },
    recipeEmoji: { fontSize: 48, marginBottom: 10 },
    recipeName: { fontSize: 14, fontWeight: '600', color: Colors.text, textAlign: 'center', marginBottom: 6 },
    recipeMeta: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },

    /* ── Meal Modal ── */
    mealModalContent: {
        width: '90%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        ...Shadows.medium,
    },
    mealModalTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 4 },
    mealModalSub: { fontSize: 15, color: Colors.textSecondary, marginBottom: 24 },
    mealOptions: { width: '100%', gap: 12 },
    mealOptionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        gap: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    mealOptionIcon: { fontSize: 24 },
    mealOptionText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
    cancelBtn: { marginTop: 20, padding: 10 },
    cancelBtnText: { fontSize: 15, color: Colors.textLight, fontWeight: '600' },

    btnUseNowSmall: {
        backgroundColor: Colors.accent,
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    btnUseNowTextSmall: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
