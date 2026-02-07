import React from 'react';
import {
    View,
    Text,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Colors, Shadows } from '../../constants/Theme';

export default function ProfileScreen() {
    const { user, signOut, isGuest } = useAuth();
    const { currentStreak, todaysMacros, macroTargets } = useApp();

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]
        );
    };

    // Calculate weekly stats (mock)
    const weeklyStats = {
        avgCalories: 1650,
        avgProtein: 98,
        daysLogged: 5,
        streakDays: currentStreak,
    };

    const menuItems = [
        { icon: 'person-outline', label: 'Edit Profile', action: () => { } },
        { icon: 'fitness-outline', label: 'Goals & Targets', action: () => { } },
        { icon: 'restaurant-outline', label: 'Dietary Preferences', action: () => { } },
        { icon: 'notifications-outline', label: 'Notifications', action: () => { } },
        { icon: 'people-outline', label: 'Friends', badge: '3', action: () => { } },
        { icon: 'bar-chart-outline', label: 'Weekly Report', action: () => { } },
        { icon: 'cloud-download-outline', label: 'Export Data', action: () => { } },
        { icon: 'help-circle-outline', label: 'Help & Support', action: () => { } },
        { icon: 'shield-outline', label: 'Privacy & Security', action: () => { } },
    ];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <Pressable style={styles.settingsButton}>
                        <Ionicons name="settings-outline" size={24} color={Colors.textDark} />
                    </Pressable>
                </View>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileRow}>
                        <Image
                            source={{ uri: user?.avatar || 'https://via.placeholder.com/80' }}
                            style={styles.avatar}
                        />
                        <View style={styles.profileInfo}>
                            <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
                            <Text style={styles.userEmail}>{user?.email || 'Guest mode'}</Text>
                            {isGuest && (
                                <Pressable style={styles.upgradeButton}>
                                    <Text style={styles.upgradeButtonText}>Create Account</Text>
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* Quick Stats */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>🔥 {currentStreak}</Text>
                            <Text style={styles.statLabel}>Day Streak</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user?.weight || 60} kg</Text>
                            <Text style={styles.statLabel}>Current</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{user?.targetWeight || 55} kg</Text>
                            <Text style={styles.statLabel}>Target</Text>
                        </View>
                    </View>
                </View>

                {/* Weekly Summary */}
                <View style={styles.weeklySummary}>
                    <View style={styles.weeklySummaryHeader}>
                        <Text style={styles.sectionTitle}>This Week</Text>
                        <Text style={styles.weeklyRange}>Feb 3 - Feb 9</Text>
                    </View>
                    <View style={styles.weeklyGrid}>
                        <View style={styles.weeklyItem}>
                            <Text style={styles.weeklyValue}>{weeklyStats.avgCalories}</Text>
                            <Text style={styles.weeklyLabel}>Avg Calories</Text>
                        </View>
                        <View style={styles.weeklyItem}>
                            <Text style={styles.weeklyValue}>{weeklyStats.avgProtein}g</Text>
                            <Text style={styles.weeklyLabel}>Avg Protein</Text>
                        </View>
                        <View style={styles.weeklyItem}>
                            <Text style={styles.weeklyValue}>{weeklyStats.daysLogged}/7</Text>
                            <Text style={styles.weeklyLabel}>Days Logged</Text>
                        </View>
                    </View>
                </View>

                {/* Goals Progress */}
                <View style={styles.goalsSection}>
                    <Text style={styles.sectionTitle}>Today's Goals</Text>
                    <View style={styles.goalItem}>
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalLabel}>Calories</Text>
                            <Text style={styles.goalProgress}>
                                {todaysMacros.calories} / {macroTargets.calories}
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min((todaysMacros.calories / macroTargets.calories) * 100, 100)}%`,
                                        backgroundColor: Colors.calories,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                    <View style={styles.goalItem}>
                        <View style={styles.goalInfo}>
                            <Text style={styles.goalLabel}>Protein</Text>
                            <Text style={styles.goalProgress}>
                                {todaysMacros.protein}g / {macroTargets.protein}g
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${Math.min((todaysMacros.protein / macroTargets.protein) * 100, 100)}%`,
                                        backgroundColor: Colors.protein,
                                    },
                                ]}
                            />
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <Pressable
                            key={item.label}
                            style={[
                                styles.menuItem,
                                index === menuItems.length - 1 && styles.menuItemLast,
                            ]}
                            onPress={item.action}
                        >
                            <View style={styles.menuItemLeft}>
                                <Ionicons
                                    name={item.icon as any}
                                    size={22}
                                    color={Colors.textMedium}
                                />
                                <Text style={styles.menuItemLabel}>{item.label}</Text>
                            </View>
                            <View style={styles.menuItemRight}>
                                {item.badge && (
                                    <View style={styles.menuBadge}>
                                        <Text style={styles.menuBadgeText}>{item.badge}</Text>
                                    </View>
                                )}
                                <Ionicons
                                    name="chevron-forward"
                                    size={20}
                                    color={Colors.textLight}
                                />
                            </View>
                        </Pressable>
                    ))}
                </View>

                {/* Sign Out */}
                <Pressable style={styles.signOutButton} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={20} color={Colors.error} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </Pressable>

                {/* App Version */}
                <Text style={styles.versionText}>NutriTrack v2.0.0</Text>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    settingsButton: {
        width: 44,
        height: 44,
        backgroundColor: Colors.surface,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.soft,
    },
    profileCard: {
        backgroundColor: Colors.surface,
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        ...Shadows.soft,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primaryLight,
        marginRight: 16,
    },
    profileInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    userEmail: {
        fontSize: 14,
        color: Colors.textMedium,
        marginTop: 2,
    },
    upgradeButton: {
        marginTop: 8,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    upgradeButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textOnPrimary,
    },
    statsGrid: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textDark,
    },
    statLabel: {
        fontSize: 12,
        color: Colors.textLight,
        marginTop: 4,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#E5E7EB',
    },
    weeklySummary: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        ...Shadows.soft,
    },
    weeklySummaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textDark,
    },
    weeklyRange: {
        fontSize: 13,
        color: Colors.textLight,
    },
    weeklyGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    weeklyItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: Colors.background,
        borderRadius: 12,
    },
    weeklyValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    weeklyLabel: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 4,
    },
    goalsSection: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        ...Shadows.soft,
    },
    goalItem: {
        marginTop: 12,
    },
    goalInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    goalLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textMedium,
    },
    goalProgress: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textDark,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    menuSection: {
        backgroundColor: Colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
        ...Shadows.soft,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuItemLast: {
        borderBottomWidth: 0,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    menuItemLabel: {
        fontSize: 15,
        color: Colors.textDark,
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    menuBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textOnPrimary,
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.error,
        marginBottom: 16,
    },
    signOutText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.error,
    },
    versionText: {
        textAlign: 'center',
        fontSize: 12,
        color: Colors.textLight,
    },
});
