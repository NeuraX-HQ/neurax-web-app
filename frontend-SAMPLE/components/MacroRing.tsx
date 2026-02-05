import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../constants/Theme';

interface MacroRingProps {
    value: number;
    max: number;
    color: string;
    label: string;
    unit?: string;
    size?: 'small' | 'large';
}

const MacroRing = memo(function MacroRing({
    value,
    max,
    color,
    label,
    unit = 'g',
    size = 'small',
}: MacroRingProps) {
    const percentage = Math.min((value / max) * 100, 100);
    const strokeDasharray = `${percentage}, 100`;

    // Enlarged large ring for visual dominance, smaller secondary rings
    const dimensions = size === 'large' ? 140 : 44;
    const strokeWidth = size === 'large' ? 5 : 3;

    return (
        <View style={styles.container}>
            <View style={{ width: dimensions, height: dimensions, marginBottom: size === 'large' ? 12 : 6 }}>
                <Svg
                    viewBox="0 0 36 36"
                    style={{ width: '100%', height: '100%', transform: [{ rotate: '-90deg' }] }}
                >
                    {/* Background circle */}
                    <Path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E5E7EB"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress circle */}
                    <Path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeLinecap="round"
                    />
                </Svg>
            </View>

            <Text style={[styles.value, size === 'large' && styles.valueLarge]}>
                {value}{unit}
            </Text>
            <Text style={[styles.label, size === 'large' && styles.labelLarge]}>
                {label}
            </Text>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    value: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textDark,
        lineHeight: 18,
    },
    valueLarge: {
        fontSize: 40,
        fontWeight: '700',
        lineHeight: 44,
    },
    label: {
        fontSize: 10,
        color: Colors.textLight,
        marginTop: 2,
        lineHeight: 12,
    },
    labelLarge: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 4,
    },
});

export default MacroRing;
