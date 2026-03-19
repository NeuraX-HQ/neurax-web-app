import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/colors';
import AnimatedTransitionText from './AnimatedTransitionText';
import { useAppLanguage } from '../i18n/LanguageProvider';

interface CalorieGaugeProps {
    current: number;
    max: number;
    size?: number;
    strokeWidth?: number;
    displayValue?: string | number;
    label?: string;
    /** Override the arc and value color — e.g. pass Colors.danger when over budget */
    accentColor?: string;
}

export function CalorieGauge({
    current,
    max,
    size = 120,
    strokeWidth = 10,
    displayValue,
    label,
    accentColor,
}: CalorieGaugeProps) {
    const { t } = useAppLanguage();
    const accent = accentColor ?? Colors.primary;
    const radius = (size - strokeWidth) / 2;
    const cx = size / 2;
    const cy = size / 2;

    // Arc spans 270° with gap at the bottom center
    const startAngle = 225; // bottom-left (7:30 position)
    const endAngle = 495;   // bottom-right (4:30 position — 225 + 270)
    const totalArc = 270;

    const progress = Math.min(current / max, 1);
    const progressAngle = startAngle + totalArc * progress;
    const valueText = String(displayValue ?? current);
    const labelText = label ?? t('calorieGauge.label');
    // If valueText is in the form "450/1800", split it
    let mainValue = valueText;
    let maxValue = '';
    if (typeof valueText === 'string' && valueText.includes('/')) {
        [mainValue, maxValue] = valueText.split('/');
        maxValue = '/' + maxValue;
    }
    const isCompactValue = valueText.length >= 8;

    const polarToCartesian = (angle: number) => {
        const rad = ((angle - 90) * Math.PI) / 180;
        return {
            x: cx + radius * Math.cos(rad),
            y: cy + radius * Math.sin(rad),
        };
    };

    const describeArc = (start: number, end: number) => {
        const startPt = polarToCartesian(start);
        const endPt = polarToCartesian(end);
        const sweep = end - start;
        const largeArc = sweep > 180 ? 1 : 0;
        return `M ${startPt.x} ${startPt.y} A ${radius} ${radius} 0 ${largeArc} 1 ${endPt.x} ${endPt.y}`;
    };

    // Background track (light gray, full arc)
    const trackPath = describeArc(startAngle, endAngle);
    // Progress arc
    const progressPath = progressAngle > startAngle + 1
        ? describeArc(startAngle, progressAngle)
        : '';

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background track */}
                <Path
                    d={trackPath}
                    fill="none"
                    stroke="#E8E8E8"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                />
                {/* Progress arc */}
                {progressPath ? (
                    <Path
                        d={progressPath}
                        fill="none"
                        stroke={accent}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                    />
                ) : null}
            </Svg>
            {/* Center content */}
            <View style={styles.center}>
                <Text style={styles.fireEmoji}>🔥</Text>
                {maxValue ? (
                    <Text style={[styles.value, isCompactValue && styles.valueCompact, { color: accent }]}>
                        <AnimatedTransitionText text={mainValue} />
                        <Text style={[styles.valueMax, { color: accent }]}>{maxValue}</Text>
                    </Text>
                ) : (
                    <AnimatedTransitionText 
                        text={valueText} 
                        style={[styles.value, isCompactValue && styles.valueCompact, { color: accent }]} 
                    />
                )}
                <AnimatedTransitionText text={labelText} style={styles.label} direction="down" />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fireEmoji: { fontSize: 14, marginBottom: 1 },
    value: { fontSize: 22, fontWeight: '800', color: Colors.primary },
    valueCompact: { fontSize: 18 },
    label: { fontSize: 7, color: '#999', letterSpacing: 1.5, fontWeight: '600' },
    valueMax: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
});
