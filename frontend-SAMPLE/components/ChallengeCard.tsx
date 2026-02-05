import React, { memo } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, BorderRadius } from '../constants/Theme';
import { Challenge } from '../data/mockData';

interface ChallengeCardProps {
    challenge: Challenge;
    onPress?: () => void;
}

// Mock spectator avatars
const SPECTATOR_AVATARS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
];

const ChallengeCard = memo(function ChallengeCard({
    challenge,
    onPress,
}: ChallengeCardProps) {
    const daysLeft = Math.ceil(
        (challenge.endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const progressPercentage = (challenge.userProgress / challenge.targetDays) * 100;
    const opponentProgressPercentage = challenge.opponent
        ? (challenge.opponent.progress / challenge.targetDays) * 100
        : 0;

    const unreadMessages = challenge.messages.filter(
        m => m.sender === 'opponent'
    ).length;

    // Get border color based on challenge type
    const getBorderColor = () => {
        switch (challenge.type) {
            case 'protein':
                return Colors.success; // Green
            case 'streak':
                return '#F59E0B'; // Orange/Amber
            default:
                return Colors.primary;
        }
    };

    return (
        <Pressable style={[styles.container, { borderLeftColor: getBorderColor() }]} onPress={onPress}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconBadge, { backgroundColor: `${getBorderColor()}15` }]}>
                    <Text style={styles.iconEmoji}>
                        {challenge.type === 'protein' ? '💪' : '🔥'}
                    </Text>
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>{challenge.title}</Text>
                    {challenge.opponent && (
                        <Text style={styles.opponent}>vs @{challenge.opponent.name.toLowerCase()}</Text>
                    )}
                </View>
                <View style={styles.timeLeft}>
                    <Ionicons name="time-outline" size={12} color={Colors.textLight} />
                    <Text style={styles.timeLeftText}>{daysLeft}d left</Text>
                </View>
            </View>

            {/* Progress Section - Different layouts for streak vs protein */}
            {challenge.type === 'streak' && challenge.opponent ? (
                /* Streak Battle: Side-by-side fire comparison */
                <View style={styles.streakBattleContainer}>
                    <View style={styles.streakPlayer}>
                        <Text style={styles.streakFireCount}>
                            {challenge.userProgress}<Text style={styles.streakFireEmoji}>🔥</Text>
                        </Text>
                        <Text style={styles.streakPlayerLabel}>YOU</Text>
                    </View>
                    <View style={styles.streakDivider} />
                    <View style={styles.streakPlayer}>
                        <Text style={styles.streakFireCount}>
                            {challenge.opponent.progress}<Text style={styles.streakFireEmoji}>🔥</Text>
                        </Text>
                        <Text style={styles.streakPlayerLabel}>{challenge.opponent.name.toUpperCase()}</Text>
                    </View>
                </View>
            ) : (
                /* Protein Battle: Progress bars */
                <View style={styles.progressSection}>
                    {/* User Progress */}
                    <View style={styles.progressRow}>
                        <View style={styles.progressLabelRow}>
                            <View style={[styles.progressDot, { backgroundColor: Colors.primary }]} />
                            <Text style={styles.progressLabel}>You</Text>
                        </View>
                        <Text style={styles.progressValue}>
                            {challenge.userProgress}/{challenge.targetDays}
                            {challenge.userProgress > (challenge.opponent?.progress || 0) && ' 🔥'}
                        </Text>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                        />
                    </View>

                    {/* Opponent Progress */}
                    {challenge.opponent && (
                        <>
                            <View style={styles.progressRow}>
                                <View style={styles.progressLabelRow}>
                                    <View style={[styles.progressDot, { backgroundColor: Colors.textLight }]} />
                                    <Text style={styles.progressLabel}>{challenge.opponent.name}</Text>
                                </View>
                                <Text style={styles.progressValue}>
                                    {challenge.opponent.progress}/{challenge.targetDays}
                                </Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        styles.progressFillOpponent,
                                        { width: `${opponentProgressPercentage}%` },
                                    ]}
                                />
                            </View>
                        </>
                    )}
                </View>
            )}

            {/* Footer with spectators and chat */}
            <View style={styles.footer}>
                {/* Spectators */}
                <View style={styles.spectators}>
                    {SPECTATOR_AVATARS.slice(0, 3).map((uri, index) => (
                        <Image
                            key={index}
                            source={{ uri }}
                            style={[
                                styles.spectatorAvatar,
                                { marginLeft: index > 0 ? -8 : 0, zIndex: 3 - index }
                            ]}
                        />
                    ))}
                    <View style={styles.spectatorCount}>
                        <Text style={styles.spectatorCountText}>+12</Text>
                    </View>
                </View>

                {/* Chat Button */}
                <Pressable style={styles.chatButton}>
                    <Ionicons name="chatbubble-outline" size={16} color={Colors.textMedium} />
                    {unreadMessages > 0 && (
                        <View style={styles.chatBadge}>
                            <Text style={styles.chatBadgeText}>{unreadMessages}</Text>
                        </View>
                    )}
                </Pressable>
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        ...Shadows.soft,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
    },
    iconBadge: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconEmoji: {
        fontSize: 22,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textDark,
        marginBottom: 2,
    },
    opponent: {
        fontSize: 13,
        color: Colors.textMedium,
    },
    timeLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    timeLeftText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textLight,
    },
    progressSection: {
        marginBottom: 16,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    progressLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textMedium,
    },
    progressValue: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textDark,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 3,
    },
    progressFillOpponent: {
        backgroundColor: Colors.textLight,
    },
    // Streak Battle Styles
    streakBattleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
        marginBottom: 16,
    },
    streakPlayer: {
        alignItems: 'center',
        flex: 1,
    },
    streakFireCount: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.textDark,
    },
    streakFireEmoji: {
        fontSize: 18,
    },
    streakPlayerLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textLight,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    streakDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E7EB',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    spectators: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    spectatorAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    spectatorCount: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -8,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    spectatorCountText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textMedium,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        padding: 8,
        backgroundColor: Colors.background,
        borderRadius: 12,
    },
    chatBadge: {
        backgroundColor: Colors.error,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 8,
        minWidth: 16,
        alignItems: 'center',
    },
    chatBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});

export default ChallengeCard;

