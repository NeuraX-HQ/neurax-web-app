import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { ProfileIcon } from '../src/components/TabIcons';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

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

    const stats = [
        { label: 'Weight', value: '75', unit: 'kg' },
        { label: 'Goal', value: '70', unit: 'kg' },
        { label: 'Streak', value: '14', unit: '🔥' },
    ];

    const accountItems = [
        { label: 'Personal Info', icon: <PersonIcon /> },
        { label: 'Health Goals', icon: <TargetIcon /> },
        { label: 'Activity Level', icon: <ActivityIcon /> },
    ];

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
                    <BackArrow />
                </TouchableOpacity>
                <Text style={styles.title}>Profile</Text>
                <TouchableOpacity style={styles.headerBtn}>
                    <MoreIcon />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Image source={require('../assets/images/avatar.png')} style={styles.avatarImage} />
                        </View>
                        <TouchableOpacity style={styles.editBadge}>
                            <EditPenIcon size={14} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.userName}>Admin</Text>
                    <Text style={styles.userEmail}>admin@nutritrack.com</Text>
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
                <Text style={styles.sectionTitle}>ACCOUNT</Text>
                <View style={styles.menuGroup}>
                    {accountItems.map((item, idx) => (
                        <TouchableOpacity
                            key={item.label}
                            style={[
                                styles.menuItem,
                                idx < accountItems.length - 1 && styles.menuItemBorder,
                            ]}
                        >
                            <View style={styles.menuIconBox}>{item.icon}</View>
                            <Text style={styles.menuLabel}>{item.label}</Text>
                            <ChevronRight />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Integrations Section */}
                <Text style={styles.sectionTitle}>INTEGRATIONS</Text>
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}>
                            <SyncIcon />
                        </View>
                        <Text style={styles.menuLabel}>Connected Apps</Text>
                        <Text style={styles.menuBadge}>2 Active</Text>
                        <ChevronRight />
                    </TouchableOpacity>
                </View>

                {/* Preferences Section */}
                <Text style={styles.sectionTitle}>PREFERENCES</Text>
                <View style={styles.menuGroup}>
                    <TouchableOpacity style={[styles.menuItem, styles.menuItemBorder]}>
                        <View style={styles.menuIconBox}>
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <Circle cx="12" cy="12" r="3" />
                                <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </Svg>
                        </View>
                        <Text style={styles.menuLabel}>Settings</Text>
                        <ChevronRight />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIconBox}>
                            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </Svg>
                        </View>
                        <Text style={styles.menuLabel}>Notifications</Text>
                        <ChevronRight />
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
