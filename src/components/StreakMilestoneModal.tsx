import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface StreakMilestoneModalProps {
    visible: boolean;
    streak: number;
    userName: string;
    onUpdateWeight: () => void;
    onDismiss: () => void;
}

export default function StreakMilestoneModal({
    visible,
    streak,
    userName,
    onUpdateWeight,
    onDismiss,
}: StreakMilestoneModalProps) {
    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Close Button */}
                    <TouchableOpacity style={styles.closeBtn} onPress={onDismiss}>
                        <Ionicons name="close" size={22} color={Colors.textSecondary} />
                    </TouchableOpacity>

                    {/* Flame Icon */}
                    <View style={styles.iconContainer}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="flame" size={48} color={Colors.streak} />
                            <View style={styles.streakBadge}>
                                <Text style={styles.streakBadgeText}>{streak} DAYS</Text>
                            </View>
                        </View>
                    </View>

                    {/* Text Content */}
                    <Text style={styles.title}>Tuyệt vời, {userName}!</Text>
                    <Text style={styles.description}>
                        Bạn đã duy trì kỷ luật ăn uống trong {streak} ngày liên tiếp. Cơ thể bạn đang bắt đầu thay đổi tích cực!
                    </Text>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>CONSISTENCY</Text>
                            <Text style={styles.statValue}>100%</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statLabel}>HEALTH SCORE</Text>
                            <Text style={styles.statValue}>+12pt</Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity style={styles.primaryBtn} onPress={onUpdateWeight} activeOpacity={0.9}>
                        <Text style={styles.primaryBtnText}>Cập nhật cân nặng ngay</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
                        <Text style={styles.secondaryBtnText}>Để sau</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(27, 40, 56, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        opacity: 0.4,
    },
    iconContainer: {
        position: 'relative',
        marginBottom: 24,
        alignItems: 'center',
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.streak,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 53, 0.1)',
    },
    streakBadge: {
        position: 'absolute',
        bottom: -6,
        right: -4,
        backgroundColor: Colors.primary,
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    streakBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(27, 40, 56, 0.04)',
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(27, 40, 56, 0.06)',
    },
    statLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    primaryBtn: {
        width: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    primaryBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryBtn: {
        paddingVertical: 8,
    },
    secondaryBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
});
