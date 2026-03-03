import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

export default function AddToFridgeScreen() {
    const router = useRouter();
    const [selectedDuration, setSelectedDuration] = useState('7');
    const [reminder, setReminder] = useState(true);
    const [isCustomModalVisible, setCustomModalVisible] = useState(false);
    const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
    const [customDays, setCustomDays] = useState(1);

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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Add to Fridge</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Food Card */}
                <View style={[styles.foodCard, Shadows.small]}>
                    <Text style={styles.foodEmoji}>🍜</Text>
                    <View style={styles.foodInfo}>
                        <Text style={styles.foodName}>Phở Bò</Text>
                        <Text style={styles.foodCalories}>450 kcal • 1 bowl</Text>
                    </View>
                    <TouchableOpacity>
                        <Text style={styles.editText}>✏️</Text>
                    </TouchableOpacity>
                </View>

                {/* Expiry Duration */}
                <Text style={styles.sectionTitle}>Expiry Date</Text>
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
                <View style={[styles.calendarCard, Shadows.small]}>
                    <View style={styles.calendarHeader}>
                        <Text style={styles.calendarMonth}>{monthNames[currentMonth]} {currentYear}</Text>
                        <View style={styles.calendarNav}>
                            <TouchableOpacity>
                                <Text style={styles.navArrow}>‹</Text>
                            </TouchableOpacity>
                            <TouchableOpacity>
                                <Text style={styles.navArrow}>›</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.calendarDays}>
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                            <Text key={d} style={styles.dayHeader}>{d}</Text>
                        ))}
                    </View>
                    <View style={styles.calendarGrid}>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const duration = selectedDuration === 'custom' ? customDays : parseInt(selectedDuration);
                            const today = currentDay;
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
                    <View>
                        <Text style={styles.reminderTitle}>🔔 Remind me before expiry</Text>
                        <Text style={styles.reminderDesc}>Get notified 1 day before</Text>
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
                        onPress={() => setSuccessModalVisible(true)}
                    >
                        <Text style={styles.addBtnText}>Thêm</Text>
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
    backArrow: { fontSize: 24, color: Colors.primary },
    title: { fontSize: 20, fontWeight: '700', color: Colors.primary },
    foodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 14,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    foodEmoji: { fontSize: 40 },
    foodInfo: { flex: 1 },
    foodName: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    foodCalories: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
    editText: { fontSize: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, paddingHorizontal: 20, marginBottom: 12 },
    durationRow: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        gap: 10,
        marginBottom: 20,
    },
    durationChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 24,
        backgroundColor: '#F5F6F8',
    },
    durationChipSelected: { backgroundColor: Colors.primary },
    durationText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
    durationTextSelected: { color: '#FFFFFF' },
    calendarCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    calendarMonth: { fontSize: 17, fontWeight: '700', color: Colors.primary },
    calendarNav: { flexDirection: 'row', gap: 16 },
    navArrow: { fontSize: 24, color: Colors.textSecondary },
    calendarDays: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
    dayHeader: { fontSize: 13, color: '#9DAABF', fontWeight: '600', width: 44, textAlign: 'center' },
    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
    calDay: {
        width: '14.28%',
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    calDayInner: {
        width: '100%',
        height: 25, // Điều chỉnh lên 25px theo yêu cầu
        justifyContent: 'center',
        alignItems: 'center',
    },
    calDayInRange: {
        backgroundColor: '#000000',
    },
    calDayRangeStart: {
        borderTopLeftRadius: 12.5,
        borderBottomLeftRadius: 12.5,
    },
    calDayRangeEnd: {
        borderTopRightRadius: 12.5,
        borderBottomRightRadius: 12.5,
    },
    calDayText: { fontSize: 15, color: '#3A4B6A', fontWeight: '600' },
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        marginHorizontal: 20,
    },
    reminderTitle: { fontSize: 16, fontWeight: '600', color: Colors.text },
    reminderDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
    footer: { paddingHorizontal: 20, paddingBottom: 32, marginTop: 10 },
    addBtn: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
    addBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
    scrollContainer: { flex: 1 },
    scrollContent: { paddingBottom: 20 },
});
