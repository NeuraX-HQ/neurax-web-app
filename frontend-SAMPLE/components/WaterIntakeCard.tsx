import React, { memo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows } from '../constants/Theme';

interface WaterIntakeCardProps {
    current: number; // in ml
    goal: number; // in ml
    glassSize?: number; // in ml, default 250
    onLogGlass?: () => void;
}

const WaterIntakeCard = memo(function WaterIntakeCard({
    current = 1800,
    goal = 2500,
    glassSize = 250,
    onLogGlass,
}: WaterIntakeCardProps) {
    const totalGlasses = Math.ceil(goal / glassSize);
    const filledGlasses = Math.floor(current / glassSize);
    const partialFill = (current % glassSize) / glassSize;

    const currentLiters = (current / 1000).toFixed(1);
    const goalLiters = (goal / 1000).toFixed(1);

    return (
        <LinearGradient
            colors={['#DBEAFE', '#BFDBFE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.emoji}>💧</Text>
                    <View>
                        <Text style={styles.title}>Water Intake</Text>
                        <Text style={styles.subtitle}>Goal: {goalLiters}L / day</Text>
                    </View>
                </View>
                <Text style={styles.currentValue}>{currentLiters}L</Text>
            </View>

            {/* Glass visualization */}
            <View style={styles.glassesRow}>
                {Array.from({ length: totalGlasses }, (_, i) => {
                    const isFilled = i < filledGlasses;
                    const isPartial = i === filledGlasses && partialFill > 0;
                    const isEmpty = i > filledGlasses;

                    return (
                        <View
                            key={i}
                            style={[
                                styles.glass,
                                isFilled && styles.glassFilled,
                                isPartial && { ...styles.glassFilled, opacity: 0.6 },
                                isEmpty && styles.glassEmpty,
                            ]}
                        />
                    );
                })}
            </View>

            {/* Log button */}
            <Pressable style={styles.logButton} onPress={onLogGlass}>
                <Text style={styles.logButtonText}>+ Log Glass ({glassSize}ml)</Text>
            </Pressable>
        </LinearGradient>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.md,
        padding: 24,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#3B82F6',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emoji: {
        fontSize: 28,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    subtitle: {
        fontSize: 13,
        color: Colors.textMedium,
        marginTop: 4,
    },
    currentValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#3B82F6',
    },
    glassesRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    glass: {
        flex: 1,
        height: 48,
        borderRadius: 8,
    },
    glassFilled: {
        backgroundColor: '#3B82F6',
    },
    glassEmpty: {
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#3B82F6',
    },
    logButton: {
        backgroundColor: '#3B82F6',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    logButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default WaterIntakeCard;
