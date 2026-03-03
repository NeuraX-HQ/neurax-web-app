import React, { useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, ScrollView, Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/colors';

const FOOD_DATABASE = [
    { id: '1', name: 'Phở Bò', calories: 450, protein: 28, carbs: 52, fat: 12, emoji: '🍜', category: 'Món Việt' },
    { id: '2', name: 'Cơm Tấm Sườn', calories: 620, protein: 35, carbs: 70, fat: 18, emoji: '🍚', category: 'Món Việt' },
    { id: '3', name: 'Bánh Mì Thịt', calories: 380, protein: 18, carbs: 45, fat: 14, emoji: '🥖', category: 'Món Việt' },
    { id: '4', name: 'Bún Bò Huế', calories: 520, protein: 30, carbs: 58, fat: 16, emoji: '🍲', category: 'Món Việt' },
    { id: '5', name: 'Chicken Rice Bowl', calories: 550, protein: 38, carbs: 55, fat: 14, emoji: '🍗', category: 'Món Châu Á' },
];

interface SearchScannerProps {
    visible: boolean;
    onClose: () => void;
}

export function SearchScanner({ visible, onClose }: SearchScannerProps) {
    const [query, setQuery] = useState('');
    const [recent] = useState(['Phở Bò', 'Cơm Tấm', 'Ức Gà Nướng']);

    const results = query.length > 0
        ? FOOD_DATABASE.filter(f =>
            f.name.toLowerCase().includes(query.toLowerCase()) ||
            f.category.toLowerCase().includes(query.toLowerCase())
        )
        : FOOD_DATABASE;

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
                        placeholder="Tìm món ăn hoặc nguyên liệu..."
                        placeholderTextColor="#A0AEC0"
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')}>
                            <Ionicons name="close-circle" size={18} color="#A0AEC0" />
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {query.length === 0 && (
                        <View style={searchStyles.section}>
                            <Text style={searchStyles.sectionTitle}>Tìm kiếm gần đây</Text>
                            <View style={searchStyles.recentRow}>
                                {recent.map(r => (
                                    <TouchableOpacity key={r} style={searchStyles.recentChip} onPress={() => setQuery(r)}>
                                        <Ionicons name="time-outline" size={13} color="#7F8C9B" />
                                        <Text style={searchStyles.recentText}>{r}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    <View style={searchStyles.section}>
                        <Text style={searchStyles.sectionTitle}>
                            {query.length > 0 ? `Kết quả cho "${query}"` : 'Thực phẩm phổ biến'}
                        </Text>
                        {results.map(item => (
                            <TouchableOpacity key={item.id} style={searchStyles.foodItem} activeOpacity={0.7}>
                                <View style={searchStyles.foodEmojiBg}>
                                    <Text style={searchStyles.foodEmoji}>{item.emoji}</Text>
                                </View>
                                <View style={searchStyles.foodInfo}>
                                    <Text style={searchStyles.foodName}>{item.name}</Text>
                                    <Text style={searchStyles.foodMeta}>
                                        {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                                    </Text>
                                </View>
                                <View style={searchStyles.addBtn}>
                                    <Ionicons name="add" size={20} color="#FFF" />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const searchStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0F0F5', justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    searchBar: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: '#FFF', marginHorizontal: 20, marginTop: 8, marginBottom: 16,
        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
        ...Shadows.small,
    },
    searchInput: { flex: 1, fontSize: 15, color: Colors.text, padding: 0 },
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
    foodMeta: { fontSize: 12, color: '#7F8C9B', marginBottom: 5 },
    addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
});
