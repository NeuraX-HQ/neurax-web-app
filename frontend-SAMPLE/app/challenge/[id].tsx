import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    ScrollView,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Shadows, BorderRadius } from '../../constants/Theme';

// ============== Types ==============
interface DayProgress {
    day: string;
    goal: number;
    actual: number | null;
    status: 'success' | 'failed' | 'today' | 'future';
}

interface ChatMessage {
    id: string;
    sender: 'user' | 'opponent';
    senderName: string;
    message: string;
    time: string;
    avatar?: string;
}

// ============== Mock Data ==============
const challengeData = {
    title: 'Protein Battle',
    rule: 'Hit protein goal 5 out of 7 days',
    emoji: '🥤',
    stakes: 'Loser buys winner a protein shake',
    daysLeft: 2,
};

const leaderboard = [
    {
        rank: 1,
        name: 'You',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        daysCompleted: 4,
        totalDays: 7,
        currentValue: 85,
        targetValue: 120,
        isLeader: true,
        isOnFire: true,
        status: 'On Track',
    },
    {
        rank: 2,
        name: '@john_doe',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        daysCompleted: 3,
        totalDays: 7,
        currentValue: 92,
        targetValue: 120,
        isLeader: false,
        isOnFire: false,
        status: null,
    },
];

const dailyProgress: DayProgress[] = [
    { day: 'Monday', goal: 120, actual: 125, status: 'success' },
    { day: 'Tuesday', goal: 120, actual: 130, status: 'success' },
    { day: 'Wednesday', goal: 120, actual: 118, status: 'success' },
    { day: 'Thursday', goal: 120, actual: 95, status: 'failed' },
    { day: 'Friday', goal: 120, actual: 140, status: 'success' },
    { day: 'Saturday', goal: 120, actual: 85, status: 'today' },
    { day: 'Sunday', goal: 120, actual: null, status: 'future' },
];

const chatMessages: ChatMessage[] = [
    {
        id: '1',
        sender: 'opponent',
        senderName: 'John',
        message: 'Gonna catch up today! 💪',
        time: '6:30 PM',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
    },
    {
        id: '2',
        sender: 'user',
        senderName: 'You',
        message: 'Bring it on! 😎',
        time: '7:00 PM',
    },
];

// ============== Components ==============

// Info Card (Hero) - Clean White Design
const InfoCard = () => (
    <View style={styles.infoCard}>
        {/* Trophy Icon */}
        <View style={styles.trophyContainer}>
            <Text style={styles.trophyEmoji}>🏆</Text>
        </View>

        {/* Challenge Title */}
        <Text style={styles.infoCardTitle}>Protein Battle</Text>

        {/* Challenge Description */}
        <Text style={styles.infoCardDescription}>
            Hit protein goal 5 out of 7 days
        </Text>

        {/* Countdown Badge */}
        <View style={styles.countdownBadge}>
            <Ionicons name="time-outline" size={14} color={Colors.textMedium} />
            <Text style={styles.countdownText}>Ends in 2 days</Text>
        </View>

        {/* Stakes Box */}
        <View style={styles.stakesBox}>
            <Text style={styles.stakesEmoji}>🎁</Text>
            <Text style={styles.stakesText}>
                Loser buys winner a protein shake 🧋
            </Text>
        </View>
    </View>
);

// Section Title with Icon
const SectionTitle = ({ icon, title, badge }: { icon: string; title: string; badge?: { count: number; color: string } }) => (
    <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleLeft}>
            <Ionicons name={icon as any} size={20} color={icon === 'trophy' ? '#D97706' : Colors.primary} />
            <Text style={styles.sectionTitleText}>{title}</Text>
        </View>
        {badge && (
            <View style={[styles.unreadBadge, { backgroundColor: badge.color }]}>
                <Text style={styles.unreadBadgeText}>{badge.count} unread</Text>
            </View>
        )}
    </View>
);

