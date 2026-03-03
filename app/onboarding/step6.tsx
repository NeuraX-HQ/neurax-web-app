import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { saveOnboardingData, getOnboardingData } from '../../src/store/userStore';
import { Ionicons } from '@expo/vector-icons';

const ITEM_WIDTH = 12;

export default function Step6() {
    const router = useRouter();
    const [weight, setWeight] = useState(55);
    const [minVal, setMinVal] = useState(30);
    const [maxVal, setMaxVal] = useState(200);
    const [rulerWidth, setRulerWidth] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);

    // Điểm trung tâm thực tế của vùng chứa thước
    const centerX = rulerWidth / 2;

    useEffect(() => {
        const init = async () => {
            const data = await getOnboardingData();
            const current = data.currentWeight || 65;
            const goalType = data.goal;

            let min = 30;
            let max = 200;
            let recommended = 55;

            if (goalType === 'lose') {
                max = current - 1;
                recommended = current - 5;
                if (recommended < 30) recommended = 30;
            } else if (goalType === 'gain') {
                min = current + 1;
                recommended = current + 5;
                if (recommended > 200) recommended = 200;
            }

            setMinVal(min);
            setMaxVal(max);
            setWeight(recommended);

            // Chờ rulerWidth được set và ScrollView sẵn sàng
            if (rulerWidth > 0) {
                const targetX = (recommended - min) * ITEM_WIDTH;
                scrollViewRef.current?.scrollTo({ x: targetX, animated: false });
            }
        };
        init();
    }, [rulerWidth]);

    const handleNext = async () => {
        await saveOnboardingData({ targetWeight: weight });
        router.push('/onboarding/weight-speed');
    };

    const handleScroll = (e: any) => {
        const x = e.nativeEvent.contentOffset.x;
        const val = Math.round(minVal + x / ITEM_WIDTH);
        if (val >= minVal && val <= maxVal) {
            setWeight(val);
        }
    };

    const selectValue = (val: number) => {
        const targetX = (val - minVal) * ITEM_WIDTH;
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
        setWeight(val);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <View key={i} style={[styles.stepDot, i === 5 && styles.stepDotActive]} />
                    ))}
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Ionicons name="trophy-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>Cân nặng mục tiêu</Text>
                </View>
                <Text style={styles.subtitle}>Mục tiêu cân nặng lý tưởng mà bạn muốn hướng tới.</Text>

                <View style={styles.valueContainer}>
                    <Text style={styles.value}>{weight}</Text>
                    <Text style={styles.unit}> kg</Text>
                </View>

                <View
                    style={styles.rulerArea}
                    onLayout={(e) => setRulerWidth(e.nativeEvent.layout.width)}
                >
                    <View style={styles.indicatorWrapper}>
                        <View style={styles.triangleDown} />
                    </View>

                    {rulerWidth > 0 && maxVal > minVal && (
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
                            {Array.from({ length: maxVal - minVal + 1 }, (_, i) => {
                                const val = minVal + i;
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
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Tiếp tục  →</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6F8',
    },
    stepIndicator: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 },
    stepDot: { width: 12, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 },
    stepDotActive: { backgroundColor: Colors.primary, width: 20 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    titleIcon: { marginRight: 10 },
    title: { fontSize: 22, fontWeight: '800', color: Colors.primary },
    subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 32 },
    valueContainer: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginBottom: 20 },
    value: { fontSize: 54, fontWeight: '900', color: Colors.primary },
    unit: { fontSize: 20, color: Colors.textSecondary, fontWeight: '600' },
    rulerArea: { height: 120, position: 'relative', marginTop: 30 },
    indicatorWrapper: { position: 'absolute', top: -5, left: 0, right: 0, alignItems: 'center', zIndex: 10 },
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
        paddingVertical: 25,
        alignItems: 'flex-start'
    },
    rulerItem: { alignItems: 'center', height: 60 },
    rulerLine: { width: 1.5, height: 15, backgroundColor: '#E0E0E0', borderRadius: 1 },
    rulerLineMain: { height: 30, backgroundColor: '#999999', width: 2 },
    rulerLineActive: { height: 45, width: 3, backgroundColor: Colors.primary, borderRadius: 1.5 },
    rulerLabel: {
        fontSize: 13,
        color: '#999999',
        marginTop: 8,
        fontWeight: '600',
        width: 40,
        textAlign: 'center'
    },
    labelActive: { color: Colors.primary, fontWeight: '800', fontSize: 15, width: 40, textAlign: 'center' },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    button: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
