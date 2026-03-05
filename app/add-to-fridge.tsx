import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { NutritionInfo } from '../src/services/geminiService';
import { useFridgeStore } from '../src/store/fridgeStore';

export default function AddToFridgeScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const addItem = useFridgeStore(state => state.addItem);

    const [selectedDuration, setSelectedDuration] = useState('7');
    const [reminder, setReminder] = useState(true);
    const [isCustomModalVisible, setCustomModalVisible] = useState(false);
    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
    const [customDays, setCustomDays] = useState(1);

    const foodData: NutritionInfo | null = params.foodData
        ? JSON.parse(params.foodData as string)
        : null;

    const getEmojiForFood = (name: string): string => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('phở')) return '🍜';
        if (lowerName.includes('cơm')) return '🍚';
        if (lowerName.includes('bánh mì')) return '🥖';
        if (lowerName.includes('bún')) return '🍲';
        if (lowerName.includes('gà') || lowerName.includes('chicken')) return '🍗';
        if (lowerName.includes('salad')) return '🥗';
        if (lowerName.includes('burger')) return '🍔';
        if (lowerName.includes('pizza')) return '🍕';
        return '🍽️';
    };

    // Lấy thông tin ngày hiện tại
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

    const durations = [
        { id: '1', label: '1 ngày' },
        { id: '3', label: '3 ngày' },
        { id: '7', label: '7 ngày' },
        { id: 'custom', label: 'Tùy chọn' },
    ];

    const handleDurationSelect = (id: string) => {
        if (id === 'custom') {
            setCustomModalVisible(true);
        } else {
            setSelectedDuration(id);
        }
    };

    const handleConfirmAdd = async () => {
        if (!foodData) return;

        const days = selectedDuration === 'custom' ? customDays : parseInt(selectedDuration);
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);

        try {
            await addItem({
                name: foodData.name,
                amount: foodData.servingSize || '1 phần',
                location: 'Ngăn mát', // Default location
                daysLeft: days,
                expiryDate: expiryDate.toISOString(),
                emoji: getEmojiForFood(foodData.name),
            });
            setSuccessModalVisible(true);
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thêm vào tủ lạnh');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.title}>Thêm vào tủ lạnh</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Food Card */}
                <View style={styles.foodCard}>
                    <View style={styles.foodImageContainer}>
                        <Text style={styles.foodEmoji}>{foodData ? getEmojiForFood(foodData.name) : '🍜'}</Text>
                    </View>
                    <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>{foodData ? foodData.name : 'Phở Bò'}</Text>
                        <Text style={styles.foodCalories}>
                            {foodData ? `${Math.round(foodData.calories)} kcal • 1 phần` : '450 kcal • 1 tô'}
                        </Text>
                    </View>
                </View>

                {/* Expiry Duration Header */}
                <View style={styles.expiryHeader}>
                    <Text style={styles.sectionTitle}>HẠN SỬ DỤNG</Text>
                    <Text style={styles.expiryMonthText}>{monthNames[currentMonth]}, {currentYear}</Text>
                </View>
                <View style={styles.durationRow}>
                    {durations.map((d) => (
                        <TouchableOpacity
                            key={d.id}
                            style={[styles.durationChip, selectedDuration === d.id && styles.durationChipSelected]}
                            onPress={() => handleDurationSelect(d.id)}
                        >
                            <Text style={[styles.durationText, selectedDuration === d.id && styles.durationTextSelected]}>
                                {d.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Calendar Placeholder */}
                <View style={styles.calendarCard}>
                    <View style={styles.calendarDays}>
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                            <Text key={d} style={styles.dayHeader}>{d}</Text>
                        ))}
                    </View>
                    <View style={styles.calendarGrid}>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const duration = selectedDuration === 'custom' ? customDays : parseInt(selectedDuration);
                            const today = now.getDate();
                            const isInRange = day >= today && day < today + duration;
                            const isStart = day === today;
                            const isEnd = day === today + duration - 1;

                            return (
                                <TouchableOpacity
                                    key={i}
                                    style={styles.calDay}
                                    activeOpacity={0.8}
                                >
                                    <View style={[
                                        styles.calDayInner,
                                        isInRange && styles.calDayInRange,
                                        isInRange && isStart && styles.calDayRangeStart,
                                        isInRange && isEnd && styles.calDayRangeEnd,
                                    ]}>
                                        <Text style={[styles.calDayText, isInRange && styles.calDayTextSelected]}>
                                            {day}
                                        </Text>
                                    </View>
                                    {day === 10 && !isInRange && <View style={styles.todayDot} />}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Reminder Toggle */}
                <View style={styles.reminderRow}>
                    <View style={styles.reminderInfo}>
                        <View style={styles.reminderIconCircle}>
                            <Ionicons name="notifications-outline" size={20} color="#6B7280" />
                        </View>
                        <View>
                            <Text style={styles.reminderTitle}>Thông báo nhắc nhở</Text>
                            <Text style={styles.reminderDesc}>Nhắc trước khi hết hạn 1 ngày</Text>
                        </View>
                    </View>
                    <Switch
                        value={reminder}
                        onValueChange={setReminder}
                        trackColor={{ false: '#E0E0E0', true: Colors.accent }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                {/* Add Button moved inside ScrollView */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.addBtn}
                        onPress={handleConfirmAdd}
                    >
                        <Ionicons name="cube-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.addBtnText}>Xác nhận thêm</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Custom Modal */}
            <Modal
                transparent={true}
                visible={isCustomModalVisible}
                animationType="fade"
                onRequestClose={() => setCustomModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Tùy chỉnh ngày hết hạn</Text>
                        <View style={styles.counterRow}>
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => setCustomDays(prev => Math.max(1, prev - 1))}
                            >
                                <Text style={styles.counterBtnText}>−</Text>
                            </TouchableOpacity>
                            <View style={styles.countDisplay}>
                                <Text style={styles.countText}>{customDays}</Text>
                                <Text style={styles.countSubText}>ngày</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.counterBtn}
                                onPress={() => setCustomDays(prev => prev + 1)}
                            >
                                <Text style={styles.counterBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.modalConfirmBtn}
                            onPress={() => {
                                setSelectedDuration('custom');
                                setCustomModalVisible(false);
                            }}
                        >
                            <Text style={styles.modalConfirmText}>Xác nhận</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Success Modal */}
            <Modal
                transparent={true}
                visible={isSuccessModalVisible}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.successIconCircle}>
                            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={styles.successTitle}>Thành công!</Text>
                        <Text style={styles.successDesc}>
                            Món ăn của bạn đã được thêm vào tủ lạnh và sẵn sàng để theo dõi.
                        </Text>
                        <TouchableOpacity
                            style={styles.modalConfirmBtn}
                            onPress={() => router.replace('/(tabs)/home')}
                        >
                            <Text style={styles.modalConfirmText}>Về trang chủ</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginLeft: -8, },
    title: { fontSize: 18, fontWeight: '700', color: '#111827' },
    foodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 24,
        gap: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    foodImageContainer: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodEmoji: { fontSize: 32 },
    foodInfo: { flex: 1 },
    foodName: { fontSize: 18, fontWeight: '700', color: '#111827' },
    foodCalories: { fontSize: 14, color: '#6B7280', marginTop: 4, fontWeight: '500' },
    expiryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
    expiryMonthText: { fontSize: 14, fontWeight: '600', color: '#2563EB' },
    durationRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 24,
    },
    durationChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
    },
    durationChipSelected: { backgroundColor: '#000000', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
    durationText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
    durationTextSelected: { color: '#FFFFFF', fontWeight: '600' },
    calendarCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    calendarDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
    dayHeader: { fontSize: 12, color: '#9CA3AF', fontWeight: '500', width: 44, textAlign: 'center' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    calDay: {
        width: '14.28%',
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calDayInner: {
        width: '100%',
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calDayInRange: {
        backgroundColor: '#000000',
    },
    calDayRangeStart: {
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
    },
    calDayRangeEnd: {
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
    },
    calDayText: { fontSize: 14, color: '#374151', fontWeight: '500' },
    calDayTextSelected: { color: '#FFFFFF', fontWeight: '700' },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#C7C7CD',
        position: 'absolute',
        bottom: 4,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        ...Shadows.medium,
    },
    modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary, marginBottom: 24 },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
        marginBottom: 32,
    },
    counterBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F5F6F8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterBtnText: { fontSize: 24, color: Colors.primary, fontWeight: '500' },
    countDisplay: { alignItems: 'center', minWidth: 60 },
    countText: { fontSize: 32, fontWeight: '800', color: Colors.primary },
    countSubText: { fontSize: 14, color: Colors.textSecondary, marginTop: -4 },
    modalConfirmBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 48,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    modalConfirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    // Success Modal specific styles
    successIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#4CD964',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 12,
    },
    successDesc: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 30,
        paddingHorizontal: 10,
    },
    reminderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        marginBottom: 24,
    },
    reminderInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    reminderIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },
    reminderTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    reminderDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingVertical: 16, paddingBottom: 32, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6', shadowColor: '#000', shadowOffset: { width: 0, height: -10 }, shadowOpacity: 0.05, shadowRadius: 40, elevation: 10 },
    addBtn: { backgroundColor: '#000000', borderRadius: 16, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#E5E7EB', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 1, shadowRadius: 15, elevation: 10 },
    addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
    scrollContainer: { flex: 1 },
    scrollContent: { paddingBottom: 100, paddingHorizontal: 20 },
});
