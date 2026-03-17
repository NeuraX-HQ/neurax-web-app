import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { useMealStore } from '../src/store/mealStore';
import { useAppLanguage } from '../src/i18n/LanguageProvider';
import { FlameLevel, getCurrentStreak, getDaysSinceLastActive, getFlameLevel, getNextStreakTarget, toLocalIsoDate } from '../src/utils/streak';

type BadgeItem = {
    key: string;
    icon: keyof typeof Ionicons.glyphMap;
    labelKey: string;
    threshold: number;
    tint: string;
};

const BADGES: BadgeItem[] = [
    { key: 'starter', icon: 'water-outline', labelKey: 'achievements.badge.starter', threshold: 1, tint: '#3B82F6' },
    { key: 'builder', icon: 'nutrition-outline', labelKey: 'achievements.badge.builder', threshold: 3, tint: '#F97316' },
    { key: 'focus', icon: 'barbell-outline', labelKey: 'achievements.badge.focus', threshold: 7, tint: '#8B5CF6' },
    { key: 'consistency', icon: 'calendar-outline', labelKey: 'achievements.badge.consistency', threshold: 14, tint: '#10B981' },
    { key: 'legend', icon: 'trophy-outline', labelKey: 'achievements.badge.legend', threshold: 30, tint: '#F59E0B' },
    { key: 'master', icon: 'flame-outline', labelKey: 'achievements.badge.master', threshold: 60, tint: '#EF4444' },
];

const FLAME_CONFIG: Record<
    FlameLevel,
    {
        wrapperSize: number;
        iconSize: number;
        countSize: number;
        outerGlowSize: number;
        midGlowSize: number;
        outerGlowColor: string;
        midGlowColor: string;
        coreColor: string;
        innerColor: string;
        pulseScale: number;
        pulseDuration: number;
        labelKey: string;
    }
> = {
    low: {
        wrapperSize: 156,
        iconSize: 98,
        countSize: 46,
        outerGlowSize: 118,
        midGlowSize: 0,
        outerGlowColor: '#EF4444',
        midGlowColor: '#FB923C',
        coreColor: '#EF4444',
        innerColor: '#FDE68A',
        pulseScale: 1.04,
        pulseDuration: 1100,
        labelKey: 'achievements.flame.low',
    },
    medium: {
        wrapperSize: 206,
        iconSize: 132,
        countSize: 60,
        outerGlowSize: 168,
        midGlowSize: 120,
        outerGlowColor: '#DC2626',
        midGlowColor: '#F97316',
        coreColor: '#DC2626',
        innerColor: '#FCD34D',
        pulseScale: 1.08,
        pulseDuration: 900,
        labelKey: 'achievements.flame.medium',
    },
    high: {
        wrapperSize: 244,
        iconSize: 164,
        countSize: 72,
        outerGlowSize: 212,
        midGlowSize: 158,
        outerGlowColor: '#B91C1C',
        midGlowColor: '#EA580C',
        coreColor: '#DC2626',
        innerColor: '#FDE047',
        pulseScale: 1.12,
        pulseDuration: 760,
        labelKey: 'achievements.flame.high',
    },
};

