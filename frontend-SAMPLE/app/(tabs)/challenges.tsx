import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    FlatList,
    Image,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Shadows, BorderRadius } from '../../constants/Theme';

// ============== Types ==============
interface Challenge {
    id: string;
    title: string;
    type: 'protein' | 'streak' | 'macro' | 'consistency';
    emoji: string;
    opponent?: {
        name: string;
        avatar?: string;
        progress: number;
    };
    userProgress: number;
    targetDays: number;
    daysLeft: number;
    spectators?: { avatar: string }[];
    unreadMessages?: number;
}

interface RecommendedChallenge {
    id: string;
    title: string;
    description: string;
    emoji: string;
    bgColor: string;
    textColor: string;
    buttonStyle: 'primary' | 'warning' | 'success';
    buttonText: string;
    hasIcon?: boolean;
}

// ============== Mock Data ==============
const activeChallenges: Challenge[] = [
    {
        id: '1',
        title: 'Protein Battle',
        type: 'protein',
        emoji: '🏆',
        opponent: {
            name: '@john_doe',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
            progress: 3,
        },
        userProgress: 4,
        targetDays: 7,
        daysLeft: 2,
        spectators: [
            { avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64' },
            { avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=64' },
        ],
        unreadMessages: 2,
    },
    {
        id: '2',
        title: '7-Day Streak',
        type: 'streak',
        emoji: '🔥',
        opponent: {
            name: '@sarah_nguyen',
            progress: 6,
        },
        userProgress: 5,
        targetDays: 7,
        daysLeft: 5,
    },
];

const recommendedChallenges: RecommendedChallenge[] = [
    {
        id: 'r1',
        title: '30-Day Consistency',
        description: 'Log your meals every day for 30 days straight to build a habit.',
        emoji: '🎯',
        bgColor: '#E0F2FE',
        textColor: '#0284C7',
        buttonStyle: 'primary',
        buttonText: 'Start Solo Challenge',
    },
    {
        id: 'r2',
        title: 'Weekend Warrior',
        description: 'Stay on track by hitting your macro goals this Saturday & Sunday.',
        emoji: '💪',
        bgColor: '#FEF3C7',
        textColor: '#D97706',
        buttonStyle: 'warning',
        buttonText: 'Challenge a Friend',
        hasIcon: true,
    },
    {
        id: 'r3',
        title: 'Macro Maestro',
        description: 'Hit all 3 macro goals (Protein, Carbs, Fat) for 5 days this week.',
        emoji: '🥗',
        bgColor: '#DCFCE7',
        textColor: '#166534',
        buttonStyle: 'success',
        buttonText: 'Start Solo Challenge',
    },
];

// ============== Components ==============

// Section Header Component
const SectionHeader = ({ title, count, badgeColor = Colors.success }: { title: string; count?: number; badgeColor?: string }) => (
    <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count !== undefined && (
            <View style={[styles.sectionBadge, { backgroundColor: badgeColor }]}>
                <Text style={styles.sectionBadgeText}>{count}</Text>
            </View>
        )}
    </View>
);

// AI Badge
const AIBadge = () => (
    <View style={styles.aiBadge}>
        <Text style={styles.aiBadgeText}>AI</Text>
    </View>
);

// Active Challenge Card (Protein type with progress bars)
const ProteinChallengeCard = ({ challenge, onPress }: { challenge: Challenge; onPress: () => void }) => {
    const userPercent = (challenge.userProgress / challenge.targetDays) * 100;
    const opponentPercent = challenge.opponent ? (challenge.opponent.progress / challenge.targetDays) * 100 : 0;

    return (
        <Pressable style={[styles.challengeCard, styles.proteinCard]} onPress={onPress}>
            {/* Green left border */}
            <View style={[styles.cardBorder, { backgroundColor: Colors.success }]} />

            {/* Header */}
            <View style={styles.cardHeader}>
                <View>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardEmoji}>{challenge.emoji}</Text>
                        <Text style={styles.cardTitle}>{challenge.title}</Text>
                    </View>
                    <Text style={styles.cardOpponent}>
                        vs <Text style={styles.cardOpponentName}>{challenge.opponent?.name}</Text>
                    </Text>
                </View>
                <View style={styles.daysLeftBadge}>
                    <Ionicons name="time-outline" size={12} color={Colors.primary} />
                    <Text style={styles.daysLeftText}>{challenge.daysLeft} days left</Text>
                </View>
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
                {/* User Progress */}
                <View style={styles.progressRow}>
                    <Text style={styles.progressLabelUser}>You</Text>
                    <Text style={styles.progressValueGreen}>{challenge.userProgress}/{challenge.targetDays} days</Text>
                </View>
                <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${userPercent}%`, backgroundColor: Colors.primary }]} />
                </View>

                {/* Opponent Progress */}
                {challenge.opponent && (
                    <>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabelOpponent}>{challenge.opponent.name.replace('@', '')}</Text>
                            <Text style={styles.progressValueGray}>{challenge.opponent.progress}/{challenge.targetDays} days</Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${opponentPercent}%`, backgroundColor: Colors.textLight }]} />
                        </View>
                    </>
                )}
            </View>

            {/* Footer */}
            <View style={styles.cardFooter}>
                <View style={styles.spectatorsRow}>
                    <View style={styles.spectatorAvatars}>
                        {challenge.spectators?.slice(0, 2).map((s, i) => (
                            <Image
                                key={i}
                                source={{ uri: s.avatar }}
                                style={[styles.spectatorAvatar, { marginLeft: i > 0 ? -8 : 0 }]}
                            />
                        ))}
                    </View>
                    <Text style={styles.spectatorText}>+1 spectator</Text>
                </View>
                {challenge.unreadMessages && challenge.unreadMessages > 0 && (
                    <Pressable style={styles.chatButton}>
                        <Ionicons name="chatbubble-outline" size={14} color={Colors.primary} />
                        <Text style={styles.chatButtonText}>{challenge.unreadMessages} new</Text>
                    </Pressable>
                )}
            </View>
        </Pressable>
    );
};

