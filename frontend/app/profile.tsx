import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { signOut, fetchAuthSession } from 'aws-amplify/auth';
import * as ImagePicker from 'expo-image-picker';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { useAuthStore } from '../src/store/authStore';
import { getOnboardingData, getUserData, saveUserData, UserData } from '../src/store/userStore';
import { useFriendStore } from '../src/store/friendStore';
import { useMealStore, getTodayDate } from '../src/store/mealStore';
import { getCurrentStreak } from '../src/utils/streak';
import { updateMyPublicStats } from '../src/services/friendService';
import { updateUserProfileInDB } from '../src/services/userService';
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
    const { logout, email, userId } = useAuthStore();
    const { myFriendCode, loadMyFriendCode, friends, loadFriends } = useFriendStore();
    const meals = useMealStore(s => s.meals);
    const streak = React.useMemo(() => {
        const mealDateSet = new Set(meals.map(m => m.date));
        return getCurrentStreak(mealDateSet, getTodayDate());
    }, [meals]);
    const [codeCopied, setCodeCopied] = React.useState(false);
    const [gender, setGender] = React.useState<string>('');
    const [userData, setUserData] = React.useState<UserData>({
        name: '',
        email: email || '',
        weight: 0,
        goalWeight: 0,
        streak: 0,
        dailyCalories: 0,
        waterIntake: 0,
        waterGoal: 2000,
    });
    const [profileName, setProfileName] = React.useState(email || '');
    const [activityLevel, setActivityLevel] = React.useState('');
    const [avatarUri, setAvatarUri] = React.useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
    const localAvatarRef = React.useRef(false);

    React.useEffect(() => {
        if (userId) {
            loadMyFriendCode(userId);
            loadFriends();
        }
    }, [userId]);

    useFocusEffect(
        useCallback(() => {
            const fetchUserData = async () => {
                const [onboarding, storedUser] = await Promise.all([getOnboardingData(), getUserData()]);

                if (onboarding?.gender) {
                    setGender(onboarding.gender.toLowerCase());
                }

                if (storedUser) {
                    // Use onboarding values as fallback only when USER_KEY fields are 0/missing
                    const resolvedUser: UserData = {
                        ...storedUser,
                        weight: storedUser.weight > 0 ? storedUser.weight : (onboarding?.currentWeight || 0),
                        goalWeight: storedUser.goalWeight > 0 ? storedUser.goalWeight : (onboarding?.targetWeight || 0),
                    };
                    setUserData(resolvedUser);
                    if (resolvedUser.avatar_url && !localAvatarRef.current) {
                        const raw = resolvedUser.avatar_url;
                        if (raw.startsWith('http') || raw.startsWith('file://')) {
                            setAvatarUri(raw);
                        } else {
                            try {
                                const { url } = await getUrl({ path: raw });
                                if (!localAvatarRef.current) {
                                    setAvatarUri(url.toString());
                                }
                            } catch (e) {
                                console.warn("Avatar resolve failed", e);
                            }
                        }
                    }
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

    const handlePickAvatar = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Please allow access to your photo library.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (result.canceled || !result.assets?.[0]) return;

        const pickedUri = result.assets[0].uri;
        localAvatarRef.current = true;
        setAvatarUri(pickedUri); // Immediate local display

        // Upload to S3 if user is authenticated
        if (userId) {
            setUploadingAvatar(true);
            try {
                // Get the Cognito Identity ID — this is the {entity_id} that Amplify
                // storage access rules use to scope paths like incoming/{entity_id}/*
                const session = await fetchAuthSession();
                const identityId = session.identityId;
                if (!identityId) {
                    console.warn('[AVATAR] No identityId found — cannot upload');
                    return;
                }

                console.log('[AVATAR] identityId:', identityId);

                // Read the picked image as a blob
                const response = await fetch(pickedUri);
                const blob = await response.blob();

                // Upload directly to avatar/{identityId}/avatar.jpg
                // Dedicated path with write permission — no Lambda needed for small avatar images
                const avatarKey = `avatar/${identityId}/avatar.jpg`;
                console.log('[AVATAR] Uploading to:', avatarKey, 'size:', blob.size);
                await uploadData({ path: avatarKey, data: blob, options: { contentType: 'image/jpeg' } }).result;
                console.log('[AVATAR] Upload complete');

                // Resolve presigned URL immediately — file exists right after upload
                const { url } = await getUrl({ path: avatarKey });
                const presignedUrl = url.toString();
                setAvatarUri(presignedUrl);
                localAvatarRef.current = false;

                // Persist the S3 key (not presigned URL — keys don't expire)
                await saveUserData({ avatar_url: avatarKey });
                // Sync to DynamoDB user model + public stats (fire-and-forget)
                updateUserProfileInDB(userId, { avatar_url: avatarKey }).catch(() => {});
                await updateMyPublicStats({ user_id: userId, avatar_url: avatarKey });
            } catch (e) {
                console.warn('[AVATAR] Upload failed:', e);
                Alert.alert('Upload Error', 'Could not upload avatar. Please try again.');
            } finally {
                setUploadingAvatar(false);
            }
        }
    };

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
        if (!value) return t('profile.activity.notSet');
        
        // Handle custom values mapped to translations
        const translationKey = `profile.activityOption.${value}.label`;
        const translated = t(translationKey);
        
        // Fallback if missing
        if (translated === translationKey) {
            return value;
        }
        return translated;
    };

    const stats = [
        { label: t('profile.weight'), value: userData.weight > 0 ? String(userData.weight) : '--', unit: 'kg' },
        { label: t('profile.goal'), value: userData.goalWeight > 0 ? String(userData.goalWeight) : '--', unit: 'kg' },
        { label: t('profile.streak'), value: String(streak), unit: '🔥' },
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
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : gender === 'male' ? (
                                <Image source={require('../assets/images/male.png')} style={styles.avatarImage} />
                            ) : gender === 'female' ? (
                                <Image source={require('../assets/images/female.png')} style={styles.avatarImage} />
                            ) : (
                                <ProfileIcon size={20} color="#000" />
                            )}
                            {uploadingAvatar && (
                                <View style={styles.avatarOverlay}>
                                    <ActivityIndicator color="#FFF" />
                                </View>
                            )}
                        </View>
                        <TouchableOpacity style={styles.editBadge} onPress={handlePickAvatar}>
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

                {/* Friend Code Section */}
                <View style={styles.friendCodeCard}>
                    <View style={styles.friendCodeHeader}>
                        <Text style={styles.friendCodeLabel}>{t('friend.myCode')}</Text>
                        <Text style={styles.friendCountText}>
                            {t('friend.friendCount', { count: friends.length })}
                        </Text>
                    </View>
                    <View style={styles.friendCodeRow}>
                        <View style={styles.friendCodeBox}>
                            <Text style={styles.friendCodeText}>{myFriendCode || '--------'}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.friendCopyBtn}
                            onPress={async () => {
                                if (myFriendCode) {
                                    Alert.alert('Friend Code', myFriendCode);
                                    setCodeCopied(true);
                                    setTimeout(() => setCodeCopied(false), 2000);
                                }
                            }}
                        >
                            <Text style={styles.friendCopyText}>
                                {codeCopied ? t('friend.copied') : t('friend.copyCode')}
                            </Text>
                        </TouchableOpacity>
                    </View>
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
    avatarOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
    },
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

    friendCodeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 16,
        borderWidth: 1,
        borderColor: '#EDEDF0',
    },
    friendCodeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    friendCodeLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    friendCountText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.accent,
    },
    friendCodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    friendCodeBox: {
        flex: 1,
        height: 46,
        borderRadius: 12,
        backgroundColor: '#F0F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#D0D8E8',
        borderStyle: 'dashed',
    },
    friendCodeText: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 3,
    },
    friendCopyBtn: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: Colors.accentLight,
    },
    friendCopyText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.accent,
    },
});
