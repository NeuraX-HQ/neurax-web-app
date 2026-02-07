import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    ScrollView,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Shadows, BorderRadius, Spacing } from '../../constants/Theme';

// Types
interface Challenge {
    id: string;
    title: string;
    type: 'protein' | 'streak' | 'macro';
    emoji: string;
    opponent?: {
        name: string;
        avatar?: string;
        progress: number;
    };
    userProgress: number;
    targetDays: number;
    daysLeft: number;
    spectators?: number;
    unreadMessages?: number;
    stakes?: string;
}

// Mock Data - More realistic
const activeChallenges: Challenge[] = [
    {
        id: '1',
        title: 'Protein Battle',
        type: 'protein',
        emoji: '🏆',
        opponent: {
            name: 'John',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
            progress: 3,
        },
        userProgress: 4,
        targetDays: 7,
        daysLeft: 2,
        spectators: 3,
        unreadMessages: 2,
        stakes: 'Loser buys protein shake 🥤',
    },
    {
        id: '2',
        title: '7-Day Streak',
        type: 'streak',
        emoji: '🔥',
        opponent: {
            name: 'Sarah',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
            progress: 6,
        },
        userProgress: 5,
        targetDays: 7,
        daysLeft: 5,
        stakes: 'Bragging rights only 😎',
    },
];

