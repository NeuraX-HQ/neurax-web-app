import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { getOnboardingData, saveOnboardingData, saveUserData } from '../src/store/userStore';
import { useAuthStore } from '../src/store/authStore';
import { updateUserProfileInDB } from '../src/services/userService';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../src/i18n/LanguageProvider';
import * as userService from '../src/services/userService';

export default function ProfilePersonalInfoScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const { userId } = useAuthStore();
    const [name, setName] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const data = await getOnboardingData();
            if (data?.name) {
                setName(data.name);
            }
        };

        loadData();
    }, []);

    const handleSave = async () => {
        const cleanedName = name.trim();
        if (!cleanedName) return;

        await Promise.all([
            saveOnboardingData({ name: cleanedName }),
            saveUserData({ name: cleanedName }),
        ]);
        // Sync display_name lên DynamoDB (fire-and-forget)
        if (userId) updateUserProfileInDB(userId, { display_name: cleanedName }).catch(() => {});

        if (userId) {
            userService.pushLocalProfileToCloud(userId).catch(e => console.warn('[USER] Silent sync failed', e));
        }

        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('profile.personalInfo')}</Text>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.content}>
                    <View style={styles.titleRow}>
                        <Ionicons name="person-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                        <Text style={styles.title}>{t('profile.pi.whatsYourName')}</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        {t('profile.pi.subtitle')}
                    </Text>

                    <Text style={styles.label}>{t('profile.pi.displayName')}</Text>
                    <TextInput
                        style={[
                            styles.input,
                            (isFocused || name.length > 0) && styles.inputActive,
                        ]}
                        placeholder={t('profile.pi.placeholder')}
                        placeholderTextColor={Colors.textLight}
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        autoFocus
                    />
                </View>

                <View style={styles.footer}>
                    <View style={styles.infoBox}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={Colors.primary} />
                        <Text style={styles.infoText}>{t('profile.pi.info')}</Text>
                    </View>

                    <TouchableOpacity style={[styles.button, !name.trim() && styles.buttonDisabled]} onPress={handleSave} disabled={!name.trim()}>
                        <Text style={styles.buttonText}>{t('profile.saveChanges')}</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    flex: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6F8',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
    },
    headerSpacer: { width: 40, height: 40 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    titleIcon: {
        marginRight: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 32,
    },
    label: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        fontSize: 20,
        color: Colors.primary,
        fontWeight: '600',
        paddingVertical: 10,
        borderWidth: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: '#E0E0E0',
    },
    inputActive: {
        borderBottomColor: Colors.primary,
        borderBottomWidth: 2,
    },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#F5F6F8',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 10,
        alignItems: 'center',
    },
    infoText: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
