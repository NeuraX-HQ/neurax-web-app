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
        <View style={styles.container}>
            {/* Left box: Text metrics */}
            <View style={styles.textColumn}>
                {maxValue ? (
                    <Text style={[styles.value, isCompactValue && styles.valueCompact, { color: accent }]}>
                        <AnimatedTransitionText text={mainValue} />
                        <Text style={[styles.valueMax, { color: '#A0A0A0' }]}>{maxValue}</Text>
                    </Text>
                ) : (
                    <AnimatedTransitionText 
                        text={valueText} 
                        style={[styles.value, isCompactValue && styles.valueCompact, { color: accent }]} 
                    />
                )}
                <AnimatedTransitionText text={labelText} style={styles.label} direction="down" />
            </View>

            {/* Right box: Doughnut Chart */}
            <View style={[styles.gaugeWrapper, { width: size, height: size }]}>
                <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {/* Background track */}
                    <Path
                        d={trackPath}
                        fill="none"
                        stroke="#F0F0F0"
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
                {/* Center content inside Donut */}
                <View style={styles.center}>
                    <Text style={[styles.fireEmoji, { fontSize: size * 0.3 }]}>🔥</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
    },
    textColumn: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    gaugeWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    fireEmoji: { },
    value: { fontSize: 42, fontWeight: '900', color: Colors.text, letterSpacing: -1 },
    valueCompact: { fontSize: 34 },
    label: { fontSize: 13, color: '#888', fontWeight: '500', marginTop: 4 },
    valueMax: { fontSize: 18, fontWeight: '600' },
});
