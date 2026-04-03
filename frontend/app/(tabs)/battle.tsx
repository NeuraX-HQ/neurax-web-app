import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/constants/colors';
import Svg, { Path } from 'react-native-svg';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useMealStore } from '../../src/store/mealStore';
import { useFriendStore } from '../../src/store/friendStore';
import { useAuthStore } from '../../src/store/authStore';
import { getUserData } from '../../src/store/userStore';
import { router, useFocusEffect } from 'expo-router';
import { getUrl } from 'aws-amplify/storage';

type SortMode = 'streak' | 'petScore';

function ChevronDown({ size = 16, color = '#666' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M6 9l6 6 6-6" />
        </Svg>
    );
}

function ArrowUp({ size = 14, color = '#2ECC71' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 19V5M5 12l7-7 7 7" />
        </Svg>
    );
}

function ArrowDown({ size = 14, color = '#E74C3C' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 5v14M19 12l-7 7-7-7" />
        </Svg>
    );
}

const SORT_OPTIONS: { key: SortMode; labelKey: string; icon: string }[] = [
    { key: 'streak', labelKey: 'battle.sort.streak', icon: '🔥' },
    { key: 'petScore', labelKey: 'battle.sort.petScore', icon: '🐾' },
];

const DRAGON_STAGE_VIDEOS = [
    require('../../MANHINH/1.mp4'),
    require('../../MANHINH/2.mp4'),
    require('../../MANHINH/3.mp4'),
    require('../../MANHINH/4.mp4'),
    require('../../MANHINH/5.mp4'),
];

const TOTAL_EVOLUTION_DAYS = 180;
const TOTAL_STAGES = 5;
const DAYS_PER_STAGE = TOTAL_EVOLUTION_DAYS / TOTAL_STAGES;

// Only render remote (http/https) URIs — block stale file:// URIs saved before the profile fix
const isRemoteUri = (uri: string | null | undefined): uri is string =>
    !!uri && (uri.startsWith('http://') || uri.startsWith('https://'));