// Streak Challenge Card (Fire comparison)
const StreakChallengeCard = ({ challenge, onPress }: { challenge: Challenge; onPress: () => void }) => (
    <Pressable style={[styles.challengeCard, styles.streakCard]} onPress={onPress}>
        {/* Orange left border */}
        <View style={[styles.cardBorder, { backgroundColor: '#F59E0B' }]} />

        {/* Header */}
        <View style={styles.cardHeader}>
            <View>
                <View style={styles.cardTitleRow}>
                    <Text style={styles.cardEmoji}>{challenge.emoji}</Text>
                    <Text style={styles.cardTitle}>{challenge.title}</Text>
                </View>
                <Text style={styles.cardOpponent}>
                    vs <Text style={styles.cardOpponentName}>{challenge.opponent?.name}</Text>
                </Text>
            </View>
            <View style={[styles.daysLeftBadge, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="time-outline" size={12} color="#D97706" />
                <Text style={[styles.daysLeftText, { color: '#D97706' }]}>{challenge.daysLeft} days left</Text>
            </View>
        </View>

        {/* Fire Comparison */}
        <View style={styles.fireComparison}>
            <View style={styles.firePlayer}>
                <Text style={styles.fireCount}>
                    {challenge.userProgress}<Text style={styles.fireEmoji}>🔥</Text>
                </Text>
                <Text style={styles.fireLabel}>YOU</Text>
            </View>
            <View style={styles.fireDivider} />
            <View style={styles.firePlayer}>
                <Text style={styles.fireCount}>
                    {challenge.opponent?.progress}<Text style={styles.fireEmoji}>🔥</Text>
                </Text>
                <Text style={styles.fireLabel}>{challenge.opponent?.name.replace('@', '').toUpperCase()}</Text>
            </View>
        </View>
    </Pressable>
);

// Collapsible Completed Section
const CompletedSection = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Pressable style={styles.completedSection} onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.completedText}>Completed Challenges (3)</Text>
            <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.textLight}
            />
        </Pressable>
    );
};

// Recommended Challenge Card
const RecommendedCard = ({ challenge }: { challenge: RecommendedChallenge }) => {
    const buttonStyles = {
        primary: { bg: Colors.primaryLight, text: Colors.primary, border: 'transparent' },
        warning: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
        success: { bg: '#DCFCE7', text: '#166534', border: 'transparent' },
    };
    const style = buttonStyles[challenge.buttonStyle];

    return (
        <View style={styles.recommendedCard}>
            <View style={[styles.recommendedIcon, { backgroundColor: challenge.bgColor }]}>
                <Text style={styles.recommendedEmoji}>{challenge.emoji}</Text>
            </View>
            <View style={styles.recommendedContent}>
                <Text style={styles.recommendedTitle}>{challenge.title}</Text>
                <Text style={styles.recommendedDesc}>{challenge.description}</Text>
                <Pressable
                    style={[
                        styles.recommendedButton,
                        { backgroundColor: style.bg, borderColor: style.border, borderWidth: style.border !== 'transparent' ? 1 : 0 }
                    ]}
                >
                    {challenge.hasIcon && (
                        <Ionicons name="add" size={12} color={style.text} style={{ marginRight: 4 }} />
                    )}
                    <Text style={[styles.recommendedButtonText, { color: style.text }]}>
                        {challenge.buttonText}
                    </Text>
                </Pressable>
            </View>
        </View>
    );
};

