import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius, Shadows } from '../constants/Theme';

interface MicroCommitmentCardProps {
    title: string;
    description: string;
    completed: number;
    total: number;
    onCheckIn?: () => void;
}

const MicroCommitmentCard = memo(function MicroCommitmentCard({
    title = "Today's Micro-Commitment",
    description = 'Drink one glass of water before each meal',
    completed = 2,
    total = 3,
    onCheckIn,
}: MicroCommitmentCardProps) {
    const checkmarks = Array.from({ length: total }, (_, i) => i < completed);

    return (
        <LinearGradient
            colors={['#FEF3C7', '#FDE68A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.emoji}>🎯</Text>
                <Text style={styles.title}>{title}</Text>
            </View>

            {/* Description */}
            <Text style={styles.description}>{description}</Text>

            {/* Progress */}
            <View style={styles.progressRow}>
                <View style={styles.checkmarks}>
                    {checkmarks.map((isCompleted, index) => (
                        <Pressable
                            key={index}
                            style={[
                                styles.checkmark,
                                isCompleted ? styles.checkmarkCompleted : styles.checkmarkPending,
                            ]}
                            onPress={!isCompleted ? onCheckIn : undefined}
                        >
                            {isCompleted && <Text style={styles.checkIcon}>✓</Text>}
                        </Pressable>
                    ))}
                </View>
                <Text style={styles.progressText}>
                    {completed}/{total} complete
                </Text>
            </View>
        </LinearGradient>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: BorderRadius.md,
        padding: 24,
        marginBottom: 24,
        borderWidth: 2,
        borderColor: '#F59E0B',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
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
    description: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textDark,
        marginBottom: 16,
        lineHeight: 22,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    checkmarks: {
        flexDirection: 'row',
        gap: 6,
    },
    checkmark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmarkCompleted: {
        backgroundColor: '#10B981',
    },
    checkmarkPending: {
        backgroundColor: 'rgba(255,255,255,0.6)',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#D97706',
    },
    checkIcon: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textMedium,
    },
});

export default MicroCommitmentCard;