// Leaderboard Row
const LeaderboardRow = ({ player, isFirst }: { player: typeof leaderboard[0]; isFirst: boolean }) => {
    const progressPercent = (player.daysCompleted / player.totalDays) * 100;

    return (
        <View style={[styles.leaderRow, isFirst && styles.leaderRowFirst]}>
            <View style={styles.leaderRowTop}>
                <View style={styles.leaderLeft}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: player.avatar }}
                            style={[
                                styles.leaderAvatar,
                                isFirst && styles.leaderAvatarFirst,
                                !isFirst && styles.leaderAvatarGray,
                            ]}
                        />
                        <View style={[styles.rankBadge, isFirst ? styles.rankBadgeFirst : styles.rankBadgeSecond]}>
                            <Text style={[styles.rankText, !isFirst && styles.rankTextGray]}>{player.rank}</Text>
                        </View>
                    </View>
                    <View>
                        <View style={styles.nameRow}>
                            <Text style={[styles.leaderName, isFirst && styles.leaderNameFirst]}>{player.name}</Text>
                            {player.isOnFire && (
                                <View style={styles.fireBadge}>
                                    <Text style={styles.fireBadgeText}>🔥</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.leaderDays}>{player.daysCompleted}/{player.totalDays} days completed</Text>
                    </View>
                </View>
                <View style={styles.leaderRight}>
                    <Text style={[styles.leaderValue, isFirst && styles.leaderValueFirst]}>
                        {player.currentValue}
                    </Text>
                    <Text style={styles.leaderValueUnit}>/ {player.targetValue}g</Text>
                </View>
            </View>
            <View style={[styles.leaderProgressBar, !isFirst && styles.leaderProgressBarGray]}>
                <View
                    style={[
                        styles.leaderProgressFill,
                        { width: `${progressPercent}%` },
                        isFirst ? styles.leaderProgressFillFirst : styles.leaderProgressFillGray,
                    ]}
                />
            </View>
            {isFirst && player.status && (
                <View style={styles.leaderStatusRow}>
                    <Text style={styles.leaderStatusLabel}>Today's Progress</Text>
                    <Text style={styles.leaderStatusValue}>{player.status}</Text>
                </View>
            )}
        </View>
    );
};

// Daily Progress Item
const DayProgressItem = ({ item }: { item: DayProgress }) => {
    const getStatusStyles = () => {
        switch (item.status) {
            case 'success':
                return { bg: '#DCFCE7', icon: 'checkmark', color: '#10B981' };
            case 'failed':
                return { bg: '#FEE2E2', icon: 'close', color: '#EF4444' };
            case 'today':
                return { bg: '#DBEAFE', icon: null, color: '#3B82F6', textColor: '#1E40AF' };
            case 'future':
                return { bg: '#F3F4F6', icon: null, color: '#9CA3AF', opacity: 0.5 };
            default:
                return { bg: '#F3F4F6', icon: null, color: '#9CA3AF' };
        }
    };

    const status = getStatusStyles();
    const isToday = item.status === 'today';
    const isFailed = item.status === 'failed';

    return (
        <View style={[
            styles.dayRow,
            isToday && styles.dayRowToday,
            { opacity: status.opacity || 1 }
        ]}>
            <View style={styles.dayLeft}>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }, isToday && styles.statusBadgeToday]}>
                    {status.icon ? (
                        <Ionicons name={status.icon as any} size={14} color={status.color} />
                    ) : isToday ? (
                        <Text style={[styles.statusText, { color: status.color }]}>?</Text>
                    ) : null}
                </View>
                <View>
                    <Text style={[styles.dayName, isToday && styles.dayNameToday]}>{item.day}</Text>
                    <Text style={[styles.dayGoal, isFailed && styles.dayGoalFailed]}>
                        {isFailed ? `Missed by ${item.goal - (item.actual || 0)}g` :
                            isToday ? `Today • Goal: ${item.goal}g` :
                                item.status !== 'future' ? `Goal: ${item.goal}g` : ''}
                    </Text>
                </View>
            </View>
            <Text style={[
                styles.dayValue,
                item.status === 'success' && styles.dayValueSuccess,
                item.status === 'failed' && styles.dayValueFailed,
                item.status === 'today' && styles.dayValueToday,
            ]}>
                {item.actual !== null ? `${item.actual}g` : '--'}
            </Text>
        </View>
    );
};

