import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { signOut } from 'aws-amplify/auth';
import { useAuthStore } from '../src/store/authStore';
import { getOnboardingData, getUserData, UserData } from '../src/store/userStore';
import { Colors, Shadows } from '../src/constants/colors';
import { ProfileIcon } from '../src/components/TabIcons';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

// --- Inline SVG Icons ---
function BackArrow({ size = 22, color = Colors.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
        </Svg>
    );
}

function MoreIcon({ size = 22, color = Colors.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="1" />
            <Circle cx="19" cy="12" r="1" />
            <Circle cx="5" cy="12" r="1" />
        </Svg>
    );
}

function EditPenIcon({ size = 16, color = '#FFF' }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </Svg>
    );
}

function PersonIcon({ size = 20, color = Colors.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <Circle cx="12" cy="7" r="4" />
        </Svg>
    );
}

function TargetIcon({ size = 20, color = Colors.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Circle cx="12" cy="12" r="10" />
            <Circle cx="12" cy="12" r="6" />
            <Circle cx="12" cy="12" r="2" />
        </Svg>
    );
}

function ActivityIcon({ size = 20, color = Colors.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </Svg>
    );
}

function SyncIcon({ size = 20, color = Colors.primary }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Polyline points="23 4 23 10 17 10" />
            <Polyline points="1 20 1 14 7 14" />
            <Path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </Svg>
    );
}

function ChevronRight({ size = 18, color = Colors.textLight }: { size?: number; color?: string }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 18l6-6-6-6" />
        </Svg>
    );
}