// ============== Main Screen ==============
export default function ChallengesScreen() {
    const router = useRouter();

    const handleChallengePress = (challengeId: string) => {
        router.push(`/challenge/${challengeId}`);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Challenges</Text>
                    <Pressable style={styles.fabAdd}>
                        <Ionicons name="add" size={24} color={Colors.primary} />
                    </Pressable>
                </View>

                {/* Active Battles Section */}
                <View style={styles.section}>
                    <SectionHeader title="ACTIVE BATTLES" count={activeChallenges.length} />

                    {/* Protein Challenge Card */}
                    <ProteinChallengeCard
                        challenge={activeChallenges[0]}
                        onPress={() => handleChallengePress(activeChallenges[0].id)}
                    />

                    {/* Streak Challenge Card */}
                    <StreakChallengeCard
                        challenge={activeChallenges[1]}
                        onPress={() => handleChallengePress(activeChallenges[1].id)}
                    />
                </View>

                {/* Completed Section (Collapsible) */}
                <View style={styles.section}>
                    <CompletedSection />
                </View>

                {/* Recommended Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>RECOMMENDED FOR YOU</Text>
                        <AIBadge />
                    </View>

                    {recommendedChallenges.map((challenge) => (
                        <RecommendedCard key={challenge.id} challenge={challenge} />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ============== Styles ==============
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 120,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    fabAdd: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Section
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textMedium,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    sectionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    sectionBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // AI Badge
    aiBadge: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    aiBadgeText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Challenge Card Base
    challengeCard: {
        backgroundColor: Colors.surface,
        borderRadius: 32,
        padding: 20,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
        ...Shadows.card,
    },
    proteinCard: {},
    streakCard: {},
    cardBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },

    // Card Header
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
        paddingLeft: 8,
    },
    cardTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    cardEmoji: {
        fontSize: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textDark,
    },
    cardOpponent: {
        fontSize: 14,
        color: Colors.textMedium,
    },
    cardOpponentName: {
        fontWeight: '600',
        color: Colors.primary,
    },
    daysLeftBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    daysLeftText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },

    // Progress Section
    progressSection: {
        marginBottom: 16,
        paddingLeft: 8,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    progressLabelUser: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textDark,
    },
    progressLabelOpponent: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textMedium,
    },
    progressValueGreen: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.success,
    },
    progressValueGray: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textMedium,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginBottom: 12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },

    // Card Footer
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingLeft: 8,
    },
    spectatorsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    spectatorAvatars: {
        flexDirection: 'row',
    },
    spectatorAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    spectatorText: {
        fontSize: 12,
        color: Colors.textLight,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
    },
    chatButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },

    // Fire Comparison (Streak)
    fireComparison: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8,
        paddingLeft: 8,
    },
    firePlayer: {
        alignItems: 'center',
        flex: 1,
    },
    fireCount: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.textDark,
    },
    fireEmoji: {
        fontSize: 18,
    },
    fireLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.textLight,
        marginTop: 4,
        letterSpacing: 0.5,
    },
    fireDivider: {
        width: 1,
        height: 32,
        backgroundColor: '#E5E7EB',
    },

    // Completed Section
    completedSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    completedText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textLight,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    // Recommended Cards
    recommendedCard: {
        backgroundColor: Colors.surface,
        borderRadius: 32,
        padding: 20,
        marginBottom: 16,
        flexDirection: 'row',
        gap: 16,
        ...Shadows.card,
    },
    recommendedIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    recommendedEmoji: {
        fontSize: 20,
    },
    recommendedContent: {
        flex: 1,
    },
    recommendedTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textDark,
        marginBottom: 4,
    },
    recommendedDesc: {
        fontSize: 12,
        color: Colors.textMedium,
        lineHeight: 18,
        marginBottom: 12,
    },
    recommendedButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 999,
    },
    recommendedButtonText: {
        fontSize: 12,
        fontWeight: '700',
    },
});
