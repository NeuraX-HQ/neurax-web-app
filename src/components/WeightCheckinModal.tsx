import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const ITEM_WIDTH = 12;
const MIN_VAL = 30;
const MAX_VAL = 200;

interface WeightCheckinModalProps {
    visible: boolean;
    currentWeight: number;
    lastWeight: number;
    lastUpdateDate: string; // e.g. "7 ngày trước"
    onSave: (newWeight: number) => void;
    onDismiss: () => void;
}

export default function WeightCheckinModal({
    visible,
    currentWeight,
    lastWeight,
    lastUpdateDate,
    onSave,
    onDismiss,
}: WeightCheckinModalProps) {
    const [weight, setWeight] = useState(currentWeight);
    const [rulerWidth, setRulerWidth] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    // Reset weight when modal opens
    useEffect(() => {
        if (visible) {
            setWeight(currentWeight);
        }
    }, [visible, currentWeight]);

    // Scroll to current weight when ruler is ready
    useEffect(() => {
        if (rulerWidth > 0 && visible) {
            const timer = setTimeout(() => {
                const initialX = (currentWeight - MIN_VAL) * ITEM_WIDTH;
                scrollViewRef.current?.scrollTo({ x: initialX, animated: false });
            }, 150);
            return () => clearTimeout(timer);
        }
    }, [rulerWidth, visible, currentWeight]);

    const centerX = rulerWidth / 2;

    const handleScroll = (e: any) => {
        const x = e.nativeEvent.contentOffset.x;
        const val = Math.round(MIN_VAL + x / ITEM_WIDTH);
        if (val >= MIN_VAL && val <= MAX_VAL) {
            setWeight(val);
        }
    };

    const selectValue = (val: number) => {
        const targetX = (val - MIN_VAL) * ITEM_WIDTH;
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
        setWeight(val);
    };

    const weightDiff = weight - lastWeight;
    const diffText = weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1);
    const diffColor = weightDiff < 0 ? Colors.success : weightDiff > 0 ? Colors.danger : Colors.textSecondary;

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    {/* Header Icon & Title */}
                    <View style={styles.headerIcon}>
                        <Ionicons name="scale-outline" size={28} color={Colors.blue} />
                    </View>
                    <Text style={styles.title}>Cân nặng hôm nay?</Text>

                    {/* Weight Display */}
                    <View style={styles.valueContainer}>
                        <Text style={styles.value}>{weight}</Text>
                        <Text style={styles.unit}>kg</Text>
                    </View>

                    {/* Ruler Picker (from step5) */}
                    <View
                        style={styles.rulerArea}
                        onLayout={(e) => setRulerWidth(e.nativeEvent.layout.width)}
                    >
                        <View style={styles.indicatorWrapper}>
                            <View style={styles.triangleDown} />
                        </View>

                        {rulerWidth > 0 && (
                            <ScrollView
                                ref={scrollViewRef}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={[
                                    styles.rulerContent,
                                    { paddingHorizontal: centerX - ITEM_WIDTH / 2 }
                                ]}
                                snapToInterval={ITEM_WIDTH}
                                decelerationRate="fast"
                                onScroll={handleScroll}
                                scrollEventThrottle={16}
                                style={styles.scrollView}
                            >
                                {Array.from({ length: MAX_VAL - MIN_VAL + 1 }, (_, i) => {
                                    const val = MIN_VAL + i;
                                    const isMain = val % 5 === 0;
                                    const isCurrent = val === weight;
                                    return (
                                        <TouchableOpacity
                                            key={val}
                                            onPress={() => selectValue(val)}
                                            activeOpacity={1}
                                            style={[styles.rulerItem, { width: ITEM_WIDTH }]}
                                        >
                                            <View style={[
                                                styles.rulerLine,
                                                isMain && styles.rulerLineMain,
                                                isCurrent && styles.rulerLineActive
                                            ]} />
                                            {isMain && (
                                                <Text style={[styles.rulerLabel, isCurrent && styles.labelActive]}>
                                                    {val}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}
                    </View>

                    {/* Last Update Info */}
                    <Text style={styles.lastUpdate}>
                        Lần cuối cập nhật: <Text style={styles.lastUpdateBold}>{lastWeight}kg</Text> ({lastUpdateDate})
                    </Text>

                    {/* Trend Mini */}
                    <View style={styles.trendBox}>
                        <View style={styles.trendHeader}>
                            <Text style={styles.trendLabel}>TREND ANALYSIS</Text>
                        </View>
                        <View style={styles.trendValueRow}>
                            <Ionicons
                                name={weightDiff < 0 ? "trending-down" : weightDiff > 0 ? "trending-up" : "remove"}
                                size={18}
                                color={diffColor}
                            />
                            <Text style={[styles.trendValue, { color: diffColor }]}>
                                {diffText} kg so với lần trước
                            </Text>
                        </View>
                    </View>

                    {/* Save Button */}
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={() => onSave(weight)}
                        activeOpacity={0.9}
                    >
                        <Text style={styles.primaryBtnText}>Lưu cân nặng</Text>
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
        padding: 28,
        alignItems: 'center',
    },
    headerIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(74, 144, 217, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 16,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        marginBottom: 4,
    },
    value: {
        fontSize: 48,
        fontWeight: '900',
        color: Colors.primary,
    },
    unit: {
        fontSize: 18,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginLeft: 4,
    },
    rulerArea: {
        height: 100,
        width: '100%',
        position: 'relative',
        marginTop: 8,
        marginBottom: 12,
    },
    indicatorWrapper: {
        position: 'absolute',
        top: -5,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 10,
    },
    triangleDown: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderBottomWidth: 0,
        borderTopWidth: 12,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderTopColor: Colors.primary,
    },
    scrollView: { flex: 1 },
    rulerContent: {
        paddingVertical: 20,
        alignItems: 'flex-start',
    },
    rulerItem: { alignItems: 'center', height: 60, overflow: 'visible' },
    rulerLine: { width: 1.5, height: 15, backgroundColor: '#E0E0E0', borderRadius: 1 },
    rulerLineMain: { height: 30, backgroundColor: '#999999', width: 2 },
    rulerLineActive: { height: 45, width: 3, backgroundColor: Colors.primary, borderRadius: 1.5 },
    rulerLabel: {
        fontSize: 11,
        color: '#999999',
        marginTop: 6,
        fontWeight: '600',
        width: 40,
        textAlign: 'center',
    },
    labelActive: {
        color: Colors.primary,
        fontWeight: '800',
        fontSize: 15,
        width: 40,
        textAlign: 'center',
    },
    lastUpdate: {
        fontSize: 11,
        color: Colors.textSecondary,
        letterSpacing: 0.3,
        marginBottom: 16,
    },
    lastUpdateBold: {
        fontWeight: '700',
        color: Colors.primary,
    },
    trendBox: {
        width: '100%',
        backgroundColor: 'rgba(27, 40, 56, 0.03)',
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },
    trendHeader: {
        marginBottom: 6,
    },
    trendLabel: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    trendValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trendValue: {
        fontSize: 14,
        fontWeight: '700',
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
