import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Pressable,
    FlatList,
    StyleSheet,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../contexts/AppContext';
import { Colors, Shadows } from '../../constants/Theme';
import FridgeItemCard from '../../components/FridgeItemCard';
import { FridgeItem, Recipe } from '../../data/mockData';

type TabType = 'fridge' | 'recipes';

interface RecipeCardProps {
    recipe: Recipe;
    onPress?: () => void;
}

const RecipeCard = React.memo(function RecipeCard({ recipe, onPress }: RecipeCardProps) {
    return (
        <Pressable style={styles.recipeCard} onPress={onPress}>
            {recipe.image ? (
                <Image source={{ uri: recipe.image }} style={styles.recipeImage} />
            ) : (
                <View style={[styles.recipeImage, styles.recipeImagePlaceholder]}>
                    <Text style={styles.recipeEmoji}>🍳</Text>
                </View>
            )}
            <View style={styles.recipeInfo}>
                <View style={styles.recipeHeader}>
                    <Text style={styles.recipeName}>{recipe.nameVi}</Text>
                    <View style={styles.matchBadge}>
                        <Text style={styles.matchText}>{recipe.matchedFromFridge} matches</Text>
                    </View>
                </View>
                <Text style={styles.recipeDesc} numberOfLines={2}>
                    {recipe.description}
                </Text>
                <View style={styles.recipeStats}>
                    <View style={styles.recipeStat}>
                        <Ionicons name="time-outline" size={14} color={Colors.textLight} />
                        <Text style={styles.recipeStatText}>
                            {recipe.prepTime + recipe.cookTime}m
                        </Text>
                    </View>
                    <View style={styles.recipeStat}>
                        <Ionicons name="flame-outline" size={14} color={Colors.textLight} />
                        <Text style={styles.recipeStatText}>{recipe.calories} kcal</Text>
                    </View>
                    <View style={styles.recipeStat}>
                        <Text style={styles.recipeStatText}>{recipe.protein}g protein</Text>
                    </View>
                </View>
            </View>
        </Pressable>
    );
});

