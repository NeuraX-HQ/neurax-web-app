import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TouchableWithoutFeedback, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../src/constants/colors';
import { mockRecipes } from '../../src/data/mockData';
import { useFridgeStore, FridgeItem } from '../../src/store/fridgeStore';
import { VoiceModal } from '../../src/components/VoiceModal';
import { CameraScannerWithLoading } from '../../src/components/CameraScannerWithLoading';
import { SearchScanner } from '../../src/components/SearchScanner';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

const ADD_FOOD_METHODS = [
    { id: 'voice', icon: 'mic-outline', labelKey: 'tabs.voice', descKey: 'tabs.voiceDesc' },
    { id: 'camera', icon: 'camera-outline', labelKey: 'tabs.camera', descKey: 'tabs.cameraDesc' },
    { id: 'search', icon: 'search-outline', labelKey: 'tabs.search', descKey: 'tabs.searchDesc' },
] as const;

export default function KitchenScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [tab, setTab] = useState<'fridge' | 'recipes'>('fridge');
    const [search, setSearch] = useState('');
    const [showAddMethod, setShowAddMethod] = useState(false);
    const [voiceVisible, setVoiceVisible] = useState(false);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const addMethodScale = useRef(new Animated.Value(0)).current;
    const addMethodOpacity = useRef(new Animated.Value(0)).current;
    const { items, loadItems, removeItem, isLoading } = useFridgeStore();

    useEffect(() => {
        loadItems();
    }, []);

    const filtered = items.filter(i =>
        search.trim() === '' || i.name.toLowerCase().includes(search.toLowerCase())
    );

    const useSoon   = filtered.filter(i => i.daysLeft <= 3);
    const thisWeek  = filtered.filter(i => i.daysLeft > 3 && i.daysLeft <= 7);
    const longTerm  = filtered.filter(i => i.daysLeft > 7);

    const openAddMethod = () => {
        setShowAddMethod(true);
        Animated.parallel([
            Animated.spring(addMethodScale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 280 }),
            Animated.timing(addMethodOpacity, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
    };

    const closeAddMethod = () => {
        Animated.parallel([
            Animated.spring(addMethodScale, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 280 }),
            Animated.timing(addMethodOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        ]).start(() => setShowAddMethod(false));
    };

    const handleSelectAddMethod = (methodId: 'voice' | 'camera' | 'search') => {
        closeAddMethod();
        if (methodId === 'voice') {
            setTimeout(() => setVoiceVisible(true), 180);
            return;
        }
        if (methodId === 'camera') {
            setTimeout(() => setCameraVisible(true), 180);
            return;
        }
        setTimeout(() => setSearchVisible(true), 180);
    };

    const openRecipeFlow = (recipeId: string) => {
        router.push({ pathname: '/recipe-ingredients', params: { recipeId } });
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
                    onPress={openAddMethod}
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
                                <TouchableOpacity style={styles.emptyAddBtn} onPress={openAddMethod}>
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
                                        <UseSoonCard key={item.id} item={item} onRemove={removeItem} t={t} />
                                    ))
                                }

                                {/* ── Group 2: This Week (4-7 ngày) ── */}
                                <View style={[styles.sectionHeader, { marginTop: 20 }]}>
                                    <Text style={styles.sectionTitle}>{t('kitchen.section.thisWeek')}</Text>
                                </View>
                                {thisWeek.length === 0
                                    ? <EmptyHint text={t('kitchen.empty.thisWeek')} />
                                    : thisWeek.map((item) => (
                                        <ThisWeekCard key={item.id} item={item} t={t} />
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
                        <TextInput style={styles.search} placeholder={t('kitchen.searchRecipe')} placeholderTextColor={Colors.textLight} />

                        {/* Featured Recipe */}
                        <Text style={styles.sectionTitle}>{t('kitchen.basedOnFridge')}</Text>
                        <TouchableOpacity
                            style={[styles.featuredRecipe, Shadows.medium]}
                            activeOpacity={0.9}
                            onPress={() => openRecipeFlow(mockRecipes[0].id)}
                        >
                            <Text style={styles.featuredEmoji}>{mockRecipes[0].emoji}</Text>
                            <View style={styles.featuredOverlay}>
                                <View style={styles.matchBadge}>
                                    <Text style={styles.matchText}>{t('kitchen.matchPercent', { percent: mockRecipes[0].match })}</Text>
                                </View>
                                <Text style={styles.featuredName}>{mockRecipes[0].name}</Text>
                                <Text style={styles.featuredDesc}>{mockRecipes[0].description}</Text>
                                <View style={styles.featuredMeta}>
                                    <Text style={styles.metaItem}>🔥 {mockRecipes[0].calories} kcal</Text>
                                    <Text style={styles.metaItem}>💪 {mockRecipes[0].protein}</Text>
                                    <Text style={styles.metaItem}>⏱ {mockRecipes[0].time}</Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* Quick & Easy */}
                        <Text style={styles.sectionTitle}>{t('kitchen.quickEasy')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesScroll}>
                            {mockRecipes.map((recipe) => (
                                <TouchableOpacity
                                    key={recipe.id}
                                    style={[styles.recipeCard, Shadows.small]}
                                    activeOpacity={0.85}
                                    onPress={() => openRecipeFlow(recipe.id)}
                                >
                                    <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
                                    <Text style={styles.recipeName}>{recipe.name}</Text>
                                    <Text style={styles.recipeMeta}>🔥 {recipe.calories} kcal • ⏱ {recipe.time}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>

            <Modal visible={showAddMethod} transparent animationType="none" onRequestClose={closeAddMethod}>
                <TouchableWithoutFeedback onPress={closeAddMethod}>
                    <View style={styles.addMethodBackdrop}>
                        <TouchableWithoutFeedback>
                            <Animated.View
                                style={[
                                    styles.addMethodPopup,
                                    {
                                        opacity: addMethodOpacity,
                                        transform: [
                                            { scale: addMethodScale },
                                            {
                                                translateY: addMethodScale.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [20, 0],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <View style={styles.addMethodHeader}>
                                    <Text style={styles.addMethodTitle}>{t('tabs.addFoodMethodTitle')}</Text>
                                    <TouchableOpacity onPress={closeAddMethod} style={styles.addMethodCloseBtn}>
                                        <Ionicons name="close" size={18} color="#666" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.addMethodOptionsRow}>
                                    {ADD_FOOD_METHODS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt.id}
                                            style={styles.addMethodOptionCard}
                                            onPress={() => handleSelectAddMethod(opt.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.addMethodOptionIcon}>
                                                <Ionicons name={opt.icon} size={24} color="#333" />
                                            </View>
                                            <Text style={styles.addMethodOptionLabel}>{t(opt.labelKey)}</Text>
                                            <Text style={styles.addMethodOptionDesc}>{t(opt.descKey)}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Animated.View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            <VoiceModal visible={voiceVisible} onClose={() => setVoiceVisible(false)} />
            <CameraScannerWithLoading visible={cameraVisible} onClose={() => setCameraVisible(false)} />
            <SearchScanner visible={searchVisible} onClose={() => setSearchVisible(false)} />
        </SafeAreaView>
    );
}

/* ─── Sub-components ─── */

function UseSoonCard({
    item,
    onRemove,
    t,
}: {
    item: FridgeItem;
    onRemove: (id: string) => Promise<void>;
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
                        <TouchableOpacity style={styles.btnUseNow}>
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
    t,
}: {
    item: FridgeItem;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    return (
        <View style={[styles.thisWeekCard, Shadows.small]}>
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
        </View>
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
});