// Chat Bubble
const ChatBubble = ({ message }: { message: ChatMessage }) => {
    const isUser = message.sender === 'user';

    return (
        <View style={styles.chatContainer}>
            {!isUser && (
                <View style={styles.chatHeader}>
                    <Image source={{ uri: message.avatar }} style={styles.chatAvatar} />
                    <Text style={styles.chatSenderName}>{message.senderName}</Text>
                </View>
            )}
            <View style={[styles.chatBubbleWrapper, isUser && styles.chatBubbleWrapperRight]}>
                <View style={[styles.chatBubble, isUser ? styles.chatBubbleRight : styles.chatBubbleLeft]}>
                    <Text style={[styles.chatText, isUser && styles.chatTextRight]}>{message.message}</Text>
                </View>
                <Text style={[styles.chatTime, isUser && styles.chatTimeRight]}>{message.time}</Text>
            </View>
        </View>
    );
};

// ============== Main Screen ==============
export default function ChallengeDetailScreen() {
    const router = useRouter();
    const [messageText, setMessageText] = useState('');

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={Colors.textMedium} />
                </Pressable>
                <Text style={styles.headerTitle}>Protein Battle</Text>
                <Pressable style={styles.moreButton}>
                    <Ionicons name="ellipsis-horizontal" size={24} color={Colors.textMedium} />
                </Pressable>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Info Card */}
                <InfoCard />

                {/* Leaderboard */}
                <SectionTitle icon="trending-up" title="Leaderboard" />
                <View style={styles.leaderboardCard}>
                    {leaderboard.map((player, index) => (
                        <LeaderboardRow key={player.rank} player={player} isFirst={index === 0} />
                    ))}
                </View>

                {/* Your Progress */}
                <SectionTitle icon="calendar" title="Your Progress" />
                <View style={styles.progressCard}>
                    {dailyProgress.map((day, index) => (
                        <DayProgressItem key={index} item={day} />
                    ))}
                </View>

                {/* Trash Talk */}
                <SectionTitle
                    icon="chatbubble-ellipses"
                    title="Trash Talk"
                    badge={{ count: 2, color: '#FEE2E2' }}
                />
                <View style={styles.chatCard}>
                    {chatMessages.map((msg) => (
                        <ChatBubble key={msg.id} message={msg} />
                    ))}
                    <View style={styles.chatInputContainer}>
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Type message..."
                            placeholderTextColor={Colors.textLight}
                            value={messageText}
                            onChangeText={setMessageText}
                        />
                        <Pressable style={styles.sendButton}>
                            <Ionicons name="send" size={16} color="#FFFFFF" />
                        </Pressable>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View style={styles.bottomActions}>
                <Pressable style={styles.primaryButton}>
                    <Ionicons name="share-social" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryButtonText}>Share Progress</Text>
                </Pressable>
                <Pressable>
                    <Text style={styles.quitText}>Quit Challenge</Text>
                </Pressable>
            </View>
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
        padding: 20,
        paddingBottom: 140,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.background,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.soft,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    moreButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Info Card - Clean White Design
    infoCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
        alignItems: 'center',
        ...Shadows.card,
    },
    trophyContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    trophyEmoji: {
        fontSize: 32,
    },
    infoCardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.textDark,
        textAlign: 'center',
        marginBottom: 8,
    },
    infoCardDescription: {
        fontSize: 15,
        color: Colors.textMedium,
        textAlign: 'center',
        marginBottom: 16,
    },
    countdownBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 20,
    },
    countdownText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textDark,
    },
    stakesBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: '#FEF9E7',
        borderRadius: 12,
        padding: 14,
        width: '100%',
    },
    stakesEmoji: {
        fontSize: 20,
    },
    stakesText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#92400E',
        flex: 1,
    },

    // Section Title
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        marginTop: 24,
        paddingHorizontal: 4,
    },
    sectionTitleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitleText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textDark,
    },
    unreadBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 999,
    },
    unreadBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#EF4444',
    },

    // Leaderboard
    leaderboardCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        ...Shadows.card,
    },
    leaderRow: {
        padding: 16,
    },
    leaderRowFirst: {
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    leaderRowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    leaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    leaderAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    leaderAvatarFirst: {
        borderWidth: 2,
        borderColor: Colors.success,
    },
    leaderAvatarGray: {
        opacity: 0.8,
    },
    rankBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.surface,
    },
    rankBadgeFirst: {
        backgroundColor: '#FBBF24',
    },
    rankBadgeSecond: {
        backgroundColor: '#E5E7EB',
    },
    rankText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    rankTextGray: {
        color: '#6B7280',
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    leaderName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textMedium,
    },
    leaderNameFirst: {
        fontWeight: '700',
        color: Colors.textDark,
    },
    fireBadge: {
        backgroundColor: '#FED7AA',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    fireBadgeText: {
        fontSize: 10,
    },
    leaderDays: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    leaderRight: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    leaderValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textMedium,
    },
    leaderValueFirst: {
        color: Colors.success,
    },
    leaderValueUnit: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    leaderProgressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    leaderProgressBarGray: {
        height: 6,
    },
    leaderProgressFill: {
        height: '100%',
        borderRadius: 4,
    },
    leaderProgressFillFirst: {
        backgroundColor: Colors.success,
    },
    leaderProgressFillGray: {
        backgroundColor: '#9CA3AF',
    },
    leaderStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    leaderStatusLabel: {
        fontSize: 10,
        color: Colors.textLight,
        fontWeight: '500',
    },
    leaderStatusValue: {
        fontSize: 10,
        color: Colors.success,
        fontWeight: '700',
    },

    // Progress Card
    progressCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 20,
        ...Shadows.card,
    },
    dayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F9FAFB',
    },
    dayRowToday: {
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        marginHorizontal: -20,
        paddingHorizontal: 20,
        borderLeftWidth: 4,
        borderLeftColor: '#3B82F6',
    },
    dayLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    statusBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusBadgeToday: {
        borderWidth: 1,
        borderColor: '#BFDBFE',
    },
    statusText: {
        fontSize: 12,
        fontWeight: '700',
    },
    dayName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textDark,
    },
    dayNameToday: {
        fontWeight: '700',
        color: '#1E3A8A',
    },
    dayGoal: {
        fontSize: 11,
        color: Colors.textLight,
    },
    dayGoalFailed: {
        color: '#EF4444',
    },
    dayValue: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textLight,
    },
    dayValueSuccess: {
        color: Colors.success,
    },
    dayValueFailed: {
        color: '#EF4444',
    },
    dayValueToday: {
        color: '#3B82F6',
    },

    // Chat
    chatCard: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        paddingBottom: 12,
        ...Shadows.card,
    },
    chatContainer: {
        marginBottom: 16,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    chatAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        opacity: 0.8,
    },
    chatSenderName: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    chatBubbleWrapper: {
        marginLeft: 32,
    },
    chatBubbleWrapperRight: {
        marginLeft: 0,
        alignItems: 'flex-end',
    },
    chatBubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        maxWidth: '80%',
    },
    chatBubbleLeft: {
        backgroundColor: '#F3F4F6',
        borderBottomLeftRadius: 4,
    },
    chatBubbleRight: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    chatText: {
        fontSize: 14,
        color: Colors.textDark,
    },
    chatTextRight: {
        color: '#FFFFFF',
    },
    chatTime: {
        fontSize: 10,
        color: Colors.textLight,
        marginTop: 4,
        marginLeft: 4,
    },
    chatTimeRight: {
        marginLeft: 0,
        marginRight: 4,
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    chatInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 14,
        color: Colors.textDark,
    },
    sendButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: -42,
    },

    // Bottom Actions
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 32,
        backgroundColor: Colors.background,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 999,
        ...Shadows.float,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    quitText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#EF4444',
        textAlign: 'center',
        paddingVertical: 12,
    },
});
