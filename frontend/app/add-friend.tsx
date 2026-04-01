import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity,
    Alert, Share, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { useAppLanguage } from '../src/i18n/LanguageProvider';
import { useFriendStore } from '../src/store/friendStore';
import { useAuthStore } from '../src/store/authStore';
import Svg, { Path } from 'react-native-svg';

function ArrowLeftIcon({ size = 24, color = '#1B2838' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
        </Svg>
    );
}

function CopyIcon({ size = 18, color = '#7F8C9B' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M20 9H11a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-9a2 2 0 00-2-2z" />
            <Path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </Svg>
    );
}

function ShareIcon({ size = 18, color = '#FFFFFF' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
            <Path d="M16 6l-4-4-4 4M12 2v13" />
        </Svg>
    );
}

function UserPlusIcon({ size = 48, color = '#2ECC71' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <Path d="M8.5 3a4 4 0 110 8 4 4 0 010-8zM20 8v6M23 11h-6" />
        </Svg>
    );
}

export default function AddFriendScreen() {
    const { t } = useAppLanguage();
    const { userId } = useAuthStore();
    const { myFriendCode, sendingRequest, error, sendRequest, loadMyFriendCode, clearError } = useFriendStore();
    const [code, setCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (userId) {
            loadMyFriendCode(userId);
        }
    }, [userId]);

    const handleSendRequest = async () => {
        if (code.trim().length < 4) return;
        clearError();
        setSuccessMessage('');
        const result = await sendRequest(code.trim());
        if (result.success) {
            setSuccessMessage(t('friend.requestSent', { name: result.friend_name || '' }));
            setCode('');
        }
    };

    const handleCopy = async () => {
        if (myFriendCode) {
            Alert.alert('Friend Code', myFriendCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (!myFriendCode) return;
        try {
            await Share.share({
                message: t('friend.shareMessage', { code: myFriendCode }),
            });
        } catch { }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ArrowLeftIcon />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('friend.title')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    {/* Hero */}
                    <View style={styles.heroSection}>
                        <UserPlusIcon size={56} />
                        <Text style={styles.heroTitle}>{t('friend.title')}</Text>
                    </View>

                    {/* Enter friend code */}
                    <View style={[styles.card, Shadows.small]}>
                        <Text style={styles.cardLabel}>{t('friend.enterCode')}</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.codeInput}
                                value={code}
                                onChangeText={(text) => setCode(text.toUpperCase())}
                                placeholder={t('friend.codePlaceholder')}
                                placeholderTextColor="#9CA3AF"
                                autoCapitalize="characters"
                                maxLength={8}
                                autoCorrect={false}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, (!code.trim() || sendingRequest) && styles.sendButtonDisabled]}
                                onPress={handleSendRequest}
                                disabled={!code.trim() || sendingRequest}
                            >
                                <Text style={styles.sendButtonText}>
                                    {sendingRequest ? '...' : t('friend.sendRequest')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {error ? (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        {successMessage ? (
                            <View style={styles.successBox}>
                                <Text style={styles.successText}>{successMessage}</Text>
                            </View>
                        ) : null}
                    </View>

                    {/* My friend code */}
                    <View style={[styles.card, Shadows.small]}>
                        <Text style={styles.cardLabel}>{t('friend.myCode')}</Text>
                        <View style={styles.myCodeRow}>
                            <View style={styles.codeDisplay}>
                                <Text style={styles.codeText}>
                                    {myFriendCode || '--------'}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                                <CopyIcon color={copied ? Colors.accent : '#7F8C9B'} />
                                <Text style={[styles.copyText, copied && { color: Colors.accent }]}>
                                    {copied ? t('friend.copied') : t('friend.copyCode')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                            <ShareIcon size={16} />
                            <Text style={styles.shareButtonText}>{t('friend.share')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Navigate to friend requests */}
                    <TouchableOpacity
                        style={[styles.requestsLink, Shadows.small]}
                        onPress={() => router.push('/friend-requests')}
                    >
                        <Text style={styles.requestsLinkText}>{t('friend.requests')}</Text>
                        <Text style={styles.requestsArrow}>→</Text>
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18, fontWeight: '700', color: Colors.primary,
    },
    content: { paddingHorizontal: 20, paddingBottom: 40 },
    heroSection: {
        alignItems: 'center', paddingVertical: 24, gap: 12,
    },
    heroTitle: {
        fontSize: 22, fontWeight: '800', color: Colors.primary,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
    },
    cardLabel: {
        fontSize: 13, fontWeight: '700', color: Colors.textSecondary,
        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row', gap: 10,
    },
    codeInput: {
        flex: 1, height: 48, borderRadius: 12,
        backgroundColor: '#F5F6F8', paddingHorizontal: 16,
        fontSize: 13, fontWeight: '700', letterSpacing: 1,
        color: Colors.text, textAlign: 'center',
    },
    sendButton: {
        height: 48, paddingHorizontal: 20, borderRadius: 12,
        backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center',
    },
    sendButtonDisabled: { opacity: 0.5 },
    sendButtonText: {
        color: '#FFFFFF', fontSize: 14, fontWeight: '700',
    },
    errorBox: {
        marginTop: 12, backgroundColor: Colors.redLight,
        borderRadius: 10, padding: 12,
    },
    errorText: { color: Colors.red, fontSize: 13, fontWeight: '600' },
    successBox: {
        marginTop: 12, backgroundColor: Colors.accentLight,
        borderRadius: 10, padding: 12,
    },
    successText: { color: Colors.accent, fontSize: 13, fontWeight: '600' },
    myCodeRow: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    codeDisplay: {
        flex: 1, height: 52, borderRadius: 12,
        backgroundColor: '#F0F4FF', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: '#D0D8E8', borderStyle: 'dashed',
    },
    codeText: {
        fontSize: 16, fontWeight: '800', color: Colors.primary, letterSpacing: 3,
    },
    copyButton: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12,
        backgroundColor: '#F5F6F8',
    },
    copyText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
    shareButton: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, marginTop: 14, height: 44, borderRadius: 12,
        backgroundColor: Colors.primary,
    },
    shareButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    requestsLink: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18,
    },
    requestsLinkText: { fontSize: 15, fontWeight: '700', color: Colors.primary },
    requestsArrow: { fontSize: 18, color: Colors.textSecondary },
});