export default function BattleScreen() {
    const { t } = useAppLanguage();
    const { meals } = useMealStore();
    const { userId } = useAuthStore();
    const { friends, leaderboard, loadFriends, loadLeaderboard, pendingRequests, loadPendingRequests } = useFriendStore();
    const [tab, setTab] = useState<'friends' | 'achievements'>('friends');
    const [sortMode, setSortMode] = useState<SortMode>('streak');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [devBoostDays, setDevBoostDays] = useState(0);
    const [myAvatarUri, setMyAvatarUri] = useState<string | null>(null);
    const videoRef = useRef<Video>(null);

    useEffect(() => {
        loadFriends();
        loadPendingRequests();
    }, []);

    useFocusEffect(
        useCallback(() => {
            getUserData().then(async (u) => {
                const raw = u?.avatar_url || null;
                if (!raw) { setMyAvatarUri(null); return; }
                if (raw.startsWith('http')) { setMyAvatarUri(raw); return; }
                if (raw.startsWith('file://')) { setMyAvatarUri(null); return; }
                // S3 key — resolve to presigned URL
                try {
                    const { url } = await getUrl({ path: raw });
                    setMyAvatarUri(url.toString());
                } catch { setMyAvatarUri(null); }
            });
        }, [])
    );

    useEffect(() => {
        if (userId) {
            loadLeaderboard(userId, 'Bạn', meals);
        }
    }, [userId, friends.length, meals.length]);

    useEffect(() => {
        // Friends ranking focuses on streak, achievements focuses on pet score.
        setSortMode(tab === 'friends' ? 'streak' : 'petScore');
    }, [tab]);

    const hasFriends = friends.length > 0;

    const sortedData = useMemo(() => {
        const data = leaderboard.map(e => ({
            user_id: e.user_id,
            name: e.display_name || 'User',
            streak: e.current_streak,
            petScore: e.pet_score,
            isMe: e.isMe || false,
            avatar_url: e.avatar_url,
            rank: 0,
            change: 0,
        }));
        if (sortMode === 'streak') {
            data.sort((a, b) => b.streak - a.streak);
        } else {
            data.sort((a, b) => b.petScore - a.petScore);
        }
        return data.map((item, i) => ({ ...item, rank: i + 1 }));
    }, [sortMode, leaderboard]);

    const myEntry = sortedData.find(e => e.isMe);
    const top3 = sortedData.slice(0, 3);
    const rest = sortedData.slice(3);

    const getDisplayScoreShort = (user: { streak: number; petScore: number }) => {
        return sortMode === 'streak' ? `${user.streak}` : `${user.petScore}`;
    };

    const petProgressDays = useMemo(() => new Set(meals.map((meal) => meal.date)).size, [meals]);
    const effectivePetDays = Math.max(0, __DEV__ ? petProgressDays + devBoostDays : petProgressDays);
    const petStreak = effectivePetDays;
    const petScore = effectivePetDays * 20;

    const petLevel = effectivePetDays <= 0
        ? 1
        : Math.min(TOTAL_STAGES, Math.floor((effectivePetDays - 1) / DAYS_PER_STAGE) + 1);
    const petStageIndex = petLevel - 1;
    const dragonVideoSource = DRAGON_STAGE_VIDEOS[petStageIndex];

    const currentStageStart = petStageIndex * DAYS_PER_STAGE;
    const daysIntoStage = petLevel === 1
        ? Math.min(DAYS_PER_STAGE, effectivePetDays)
        : Math.min(DAYS_PER_STAGE, Math.max(0, effectivePetDays - currentStageStart));
    const level = petLevel;
    const xpNeed = DAYS_PER_STAGE;
    const xpInLevel = petLevel === TOTAL_STAGES ? DAYS_PER_STAGE : daysIntoStage;


    const milestones = [36, 72, 108, 144, 180];
    const achievedMilestones = milestones.filter((m) => petStreak >= m).length;
    const currentBadge =
        petStreak >= 180 ? t('battle.badge.legendary') :
            petStreak >= 144 ? t('battle.badge.diamond') :
                petStreak >= 108 ? t('battle.badge.gold') :
                    petStreak >= 72 ? t('battle.badge.silver') : t('battle.badge.starter');

    const podiumColors = ['#FFF5E1', '#E8F0FE', '#FFE8E0'];
    const podiumBorderColors = ['#FFD700', '#C0C8D4', '#CD7F32'];
    const podiumEmojis = ['👨', '👩', '👩'];
    const podiumBarHeights = [90, 60, 40];

    // Re-order for podium display: [2nd, 1st, 3rd]
    const podiumOrder = [1, 0, 2];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{t('battle.title')}</Text>
                {tab === 'friends' ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={styles.addFriendButton}
                            onPress={() => router.push('/add-friend')}
                        >
                            <Text style={styles.addFriendText}>{t('battle.addFriend')}</Text>
                            {pendingRequests.length > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{pendingRequests.length}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        {hasFriends && (
                            <TouchableOpacity
                                style={styles.sortButton}
                                onPress={() => setShowSortMenu(true)}
                            >
                                <Text style={styles.sortButtonText}>{t('battle.sortButton')}</Text>
                                <ChevronDown size={14} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.levelPill}>
                        <Text style={styles.levelPillText}>{t('battle.levelShort', { level })}</Text>
                    </View>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'friends' && styles.tabActive]}
                    onPress={() => setTab('friends')}
                >
                    <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>{t('battle.tab.friends')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'achievements' && styles.tabActive]}
                    onPress={() => setTab('achievements')}
                >
                    <Text style={[styles.tabText, tab === 'achievements' && styles.tabTextActive]}>{t('battle.tab.achievements')}</Text>
                </TouchableOpacity>
            </View>

            {tab === 'friends' ? (
                !hasFriends ? (
                    /* Empty state — no friends yet */
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>👥</Text>
                        <Text style={styles.emptyTitle}>{t('battle.noFriends.title')}</Text>
                        <Text style={styles.emptyDesc}>{t('battle.noFriends.desc')}</Text>
                        <TouchableOpacity
                            style={styles.emptyAddBtn}
                            onPress={() => router.push('/add-friend')}
                        >
                            <Text style={styles.emptyAddText}>{t('battle.addFriend')}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Sort badge */}
                            <View style={styles.sortBadgeRow}>
                                <View style={styles.sortBadge}>
                                    <Text style={styles.sortBadgeIcon}>
                                        {SORT_OPTIONS.find(o => o.key === sortMode)?.icon}
                                    </Text>
                                    <Text style={styles.sortBadgeText}>
                                        {t(SORT_OPTIONS.find(o => o.key === sortMode)?.labelKey || 'battle.sort.streak')}
                                    </Text>
                                </View>
                            </View>

                            {/* Podium */}
                            <View style={styles.podium}>
                                {podiumOrder.map((idx) => {
                                    const user = top3[idx];
                                    if (!user) return null;
                                    const isFirst = idx === 0;
                                    return (
                                        <View key={user.user_id || `podium-${idx}`} style={styles.podiumItem}>
                                            {isFirst && <Text style={styles.goldCrown}>👑</Text>}
                                            {!isFirst && <View style={{ height: 28 }} />}
                                            <View style={[
                                                styles.podiumAvatar,
                                                isFirst && styles.podiumAvatarFirst,
                                                { backgroundColor: podiumColors[idx], borderColor: podiumBorderColors[idx], borderWidth: isFirst ? 3 : 2 },
                                            ]}>
                                                {isRemoteUri(user.isMe ? myAvatarUri : user.avatar_url) ? (
                                                    <Image source={{ uri: (user.isMe ? myAvatarUri : user.avatar_url)! }} style={[styles.podiumAvatarImg, isFirst && styles.podiumAvatarImgFirst]} />
                                                ) : (
                                                    <Text style={styles.podiumEmoji}>{podiumEmojis[idx]}</Text>
                                                )}
                                                <View style={[styles.crown, { backgroundColor: podiumBorderColors[idx] }]}>
                                                    <Text style={styles.crownText}>{idx + 1}</Text>
                                                </View>
                                            </View>
                                            <Text style={styles.podiumName}>{user.name}</Text>
                                            <Text style={[styles.podiumScore, isFirst && styles.podiumScoreFirst]}>
                                                {getDisplayScoreShort(user)}
                                            </Text>
                                            <View style={[styles.podiumBar, {
                                                height: podiumBarHeights[idx],
                                                backgroundColor: podiumColors[idx],
                                            }]} />
                                        </View>
                                    );
                                })}
                            </View>

                            {/* Rankings divider */}
                            <View style={styles.rankingsDivider}>
                                <Text style={styles.rankingsLabel}>{t('battle.rankings')}</Text>
                                <Text style={styles.rankingsTimer}>{t('battle.refreshInHours', { hours: 4 })}</Text>
                            </View>

                            {/* Rankings List */}
                            <View style={styles.rankings}>
                                {rest.map((user) => (
                                    <View key={user.rank} style={[styles.rankRow, Shadows.small]}>
                                        <Text style={styles.rankNum}>
                                            {String(user.rank).padStart(2, '0')}
                                        </Text>
                                        <View style={styles.rankAvatar}>
                                            {isRemoteUri(user.isMe ? myAvatarUri : user.avatar_url) ? (
                                                <Image source={{ uri: (user.isMe ? myAvatarUri : user.avatar_url)! }} style={styles.rankAvatarImage} />
                                            ) : (
                                                <Text>👤</Text>
                                            )}
                                        </View>
                                        <View style={styles.rankInfo}>
                                            <Text style={styles.rankName}>{user.name}</Text>
                                            <Text style={styles.rankStreak}>
                                                {sortMode === 'streak'
                                                    ? t('battle.streakWithEmoji', { count: user.streak })
                                                    : t('battle.petScoreWithEmoji', { score: user.petScore })}
                                            </Text>
                                        </View>
                                        <Text style={styles.rankScore}>{getDisplayScoreShort(user)}</Text>
                                        {user.change !== 0 && (
                                            <View style={styles.rankChangeContainer}>
                                                {user.change > 0 ? (
                                                    <View style={styles.rankChangeRow}>
                                                        <ArrowUp size={12} />
                                                        <Text style={[styles.rankChange, styles.rankUp]}>{user.change}</Text>
                                                    </View>
                                                ) : (
                                                    <View style={styles.rankChangeRow}>
                                                        <ArrowDown size={12} />
                                                        <Text style={[styles.rankChange, styles.rankDown]}>{Math.abs(user.change)}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>

                            <View style={{ height: 140 }} />
                        </ScrollView>

                        {/* You bar - sticky at bottom */}
                        <View style={styles.youBar}>
                            <View style={[styles.rankRow, styles.rankRowYou, Shadows.medium]}>
                                <Text style={[styles.rankNum, { color: Colors.primary }]}>
                                    {myEntry ? String(myEntry.rank).padStart(2, '0') : '--'}
                                </Text>
                                <View style={[styles.rankAvatar, { backgroundColor: '#E8ECF0' }]}>
                                    {myAvatarUri ? (
                                        <Image source={{ uri: myAvatarUri }} style={styles.rankAvatarImage} />
                                    ) : (
                                        <Text>👤</Text>
                                    )}
                                </View>
                                <View style={styles.rankInfo}>
                                    <Text style={[styles.rankName, { color: Colors.primary }]}>{t('battle.you')}</Text>
                                    <Text style={styles.rankStreak}>
                                        {sortMode === 'streak'
                                            ? t('battle.streakWithEmoji', { count: petStreak })
                                            : t('battle.petScoreWithEmoji', { score: petScore })}
                                    </Text>
                                </View>
                                <Text style={[styles.rankScore, { color: Colors.primary }]}>
                                    {sortMode === 'streak' ? String(petStreak) : String(petScore)}
                                </Text>
                            </View>
                        </View>
                    </>
                )
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.achievementsContent}>
                    <View style={styles.petStatRow}>
                        <View style={styles.petStatCard}>
                            <Text style={styles.petStatLabel}>{t('battle.currentStreak')}</Text>
                            <Text style={styles.petStatValue}>🔥 {petStreak}</Text>
                        </View>
                        <View style={styles.petStatCard}>
                            <Text style={styles.petStatLabel}>{t('battle.badge')}</Text>
                            <Text style={styles.petStatValue}>🏅 {currentBadge}</Text>
                        </View>
                    </View>

                    <View style={styles.petArena}>
                        <View style={styles.dragonWrap}>
                            <Video
                                ref={videoRef}
                                source={dragonVideoSource}
                                style={styles.dragonVideo}
                                videoStyle={{ width: '100%', height: '100%' } as any}
                                resizeMode={ResizeMode.CONTAIN}
                                shouldPlay
                                isLooping
                                isMuted
                                useNativeControls={false}
                                onLoad={() => {
                                    videoRef.current?.playAsync();
                                }}
                            />
                        </View>
                    </View>

                    <Text style={styles.petName}>{t('battle.petName')}</Text>
                    <Text style={styles.petDesc}>{t('battle.petDesc')}</Text>

                    <View style={styles.xpCard}>
                        <View style={styles.xpTopRow}>
                            <Text style={styles.xpTitle}>{t('battle.xpAndLevel')}</Text>
                            <Text style={styles.xpValue}>{xpInLevel}/{xpNeed} ngày</Text>
                        </View>
                        <View style={styles.xpTrack}>
                            <View style={[styles.xpFill, { width: `${Math.min(100, (xpInLevel / xpNeed) * 100)}%` }]} />
                        </View>
                        <Text style={styles.xpHint}>
                            {level < TOTAL_STAGES
                                ? t('battle.xpToNextLevel', { days: Math.max(0, xpNeed - xpInLevel), level: level + 1 })
                                : t('achievements.maxLevel')}
                        </Text>
                    </View>

                    {__DEV__ ? (
                        <View style={styles.devCard}>
                            <Text style={styles.devTitle}>DEV Test</Text>
                            <View style={styles.devRow}>
                                <TouchableOpacity style={styles.devButton} onPress={() => setDevBoostDays((prev) => prev + 36)}>
                                    <Text style={styles.devButtonText}>+36 ngày</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.devButton} onPress={() => setDevBoostDays((prev) => prev + 180)}>
                                    <Text style={styles.devButtonText}>+180 ngày</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.devButton, styles.devButtonGhost]} onPress={() => setDevBoostDays(0)}>
                                    <Text style={[styles.devButtonText, styles.devButtonGhostText]}>Reset</Text>
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.devHint}>Base: {petProgressDays} | Boost: +{devBoostDays} | Display: {effectivePetDays}</Text>
                        </View>
                    ) : null}

                    <View style={styles.milestoneCard}>
                        <View style={styles.milestoneRow}>
                            {milestones.map((m) => {
                                const unlocked = petStreak >= m;
                                return (
                                    <View key={m} style={[styles.milestoneChip, unlocked && styles.milestoneChipActive]}>
                                        <Text style={[styles.milestoneText, unlocked && styles.milestoneTextActive]}>{t('battle.dayCount', { count: m })}</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <Text style={styles.milestoneHint}>{t('battle.unlockedMilestones', { unlocked: achievedMilestones, total: 5 })}</Text>
                    </View>

                </ScrollView>
            )}

            {/* Sort Modal */}
            <Modal visible={showSortMenu} transparent animationType="fade">
                <Pressable style={styles.overlay} onPress={() => setShowSortMenu(false)}>
                    <View style={styles.sortMenuContainer}>
                        <View style={styles.sortMenu}>
                            <Text style={styles.sortMenuTitle}>{t('battle.sortBy')}</Text>
                            {SORT_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        styles.sortMenuItem,
                                        sortMode === option.key && styles.sortMenuItemActive,
                                    ]}
                                    onPress={() => {
                                        setSortMode(option.key);
                                        setShowSortMenu(false);
                                    }}
                                >
                                    <Text style={styles.sortMenuItemIcon}>{option.icon}</Text>
                                    <Text style={[
                                        styles.sortMenuItemText,
                                        sortMode === option.key && styles.sortMenuItemTextActive,
                                    ]}>
                                        {t(option.labelKey)}
                                    </Text>
                                    {sortMode === option.key && (
                                        <View style={styles.checkCircle}>
                                            <Text style={styles.checkMark}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    title: { fontSize: 22, fontWeight: '700', color: Colors.primary },
    sortButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
    },
    sortButtonText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    levelPill: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 16,
        backgroundColor: '#E8F3FF',
    },
    levelPillText: { fontSize: 13, fontWeight: '700', color: '#2563EB' },
    tabs: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 4,
        marginBottom: 12,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: '#FFFFFF', ...Shadows.small },
    tabText: { fontSize: 14, color: Colors.textSecondary, fontWeight: '500' },
    tabTextActive: { color: Colors.primary, fontWeight: '700' },

    sortBadgeRow: { paddingHorizontal: 20, marginBottom: 8 },
    sortBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#FFF5E1',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 5,
        gap: 6,
    },
    sortBadgeIcon: { fontSize: 12 },
    sortBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.streak },

    podium: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingHorizontal: 20,
        marginBottom: 0,
        gap: 8,
    },
    podiumItem: { alignItems: 'center', flex: 1 },
    goldCrown: { fontSize: 24, marginBottom: 4 },
    podiumAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    podiumAvatarFirst: { width: 68, height: 68, borderRadius: 34 },
    podiumEmoji: { fontSize: 26 },
    podiumAvatarImg: { width: 52, height: 52, borderRadius: 26 },
    podiumAvatarImgFirst: { width: 64, height: 64, borderRadius: 32 },
    crown: {
        position: 'absolute',
        bottom: -6,
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    crownText: { fontSize: 10, fontWeight: '800', color: '#FFF' },
    podiumName: { fontSize: 12, fontWeight: '600', color: Colors.text, marginTop: 10 },
    podiumScore: { fontSize: 13, fontWeight: '800', color: Colors.primary, marginTop: 2 },
    podiumScoreFirst: { fontSize: 16, color: Colors.primary },
    podiumBar: {
        width: '85%',
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        marginTop: 8,
    },

    rankingsDivider: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    rankingsLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 1, textTransform: 'uppercase' },
    rankingsTimer: { fontSize: 11, color: Colors.textLight, fontWeight: '500' },

    rankings: { paddingHorizontal: 16 },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        gap: 12,
    },
    rankRowYou: {
        backgroundColor: '#F0F4F8',
        borderWidth: 1.5,
        borderColor: Colors.primary,
        marginBottom: 0,
    },
    youBar: {
        position: 'absolute',
        bottom: 80,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 12,
        backgroundColor: 'rgba(245,246,248,0.95)',
    },
    rankNum: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, width: 24, textAlign: 'center', fontVariant: ['tabular-nums'] },
    rankAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankAvatarImage: { width: 40, height: 40, borderRadius: 20 },
    rankInfo: { flex: 1 },
    rankName: { fontSize: 14, fontWeight: '600', color: Colors.text },
    rankStreak: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    rankScore: { fontSize: 16, fontWeight: '800', color: Colors.text, marginRight: 4 },
    rankChangeContainer: { width: 30, alignItems: 'flex-end' },
    rankChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    rankChange: { fontSize: 11, fontWeight: '700' },
    rankUp: { color: Colors.primary },
    rankDown: { color: Colors.red },

    achievementsContent: {
        paddingHorizontal: 16,
        paddingBottom: 32,
    },
    petStatRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 12,
    },
    petStatCard: {
        flex: 1,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        padding: 12,
        ...Shadows.small,
    },
    petStatLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    petStatValue: { marginTop: 6, fontSize: 16, color: Colors.primary, fontWeight: '800' },
    petArena: {
        marginTop: 6,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dragonWrap: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.medium,
    },
    dragonVideo: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    petName: {
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '800',
        color: Colors.primary,
    },
    petDesc: {
        textAlign: 'center',
        marginTop: 6,
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 14,
    },
    xpCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        ...Shadows.small,
    },
    xpTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    xpTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
    xpValue: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    xpTrack: {
        height: 10,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
    },
    xpFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 8,
    },
    xpHint: { marginTop: 8, fontSize: 12, color: Colors.textSecondary },
    devCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        ...Shadows.small,
    },
    devTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    devRow: {
        flexDirection: 'row',
        gap: 8,
    },
    devButton: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 10,
        paddingVertical: 9,
        backgroundColor: Colors.primary,
    },
    devButtonGhost: {
        backgroundColor: '#F3F4F6',
    },
    devButtonText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    devButtonGhostText: {
        color: '#111827',
    },
    devHint: {
        marginTop: 8,
        fontSize: 11,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    milestoneCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        ...Shadows.small,
    },
    milestoneRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
    milestoneChip: {
        flex: 1,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D1D5DB',
        backgroundColor: '#F9FAFB',
        paddingVertical: 8,
        alignItems: 'center',
    },
    milestoneChipActive: {
        borderColor: Colors.primary,
        backgroundColor: '#E8ECF0',
    },
    milestoneText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    milestoneTextActive: { color: Colors.primary, fontWeight: '700' },
    milestoneHint: { fontSize: 12, color: Colors.textSecondary },
    // Sort Modal
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    sortMenuContainer: { paddingHorizontal: 16, paddingBottom: 40 },
    sortMenu: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 16,
        ...Shadows.medium,
    },
    sortMenuTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sortMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 4,
        gap: 12,
    },
    sortMenuItemActive: {
        backgroundColor: '#E8ECF0',
    },
    sortMenuItemIcon: { fontSize: 20 },
    sortMenuItemText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
    sortMenuItemTextActive: { fontWeight: '700', color: Colors.primary },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMark: { color: '#FFF', fontSize: 13, fontWeight: '700' },
    // Add friend button + badge
    addFriendButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
    },
    addFriendText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
    badge: {
        width: 18, height: 18, borderRadius: 9,
        backgroundColor: Colors.red, justifyContent: 'center', alignItems: 'center',
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
    // Empty state
    emptyState: {
        flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80,
    },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
    emptyDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40, marginBottom: 24 },
    emptyAddBtn: {
        paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,
        backgroundColor: Colors.primary,
    },
    emptyAddText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
