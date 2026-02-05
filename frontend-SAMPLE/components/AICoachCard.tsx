import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows } from '../constants/Theme';
import { AI_BAO_MESSAGES } from '../data/mockData';

interface AICoachCardProps {
    type: 'morning' | 'praise' | 'encouragement';
    onAskBao?: () => void;
    onDismiss?: () => void;
}

const AICoachCard = memo(function AICoachCard({
    type,
    onAskBao,
    onDismiss,
}: AICoachCardProps) {
    const messages = AI_BAO_MESSAGES[type];
    const message = messages[Math.floor(Math.random() * messages.length)];

    const getTitle = () => {
        switch (type) {
            case 'morning':
                return 'Good morning motivation';
            case 'praise':
                return "Great start! You're hitting your protein goals early.";
            case 'encouragement':
                return 'Keep going!';
            default:
                return 'AI Coach Bảo';
        }
    };

    const getSubtitle = () => {
        switch (type) {
            case 'morning':
                return message;
            case 'praise':
                return 'Consider a fiber-rich snack next to balance your digestion.';
            case 'encouragement':
                return message;
            default:
                return message;
        }
    };

    return (
        <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            {/* Decorative radial overlay */}
            <View style={styles.overlay} />

            {/* Header */}
            <View style={styles.header}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>AI Coach</Text>
                </View>
                <Text style={styles.timestamp}>Just now</Text>
            </View>

            {/* Content */}
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>

            {/* Actions */}
            <View style={styles.actions}>
                <Pressable
                    style={styles.actionButton}
                    onPress={onAskBao}
                >
                    <Text style={styles.actionButtonText}>Ask Bảo</Text>
                </Pressable>
                <Pressable
                    style={[styles.actionButton, styles.actionButtonSecondary]}
                    onPress={onDismiss}
                >
                    <Text style={styles.actionButtonText}>Dismiss</Text>
                </Pressable>
            </View>
        </LinearGradient>
    );
});

const styles = StyleSheet.create({
    container: {
        borderRadius: 32,
        padding: 24,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    overlay: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: '200%',
        height: '200%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 500,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textOnPrimary,
    },
    timestamp: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textOnPrimary,
        marginBottom: 8,
        lineHeight: 24,
        fontFamily: 'Playfair Display',
    },
    subtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
        marginBottom: 16,
        lineHeight: 20,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    actionButtonSecondary: {
        backgroundColor: 'transparent',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textOnPrimary,
    },
});

export default AICoachCard;
