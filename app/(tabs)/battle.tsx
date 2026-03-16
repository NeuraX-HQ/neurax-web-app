import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/constants/colors';
import { mockLeaderboard } from '../../src/data/mockData';
import Svg, { Path, Circle, Line } from 'react-native-svg';

type SortMode = 'streak' | 'petScore';

function SortIcon({ size = 20, color = '#000' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Line x1="4" y1="6" x2="13" y2="6" />
            <Line x1="4" y1="12" x2="11" y2="12" />
            <Line x1="4" y1="18" x2="9" y2="18" />
            <Path d="M17 8l3 -3 3 3" />
            <Path d="M20 5v14" />
        </Svg>
    );
}

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

const SORT_OPTIONS: { key: SortMode; label: string; icon: string }[] = [
    { key: 'streak', label: 'Chuỗi ngày', icon: '🔥' },
    { key: 'petScore', label: 'Điểm nuôi dưỡng bé', icon: '🐾' },
];

export default function BattleScreen() {
    const [tab, setTab] = useState<'friends' | 'achievements'>('friends');
    const [sortMode, setSortMode] = useState<SortMode>('streak');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [petScore, setPetScore] = useState(420);
    const [petStreak, setPetStreak] = useState(3);

    const floatAnim = useState(new Animated.Value(0))[0];
    const breatheAnim = useState(new Animated.Value(0))[0];
    const blinkAnim = useState(new Animated.Value(1))[0];
    const tailAnim = useState(new Animated.Value(0))[0];
    const celebrateAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        // Friends ranking focuses on streak, achievements focuses on pet score.
        setSortMode(tab === 'friends' ? 'streak' : 'petScore');
    }, [tab]);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, { toValue: 1, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(floatAnim, { toValue: 0, duration: 1900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(breatheAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(breatheAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.delay(1900),
                Animated.timing(blinkAnim, { toValue: 0.15, duration: 90, useNativeDriver: true }),
                Animated.timing(blinkAnim, { toValue: 1, duration: 90, useNativeDriver: true }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(tailAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
                Animated.timing(tailAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
                Animated.timing(tailAnim, { toValue: -1, duration: 280, useNativeDriver: true }),
                Animated.timing(tailAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
            ])
        ).start();
    }, [blinkAnim, breatheAnim, floatAnim, tailAnim]);

    const sortedData = useMemo(() => {
        const data = [...mockLeaderboard];
        if (sortMode === 'streak') {
            data.sort((a, b) => b.streak - a.streak);
        } else {
            data.sort((a, b) => b.petScore - a.petScore);
        }
        return data.map((item, i) => ({ ...item, rank: i + 1 }));
    }, [sortMode]);

    const top3 = sortedData.slice(0, 3);
    const rest = sortedData.slice(3);

    const getDisplayScore = (user: typeof mockLeaderboard[0]) => {
        return sortMode === 'streak' ? `${user.streak} ngày` : `${user.petScore}`;
    };

    const getDisplayScoreShort = (user: typeof mockLeaderboard[0]) => {
        return sortMode === 'streak' ? `${user.streak}` : `${user.petScore}`;
    };

    const level = Math.floor(petScore / 200) + 1;
    const xpInLevel = petScore % 200;
    const xpNeed = 200;

    const getPetSize = () => {
        if (petStreak >= 30) return 250;
        if (petStreak >= 14) return 220;
        if (petStreak >= 7) return 190;
        if (petStreak >= 3) return 165;
        return 140;
    };

    const petSize = getPetSize();
    const dragonScale = breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
    const dragonFloat = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
    const dragonTilt = floatAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: ['-2deg', '2deg', '-2deg'] });
    const tailRotate = tailAnim.interpolate({ inputRange: [-1, 0, 1], outputRange: ['-18deg', '0deg', '18deg'] });
    const celebrateScale = celebrateAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.16] });
    const celebrateLift = celebrateAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });

    const milestones = [3, 7, 14, 30];
    const achievedMilestones = milestones.filter((m) => petStreak >= m).length;
    const currentBadge =
        petStreak >= 30 ? 'Huyen thoai' :
            petStreak >= 14 ? 'Kim cuong' :
                petStreak >= 7 ? 'Vang' :
                    petStreak >= 3 ? 'Bac' : 'Khoi dau';

    const playPetCelebrate = () => {
        Animated.sequence([
            Animated.timing(celebrateAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
            Animated.timing(celebrateAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
        ]).start();
        setPetScore((prev) => prev + 25);
    };

    const completeDailyStreak = () => {
        setPetStreak((prev) => prev + 1);
        setPetScore((prev) => prev + 60);
        playPetCelebrate();
    };

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
                <Text style={styles.title}>Bảng xếp hạng</Text>
                {tab === 'friends' ? (
                    <TouchableOpacity
                        style={styles.sortButton}
                        onPress={() => setShowSortMenu(true)}
                    >
                        <Text style={styles.sortButtonText}>Sắp xếp</Text>
                        <ChevronDown size={14} color={Colors.textSecondary} />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.levelPill}>
                        <Text style={styles.levelPillText}>Lv {level}</Text>
                    </View>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, tab === 'friends' && styles.tabActive]}
                    onPress={() => setTab('friends')}
                >
                    <Text style={[styles.tabText, tab === 'friends' && styles.tabTextActive]}>Bạn bè</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, tab === 'achievements' && styles.tabActive]}
                    onPress={() => setTab('achievements')}
                >
                    <Text style={[styles.tabText, tab === 'achievements' && styles.tabTextActive]}>Thành tích</Text>
                </TouchableOpacity>
            </View>

            {tab === 'friends' ? (
                <>
                    <ScrollView showsVerticalScrollIndicator={false}>
                {/* Sort badge */}
                <View style={styles.sortBadgeRow}>
                    <View style={styles.sortBadge}>
                        <Text style={styles.sortBadgeIcon}>
                            {SORT_OPTIONS.find(o => o.key === sortMode)?.icon}
                        </Text>
                        <Text style={styles.sortBadgeText}>
                            {SORT_OPTIONS.find(o => o.key === sortMode)?.label}
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
                            <View key={user.name} style={styles.podiumItem}>
                                {isFirst && <Text style={styles.goldCrown}>👑</Text>}
                                {!isFirst && <View style={{ height: 28 }} />}
                                <View style={[
                                    styles.podiumAvatar,
                                    isFirst && styles.podiumAvatarFirst,
                                    { backgroundColor: podiumColors[idx], borderColor: podiumBorderColors[idx], borderWidth: isFirst ? 3 : 2 },
                                ]}>
                                    <Text style={styles.podiumEmoji}>{podiumEmojis[idx]}</Text>
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
                    <Text style={styles.rankingsLabel}>Xếp hạng</Text>
                    <Text style={styles.rankingsTimer}>Làm mới sau 4h</Text>
                </View>

                {/* Rankings List */}
                <View style={styles.rankings}>
                    {rest.map((user) => (
                        <View key={user.rank} style={[styles.rankRow, Shadows.small]}>
                            <Text style={styles.rankNum}>
                                {String(user.rank).padStart(2, '0')}
                            </Text>
                            <View style={styles.rankAvatar}>
                                <Text>👤</Text>
                            </View>
                            <View style={styles.rankInfo}>
                                <Text style={styles.rankName}>{user.name}</Text>
                                <Text style={styles.rankStreak}>
                                    {sortMode === 'streak'
                                        ? `🔥 ${user.streak} ngày liên tiếp`
                                        : `🐾 ${user.petScore} điểm`}
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
                            <Text style={[styles.rankNum, { color: Colors.accent }]}>42</Text>
                            <View style={[styles.rankAvatar, { backgroundColor: Colors.accentLight }]}>
                                <Text>👤</Text>
                            </View>
                            <View style={styles.rankInfo}>
                                <Text style={[styles.rankName, { color: Colors.accent }]}>Bạn</Text>
                                <Text style={styles.rankStreak}>
                                    {sortMode === 'streak' ? `🔥 ${petStreak} ngày liên tiếp` : `🐾 ${petScore} điểm`}
                                </Text>
                            </View>
                            <Text style={[styles.rankScore, { color: Colors.accent }]}>
                                {sortMode === 'streak' ? String(petStreak) : String(petScore)}
                            </Text>
                            <View style={styles.rankChangeRow}>
                                <ArrowUp size={12} />
                                <Text style={[styles.rankChange, styles.rankUp]}>4</Text>
                            </View>
                        </View>
                    </View>
                </>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.achievementsContent}>
                    <View style={styles.petStatRow}>
                        <View style={styles.petStatCard}>
                            <Text style={styles.petStatLabel}>Chuỗi hiện tại</Text>
                            <Text style={styles.petStatValue}>🔥 {petStreak}</Text>
                        </View>
                        <View style={styles.petStatCard}>
                            <Text style={styles.petStatLabel}>Badge</Text>
                            <Text style={styles.petStatValue}>🏅 {currentBadge}</Text>
                        </View>
                    </View>

                    <View style={styles.petArena}>
                        <Animated.View
                            style={[
                                styles.petAura,
                                {
                                    width: petSize + 48,
                                    height: petSize + 48,
                                    borderRadius: (petSize + 48) / 2,
                                    transform: [{ scale: dragonScale }],
                                },
                            ]}
                        />

                        <Animated.View
                            style={[
                                styles.dragonWrap,
                                {
                                    width: petSize,
                                    height: petSize,
                                    borderRadius: petSize / 2,
                                    transform: [
                                        { translateY: dragonFloat },
                                        { rotate: dragonTilt },
                                        { scale: celebrateScale },
                                        { translateY: celebrateLift },
                                    ],
                                },
                            ]}
                        >
                            <Animated.View style={[styles.dragonTail, { transform: [{ rotate: tailRotate }] }]} />
                            <Text style={[styles.dragonEmoji, { fontSize: Math.round(petSize * 0.38) }]}>🐲</Text>
                            <View style={styles.dragonFaceRow}>
                                <Animated.View style={[styles.dragonEye, { transform: [{ scaleY: blinkAnim }] }]} />
                                <Animated.View style={[styles.dragonEye, { transform: [{ scaleY: blinkAnim }] }]} />
                            </View>
                        </Animated.View>
                    </View>

                    <Text style={styles.petName}>Rong Chibi cua ban</Text>
                    <Text style={styles.petDesc}>Chuoi ngay cang dai, be rong cang lon va nang cap ngoai hinh.</Text>

                    <View style={styles.xpCard}>
                        <View style={styles.xpTopRow}>
                            <Text style={styles.xpTitle}>XP & Level</Text>
                            <Text style={styles.xpValue}>{xpInLevel}/{xpNeed} XP</Text>
                        </View>
                        <View style={styles.xpTrack}>
                            <View style={[styles.xpFill, { width: `${Math.min(100, (xpInLevel / xpNeed) * 100)}%` }]} />
                        </View>
                        <Text style={styles.xpHint}>Con {xpNeed - xpInLevel} XP de len Level {level + 1}</Text>
                    </View>

                    <View style={styles.milestoneCard}>
                        <Text style={styles.milestoneTitle}>Moc lon len theo chuoi ngay</Text>
                        <View style={styles.milestoneRow}>
                            {milestones.map((m) => {
                                const unlocked = petStreak >= m;
                                return (
                                    <View key={m} style={[styles.milestoneChip, unlocked && styles.milestoneChipActive]}>
                                        <Text style={[styles.milestoneText, unlocked && styles.milestoneTextActive]}>{m} ngay</Text>
                                    </View>
                                );
                            })}
                        </View>
                        <Text style={styles.milestoneHint}>Da mo khoa: {achievedMilestones}/4 moc</Text>
                    </View>

                    <View style={styles.petActionRow}>
                        <TouchableOpacity style={styles.petActionButton} onPress={playPetCelebrate}>
                            <Text style={styles.petActionText}>Vuot ve +25 XP</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.petActionButton, styles.petActionButtonPrimary]} onPress={completeDailyStreak}>
                            <Text style={[styles.petActionText, styles.petActionTextPrimary]}>Hoan thanh ngay +60 XP</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            )}

            {/* Sort Modal */}
            <Modal visible={showSortMenu} transparent animationType="fade">
                <Pressable style={styles.overlay} onPress={() => setShowSortMenu(false)}>
                    <View style={styles.sortMenuContainer}>
                        <View style={styles.sortMenu}>
                            <Text style={styles.sortMenuTitle}>Sắp xếp theo</Text>
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
                                        {option.label}
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
    podiumScore: { fontSize: 13, fontWeight: '800', color: Colors.accent, marginTop: 2 },
    podiumScoreFirst: { fontSize: 16, color: Colors.accent },
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
        backgroundColor: Colors.accentLight,
        borderWidth: 1.5,
        borderColor: Colors.accent,
        marginBottom: 0,
    },
    youBar: {
        position: 'absolute',
        bottom: 0,
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
    rankInfo: { flex: 1 },
    rankName: { fontSize: 14, fontWeight: '600', color: Colors.text },
    rankStreak: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    rankScore: { fontSize: 16, fontWeight: '800', color: Colors.text, marginRight: 4 },
    rankChangeContainer: { width: 30, alignItems: 'flex-end' },
    rankChangeRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    rankChange: { fontSize: 11, fontWeight: '700' },
    rankUp: { color: Colors.accent },
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
        minHeight: 300,
    },
    petAura: {
        position: 'absolute',
        backgroundColor: '#D1FAE5',
        opacity: 0.65,
    },
    dragonWrap: {
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.medium,
    },
    dragonTail: {
        position: 'absolute',
        right: -10,
        bottom: 14,
        width: 26,
        height: 12,
        borderRadius: 8,
        backgroundColor: '#A7F3D0',
    },
    dragonEmoji: {
        lineHeight: 90,
    },
    dragonFaceRow: {
        position: 'absolute',
        top: '38%',
        flexDirection: 'row',
        gap: 18,
    },
    dragonEye: {
        width: 8,
        height: 10,
        borderRadius: 4,
        backgroundColor: '#111827',
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
    xpValue: { fontSize: 13, fontWeight: '700', color: Colors.accent },
    xpTrack: {
        height: 10,
        borderRadius: 8,
        backgroundColor: '#E5E7EB',
        overflow: 'hidden',
    },
    xpFill: {
        height: '100%',
        backgroundColor: Colors.accent,
        borderRadius: 8,
    },
    xpHint: { marginTop: 8, fontSize: 12, color: Colors.textSecondary },
    milestoneCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginBottom: 14,
        ...Shadows.small,
    },
    milestoneTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 10 },
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
        borderColor: Colors.accent,
        backgroundColor: Colors.accentLight,
    },
    milestoneText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    milestoneTextActive: { color: Colors.accent, fontWeight: '700' },
    milestoneHint: { fontSize: 12, color: Colors.textSecondary },
    petActionRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
    petActionButton: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    petActionButtonPrimary: {
        backgroundColor: '#DEF7EC',
        borderColor: Colors.accent,
    },
    petActionText: {
        color: Colors.text,
        fontSize: 13,
        fontWeight: '700',
    },
    petActionTextPrimary: {
        color: Colors.accent,
    },

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
        backgroundColor: Colors.accentLight,
    },
    sortMenuItemIcon: { fontSize: 20 },
    sortMenuItemText: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
    sortMenuItemTextActive: { fontWeight: '700', color: Colors.accent },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkMark: { color: '#FFF', fontSize: 13, fontWeight: '700' },
});
