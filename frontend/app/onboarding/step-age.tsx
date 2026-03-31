import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { saveOnboardingData } from '../../src/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

const { width, height: screenHeight } = Dimensions.get('window');
const RULER_HEIGHT = 280;
const ITEM_HEIGHT = 10;
const CENTER_Y = RULER_HEIGHT / 2;
const MIN_VAL = 10;
const MAX_VAL = 100;

export default function StepAge() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const insets = useSafeAreaInsets();
    const [age, setAge] = useState(25);
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            const initialY = (MAX_VAL - 25) * ITEM_HEIGHT;
            scrollViewRef.current?.scrollTo({ y: initialY, animated: false });
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleNext = async () => {
        await saveOnboardingData({ age });
        router.push('/onboarding/step3');
    };

    const handleScroll = (e: any) => {
        const y = e.nativeEvent.contentOffset.y;
        const val = Math.round(MAX_VAL - y / ITEM_HEIGHT);
        if (val >= MIN_VAL && val <= MAX_VAL) {
            setAge(val);
        }
    };

    const selectValue = (val: number) => {
        const targetY = (MAX_VAL - val) * ITEM_HEIGHT;
        scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
        setAge(val);
    };

    return (
        <View style={[styles.container, { paddingTop: Math.max(insets.top, 32) }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    {/* Render 9 dots. Wait step2 is index 1. This is step 2.5, so index 1 is active, moving towards 2 */}
                    {Array.from({ length: 9 }).map((_, i) => (
                        <View key={i} style={[styles.stepDot, i === 1 && styles.stepDotActive]} />
                    ))}
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Ionicons name="calendar-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>{t('onboarding.stepAge.title')}</Text>
                </View>
                <Text style={styles.subtitle}>{t('onboarding.stepAge.subtitle')}</Text>

                <View style={styles.pickerArea}>
                    <View style={styles.valueDisplay}>
                        <Text style={styles.value}>{age}</Text>
                        <Text style={styles.unit}></Text>
                    </View>

                    <View style={styles.rulerOuterContainer}>
                        <View style={styles.indicatorContainer}>
                            <View style={styles.triangle} />
                        </View>

                        <ScrollView
                            ref={scrollViewRef}
                            style={styles.rulerScroll}
                            contentContainerStyle={styles.rulerContent}
                            showsVerticalScrollIndicator={false}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                        >
                            {Array.from({ length: MAX_VAL - MIN_VAL + 1 }, (_, i) => {
                                const val = MAX_VAL - i;
                                const isMain = val % 10 === 0;
                                const isHalf = val % 5 === 0;
                                const isCurrent = val === age;
                                return (
                                    <TouchableOpacity
                                        key={val}
                                        activeOpacity={1}
                                        onPress={() => selectValue(val)}
                                        style={[styles.rulerRow, { height: ITEM_HEIGHT }]}
                                    >
                                        <View style={[
                                            styles.rulerLine,
                                            isMain && styles.rulerLineMain,
                                            isHalf && !isMain && styles.rulerLineHalf,
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
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
                </TouchableOpacity>
            </View>
        </View>
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
    subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 24 },
    pickerArea: { flex: 1, flexDirection: 'row', alignItems: 'center', marginTop: -40 },
    valueDisplay: { flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', paddingRight: 40 },
    value: { fontSize: 54, fontWeight: '900', color: Colors.primary },
    unit: { fontSize: 18, color: Colors.textSecondary, fontWeight: '600' },
    rulerOuterContainer: { width: 100, height: RULER_HEIGHT, position: 'relative', overflow: 'hidden' },
    indicatorContainer: {
        position: 'absolute',
        left: 0,
        top: CENTER_Y - 10,
        zIndex: 100,
        pointerEvents: 'none',
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 12,
        borderRightWidth: 0,
        borderBottomWidth: 10,
        borderTopWidth: 10,
        borderLeftColor: Colors.primary,
        borderRightColor: 'transparent',
        borderBottomColor: 'transparent',
        borderTopColor: 'transparent',
    },
    rulerScroll: { flex: 1, zIndex: 5, overflow: 'visible' },
    rulerContent: {
        paddingVertical: CENTER_Y - ITEM_HEIGHT / 2,
        alignItems: 'flex-start',
        paddingLeft: 0,
        overflow: 'visible'
    },
    rulerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', overflow: 'visible' },
    rulerLine: { width: 15, height: 1.5, backgroundColor: '#E0E0E0' },
    rulerLineMain: { width: 35, backgroundColor: '#999999', height: 2 },
    rulerLineHalf: { width: 25, backgroundColor: '#CCCCCC', height: 1.5 },
    rulerLineActive: { backgroundColor: Colors.primary, width: 45, height: 2.5 },
    rulerLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#666666',
        marginLeft: 12,
        width: 50,
        height: 30,
        lineHeight: 30,
        includeFontPadding: false,
        textAlignVertical: 'center'
    },
    labelActive: {
        color: Colors.primary,
        fontSize: 16,
        includeFontPadding: false,
        textAlignVertical: 'center',
        height: 30,
        lineHeight: 30
    },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    button: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