// Challenge Card - Human, not robotic
const ChallengeCard = ({ challenge, onPress }: { challenge: Challenge; onPress: () => void }) => {
    const userPercent = (challenge.userProgress / challenge.targetDays) * 100;
    const opponentPercent = challenge.opponent ? (challenge.opponent.progress / challenge.targetDays) * 100 : 0;
    const isWinning = challenge.userProgress > (challenge.opponent?.progress || 0);
    const isTied = challenge.userProgress === (challenge.opponent?.progress || 0);

    return (
        <Pressable
            style={styles.challengeCard}
            onPress={onPress}
        >
            {/* Left accent based on status */}
            <View style={[styles.cardAccent, { backgroundColor: isWinning ? Colors.success : isTied ? '#F59E0B' : Colors.error }]} />

            {/* Main content */}
            <View style={styles.cardContent}>
                {/* Header row */}
                <View style={styles.cardHeader}>
                    <View style={styles.titleRow}>
                        <Text style={styles.cardEmoji}>{challenge.emoji}</Text>
                        <View>
                            <Text style={styles.cardTitle}>{challenge.title}</Text>
                            <Text style={styles.cardSubtitle}>
                                vs <Text style={styles.opponentName}>{challenge.opponent?.name}</Text>
                            </Text>
                        </View>
                    </View>

                    {/* Time left - pill style from Home */}
                    <View style={styles.timePill}>
                        <Ionicons name="time-outline" size={12} color={challenge.daysLeft <= 2 ? '#DC2626' : Colors.primary} />
                        <Text style={[styles.timeText, challenge.daysLeft <= 2 && styles.timeTextUrgent]}>
                            {challenge.daysLeft}d left
                        </Text>
                    </View>
                </View>

                {/* Progress comparison - visual, not just bars */}
                <View style={styles.progressComparison}>
                    {/* Your progress */}
                    <View style={styles.playerProgress}>
                        <View style={styles.playerInfo}>
                            <Text style={styles.playerLabel}>You</Text>
                            <Text style={styles.progressDays}>
                                {challenge.userProgress}<Text style={styles.progressTotal}>/{challenge.targetDays}</Text>
                            </Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${userPercent}%`, backgroundColor: Colors.primary }]} />
                        </View>
                    </View>

                    {/* VS divider */}
                    <View style={styles.vsDivider}>
                        <Text style={styles.vsText}>vs</Text>
                    </View>

                    {/* Opponent progress */}
                    <View style={styles.playerProgress}>
                        <View style={styles.playerInfo}>
                            <Text style={styles.playerLabelOpponent}>{challenge.opponent?.name}</Text>
                            <Text style={styles.progressDaysOpponent}>
                                {challenge.opponent?.progress}<Text style={styles.progressTotal}>/{challenge.targetDays}</Text>
                            </Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View style={[styles.progressFill, { width: `${opponentPercent}%`, backgroundColor: Colors.textLight }]} />
                        </View>
                    </View>
                </View>

                {/* Stakes - the fun part */}
                {challenge.stakes && (
                    <View style={styles.stakesRow}>
                        <Text style={styles.stakesLabel}>🎁 Stakes:</Text>
                        <Text style={styles.stakesText}>{challenge.stakes}</Text>
                    </View>
                )}

                {/* Footer with social proof */}
                <View style={styles.cardFooter}>
                    {challenge.spectators && challenge.spectators > 0 && (
                        <View style={styles.spectatorInfo}>
                            <Ionicons name="eye-outline" size={14} color={Colors.textLight} />
                            <Text style={styles.spectatorText}>{challenge.spectators} watching</Text>
                        </View>
                    )}

                    {challenge.unreadMessages && challenge.unreadMessages > 0 && (
                        <View style={styles.messagesBadge}>
                            <Ionicons name="chatbubble" size={12} color={Colors.surface} />
                            <Text style={styles.messagesText}>{challenge.unreadMessages}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

// Quick Start Card - Friendly, not robotic
const QuickStartCard = ({ title, description, emoji, color, onPress }: {
    title: string;
    description: string;
    emoji: string;
    color: string;
    onPress: () => void;
}) => (
    <Pressable style={styles.quickStartCard} onPress={onPress}>
        <View style={[styles.quickStartIcon, { backgroundColor: color + '20' }]}>
            <Text style={styles.quickStartEmoji}>{emoji}</Text>
        </View>
        <View style={styles.quickStartContent}>
            <Text style={styles.quickStartTitle}>{title}</Text>
            <Text style={styles.quickStartDesc}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </Pressable>
);

export default function ChallengesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    }, []);

    const handleChallengePress = (challengeId: string) => {
        router.push(`/challenge/${challengeId}`);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                    />
                }
            >
                {/* Header - Matches Home exactly */}
                <View style={styles.headerTop}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.greetingTitle}>Challenges</Text>
                        <Text style={styles.greetingSubtitle}>
                            You're winning {activeChallenges.filter(c => c.userProgress > (c.opponent?.progress || 0)).length} of {activeChallenges.length} 🎯
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Pressable style={styles.iconButton}>
                            <Ionicons name="trophy-outline" size={24} color={Colors.textDark} />
                        </Pressable>
                        <Image
                            source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
                            style={styles.avatar}
                        />
                    </View>
                </View>

                {/* Active Challenges */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Active Battles</Text>
                        <View style={styles.countPill}>
                            <Text style={styles.countText}>{activeChallenges.length}</Text>
                        </View>
                    </View>

                    {activeChallenges.map(challenge => (
                        <ChallengeCard
                            key={challenge.id}
                            challenge={challenge}
                            onPress={() => handleChallengePress(challenge.id)}
                        />
                    ))}
                </View>

                {/* Quick Start Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Start Something New</Text>
                    </View>

                    <QuickStartCard
                        title="Challenge a Friend"
                        description="Bet on who can hit their goals"
                        emoji="👊"
                        color={Colors.primary}
                        onPress={() => { }}
                    />
                    <QuickStartCard
                        title="Solo Challenge"
                        description="Push yourself with personal goals"
                        emoji="🎯"
                        color="#F59E0B"
                        onPress={() => { }}
                    />
                    <QuickStartCard
                        title="Join Community"
                        description="Compete in group challenges"
                        emoji="🌍"
                        color="#8B5CF6"
                        onPress={() => { }}
                    />
                </View>

                {/* Completed - Collapsed */}
                <View style={styles.section}>
                    <Pressable style={styles.collapsedRow}>
                        <Text style={styles.collapsedText}>Past Challenges (3)</Text>
                        <Ionicons name="chevron-down" size={16} color={Colors.textLight} />
                    </Pressable>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB - Same as Home */}
            <Pressable style={styles.fab}>
                <Ionicons name="add" size={28} color={Colors.surface} />
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.md,
        paddingTop: 16,
    },
    // Header - Exact match to Home
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 24,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    greetingTitle: {
        fontSize: 28,
        fontWeight: '600',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
        marginBottom: 4,
        lineHeight: 34,
    },
    greetingSubtitle: {
        fontSize: 16,
        color: Colors.textMedium,
    },
    iconButton: {
        padding: 4,
        minWidth: 44,
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 2,
        borderColor: Colors.surface,
        ...Shadows.soft,
    },
    // Sections
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    countPill: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.surface,
    },
    // Challenge Card
    challengeCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        marginBottom: 16,
        flexDirection: 'row',
        overflow: 'hidden',
        ...Shadows.soft,
    },
    cardAccent: {
        width: 4,
    },
    cardContent: {
        flex: 1,
        padding: 18,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    cardEmoji: {
        fontSize: 28,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.textDark,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13,
        color: Colors.textMedium,
    },
    opponentName: {
        fontWeight: '600',
        color: Colors.primary,
    },
    timePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.pill,
        gap: 4,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    timeTextUrgent: {
        color: '#DC2626',
    },
    // Progress comparison
    progressComparison: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
        gap: 8,
    },
    playerProgress: {
        flex: 1,
    },
    playerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    playerLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textDark,
    },
    playerLabelOpponent: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textLight,
    },
    progressDays: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.primary,
    },
    progressDaysOpponent: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textLight,
    },
    progressTotal: {
        fontWeight: '400',
        color: Colors.textLight,
    },
    progressTrack: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    vsDivider: {
        paddingHorizontal: 6,
    },
    vsText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textLight,
    },
    // Stakes
    stakesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 14,
        gap: 6,
    },
    stakesLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
    },
    stakesText: {
        fontSize: 12,
        color: '#78350F',
        flex: 1,
    },
    // Card footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    spectatorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    spectatorText: {
        fontSize: 12,
        color: Colors.textLight,
    },
    messagesBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: BorderRadius.pill,
        gap: 4,
    },
    messagesText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.surface,
    },
    // Quick Start Cards
    quickStartCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 16,
        marginBottom: 12,
        gap: 14,
        ...Shadows.soft,
    },
    quickStartIcon: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickStartEmoji: {
        fontSize: 22,
    },
    quickStartContent: {
        flex: 1,
    },
    quickStartTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textDark,
        marginBottom: 2,
    },
    quickStartDesc: {
        fontSize: 13,
        color: Colors.textMedium,
    },
    // Collapsed row
    collapsedRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    collapsedText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textLight,
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.float,
    },
});
