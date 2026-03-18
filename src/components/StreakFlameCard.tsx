import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FlameLevel } from '../utils/streak';

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
    },
};

type Props = {
    streak: number;
    flameLevel: FlameLevel;
    /** compact mode: smaller size for use inside hero cards */
    compact?: boolean;
    dayLabel?: string;
};

export function StreakFlameCard({ streak, flameLevel, compact = false, dayLabel = 'Ngày' }: Props) {
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const glowAnim = useRef(new Animated.Value(0.6)).current;

    const baseConfig = FLAME_CONFIG[flameLevel];

    // Scale down by 55% in compact mode
    const scale = compact ? 0.55 : 1;
    const cfg = compact
        ? {
              ...baseConfig,
              wrapperSize: Math.round(baseConfig.wrapperSize * scale),
              iconSize: Math.round(baseConfig.iconSize * scale),
              countSize: Math.round(baseConfig.countSize * scale),
              outerGlowSize: Math.round(baseConfig.outerGlowSize * scale),
              midGlowSize: Math.round(baseConfig.midGlowSize * scale),
          }
        : baseConfig;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(scaleAnim, { toValue: baseConfig.pulseScale, duration: baseConfig.pulseDuration, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 1, duration: baseConfig.pulseDuration, useNativeDriver: true }),
                ]),
                Animated.parallel([
                    Animated.timing(scaleAnim, { toValue: 1, duration: baseConfig.pulseDuration, useNativeDriver: true }),
                    Animated.timing(glowAnim, { toValue: 0.65, duration: baseConfig.pulseDuration, useNativeDriver: true }),
                ]),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [baseConfig.pulseDuration, baseConfig.pulseScale, glowAnim, scaleAnim]);

    return (
        <View style={[styles.wrap, { width: cfg.wrapperSize, height: cfg.wrapperSize }]}>
            {/* Outer glow */}
            <Animated.View
                style={[
                    styles.outerGlow,
                    {
                        width: cfg.outerGlowSize,
                        height: cfg.outerGlowSize,
                        backgroundColor: cfg.outerGlowColor,
                        opacity: glowAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            />

            {/* Mid glow */}
            {cfg.midGlowSize > 0 && (
                <Animated.View
                    style={[
                        styles.midGlow,
                        {
                            width: cfg.midGlowSize,
                            height: cfg.midGlowSize,
                            backgroundColor: cfg.midGlowColor,
                            opacity: glowAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                />
            )}

            {/* High ring */}
            {flameLevel === 'high' && (
                <Animated.View
                    style={[
                        styles.highRing,
                        {
                            width: cfg.wrapperSize,
                            height: cfg.wrapperSize,
                            opacity: glowAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                />
            )}

            {/* Flame icons */}
            <Animated.View style={[styles.flameBody, { transform: [{ scale: scaleAnim }] }]}>
                <Ionicons name="flame" size={cfg.iconSize} color={cfg.coreColor} />
                <Ionicons
                    name="flame"
                    size={Math.round(cfg.iconSize * 0.68)}
                    color={cfg.innerColor}
                    style={styles.innerIcon}
                />
            </Animated.View>

            {/* Count overlay */}
            <View style={styles.valueOverlay}>
                <Text style={[styles.count, { fontSize: cfg.countSize }]}>{streak}</Text>
                <Text style={[styles.days, compact && styles.daysCompact]}>{dayLabel}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    outerGlow: {
        position: 'absolute',
        borderRadius: 999,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 26,
    },
    midGlow: {
        position: 'absolute',
        borderRadius: 999,
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 22,
    },
    highRing: {
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
    innerIcon: {
        position: 'absolute',
    },
    valueOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    count: {
        fontWeight: '900',
        color: '#FFFFFF',
        textShadowColor: 'rgba(127, 29, 29, 0.95)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 14,
    },
    days: {
        marginTop: -6,
        fontSize: 10,
        letterSpacing: 2.2,
        fontWeight: '800',
        color: '#FEF2F2',
        textTransform: 'uppercase',
    },
    daysCompact: {
        fontSize: 7,
        letterSpacing: 1,
    },
});
