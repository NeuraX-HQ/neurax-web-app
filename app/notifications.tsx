import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { mockNotifications } from '../src/data/mockData';

export default function NotificationsScreen() {
    const router = useRouter();
    const todayNotifs = mockNotifications.filter(n => n.section === 'TODAY');
    const earlierNotifs = mockNotifications.filter(n => n.section === 'EARLIER');

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <TouchableOpacity>
                    <Text style={styles.markRead}>Mark all read</Text>
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>TODAY</Text>
                {todayNotifs.map((notif) => (
                    <View key={notif.id} style={[styles.notifCard, Shadows.small]}>
                        <View style={[styles.notifIcon, { backgroundColor: notif.color + '20' }]}>
                            <Text style={styles.notifEmoji}>{notif.icon}</Text>
                        </View>
                        <View style={styles.notifContent}>
                            <Text style={styles.notifTitle}>{notif.title}</Text>
                            <Text style={styles.notifBody}>{notif.body}</Text>
                        </View>
                        <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                ))}

                <Text style={styles.sectionLabel}>EARLIER</Text>
                {earlierNotifs.map((notif) => (
                    <View key={notif.id} style={[styles.notifCard, Shadows.small, styles.notifRead]}>
                        <View style={[styles.notifIcon, { backgroundColor: notif.color + '15' }]}>
                            <Text style={styles.notifEmoji}>{notif.icon}</Text>
                        </View>
                        <View style={styles.notifContent}>
                            <Text style={[styles.notifTitle, styles.notifTitleRead]}>{notif.title}</Text>
                            <Text style={styles.notifBody}>{notif.body}</Text>
                        </View>
                        <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                ))}

                <View style={{ height: 40 }} />
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
        paddingBottom: 12,
    },
    backArrow: { fontSize: 24, color: Colors.primary },
    title: { fontSize: 22, fontWeight: '700', color: Colors.primary },
    markRead: { fontSize: 14, color: Colors.blue, fontWeight: '500' },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
        paddingHorizontal: 20,
        marginTop: 16,
        marginBottom: 12,
    },
    notifCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 14,
        marginHorizontal: 20,
        marginBottom: 10,
        gap: 12,
        alignItems: 'flex-start',
    },
    notifRead: { opacity: 0.7 },
    notifIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notifEmoji: { fontSize: 20 },
    notifContent: { flex: 1 },
    notifTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 3 },
    notifTitleRead: { fontWeight: '500' },
    notifBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    notifTime: { fontSize: 12, color: Colors.textLight },
});
