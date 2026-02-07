import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Colors, Shadows, BorderRadius, Spacing } from '../../constants/Theme';
import FridgeItemCard from '../../components/FridgeItemCard';
import RecipeCard from '../../components/RecipeCard';
import UseNowModal from '../../components/UseNowModal';
import { FridgeItem, Recipe } from '../../data/mockData';

type TabType = 'fridge' | 'recipes';
type RecipeMode = 'flexible' | 'strict';

export default function KitchenScreen() {
    const { user } = useAuth();
    const { fridgeItems, recipes, removeFridgeItem } = useApp();
    const [activeTab, setActiveTab] = useState<TabType>('fridge');
    const [searchQuery, setSearchQuery] = useState('');
    const [recipeMode, setRecipeMode] = useState<RecipeMode>('flexible');
    const [refreshing, setRefreshing] = useState(false);

    // UseNow Modal state
    const [useNowModalVisible, setUseNowModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState<FridgeItem | null>(null);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    // Group fridge items by expiry timeframe
    const groupedItems = useMemo(() => {
        const now = Date.now();
        const useSoon: FridgeItem[] = [];
        const thisWeek: FridgeItem[] = [];
        const longTerm: FridgeItem[] = [];

        fridgeItems.forEach(item => {
            const daysUntilExpiry = Math.ceil((item.expiresAt.getTime() - now) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 3) {
                useSoon.push(item);
            } else if (daysUntilExpiry <= 7) {
                thisWeek.push(item);
            } else {
                longTerm.push(item);
            }
        });

        useSoon.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
        thisWeek.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());

        return { useSoon, thisWeek, longTerm };
    }, [fridgeItems]);

    // Filter items by search
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return groupedItems;
        const query = searchQuery.toLowerCase();
        return {
            useSoon: groupedItems.useSoon.filter(i => i.nameVi.toLowerCase().includes(query)),
            thisWeek: groupedItems.thisWeek.filter(i => i.nameVi.toLowerCase().includes(query)),
            longTerm: groupedItems.longTerm.filter(i => i.nameVi.toLowerCase().includes(query)),
        };
    }, [groupedItems, searchQuery]);

    // Filter recipes based on mode
    const filteredRecipes = useMemo(() => {
        if (recipeMode === 'strict') {
            return recipes.filter(r => (r.matchedFromFridge || 0) >= 3);
        }
        return recipes;
    }, [recipes, recipeMode]);

    // Split recipes into sections
    const { aiSuggested, favorites, trending } = useMemo(() => {
        const sorted = [...filteredRecipes].sort((a, b) =>
            (b.matchedFromFridge || 0) - (a.matchedFromFridge || 0)
        );
        return {
            aiSuggested: sorted.slice(0, 4),
            favorites: sorted.filter(r => r.matchedFromFridge && r.matchedFromFridge >= 2).slice(0, 3),
            trending: sorted.slice(0, 3),
        };
    }, [filteredRecipes]);

    const expiringSoon = groupedItems.useSoon.length;

    // Handlers
    const handleItemPress = useCallback((item: FridgeItem) => {
        setSelectedItem(item);
        setUseNowModalVisible(true);
    }, []);

    const handleGetRecipes = useCallback((item: FridgeItem) => {
        setActiveTab('recipes');
        setSearchQuery(item.nameVi);
    }, []);

    const handleMarkUsed = useCallback((item: FridgeItem) => {
        Alert.alert(
            'Remove Item',
            `Mark "${item.nameVi}" as used?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => removeFridgeItem(item.id)
                },
            ]
        );
    }, [removeFridgeItem]);

    const handleLogMeal = useCallback((item: FridgeItem) => {
        Alert.alert('Log Meal', `Add ${item.nameVi} to today's log?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Add', onPress: () => { } },
        ]);
    }, []);

    const handleAddGroceries = useCallback(() => {
        Alert.alert('Add Groceries', 'Scan or manually add items to your fridge', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Scan', onPress: () => { } },
            { text: 'Manual', onPress: () => { } },
        ]);
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Header - Matches Home exactly */}
                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greetingTitle}>Kitchen</Text>
                        <Text style={styles.greetingSubtitle}>
                            {fridgeItems.length} items in fridge
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Pressable style={styles.iconButton} onPress={handleAddGroceries}>
                            <Ionicons name="add-circle-outline" size={24} color={Colors.textDark} />
                        </Pressable>
                        <Pressable style={styles.iconButton}>
                            <Ionicons name="settings-outline" size={24} color={Colors.textDark} />
                        </Pressable>
                        <Image
                            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
                            style={styles.avatar}
                        />
                    </View>
                </View>

                {/* Stats Row - Matches Home pill style */}
                <View style={styles.statsRow}>
                    {expiringSoon > 0 && (
                        <View style={styles.warningPill}>
                            <Text style={styles.warningEmoji}>⚠️</Text>
                            <Text style={styles.warningText}>{expiringSoon} expiring soon</Text>
                        </View>
                    )}
                    <View style={styles.streakPill}>
                        <Text style={styles.streakEmoji}>✨</Text>
                        <Text style={styles.streakText}>{recipes.length} recipes available</Text>
                    </View>
                </View>

                {/* Tab Switcher - Card style like Home macro cards */}
                <View style={styles.tabContainer}>
                    <Pressable
                        style={[styles.tab, activeTab === 'fridge' && styles.tabActive]}
                        onPress={() => setActiveTab('fridge')}
                    >
                        <Ionicons
                            name="snow-outline"
                            size={20}
                            color={activeTab === 'fridge' ? Colors.surface : Colors.textMedium}
                        />
                        <Text style={[styles.tabText, activeTab === 'fridge' && styles.tabTextActive]}>
                            My Fridge
                        </Text>
                        {expiringSoon > 0 && activeTab !== 'fridge' && (
                            <View style={styles.tabBadge}>
                                <Text style={styles.tabBadgeText}>{expiringSoon}</Text>
                            </View>
                        )}
                    </Pressable>

                    <Pressable
                        style={[styles.tab, activeTab === 'recipes' && styles.tabActive]}
                        onPress={() => setActiveTab('recipes')}
                    >
                        <Ionicons
                            name="restaurant-outline"
                            size={20}
                            color={activeTab === 'recipes' ? Colors.surface : Colors.textMedium}
                        />
                        <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>
                            Recipes
                        </Text>
                    </Pressable>
                </View>

                {activeTab === 'fridge' ? (
                    <>
                        {/* Search Input - Card style */}
                        <View style={styles.searchCard}>
                            <Ionicons name="search" size={20} color={Colors.textLight} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search ingredients..."
                                placeholderTextColor={Colors.textLight}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                                    <Ionicons name="close-circle" size={20} color={Colors.textLight} />
                                </Pressable>
                            )}
                        </View>

                        {/* Use Soon Section - Matches Home section headers */}
                        {filteredItems.useSoon.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <View style={styles.urgentDot} />
                                        <Text style={styles.sectionTitle}>Use Soon</Text>
                                        <Text style={styles.sectionBadge}>2-3 days</Text>
                                    </View>
                                    <Pressable>
                                        <Text style={styles.seeAllText}>View all →</Text>
                                    </Pressable>
                                </View>
                                {filteredItems.useSoon.map(item => (
                                    <FridgeItemCard
                                        key={item.id}
                                        item={item}
                                        variant="urgent"
                                        onPress={() => handleItemPress(item)}
                                    />
                                ))}
                            </View>
                        )}

                        {/* This Week Section */}
                        {filteredItems.thisWeek.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <Text style={styles.sectionTitle}>This Week</Text>
                                        <Text style={styles.sectionBadge}>4-7 days</Text>
                                    </View>
                                </View>
                                {filteredItems.thisWeek.map(item => (
                                    <FridgeItemCard
                                        key={item.id}
                                        item={item}
                                        variant="compact"
                                        onPress={() => handleItemPress(item)}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Pantry Section */}
                        {filteredItems.longTerm.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <View style={styles.sectionTitleRow}>
                                        <Text style={styles.sectionTitle}>Pantry</Text>
                                        <Text style={styles.sectionBadge}>Long-term</Text>
                                    </View>
                                </View>
                                {filteredItems.longTerm.map(item => (
                                    <FridgeItemCard
                                        key={item.id}
                                        item={item}
                                        variant="compact"
                                        onPress={() => handleItemPress(item)}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Empty state */}
                        {fridgeItems.length === 0 && (
                            <View style={styles.emptyCard}>
                                <Ionicons name="basket-outline" size={48} color={Colors.textLight} />
                                <Text style={styles.emptyTitle}>Your fridge is empty</Text>
                                <Text style={styles.emptyDesc}>Scan groceries or add items manually</Text>
                                <Pressable style={styles.primaryButton} onPress={handleAddGroceries}>
                                    <Ionicons name="scan-outline" size={20} color={Colors.surface} />
                                    <Text style={styles.primaryButtonText}>Add groceries</Text>
                                </Pressable>
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        {/* Recipe Mode Toggle - Pill style like Home */}
                        <View style={styles.modeRow}>
                            <Text style={styles.modeLabel}>Mode:</Text>
                            <View style={styles.modeToggle}>
                                <Pressable
                                    style={[styles.modeButton, recipeMode === 'flexible' && styles.modeButtonActive]}
                                    onPress={() => setRecipeMode('flexible')}
                                >
                                    <Text style={[styles.modeButtonText, recipeMode === 'flexible' && styles.modeButtonTextActive]}>
                                        Flexible
                                    </Text>
                                </Pressable>
                                <Pressable
                                    style={[styles.modeButton, recipeMode === 'strict' && styles.modeButtonActive]}
                                    onPress={() => setRecipeMode('strict')}
                                >
                                    <Text style={[styles.modeButtonText, recipeMode === 'strict' && styles.modeButtonTextActive]}>
                                        Strict
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Mode info pill */}
                        <View style={styles.infoCard}>
                            <Ionicons
                                name="information-circle"
                                size={18}
                                color={recipeMode === 'strict' ? '#059669' : Colors.primary}
                            />
                            <Text style={styles.infoText}>
                                {recipeMode === 'flexible'
                                    ? 'May suggest 1-2 cheap extra ingredients'
                                    : 'Only recipes with 100% fridge ingredients'
                                }
                            </Text>
                        </View>

                        {/* AI Suggested Section - Matches Home section style */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Text style={styles.sectionTitle}>AI Suggested</Text>
                                </View>
                                <Pressable>
                                    <Text style={styles.seeAllText}>See all →</Text>
                                </Pressable>
                            </View>
                            <View style={styles.recipesGrid}>
                                {aiSuggested.length > 0 ? (
                                    aiSuggested.map((recipe, index) => (
                                        <RecipeCard
                                            key={recipe.id}
                                            recipe={recipe}
                                            featured={index === 0}
                                            onPress={() => { }}
                                        />
                                    ))
                                ) : (
                                    <View style={styles.emptyCard}>
                                        <Text style={styles.emptyDesc}>Add more ingredients to get suggestions</Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Favorites Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Text style={styles.sectionTitle}>Favorites</Text>
                                </View>
                                <Pressable>
                                    <Text style={styles.seeAllText}>See all →</Text>
                                </Pressable>
                            </View>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horizontalList}
                            >
                                {favorites.map(recipe => (
                                    <View key={recipe.id} style={styles.horizontalCard}>
                                        <RecipeCard recipe={recipe} onPress={() => { }} />
                                    </View>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Trending Section */}
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <Text style={styles.sectionTitle}>Trending</Text>
                                </View>
                                <Pressable>
                                    <Text style={styles.seeAllText}>See all →</Text>
                                </Pressable>
                            </View>
                            <View style={styles.recipesGrid}>
                                {trending.map(recipe => (
                                    <RecipeCard key={recipe.id} recipe={recipe} onPress={() => { }} />
                                ))}
                            </View>
                        </View>
                    </>
                )}

                {/* Bottom spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Context-aware FAB - Same position as Home AIBaoFAB */}
            <Pressable
                style={styles.fab}
                onPress={activeTab === 'fridge' ? handleAddGroceries : () => { }}
            >
                <Ionicons
                    name={activeTab === 'fridge' ? 'scan-outline' : 'search-outline'}
                    size={24}
                    color={Colors.surface}
                />
            </Pressable>

            {/* UseNow Modal */}
            <UseNowModal
                visible={useNowModalVisible}
                item={selectedItem}
                onClose={() => setUseNowModalVisible(false)}
                onGetRecipes={handleGetRecipes}
                onMarkUsed={handleMarkUsed}
                onLogMeal={handleLogMeal}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingTop: 16,
    },
    // Header - Exact match to Home
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    greetingTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
        marginBottom: 4,
        lineHeight: 34,
    },
    greetingSubtitle: {
        fontSize: 16,
        color: Colors.textMedium,
    },
    iconButton: {
        position: 'relative',
        padding: 4,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: Colors.surface,
        ...Shadows.soft,
    },
    // Stats Row - Same as Home dateStreakRow
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20,
    },
    warningPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.pill,
        gap: 6,
    },
    warningEmoji: {
        fontSize: 14,
    },
    warningText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#92400E',
    },
    streakPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.pill,
        gap: 6,
        ...Shadows.soft,
    },
    streakEmoji: {
        fontSize: 14,
    },
    streakText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textDark,
    },
    // Tab Container - Card style
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 4,
        marginBottom: 20,
        ...Shadows.soft,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: BorderRadius.sm,
        gap: 8,
    },
    tabActive: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textMedium,
    },
    tabTextActive: {
        color: Colors.surface,
    },
    tabBadge: {
        backgroundColor: Colors.error,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.surface,
    },
    // Search Card
    searchCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 16,
        marginBottom: 24,
        gap: 12,
        ...Shadows.soft,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 16,
        color: Colors.textDark,
    },
    clearButton: {
        padding: 4,
    },
    // Sections - Matches Home
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    sectionBadge: {
        fontSize: 12,
        color: Colors.textLight,
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    urgentDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.error,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.primary,
    },
    // Recipe Mode
    modeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    modeLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textMedium,
    },
    modeToggle: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 4,
        ...Shadows.soft,
    },
    modeButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: BorderRadius.sm,
    },
    modeButtonActive: {
        backgroundColor: Colors.primary,
    },
    modeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMedium,
    },
    modeButtonTextActive: {
        color: Colors.surface,
    },
    // Info Card
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: BorderRadius.md,
        marginBottom: 24,
        gap: 10,
        ...Shadows.soft,
    },
    infoText: {
        fontSize: 14,
        color: Colors.textMedium,
        flex: 1,
    },
    // Recipes
    recipesGrid: {
        gap: 0,
    },
    horizontalList: {
        gap: 12,
    },
    horizontalCard: {
        width: 280,
    },
    // Empty state card
    emptyCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 40,
        alignItems: 'center',
        ...Shadows.soft,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textDark,
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        color: Colors.textMedium,
        marginTop: 8,
        textAlign: 'center',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: BorderRadius.sm,
        gap: 8,
        marginTop: 20,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.surface,
    },
    // FAB - Same position as Home AIBaoFAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.float,
    },
});
