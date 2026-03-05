import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/constants/colors';
import { mockFridgeItems, mockRecipes } from '../../src/data/mockData';
import { useFridgeStore } from '../../src/store/fridgeStore';

export default function KitchenScreen() {
    const [tab, setTab] = useState<'fridge' | 'recipes'>('fridge');
    const { items, loadItems, isLoading } = useFridgeStore();

    useEffect(() => {
        loadItems();
    }, []);

    // Combine store items with mock data if store is empty
    const displayItems = items.length > 0 ? items : mockFridgeItems;

    const expiring = displayItems.filter(i => i.daysLeft <= 3);
    const fresh = displayItems.filter(i => i.daysLeft > 3);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Smart Kitchen</Text>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity style={[styles.tab, tab === 'fridge' && styles.tabActive]} onPress={() => setTab('fridge')}>
                    <Text style={[styles.tabText, tab === 'fridge' && styles.tabTextActive]}>My Fridge</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tab, tab === 'recipes' && styles.tabActive]} onPress={() => setTab('recipes')}>
                    <Text style={[styles.tabText, tab === 'recipes' && styles.tabTextActive]}>Recipes</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {tab === 'fridge' ? (
                    <View style={styles.content}>
                        <View style={styles.searchRow}>
                            <TextInput style={styles.search} placeholder="Tìm kiếm nguyên liệu..." placeholderTextColor={Colors.textLight} />
                            <TouchableOpacity style={styles.filterBtn}>
                                <Text>🔍</Text>
                            </TouchableOpacity>
                        </View>

                        {isLoading && items.length === 0 ? (
                            <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
                        ) : (
                            <>
                                {/* Expiring Soon */}
                                <Text style={styles.sectionTitle}>⚠️ Sắp hết hạn</Text>
                                {expiring.length === 0 && (
                                    <View style={styles.emptyContainer}>
                                        <Text style={styles.emptyText}>Tủ lạnh của bạn đang trống</Text>
                                    </View>
                                )}
                                {expiring.map((item) => (
                                    <View key={item.id} style={[styles.fridgeItem, Shadows.small]}>
                                        <View style={styles.fridgeEmoji}>
                                            <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                                        </View>
                                        <View style={styles.fridgeInfo}>
                                            <Text style={styles.fridgeName}>{item.name}</Text>
                                            <Text style={styles.fridgeDetail}>{item.amount} • {item.location}</Text>
                                        </View>
                                        <View style={[styles.expiryBadge, { backgroundColor: Colors.redLight }]}>
                                            <Text style={[styles.expiryText, { color: Colors.red }]}>
                                                {item.daysLeft} ngày nữa
                                            </Text>
                                        </View>
                                    </View>
                                ))}

                                {/* Fresh */}
                                <Text style={styles.sectionTitle}>✅ Còn tươi</Text>
                                {fresh.map((item) => (
                                    <View key={item.id} style={[styles.fridgeItem, Shadows.small]}>
                                        <View style={styles.fridgeEmoji}>
                                            <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                                        </View>
                                        <View style={styles.fridgeInfo}>
                                            <Text style={styles.fridgeName}>{item.name}</Text>
                                            <Text style={styles.fridgeDetail}>{item.amount} • {item.location}</Text>
                                        </View>
                                        <View style={[styles.expiryBadge, { backgroundColor: Colors.accentLight }]}>
                                            <Text style={[styles.expiryText, { color: Colors.accent }]}>
                                                {item.daysLeft} ngày nữa
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                ) : (
                    <View style={styles.content}>
                        <TextInput style={styles.search} placeholder="Search recipes..." placeholderTextColor={Colors.textLight} />

                        {/* Featured Recipe */}
                        <Text style={styles.sectionTitle}>Based on your Fridge</Text>
                        <View style={[styles.featuredRecipe, Shadows.medium]}>
                            <Text style={styles.featuredEmoji}>{mockRecipes[0].emoji}</Text>
                            <View style={styles.featuredOverlay}>
                                <View style={styles.matchBadge}>
                                    <Text style={styles.matchText}>{mockRecipes[0].match}% Match</Text>
                                </View>
                                <Text style={styles.featuredName}>{mockRecipes[0].name}</Text>
                                <Text style={styles.featuredDesc}>{mockRecipes[0].description}</Text>
                                <View style={styles.featuredMeta}>
                                    <Text style={styles.metaItem}>🔥 {mockRecipes[0].calories} kcal</Text>
                                    <Text style={styles.metaItem}>💪 {mockRecipes[0].protein}</Text>
                                    <Text style={styles.metaItem}>⏱ {mockRecipes[0].time}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Quick & Easy */}
                        <Text style={styles.sectionTitle}>Quick & Easy</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recipesScroll}>
                            {mockRecipes.map((recipe) => (
                                <View key={recipe.id} style={[styles.recipeCard, Shadows.small]}>
                                    <Text style={styles.recipeEmoji}>{recipe.emoji}</Text>
                                    <Text style={styles.recipeName}>{recipe.name}</Text>
                                    <Text style={styles.recipeMeta}>🔥 {recipe.calories} kcal • ⏱ {recipe.time}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
    title: { fontSize: 28, fontWeight: '800', color: Colors.primary },
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
    tabText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
    tabTextActive: { color: Colors.primary, fontWeight: '600' },
    content: { paddingHorizontal: 20 },
    searchRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    search: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        fontSize: 16,
        color: Colors.text,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    filterBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12, marginTop: 8 },
    fridgeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        gap: 14,
    },
    fridgeEmoji: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#F5F6F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fridgeInfo: { flex: 1 },
    fridgeName: { fontSize: 16, fontWeight: '600', color: Colors.text },
    fridgeDetail: { fontSize: 13, color: Colors.textSecondary, marginTop: 3 },
    expiryBadge: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
    expiryText: { fontSize: 13, fontWeight: '700' },
    featuredRecipe: {
        backgroundColor: Colors.primary,
        borderRadius: 20,
        padding: 24,
        marginBottom: 16,
        overflow: 'hidden',
    },
    featuredEmoji: { fontSize: 64, alignSelf: 'center', marginBottom: 16 },
    featuredOverlay: {},
    matchBadge: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(46, 204, 113, 0.2)',
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
    recipesScroll: { marginBottom: 16 },
    recipeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        width: 180,
        marginRight: 12,
        alignItems: 'center',
    },
    recipeEmoji: { fontSize: 48, marginBottom: 12 },
    recipeName: { fontSize: 15, fontWeight: '600', color: Colors.text, textAlign: 'center', marginBottom: 6 },
    recipeMeta: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
    emptyContainer: { padding: 32, alignItems: 'center' },
    emptyText: { fontSize: 15, color: Colors.textLight },
});