export default function KitchenScreen() {
    const { fridgeItems, recipes } = useApp();
    const [activeTab, setActiveTab] = useState<TabType>('fridge');

    // Sort fridge items by expiry
    const sortedFridgeItems = [...fridgeItems].sort(
        (a, b) => a.expiresAt.getTime() - b.expiresAt.getTime()
    );

    // Count expiring soon items
    const expiringSoon = fridgeItems.filter(
        item => (item.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24) <= 3
    ).length;

    const renderFridgeItem = useCallback(({ item }: { item: FridgeItem }) => (
        <FridgeItemCard item={item} onPress={() => { }} />
    ), []);

    const renderRecipeItem = useCallback(({ item }: { item: Recipe }) => (
        <RecipeCard recipe={item} onPress={() => { }} />
    ), []);

    const keyExtractorFridge = useCallback((item: FridgeItem) => item.id, []);
    const keyExtractorRecipe = useCallback((item: Recipe) => item.id, []);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Kitchen</Text>
                <Pressable style={styles.addButton}>
                    <Ionicons name="scan-outline" size={24} color={Colors.primary} />
                </Pressable>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, activeTab === 'fridge' && styles.tabActive]}
                    onPress={() => setActiveTab('fridge')}
                >
                    <Text style={styles.tabIcon}>🧊</Text>
                    <Text style={[styles.tabText, activeTab === 'fridge' && styles.tabTextActive]}>
                        Fridge
                    </Text>
                    {expiringSoon > 0 && (
                        <View style={styles.tabBadge}>
                            <Text style={styles.tabBadgeText}>{expiringSoon}</Text>
                        </View>
                    )}
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'recipes' && styles.tabActive]}
                    onPress={() => setActiveTab('recipes')}
                >
                    <Text style={styles.tabIcon}>📖</Text>
                    <Text style={[styles.tabText, activeTab === 'recipes' && styles.tabTextActive]}>
                        Recipes
                    </Text>
                </Pressable>
            </View>

            {/* Content */}
            {activeTab === 'fridge' ? (
                <>
                    {/* Quick stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNum}>{fridgeItems.length}</Text>
                            <Text style={styles.statLabel}>Items</Text>
                        </View>
                        <View style={[styles.statCard, expiringSoon > 0 && styles.statCardWarning]}>
                            <Text style={[styles.statNum, expiringSoon > 0 && styles.statNumWarning]}>
                                {expiringSoon}
                            </Text>
                            <Text style={[styles.statLabel, expiringSoon > 0 && styles.statLabelWarning]}>
                                Expiring soon
                            </Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNum}>{recipes.length}</Text>
                            <Text style={styles.statLabel}>Can make</Text>
                        </View>
                    </View>

                    <FlatList
                        data={sortedFridgeItems}
                        renderItem={renderFridgeItem}
                        keyExtractor={keyExtractorFridge}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyIcon}>🧊</Text>
                                <Text style={styles.emptyText}>Your fridge is empty</Text>
                                <Pressable style={styles.scanButton}>
                                    <Text style={styles.scanButtonText}>📸 Scan groceries</Text>
                                </Pressable>
                            </View>
                        }
                    />
                </>
            ) : (
                <>
                    {/* AI suggestion banner */}
                    <View style={styles.aiBanner}>
                        <View style={styles.aiBannerIcon}>
                            <Text style={styles.aiBannerEmoji}>🤖</Text>
                        </View>
                        <View style={styles.aiBannerText}>
                            <Text style={styles.aiBannerTitle}>AI Suggestions</Text>
                            <Text style={styles.aiBannerDesc}>
                                Based on your fridge & weather today
                            </Text>
                        </View>
                    </View>

                    <FlatList
                        data={recipes}
                        renderItem={renderRecipeItem}
                        keyExtractor={keyExtractorRecipe}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}

            {/* Add button */}
            <Pressable style={styles.fab}>
                <Ionicons name="add" size={28} color={Colors.textOnPrimary} />
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    addButton: {
        width: 44,
        height: 44,
        backgroundColor: Colors.primaryLight,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: Colors.surface,
        ...Shadows.soft,
    },
    tabActive: {
        backgroundColor: Colors.primary,
    },
    tabIcon: {
        fontSize: 18,
    },
    tabText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textMedium,
    },
    tabTextActive: {
        color: Colors.textOnPrimary,
    },
    tabBadge: {
        backgroundColor: Colors.warning,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: Colors.surface,
        borderRadius: 16,
        ...Shadows.soft,
    },
    statCardWarning: {
        backgroundColor: '#FEF3C7',
    },
    statNum: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.textDark,
    },
    statNumWarning: {
        color: Colors.warning,
    },
    statLabel: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 4,
    },
    statLabelWarning: {
        color: Colors.warning,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textMedium,
        marginBottom: 20,
    },
    scanButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    scanButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textOnPrimary,
    },
    aiBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 16,
        padding: 16,
        backgroundColor: Colors.primaryLight,
        borderRadius: 16,
    },
    aiBannerIcon: {
        width: 44,
        height: 44,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    aiBannerEmoji: {
        fontSize: 22,
    },
    aiBannerText: {
        flex: 1,
    },
    aiBannerTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.primary,
    },
    aiBannerDesc: {
        fontSize: 13,
        color: Colors.textMedium,
        marginTop: 2,
    },
    recipeCard: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 12,
        marginBottom: 12,
        ...Shadows.soft,
    },
    recipeImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 12,
    },
    recipeImagePlaceholder: {
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recipeEmoji: {
        fontSize: 32,
    },
    recipeInfo: {
        flex: 1,
    },
    recipeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    recipeName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textDark,
        flex: 1,
    },
    matchBadge: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    matchText: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.primary,
    },
    recipeDesc: {
        fontSize: 13,
        color: Colors.textMedium,
        lineHeight: 18,
        marginBottom: 8,
    },
    recipeStats: {
        flexDirection: 'row',
        gap: 12,
    },
    recipeStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    recipeStatText: {
        fontSize: 12,
        color: Colors.textLight,
    },
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 100,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.float,
        shadowColor: Colors.primary,
    },
});