export default function ProfileScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const { logout, email } = useAuthStore();
    const [gender, setGender] = React.useState<string>('');
    const [userData, setUserData] = React.useState<UserData>({
        name: 'Admin',
        email: 'admin@nutritrack.com',
        weight: 75,
        goalWeight: 70,
        streak: 14,
        dailyCalories: 1800,
        waterIntake: 800,
        waterGoal: 2500,
    });
    const [profileName, setProfileName] = React.useState('Admin');
    const [activityLevel, setActivityLevel] = React.useState('');

    useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                const [onboarding, storedUser] = await Promise.all([getOnboardingData(), getUserData()]);

                if (onboarding?.gender) {
                    setGender(onboarding.gender.toLowerCase());
                }

                if (storedUser) {
                    setUserData(storedUser);
                }

                if (onboarding?.name?.trim()) {
                    setProfileName(onboarding.name.trim());
                } else if (storedUser?.name?.trim()) {
                    setProfileName(storedUser.name.trim());
                }

                if (onboarding?.activityLevel?.trim()) {
                    setActivityLevel(onboarding.activityLevel);
                }
            };
            fetchUserData();
        }, [])
    );

    const handleSignOut = async () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(t('settings.logoutMessage'));
            if (confirmed) {
                try {
                    await signOut();
                    await logout();
                    router.replace('/welcome');
                } catch (error) {
                    console.log('Error signing out: ', error);
                }
            }
        } else {
            Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('settings.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            await logout();
                            router.replace('/welcome');
                        } catch (error) {
                            console.log('Error signing out: ', error);
                        }
                    },
                },
            ]);
        }
    };

    const formatActivityLevel = (value: string) => {
        const normalized = value.toLowerCase();
        if (normalized.includes('light')) return t('profile.activity.light');
        if (normalized.includes('moderate')) return t('profile.activity.moderate');
        if (normalized.includes('active')) return t('profile.activity.active');
        if (normalized.includes('very')) return t('profile.activity.veryActive');
        return value || t('profile.activity.notSet');
    };

    const stats = [
        { label: t('profile.weight'), value: String(userData.weight), unit: 'kg' },
        { label: t('profile.goal'), value: String(userData.goalWeight), unit: 'kg' },
        { label: t('profile.streak'), value: String(userData.streak), unit: '🔥' },
    ];

    const accountItems = [
        { label: t('profile.personalInfo'), icon: <PersonIcon />, onPress: () => router.push('/profile-personal-info') },
        { label: t('profile.healthGoal'), icon: <TargetIcon />, onPress: () => router.push('/profile-health-goal') },
        { label: `${t('profile.activityLevel')}: ${formatActivityLevel(activityLevel)}`, icon: <ActivityIcon />, onPress: () => router.push('/profile-activity-level') },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                    <BackArrow />
                </TouchableOpacity>
                <Text style={styles.title}>{t('profile.title')}</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <MoreIcon />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            {gender === 'male' ? (
                                <Image source={require('../assets/images/male.png')} style={styles.avatarImage} />
                            ) : gender === 'female' ? (
                                <Image source={require('../assets/images/female.png')} style={styles.avatarImage} />
                            ) : (
                                <ProfileIcon size={20} color="#000" />
                            )}
                        </View>
                        <TouchableOpacity style={styles.editBadge}>
                            <EditPenIcon size={14} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>{profileName}</Text>
                    <Text style={styles.userEmail}>{email || userData.email}</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    {stats.map((stat) => (
                        <View key={stat.label} style={styles.statCard}>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                            <View style={styles.statValueRow}>
                                <Text style={styles.statValue}>{stat.value}</Text>
                                <Text style={styles.statUnit}> {stat.unit}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Account Section */}
                <Text style={styles.sectionTitle}>{t('settings.section.account')}</Text>
                <View style={styles.menuGroup}>
                    {accountItems.map((item, idx) => (
                        <TouchableOpacity
                            key={item.label}
                            style={[
                                styles.menuItem,
                                idx < accountItems.length - 1 && styles.menuItemBorder,
                            ]}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuIconBox}>{item.icon}</View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <ChevronRight />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Integrations Section */}
                <Text style={styles.sectionTitle}>{t('profile.integrations')}</Text>
                <View style={styles.menuGroup}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Alert.alert(t('common.success'), t('profile.integrationSoon'))}
                    >
                        <View style={styles.menuIconBox}>
                            <SyncIcon />
                        </View>
                        <Text style={styles.menuLabel}>{t('profile.connectedApps')}</Text>
                        <Text style={styles.menuBadge}>{t('profile.activeCount', { count: 2 })}</Text>
                        <ChevronRight />
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <Text style={styles.sectionTitle}>{t('settings.section.preferences')}</Text>
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]} onPress={() => router.push('/settings')}>
                        <View style={styles.menuIconBox}>
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <Circle cx="12" cy="12" r="3" />
                                <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </Svg>
                        </View>
                        <Text style={styles.menuLabel}>{t('settings.title')}</Text>
                        <ChevronRight />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/notifications')}>
                        <View style={styles.menuIconBox}>
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </Svg>
                        </View>
                        <Text style={styles.menuLabel}>{t('profile.notifications')}</Text>
                        <ChevronRight />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
                        <View style={[styles.menuIconBox, { backgroundColor: '#FFEEF0' }]}>
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FF4D4D" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <Polyline points="16 17 21 12 16 7" />
                                <Line x1="21" y1="12" x2="9" y2="12" />
                            </Svg>
                        </View>
                        <Text style={[styles.menuLabel, { color: '#FF4D4D' }]}>{t('settings.logout')}</Text>
                        <ChevronRight color="#FF4D4D" />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 60 }} />
            </ScrollView>
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
    headerBtn: { padding: 4 },
    title: { fontSize: 18, fontWeight: '700', color: Colors.primary },

    avatarSection: { alignItems: 'center', paddingTop: 20, paddingBottom: 24 },
    avatarContainer: { position: 'relative', marginBottom: 14 },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#E8ECF0',
        overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    editBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2.5,
        borderColor: Colors.background,
    },
    userName: { fontSize: 22, fontWeight: '700', color: Colors.primary },
    userEmail: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },

    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 28,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#EDEDF0',
    },
    statLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginBottom: 4 },
    statValueRow: { flexDirection: 'row', alignItems: 'baseline' },
    statValue: { fontSize: 22, fontWeight: '700', color: Colors.primary },
    statUnit: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },

    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
        paddingHorizontal: 24,
        marginBottom: 10,
    },
    menuGroup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#EDEDF0',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        gap: 14,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F3F3F5',
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.text },
    menuBadge: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500', marginRight: 4 },
});
