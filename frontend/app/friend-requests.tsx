import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { useAppLanguage } from '../src/i18n/LanguageProvider';
import { useFriendStore } from '../src/store/friendStore';
import Svg, { Path } from 'react-native-svg';

function ArrowLeftIcon({ size = 24, color = '#1B2838' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
        </Svg>
    );
}

type Tab = 'received' | 'sent' | 'friends';

export default function FriendRequestsScreen() {
    const { t } = useAppLanguage();
    const {
        pendingRequests, sentRequests, friends, acceptingId, decliningId, removingId, error,
        loadPendingRequests, loadFriends, acceptRequest, declineRequest, removeFriend, clearError,
    } = useFriendStore();
    const [tab, setTab] = useState<Tab>('received');

    useEffect(() => {
        loadPendingRequests();
        loadFriends();
    }, []);

    const handleAccept = async (id: string) => {
        await acceptRequest(id);
    };

    const handleDecline = async (id: string) => {
        await declineRequest(id);
    };

    const handleRemove = (id: string, name: string) => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm(`${t('friend.removeFriend')}\n\n${name}`);
            if (confirmed) removeFriend(id);
        } else {
            Alert.alert(
                t('friend.removeFriend'),
                name,
                [
                    { text: t('friend.decline'), style: 'cancel' },
                    { text: t('friend.removeFriend'), style: 'destructive', onPress: () => removeFriend(id) },
                ],
            );
        }
    };

    const renderReceivedItem = ({ item }: any) => (
        <View style={[styles.requestCard, Shadows.small]}>
            <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{item.friend_name || 'User'}</Text>
                <Text style={styles.requestSub}>{t('friend.pending')}</Text>
            </View>
            <View style={styles.actionButtons}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn]}
                    onPress={() => handleAccept(item.id)}
                    disabled={acceptingId === item.id || decliningId === item.id}
                >
                    <Text style={styles.acceptText}>{acceptingId === item.id ? '...' : t('friend.accept')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.declineBtn]}
                    onPress={() => handleDecline(item.id)}
                    disabled={acceptingId === item.id || decliningId === item.id}
                >
                    <Text style={styles.declineText}>{decliningId === item.id ? '...' : t('friend.decline')}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderSentItem = ({ item }: any) => (
        <View style={[styles.requestCard, Shadows.small]}>
            <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{item.friend_name || 'User'}</Text>
                <Text style={styles.requestSub}>{t('friend.pending')}</Text>
            </View>
            <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>{t('friend.pending')}</Text>
            </View>
        </View>
    );

    const renderFriendItem = ({ item }: any) => (
        <View style={[styles.requestCard, Shadows.small]}>
            <View style={styles.avatar}>
                <Text style={styles.avatarEmoji}>👤</Text>
            </View>
            <View style={styles.requestInfo}>
                <Text style={styles.requestName}>{item.friend_name || 'User'}</Text>
            </View>
            <TouchableOpacity
                style={[styles.actionBtn, styles.declineBtn]}
                onPress={() => handleRemove(item.id, item.friend_name || 'User')}
                disabled={removingId === item.id}
            >
                <Text style={styles.declineText}>{removingId === item.id ? '...' : t('friend.removeFriend')}</Text>
            </TouchableOpacity>
        </View>
    );

    const getListData = () => {
        switch (tab) {
            case 'received': return pendingRequests;
            case 'sent': return sentRequests;
            case 'friends': return friends;
        }
    };

    const getRenderItem = () => {
        switch (tab) {
            case 'received': return renderReceivedItem;
            case 'sent': return renderSentItem;
            case 'friends': return renderFriendItem;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <ArrowLeftIcon />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('friend.requests')}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                {(['received', 'sent', 'friends'] as Tab[]).map((key) => {
                    const labels: Record<Tab, string> = {
                        received: t('friend.requests'),
                        sent: t('friend.sentRequests'),
                        friends: t('battle.tab.friends'),
                    };
                    const counts: Record<Tab, number> = {
                        received: pendingRequests.length,
                        sent: sentRequests.length,
                        friends: friends.length,
                    };
                    return (
                        <TouchableOpacity
                            key={key}
                            style={[styles.tab, tab === key && styles.tabActive]}
                            onPress={() => setTab(key)}
                        >
                            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
                                {labels[key]}
                                {counts[key] > 0 ? ` (${counts[key]})` : ''}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Error banner */}
            {error && (
                <TouchableOpacity style={styles.errorBanner} onPress={clearError}>
                    <Text style={styles.errorText}>{error}</Text>
                </TouchableOpacity>
            )}

            {/* List */}
            <FlatList
                data={getListData()}
                renderItem={getRenderItem()}
                keyExtractor={(item: any) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>📭</Text>
                        <Text style={styles.emptyText}>{t('friend.noRequests')}</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    tabs: {
        flexDirection: 'row', marginHorizontal: 20,
        backgroundColor: '#F0F0F0', borderRadius: 12, padding: 4, marginBottom: 16,
    },
    tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
    tabActive: { backgroundColor: '#FFFFFF', ...Shadows.small },
    tabText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    tabTextActive: { color: Colors.primary, fontWeight: '700' },
    list: { paddingHorizontal: 16, paddingBottom: 32 },
    requestCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
        marginBottom: 10, gap: 12,
    },
    avatar: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
    },
    avatarEmoji: { fontSize: 20 },
    requestInfo: { flex: 1 },
    requestName: { fontSize: 15, fontWeight: '600', color: Colors.text },
    requestSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
    actionButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: {
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    },
    acceptBtn: { backgroundColor: Colors.accent },
    acceptText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    declineBtn: { backgroundColor: '#F0F0F0' },
    declineText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
    pendingBadge: {
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
        backgroundColor: '#FFF5E1',
    },
    pendingText: { color: Colors.streak, fontSize: 12, fontWeight: '600' },
    emptyState: { alignItems: 'center', paddingTop: 60 },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '500' },
    errorBanner: {
        backgroundColor: '#FEE2E2', marginHorizontal: 16, marginBottom: 8,
        padding: 12, borderRadius: 10,
    },
    errorText: { color: '#DC2626', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
