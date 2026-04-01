import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface AiAdjustmentModalProps {
    visible: boolean;
    oldCalories: number;
    newCalories: number;
    onAccept: () => void;
    onDismiss: () => void;
}

export default function AiAdjustmentModal({
    visible,
    oldCalories,
    newCalories,
    onAccept,
    onDismiss,
}: AiAdjustmentModalProps) {
    const isDecrease = newCalories < oldCalories;

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Header Icon */}
                    <View style={styles.iconContainer}>
                        <Ionicons name="sparkles" size={32} color={Colors.primary} />
                    </View>

                    {/* Title & Description */}
                    <Text style={styles.title}>Lộ trình đã được tối ưu</Text>
                    <Text style={styles.description}>
                        AI Bảo đã điều chỉnh mục tiêu Calo dựa trên cân nặng mới để đảm bảo bạn vẫn đạt mục tiêu an toàn.
                    </Text>

                    {/* Comparison Card */}
                    <View style={styles.comparisonCard}>
                        <View style={styles.comparisonSide}>
                            <Text style={styles.comparisonLabel}>CŨ</Text>
                            <Text style={styles.comparisonValueOld}>
                                {oldCalories} <Text style={styles.comparisonUnit}>kcal</Text>
                            </Text>
                        </View>

                        <View style={styles.arrowCircle}>
                            <Ionicons
                                name={isDecrease ? "trending-down" : "trending-up"}
                                size={20}
                                color="#FFFFFF"
                            />
                        </View>

                        <View style={styles.comparisonSide}>
                            <Text style={[styles.comparisonLabel, { color: Colors.primary }]}>MỚI</Text>
                            <Text style={styles.comparisonValueNew}>
                                {newCalories} <Text style={[styles.comparisonUnit, { fontWeight: '700' }]}>kcal</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Scientific Note */}
                    <View style={styles.noteBox}>
                        <Ionicons name="shield-checkmark" size={14} color={Colors.primary} style={{ marginTop: 1 }} />
                        <View style={styles.noteContent}>
                            <Text style={styles.noteTitle}>SCIENTIFIC ADJUSTMENT</Text>
                            <Text style={styles.noteText}>
                                Điều chỉnh này dựa trên TDEE mới của bạn sau khi thay đổi cân nặng.
                            </Text>
                        </View>
                    </View>

                    {/* Buttons */}
                    <TouchableOpacity style={styles.primaryBtn} onPress={onAccept} activeOpacity={0.9}>
                        <Text style={styles.primaryBtnText}>Đồng ý & Tiếp tục</Text>
                        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryBtn} onPress={onDismiss}>
                        <Text style={styles.secondaryBtnText}>Xem chi tiết phân tích</Text>
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
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: 'rgba(27, 40, 56, 0.06)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    comparisonCard: {
        width: '100%',
        backgroundColor: '#F5F6F8',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    comparisonSide: {
        flex: 1,
        alignItems: 'center',
    },
    comparisonLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textSecondary,
        letterSpacing: 1,
        marginBottom: 4,
    },
    comparisonValueOld: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    comparisonValueNew: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.primary,
    },
    comparisonUnit: {
        fontSize: 12,
        fontWeight: '400',
    },
    arrowCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    noteBox: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: 'rgba(27, 40, 56, 0.03)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: 'rgba(27, 40, 56, 0.04)',
        marginBottom: 24,
    },
    noteContent: {
        flex: 1,
    },
    noteTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    noteText: {
        fontSize: 12,
        color: Colors.textSecondary,
        lineHeight: 17,
    },
    primaryBtn: {
        width: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
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
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
});
