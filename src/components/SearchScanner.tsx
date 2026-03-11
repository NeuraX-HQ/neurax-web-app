import React, { useState, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ScrollView, Modal, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../constants/colors';
import { searchFoodNutrition } from '../services/geminiService';

interface SearchScannerProps {
    visible: boolean;
    onClose: () => void;
}

export function SearchScanner({ visible, onClose }: SearchScannerProps) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [recent, setRecent] = useState<string[]>(['Phở Bò', 'Cơm Tấm', 'Ức Gà Nướng']);

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

    return (
        <Modal visible={visible} animationType="slide">
            <SafeAreaView style={searchStyles.container}>
                <View style={searchStyles.header}>
                    <TouchableOpacity onPress={onClose} style={searchStyles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={searchStyles.title}>Tìm kiếm món ăn</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={searchStyles.searchBar}>
                    <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
                    <TextInput
                        style={searchStyles.searchInput}
                        placeholder="Nhập tên món ăn (VD: Phở bò, Pizza...)"
                        placeholderTextColor="#A0AEC0"
                        value={query}
                        onChangeText={setQuery}
                        onSubmitEditing={() => handleSearch(query)}
                        returnKeyType="search"
                        autoFocus
                        editable={!searching}
                    />
                    {query.length > 0 && !searching && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#A0AEC0" />
                        </TouchableOpacity>
                    )}
                    {searching && (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    )}
                </View>

                {/* Nút tìm kiếm */}
                {query.length > 0 && (
                    <TouchableOpacity
                        style={[searchStyles.searchButton, searching && searchStyles.searchButtonDisabled]}
                        onPress={() => handleSearch(query)}
                        disabled={searching}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="sparkles" size={18} color="#FFF" />
                        <Text style={searchStyles.searchButtonText}>
                            {searching ? 'Đang phân tích với AI...' : `Tìm kiếm "${query}"`}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Loading state */}
                {searching && (
                    <View style={searchStyles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={searchStyles.loadingText}>AI đang phân tích thành phần dinh dưỡng...</Text>
                        <Text style={searchStyles.loadingSubtext}>Đối chiếu với cơ sở dữ liệu thực phẩm</Text>
                    </View>
                )}

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Lịch sử tìm kiếm */}
                    {query.length === 0 && !searching && (
                        <View style={searchStyles.section}>
                            <Text style={searchStyles.sectionTitle}>Tìm kiếm gần đây</Text>
                            <View style={searchStyles.recentRow}>
                                {recent.map(r => (
                                    <TouchableOpacity
                                        key={r}
                                        style={searchStyles.recentChip}
                                        onPress={() => {
                                            setQuery(r);
                                            handleSearch(r);
                                        }}
                                    >
                                        <Ionicons name="time-outline" size={13} color="#7F8C9B" />
                                        <Text style={searchStyles.recentText}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Gợi ý phổ biến */}
                    {query.length === 0 && !searching && (
                        <View style={searchStyles.section}>
                            <Text style={searchStyles.sectionTitle}>Gợi ý phổ biến</Text>
                            {POPULAR_FOODS.map(item => (
                                <TouchableOpacity
                                    key={item.name}
                                    style={searchStyles.foodItem}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        setQuery(item.name);
                                        handleSearch(item.name);
                                    }}
                                >
                                    <View style={searchStyles.foodEmojiBg}>
                                        <Text style={searchStyles.foodEmoji}>{item.emoji}</Text>
                                    </View>
                                    <View style={searchStyles.foodInfo}>
                                        <Text style={searchStyles.foodName}>{item.name}</Text>
                                        <Text style={searchStyles.foodMeta}>{item.category}</Text>
                                    </View>
                                    <View style={searchStyles.searchIconBtn}>
                                        <Ionicons name="search" size={16} color={Colors.primary} />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Hướng dẫn */}
                    {query.length === 0 && !searching && (
                        <View style={searchStyles.tipSection}>
                            <Ionicons name="bulb-outline" size={20} color="#FFB84D" />
                            <Text style={searchStyles.tipText}>
                                Nhập tên món ăn bất kỳ, AI sẽ phân tích thành phần và đối chiếu dinh dưỡng chính xác từ cơ sở dữ liệu.
                            </Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const POPULAR_FOODS = [
    { name: 'Phở Bò', emoji: '🍜', category: 'Món Việt' },
    { name: 'Cơm Tấm Sườn', emoji: '🍚', category: 'Món Việt' },
    { name: 'Bánh Mì Thịt', emoji: '🥖', category: 'Món Việt' },
    { name: 'Bún Bò Huế', emoji: '🍲', category: 'Món Việt' },
    { name: 'Pizza', emoji: '🍕', category: 'Món Quốc Tế' },
    { name: 'Hamburger', emoji: '🍔', category: 'Món Quốc Tế' },
    { name: 'Sushi', emoji: '🍣', category: 'Món Quốc Tế' },
    { name: 'Salad Caesar', emoji: '🥗', category: 'Món Quốc Tế' },
];

const searchStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F5', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 8, marginBottom: 12,
        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
        ...Shadows.small,
    },
    searchInput: { flex: 1, fontSize: 15, color: Colors.text, padding: 0 },
    searchButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: Colors.primary, marginHorizontal: 20, marginBottom: 16,
        borderRadius: 14, paddingVertical: 14,
    },
    searchButtonDisabled: { opacity: 0.6 },
    searchButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    loadingContainer: {
        alignItems: 'center', paddingVertical: 40, gap: 12,
    },
    loadingText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
    loadingSubtext: { fontSize: 13, color: '#7F8C9B' },
    section: { paddingHorizontal: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: '#7F8C9B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
    recentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    recentChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#E8E8E8' },
    recentText: { fontSize: 13, color: Colors.text, fontWeight: '500' },
    foodItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 10, gap: 12, ...Shadows.small },
    foodEmojiBg: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#F5F6F8', justifyContent: 'center', alignItems: 'center' },
    foodEmoji: { fontSize: 28 },
    foodInfo: { flex: 1 },
    foodName: { fontSize: 15, fontWeight: '700', color: Colors.primary, marginBottom: 3 },
    foodMeta: { fontSize: 12, color: '#7F8C9B' },
    searchIconBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center' },
    tipSection: {
        flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 8, marginBottom: 20,
        backgroundColor: '#FFF9E6', borderRadius: 14, padding: 16, alignItems: 'flex-start',
    },
    tipText: { flex: 1, fontSize: 13, color: '#7F6E30', lineHeight: 18 },
});
