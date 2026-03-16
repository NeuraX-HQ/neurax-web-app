import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ScrollView, Modal, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../constants/colors';
import { searchFoodNutrition, NutritionInfo } from '../services/geminiService';

interface SearchScannerProps {
    visible: boolean;
    onClose: () => void;
}

const DEFAULT_PORTION_UNIT = 'khẩu phần';

export function SearchScanner({ visible, onClose }: SearchScannerProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [recent, setRecent] = useState<string[]>(['Phở Bò', 'Cơm Tấm', 'Ức Gà Nướng']);
    const [activeTab, setActiveTab] = useState<'recent' | 'popular' | 'myfoods'>('recent');

    const handleSearch = useCallback(async (foodName: string) => {
        if (!foodName.trim() || searching) return;

        setSearching(true);
        try {
            const result = await searchFoodNutrition(foodName.trim());

            if (result.success && result.data) {
                // Thêm vào lịch sử tìm kiếm
                setRecent(prev => {
                    const updated = [foodName.trim(), ...prev.filter(r => r !== foodName.trim())];
                    return updated.slice(0, 5);
                });

                onClose();
                router.push({
                    pathname: '/food-detail',
                    params: {
                        foodData: JSON.stringify(result.data),
                        source: 'search',
                    }
                });
            } else {
                Alert.alert('Không tìm thấy', result.error || 'Không thể tìm thông tin món ăn này. Thử lại với tên khác.');
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert('Lỗi', 'Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.');
        } finally {
            setSearching(false);
        }
    }, [searching, onClose, router]);

    const buildQuickFoodData = useCallback((item: FoodTemplateItem): NutritionInfo => {
        return {
            name: item.name,
            calories: item.kcal,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            servingSize: item.serving,
            ingredients: [],
            db_match_count: 0,
            ai_fallback_count: 0,
        };
    }, []);

    const handleQuickAdd = useCallback((item: FoodTemplateItem) => {
        const foodData = buildQuickFoodData(item);
        onClose();
        router.push({
            pathname: '/food-detail',
            params: {
                foodData: JSON.stringify(foodData),
                source: 'quick_add',
            },
        });
    }, [buildQuickFoodData, onClose, router]);

    const renderFoodCard = (item: FoodTemplateItem) => (
        <TouchableOpacity
            key={item.name}
            style={searchStyles.foodCard}
            activeOpacity={0.85}
            onPress={() => handleSearch(item.name)}
            disabled={searching}
        >
            <View style={searchStyles.foodThumb}>
                <Text style={searchStyles.foodEmoji}>{item.emoji}</Text>
            </View>

            <View style={searchStyles.foodMainInfo}>
                <Text style={searchStyles.foodName}>{item.name}</Text>
                <Text style={searchStyles.foodKcal}>{item.kcal} kcal • {item.serving}</Text>
                <Text style={searchStyles.foodMacro}>P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g</Text>
            </View>

            <TouchableOpacity
                style={searchStyles.addBtn}
                activeOpacity={0.8}
                onPress={() => handleQuickAdd(item)}
                disabled={searching}
            >
                <Text style={searchStyles.addBtnPlus}>+</Text>
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const mergedSuggestions: FoodTemplateItem[] = [...POPULAR_FOODS, ...MY_FOODS];
    const filteredSuggestions = mergedSuggestions.filter((item) =>
        item.name.toLowerCase().includes(query.trim().toLowerCase())
    );

    return (
        <Modal visible={visible} animationType="slide">
            <SafeAreaView style={searchStyles.container}>
                <View style={searchStyles.header}>
                    <TouchableOpacity onPress={onClose} style={searchStyles.headerIconBtn}>
                        <Ionicons name="arrow-back" size={22} color="#334155" />
                    </TouchableOpacity>
                    <Text style={searchStyles.headerTitle}>Tìm kiếm món ăn</Text>
                    <View style={searchStyles.headerSpacer} />
                </View>

                <View style={searchStyles.searchWrap}>
                    <Ionicons name="search-outline" size={18} color="#94A3B8" />
                    <TextInput
                        style={searchStyles.searchInput}
                        placeholder="Tìm món ăn (vd: Phở bò)"
                        placeholderTextColor="#94A3B8"
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={() => handleSearch(query)}
                        returnKeyType="search"
                        autoFocus
                        editable={!searching}
                    />
                    {query.length > 0 && !searching && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                    )}
                    {searching && <ActivityIndicator size="small" color={Colors.primary} />}
                </View>

                {query.length > 0 && (
                    <TouchableOpacity
                        style={[searchStyles.searchButton, searching && searchStyles.searchButtonDisabled]}
                        onPress={() => handleSearch(query)}
                        disabled={searching}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="sparkles" size={16} color="#FFF" />
                        <Text style={searchStyles.searchButtonText}>
                            {searching ? 'Đang phân tích...' : `Tìm "${query}"`}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={searchStyles.tabRow}>
                    <TouchableOpacity
                        style={[searchStyles.tabBtn, activeTab === 'recent' && searchStyles.tabBtnActive]}
                        onPress={() => setActiveTab('recent')}
                    >
                        <Text style={[searchStyles.tabText, activeTab === 'recent' && searchStyles.tabTextActive]}>Gần đây</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[searchStyles.tabBtn, activeTab === 'popular' && searchStyles.tabBtnActive]}
                        onPress={() => setActiveTab('popular')}
                    >
                        <Text style={[searchStyles.tabText, activeTab === 'popular' && searchStyles.tabTextActive]}>Phổ biến</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[searchStyles.tabBtn, activeTab === 'myfoods' && searchStyles.tabBtnActive]}
                        onPress={() => setActiveTab('myfoods')}
                    >
                        <Text style={[searchStyles.tabText, activeTab === 'myfoods' && searchStyles.tabTextActive]}>Món của tôi</Text>
                    </TouchableOpacity>
                </View>

                {searching && (
                    <View style={searchStyles.loadingBox}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={searchStyles.loadingText}>AI đang phân tích dữ liệu dinh dưỡng...</Text>
                    </View>
                )}

                {!searching && (
                    <ScrollView style={searchStyles.listWrap} showsVerticalScrollIndicator={false}>
                        {query.length > 0 ? (
                            <>
                                <Text style={searchStyles.sectionTitle}>Kết quả tìm kiếm</Text>
                                {filteredSuggestions.length > 0 ? (
                                    filteredSuggestions.map(renderFoodCard)
                                ) : (
                                    <Text style={searchStyles.emptyText}>Không có kết quả nhanh. Bấm Tìm ở trên để AI phân tích.</Text>
                                )}
                            </>
                        ) : (
                            <>
                                {activeTab === 'recent' && (
                                    <>
                                        <Text style={searchStyles.sectionTitle}>Gần đây</Text>
                                        {recent.map((name) => {
                                            const mapped = mergedSuggestions.find((x) => x.name === name);
                                            const item = mapped || {
                                                name,
                                                emoji: '🍽️',
                                                kcal: 300,
                                                serving: `1 ${DEFAULT_PORTION_UNIT}`,
                                                protein: 18,
                                                carbs: 38,
                                                fat: 10,
                                            };
                                            return renderFoodCard(item);
                                        })}
                                    </>
                                )}

                                {activeTab === 'popular' && (
                                    <>
                                        <Text style={searchStyles.sectionTitle}>Phổ biến</Text>
                                        {POPULAR_FOODS.map(renderFoodCard)}
                                    </>
                                )}

                                {activeTab === 'myfoods' && (
                                    <>
                                        <Text style={searchStyles.sectionTitle}>Món của tôi</Text>
                                        {MY_FOODS.map(renderFoodCard)}
                                    </>
                                )}
                            </>
                        )}
                        <View style={{ height: 20 }} />
                    </ScrollView>
                )}
            </SafeAreaView>
        </Modal>
    );
}

type FoodTemplateItem = {
    name: string;
    emoji: string;
    kcal: number;
    serving: string;
    protein: number;
    carbs: number;
    fat: number;
};

const POPULAR_FOODS: FoodTemplateItem[] = [
    { name: 'Phở Bò', emoji: '🍜', kcal: 350, serving: `1 ${DEFAULT_PORTION_UNIT}`, protein: 22, carbs: 45, fat: 10 },
    { name: 'Bún Chả', emoji: '🍲', kcal: 450, serving: `1 ${DEFAULT_PORTION_UNIT}`, protein: 25, carbs: 60, fat: 15 },
    { name: 'Cơm Tấm', emoji: '🍚', kcal: 520, serving: '1 đĩa', protein: 30, carbs: 75, fat: 20 },
    { name: 'Gỏi Cuốn', emoji: '🥗', kcal: 180, serving: '2 cuốn', protein: 10, carbs: 28, fat: 4 },
    { name: 'Bánh Mì', emoji: '🥖', kcal: 310, serving: '1 ổ', protein: 15, carbs: 48, fat: 12 },
];

const MY_FOODS: FoodTemplateItem[] = [
    { name: 'Ức Gà Áp Chảo', emoji: '🍗', kcal: 240, serving: '150g', protein: 35, carbs: 2, fat: 9 },
    { name: 'Yến Mạch Sữa Chua', emoji: '🥣', kcal: 290, serving: '1 tô', protein: 14, carbs: 42, fat: 8 },
    { name: 'Salad Cá Ngừ', emoji: '🥬', kcal: 260, serving: '1 tô', protein: 24, carbs: 14, fat: 12 },
];

const searchStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        backgroundColor: 'rgba(248,250,252,0.96)',
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerSpacer: { width: 40, height: 40 },
    searchWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#E2E8F080',
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    searchInput: { flex: 1, fontSize: 15, color: '#0F172A', padding: 0 },
    searchButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: '#10B981', marginHorizontal: 16, marginBottom: 10,
        borderRadius: 12, paddingVertical: 12,
    },
    searchButtonDisabled: { opacity: 0.6 },
    searchButtonText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
    tabRow: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
        paddingBottom: 6,
    },
    tabBtn: {
        paddingVertical: 8,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabBtnActive: {
        borderBottomColor: '#10B981',
    },
    tabText: {
        color: '#64748B',
        fontSize: 13,
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#10B981',
    },
    loadingBox: {
        alignItems: 'center',
        paddingVertical: 44,
        gap: 10,
    },
    loadingText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
    listWrap: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    foodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        ...Shadows.small,
    },
    foodThumb: {
        width: 64,
        height: 64,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodEmoji: { fontSize: 30 },
    foodMainInfo: { flex: 1 },
    foodName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 2,
    },
    foodKcal: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 2,
    },
    foodMacro: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B9811A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBtnPlus: {
        color: '#10B981',
        fontSize: 24,
        fontWeight: '700',
        lineHeight: 26,
    },
    emptyText: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 19,
        marginTop: 4,
    },
});
