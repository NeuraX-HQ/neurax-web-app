import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ScrollView, Modal, ActivityIndicator, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../constants/colors';
import { searchFoodNutrition, NutritionInfo } from '../services/geminiService';
import { useAppLanguage } from '../i18n/LanguageProvider';
import { mockRecipes } from '../data/mockData';

interface SearchScannerProps {
    visible: boolean;
    onClose: () => void;
}

const DEFAULT_PORTION_UNIT = 'khẩu phần';

const STORAGE_KEY_RECENT = '@nutritrack_recent_search';

export function SearchScanner({ visible, onClose }: SearchScannerProps) {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [recent, setRecent] = useState<NutritionInfo[]>([]);
    const [activeTab, setActiveTab] = useState<'recent' | 'popular' | 'myfoods'>('recent');

    // Load recent searches on mount
    React.useEffect(() => {
        const loadRecent = async () => {
            try {
                const stored = await AsyncStorage.getItem(STORAGE_KEY_RECENT);
                if (stored) {
                    setRecent(JSON.parse(stored));
                }
            } catch (err) {
                console.error('Failed to load recent searches', err);
            }
        };
        loadRecent();
    }, []);

    const updateRecent = useCallback(async (foodData: NutritionInfo) => {
        if (!foodData.name) return;
        
        setRecent(prev => {
            const updated = [foodData, ...prev.filter(r => r.name !== foodData.name)].slice(0, 10);
            AsyncStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(updated)).catch(e => 
                console.error('Failed to save recent search', e)
            );
            return updated;
        });
    }, []);

    const handleSearch = useCallback(async (foodName: string) => {
        if (!foodName.trim() || searching) return;

        setSearching(true);
        try {
            const result = await searchFoodNutrition(foodName.trim());

            if (result.success && result.data) {
                // Thêm vào lịch sử tìm kiếm (Dạng NutritionInfo)
                await updateRecent(result.data);

                onClose();
                router.push({
                    pathname: '/food-detail',
                    params: {
                        foodData: JSON.stringify(result.data),
                        source: 'search',
                    }
                });
            } else {
                Alert.alert(t('search.notFound.title'), result.error || t('search.error.notFound'));
            }
        } catch (error) {
            console.error('Search error:', error);
            Alert.alert(t('common.error'), t('search.error.searchFailed'));
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
        updateRecent(foodData); // Add to recent
        onClose();
        router.push({
            pathname: '/food-detail',
            params: {
                foodData: JSON.stringify(foodData),
                source: 'quick_add',
            },
        });
    }, [buildQuickFoodData, onClose, router, updateRecent]);

    const handleRecentClick = useCallback((foodData: NutritionInfo) => {
        updateRecent(foodData); // push to top
        onClose();
        router.push({
            pathname: '/food-detail',
            params: {
                foodData: JSON.stringify(foodData),
                source: 'recent',
            }
        });
    }, [onClose, router, updateRecent]);

    const renderRecentCard = (foodData: NutritionInfo) => (
        <View key={`recent-${foodData.name}`} style={searchStyles.foodCard}>
            <TouchableOpacity
                style={[searchStyles.foodMainInfo, { flex: 1 }]}
                activeOpacity={0.85}
                onPress={() => handleRecentClick(foodData)}
                disabled={searching}
            >
                <Text style={searchStyles.foodName}>{foodData.name}</Text>
                <Text style={searchStyles.foodKcal}>{foodData.calories} kcal • {foodData.servingSize}</Text>
                <Text style={searchStyles.foodMacro}>P: {foodData.protein}g • C: {foodData.carbs}g • F: {foodData.fat}g</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={searchStyles.addBtn}
                activeOpacity={0.8}
                onPress={() => {
                    updateRecent(foodData);
                    onClose();
                    router.push({
                        pathname: '/food-detail',
                        params: { foodData: JSON.stringify(foodData), source: 'quick_add' }
                    });
                }}
                disabled={searching}
            >
                <Text style={searchStyles.addBtnPlus}>+</Text>
            </TouchableOpacity>
        </View>
    );

    const renderFoodCard = (item: FoodTemplateItem) => (
        <View key={item.name} style={searchStyles.foodCard}>
            <TouchableOpacity
                style={[searchStyles.foodMainInfo, { flex: 1 }]}
                activeOpacity={0.85}
                onPress={() => handleSearch(item.name)}
                disabled={searching}
            >
                <Text style={searchStyles.foodName}>{item.name}</Text>
                <Text style={searchStyles.foodKcal}>{item.kcal} kcal • {item.serving}</Text>
                <Text style={searchStyles.foodMacro}>P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={searchStyles.addBtn}
                activeOpacity={0.8}
                onPress={() => handleQuickAdd(item)}
                disabled={searching}
            >
                <Text style={searchStyles.addBtnPlus}>+</Text>
            </TouchableOpacity>
        </View>
    );

    const mergedSuggestions: FoodTemplateItem[] = ALL_FOODS;
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
                    <Text style={searchStyles.headerTitle}>{t('search.title')}</Text>
                    <View style={searchStyles.headerSpacer} />
                </View>

                <View style={searchStyles.searchWrap}>
                    <Ionicons name="search-outline" size={18} color="#94A3B8" />
                    <TextInput
                        style={searchStyles.searchInput}
                        placeholder={t('search.placeholder')}
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
                            {searching ? t('search.analyzing') : t('search.findQuery', { query })}
                        </Text>
                    </TouchableOpacity>
                )}

                <View style={searchStyles.tabRow}>
                    <TouchableOpacity
                        style={[searchStyles.tabBtn, activeTab === 'recent' && searchStyles.tabBtnActive]}
                        onPress={() => setActiveTab('recent')}
                    >
                        <Text style={[searchStyles.tabText, activeTab === 'recent' && searchStyles.tabTextActive]}>{t('search.tab.recent')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[searchStyles.tabBtn, activeTab === 'popular' && searchStyles.tabBtnActive]}
                        onPress={() => setActiveTab('popular')}
                    >
                        <Text style={[searchStyles.tabText, activeTab === 'popular' && searchStyles.tabTextActive]}>{t('search.tab.popular')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[searchStyles.tabBtn, activeTab === 'myfoods' && searchStyles.tabBtnActive]}
                        onPress={() => setActiveTab('myfoods')}
                    >
                        <Text style={[searchStyles.tabText, activeTab === 'myfoods' && searchStyles.tabTextActive]}>{t('search.tab.myFoods')}</Text>
                    </TouchableOpacity>
                </View>

                {searching && (
                    <View style={searchStyles.loadingBox}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={searchStyles.loadingText}>{t('search.loading')}</Text>
                    </View>
                )}

                {!searching && (
                    <ScrollView style={searchStyles.listWrap} showsVerticalScrollIndicator={false}>
                        {query.length > 0 ? (
                            <>
                                <Text style={searchStyles.sectionTitle}>{t('search.results')}</Text>
                                {filteredSuggestions.length > 0 ? (
                                    filteredSuggestions.map(renderFoodCard)
                                ) : (
                                    <Text style={searchStyles.emptyText}>{t('search.noQuickResult')}</Text>
                                )}
                            </>
                        ) : (
                            <>
                                {activeTab === 'recent' && (
                                    <>
                                        <Text style={searchStyles.sectionTitle}>{t('search.tab.recent')}</Text>
                                        {recent.map((nutritionObj) => {
                                            // Render directly using our new component
                                            // The type is expected to be NutritionInfo now (after fix)
                                            // Handle migration for old string values just in case
                                            if (typeof nutritionObj === 'string') {
                                                const mapped = mergedSuggestions.find((x) => x.name === nutritionObj);
                                                const item = mapped || {
                                                    name: nutritionObj, emoji: '', kcal: 300, serving: `1 ${DEFAULT_PORTION_UNIT}`,
                                                    protein: 18, carbs: 38, fat: 10,
                                                };
                                                return renderFoodCard(item);
                                            }
                                            return renderRecentCard(nutritionObj);
                                        })}
                                    </>
                                )}

                                {activeTab === 'popular' && (
                                    <>
                                        <Text style={searchStyles.sectionTitle}>{t('search.tab.popular')}</Text>
                                        {POPULAR_FOODS.map(renderFoodCard)}
                                    </>
                                )}

                                {activeTab === 'myfoods' && (
                                    <>
                                        <Text style={searchStyles.sectionTitle}>{t('search.tab.myFoods')}</Text>
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

const parseProteinInGrams = (proteinLabel: string): number => {
    const parsed = parseInt(proteinLabel.replace(/[^\d]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
};

const mapRecipeToFoodTemplateItem = (recipe: typeof mockRecipes[number]): FoodTemplateItem => {
    const protein = parseProteinInGrams(recipe.protein);
    const fat = Math.max(Math.round((recipe.calories * 0.25) / 9), 1);
    const carbs = Math.max(Math.round((recipe.calories - protein * 4 - fat * 9) / 4), 0);

    return {
        name: recipe.name,
        emoji: '',
        kcal: recipe.calories,
        serving: `1 ${DEFAULT_PORTION_UNIT}`,
        protein,
        carbs,
        fat,
    };
};

const ALL_FOODS: FoodTemplateItem[] = mockRecipes.slice(0, 20).map(mapRecipeToFoodTemplateItem);
const POPULAR_FOODS: FoodTemplateItem[] = ALL_FOODS.slice(0, 10);
const MY_FOODS: FoodTemplateItem[] = ALL_FOODS.slice(10);

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
        alignItems: 'center', // căn giữa theo chiều dọc
        gap: 12,
        borderRadius: 12,
        padding: 12,
        marginBottom: 10,
        // No background, border, or shadow
    },
    foodThumb: {
        width: 64,
        height: 64,
        borderRadius: 10,
        // backgroundColor: '#F1F5F9', // Removed thumb background
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodEmoji: { fontSize: 30 },
    foodMainInfo: {
        flex: 1,
        alignItems: 'flex-start',
        justifyContent: 'center',
        display: 'flex',
    },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B9811A',
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
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