export default function AchievementsScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const { meals } = useMealStore();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.6)).current;
    const [devStreakBoost, setDevStreakBoost] = useState(0);

    const todayIso = toLocalIsoDate(new Date());
    const activeDateSet = useMemo(() => new Set(meals.map((meal) => meal.date)), [meals]);
    const streak = useMemo(() => getCurrentStreak(activeDateSet, todayIso), [activeDateSet, todayIso]);
    const flameLevel = useMemo(() => getFlameLevel(activeDateSet, todayIso), [activeDateSet, todayIso]);
    const daysSinceLastActive = useMemo(() => getDaysSinceLastActive(activeDateSet, todayIso), [activeDateSet, todayIso]);
    const effectiveStreak = __DEV__ ? streak + devStreakBoost : streak;
    const effectiveFlameLevel: FlameLevel =
        effectiveStreak >= 21 ? 'high' : effectiveStreak >= 7 ? 'medium' : flameLevel;
    const nextTarget = useMemo(() => getNextStreakTarget(effectiveStreak), [effectiveStreak]);
    const unlockedCount = BADGES.filter((badge) => effectiveStreak >= badge.threshold).length;
    const flame = FLAME_CONFIG[effectiveFlameLevel];

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: flame.pulseScale,
                        duration: flame.pulseDuration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 1,
                        duration: flame.pulseDuration,
                        useNativeDriver: true,
                    }),
                ]),
                Animated.parallel([
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: flame.pulseDuration,
                        useNativeDriver: true,
                    }),
                    Animated.timing(glowAnim, {
                        toValue: 0.65,
                        duration: flame.pulseDuration,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        );

        pulse.start();
        return () => pulse.stop();
    }, [flame.pulseDuration, flame.pulseScale, glowAnim, scaleAnim]);

    const missInfo =
        daysSinceLastActive && daysSinceLastActive > 0
            ? t('achievements.missInfo', { count: daysSinceLastActive })
            : t('achievements.activeInfo');
    const displayMissInfo = __DEV__ && devStreakBoost > 0 ? t('achievements.activeInfo') : missInfo;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={22} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('achievements.title')}</Text>
                <View style={styles.headerButton} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
                <View style={styles.flameCard}>
                    <View style={[styles.flameWrap, { width: flame.wrapperSize, height: flame.wrapperSize }]}>
                        <Animated.View
                            style={[
                                styles.flameOuterGlow,
                                {
                                    width: flame.outerGlowSize,
                                    height: flame.outerGlowSize,
                                    backgroundColor: flame.outerGlowColor,
                                    opacity: glowAnim,
                                    transform: [{ scale: scaleAnim }],
                                },
                            ]}
                        />

                        {flame.midGlowSize > 0 ? (
                            <Animated.View
                                style={[
                                    styles.flameMidGlow,
                                    {
                                        width: flame.midGlowSize,
                                        height: flame.midGlowSize,
                                        backgroundColor: flame.midGlowColor,
                                        opacity: glowAnim,
                                        transform: [{ scale: scaleAnim }],
                                    },
                                ]}
                            />
                        ) : null}

                        {effectiveFlameLevel === 'high' ? (
                            <Animated.View
                                style={[
                                    styles.flameHighRing,
                                    {
                                        width: flame.wrapperSize,
                                        height: flame.wrapperSize,
                                        opacity: glowAnim,
                                        transform: [{ scale: scaleAnim }],
                                    },
                                ]}
                            />
                        ) : null}

                        <Animated.View style={[styles.flameBody, { transform: [{ scale: scaleAnim }] }]}>
                            <Ionicons name="flame" size={flame.iconSize} color={flame.coreColor} />
                            <Ionicons
                                name="flame"
                                size={Math.round(flame.iconSize * 0.68)}
                                color={flame.innerColor}
                                style={styles.flameInnerIcon}
                            />
                        </Animated.View>

                        <View style={styles.flameValueOverlay}>
                            <Text style={[styles.flameCount, { fontSize: flame.countSize }]}>{effectiveStreak}</Text>
                            <Text style={styles.flameDays}>{t('achievements.days')}</Text>
                        </View>
                    </View>

                    <Text style={styles.flameLevelText}>{t(flame.labelKey)}</Text>
                    <Text style={styles.flameHint}>{displayMissInfo}</Text>

                    {nextTarget ? (
                        <View style={styles.nextGoalBadge}>
                            <Text style={styles.nextGoalText}>
                                {t('achievements.nextGoal', { days: nextTarget - effectiveStreak })}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.nextGoalBadge}>
                            <Text style={styles.nextGoalText}>{t('achievements.maxLevel')}</Text>
                        </View>
                    )}
                </View>

                {__DEV__ ? (
                    <View style={styles.devToolsCard}>
                        <Text style={styles.devToolsTitle}>DEV Demo</Text>
                        <Text style={styles.devToolsSubtitle}>Boost streak nhanh để test flame growth</Text>
                        <View style={styles.devToolsRow}>
                            <TouchableOpacity style={styles.devButton} onPress={() => setDevStreakBoost((prev) => prev + 7)}>
                                <Text style={styles.devButtonText}>Fake +7 days streak</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.devButton, styles.devButtonGhost]}
                                onPress={() => setDevStreakBoost(0)}
                            >
                                <Text style={[styles.devButtonText, styles.devButtonGhostText]}>Reset</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.devStateText}>Base: {streak} | Boost: +{devStreakBoost} | Display: {effectiveStreak}</Text>
                    </View>
                ) : null}

                <View style={styles.badgeHeaderRow}>
                    <Text style={styles.badgeTitle}>{t('achievements.badgesTitle')}</Text>
                    <Text style={styles.badgeCounter}>{t('achievements.badgesUnlocked', { unlocked: unlockedCount, total: BADGES.length })}</Text>
                </View>

                <View style={styles.badgeGrid}>
                    {BADGES.map((badge) => {
                        const unlocked = effectiveStreak >= badge.threshold;

                        return (
                            <View key={badge.key} style={styles.badgeItem}>
                                <View
                                    style={[
                                        styles.badgeIconWrap,
                                        unlocked ? { borderColor: badge.tint, backgroundColor: `${badge.tint}15` } : styles.badgeIconWrapLocked,
                                    ]}
                                >
                                    <Ionicons
                                        name={badge.icon}
                                        size={24}
                                        color={unlocked ? badge.tint : '#9CA3AF'}
                                    />
                                </View>
                                <Text style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]}>{t(badge.labelKey)}</Text>
                                <Text style={[styles.badgeState, unlocked ? styles.badgeStateOn : styles.badgeStateOff]}>
                                    {unlocked ? t('achievements.badge.unlocked') : t('achievements.badge.locked')}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF7F2',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 6,
        paddingBottom: 10,
    },
    headerButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.text,
    },
    content: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    flameCard: {
        marginTop: 8,
        borderRadius: 20,
        backgroundColor: '#1F130E',
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        ...Shadows.medium,
    },
    flameWrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    flameOuterGlow: {
        position: 'absolute',
        borderRadius: 999,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 26,
    },
    flameMidGlow: {
        position: 'absolute',
        borderRadius: 999,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 22,
    },
    flameHighRing: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 2,
        borderColor: 'rgba(254, 202, 202, 0.45)',
    },
    flameBody: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flameInnerIcon: {
        position: 'absolute',
    },
    flameValueOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    flameCount: {
        fontWeight: '900',
        color: '#FFFFFF',
        textShadowColor: 'rgba(127, 29, 29, 0.95)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 14,
    },
    flameDays: {
        marginTop: -6,
        fontSize: 10,
        letterSpacing: 2.2,
        fontWeight: '800',
        color: '#FEF2F2',
        textTransform: 'uppercase',
    },
    flameLevelText: {
        marginTop: -20,
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    flameHint: {
        marginTop: 8,
        fontSize: 13,
        color: '#FBD5CC',
        textAlign: 'center',
    },
    nextGoalBadge: {
        marginTop: 14,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: 'rgba(251, 113, 133, 0.18)',
        borderWidth: 1,
        borderColor: 'rgba(251, 113, 133, 0.35)',
    },
    nextGoalText: {
        fontSize: 12,
        color: '#FFE4E6',
        fontWeight: '700',
    },
    devToolsCard: {
        marginTop: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#FFFFFF',
        padding: 12,
    },
    devToolsTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#111827',
    },
    devToolsSubtitle: {
        marginTop: 2,
        fontSize: 11,
        color: '#6B7280',
    },
    devToolsRow: {
        marginTop: 10,
        flexDirection: 'row',
        columnGap: 8,
    },
    devButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: '#111827',
    },
    devButtonGhost: {
        backgroundColor: '#F3F4F6',
    },
    devButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    devButtonGhostText: {
        color: '#111827',
    },
    devStateText: {
        marginTop: 10,
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    badgeHeaderRow: {
        marginTop: 18,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    badgeTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.text,
    },
    badgeCounter: {
        fontSize: 12,
        fontWeight: '700',
        color: '#B45309',
        backgroundColor: '#FFEDD5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        rowGap: 14,
    },
    badgeItem: {
        width: '31%',
        alignItems: 'center',
    },
    badgeIconWrap: {
        width: 74,
        height: 74,
        borderRadius: 18,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    badgeIconWrapLocked: {
        borderColor: '#E5E7EB',
        backgroundColor: '#F3F4F6',
    },
    badgeLabel: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
        textAlign: 'center',
    },
    badgeLabelLocked: {
        color: '#9CA3AF',
    },
    badgeState: {
        marginTop: 2,
        fontSize: 10,
        fontWeight: '600',
    },
    badgeStateOn: {
        color: '#059669',
    },
    badgeStateOff: {
        color: '#9CA3AF',
    },
});
