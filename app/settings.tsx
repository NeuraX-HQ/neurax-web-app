import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { useAuthStore } from '../src/store/authStore';
import { useAppLanguage } from '../src/i18n/LanguageProvider';
import { AppLanguage } from '../src/i18n/translations';
import { useSettingsStore, SettingsUnits } from '../src/store/settingsStore';

type PickerType = 'language' | 'units' | null;

// Removed SettingsPreferences interface since it's now in store

export type SettingsRowProps = {
    icon: string;
    label: string;
    value?: string;
    subtext?: string;
    showArrow?: boolean;
    onPress?: () => void;
    trailing?: React.ReactNode;
};

function SettingsRow({
    icon,
    label,
    value,
    subtext,
    showArrow = false,
    onPress,
    trailing,
}: SettingsRowProps) {
    const content = (
        <View style={[styles.item, Shadows.small]}>
            <Text style={styles.itemIcon}>{icon}</Text>
            <View style={styles.itemLabelWrap}>
                <Text style={styles.itemLabel}>{label}</Text>
                {subtext ? <Text style={styles.itemSubtext}>{subtext}</Text> : null}
            </View>
            {value ? <Text style={styles.itemValue}>{value}</Text> : null}
            {trailing}
            {showArrow ? <Text style={styles.itemArrow}>›</Text> : null}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
}

export default function SettingsScreen() {
    const router = useRouter();
    const { language, setLanguage: setAppLanguage, t } = useAppLanguage();
    
    const { 
        units, setUnits, 
        darkMode, setDarkMode, 
        pushNotif, setPushNotif, 
        emailUpdates, setEmailUpdates 
    } = useSettingsStore();
    
    const [pickerType, setPickerType] = useState<PickerType>(null);
    
    const {
        biometricEnabled,
        biometricSupported,
        biometricEnrolled,
        setBiometricEnabled,
        checkBiometricAvailability,
        logout,
    } = useAuthStore();

    useEffect(() => {
        checkBiometricAvailability();
    }, []);

    const handleSelectLanguage = async (nextLanguage: AppLanguage) => {
        await setAppLanguage(nextLanguage);
        useSettingsStore.getState().setLanguage(nextLanguage); // sync to store
        setPickerType(null);
    };

    const handleSelectUnits = async (nextUnits: SettingsUnits) => {
        await setUnits(nextUnits);
        setPickerType(null);
    };

    const handleDarkModeChange = async (value: boolean) => {
        await setDarkMode(value);
    };

    const handlePushNotifChange = async (value: boolean) => {
        await setPushNotif(value);
    };

    const handleEmailUpdatesChange = async (value: boolean) => {
        await setEmailUpdates(value);
    };

    const handleBiometricToggle = async (value: boolean) => {
        if (value) {
            Alert.alert(
                t('settings.biometricEnableTitle'),
                t('settings.biometricEnableMessage'),
                [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                        text: t('settings.enable'),
                        onPress: async () => {
                            await setBiometricEnabled(true);
                        },
                    },
                ]
            );
        } else {
            await setBiometricEnabled(false);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            t('settings.logoutTitle'),
            t('settings.logoutMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('settings.logout'),
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/login');
                    },
                },
            ]
        );
    };

    type SettingsSection = {
        title: string;
        rows: (SettingsRowProps & { key: string })[];
    };

    const settingsSections: SettingsSection[] = [
        {
            title: t('settings.section.account'),
            rows: [
                {
                    key: 'edit-profile',
                    icon: '👤',
                    label: t('settings.editProfile'),
                    onPress: () => router.push('/profile'),
                    showArrow: true,
                },
                {
                    key: 'change-password',
                    icon: '🔒',
                    label: t('settings.changePassword'),
                    onPress: () => router.push('/login'),
                    showArrow: true,
                },
            ],
        },
        {
            title: t('settings.section.preferences'),
            rows: [
                {
                    key: 'language',
                    icon: '🌐',
                    label: t('settings.language'),
                    value: language === 'vi' ? t('settings.language.vi') : t('settings.language.en'),
                    onPress: () => setPickerType('language'),
                    showArrow: true,
                },
            ],
        },
        {
            title: t('settings.section.notifications'),
            rows: [
                {
                    key: 'push',
                    icon: '🔔',
                    label: t('settings.pushNotifications'),
                    trailing: (
                        <Switch
                            value={pushNotif}
                            onValueChange={handlePushNotifChange}
                            trackColor={{ false: '#E0E0E0', true: Colors.accent }}
                            thumbColor="#FFFFFF"
                        />
                    ),
                },
            ],
        },
        {
            title: t('settings.section.privacy'),
            rows: [
                {
                    key: 'privacy-policy',
                    icon: '📋',
                    label: t('settings.privacyPolicy'),
                    onPress: () => router.push('/privacy-policy'),
                    showArrow: true,
                },
                {
                    key: 'tos',
                    icon: '📄',
                    label: t('settings.terms'),
                    onPress: () => router.push('/terms-of-service'),
                    showArrow: true,
                },
            ],
        },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t('settings.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {settingsSections.map((section) => (
                    <View key={section.title}>
                        <Text style={styles.sectionLabel}>{section.title}</Text>
                        {section.rows.map((row) => (
                            <SettingsRow
                                key={row.key}
                                icon={row.icon}
                                label={row.label}
                                value={row.value}
                                subtext={row.subtext}
                                onPress={row.onPress}
                                showArrow={row.showArrow}
                                trailing={row.trailing}
                            />
                        ))}
                    </View>
                ))}

                {/* Log Out */}
                <TouchableOpacity style={[styles.logoutBtn]} onPress={handleLogout}>
                    <Text style={styles.logoutText}>{t('settings.logout')}</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                visible={pickerType !== null}
                transparent
                animationType="fade"
                onRequestClose={() => setPickerType(null)}
            >
                <TouchableWithoutFeedback onPress={() => setPickerType(null)}>
                    <View style={styles.modalBackdrop}>
                        <TouchableWithoutFeedback>
                            <View style={styles.pickerCard}>
                                <Text style={styles.pickerTitle}>
                                    {pickerType === 'language' ? t('settings.selectLanguage') : t('settings.selectUnits')}
                                </Text>

                                {pickerType === 'language' ? (
                                    <>
                                        <TouchableOpacity
                                            style={styles.pickerOption}
                                            onPress={() => handleSelectLanguage('vi')}
                                        >
                                            <Text style={styles.pickerOptionText}>{t('settings.language.vi')}</Text>
                                            {language === 'vi' ? <Text style={styles.pickerCheck}>✓</Text> : null}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.pickerOption}
                                            onPress={() => handleSelectLanguage('en')}
                                        >
                                            <Text style={styles.pickerOptionText}>{t('settings.language.en')}</Text>
                                            {language === 'en' ? <Text style={styles.pickerCheck}>✓</Text> : null}
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <>
                                        <TouchableOpacity
                                            style={styles.pickerOption}
                                            onPress={() => handleSelectUnits('Metric (kg, cm)')}
                                        >
                                            <Text style={styles.pickerOptionText}>{t('settings.units.metric')}</Text>
                                            {units === 'Metric (kg, cm)' ? <Text style={styles.pickerCheck}>✓</Text> : null}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.pickerOption}
                                            onPress={() => handleSelectUnits('Imperial (lb, ft)')}
                                        >
                                            <Text style={styles.pickerOptionText}>{t('settings.units.imperial')}</Text>
                                            {units === 'Imperial (lb, ft)' ? <Text style={styles.pickerCheck}>✓</Text> : null}
                                        </TouchableOpacity>
                                    </>
                                )}

                                <TouchableOpacity style={styles.pickerCancelBtn} onPress={() => setPickerType(null)}>
                                    <Text style={styles.pickerCancelText}>{t('common.cancel')}</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
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
        paddingBottom: 12,
    },
    backArrow: { fontSize: 24, color: Colors.primary },
    title: { fontSize: 22, fontWeight: '700', color: Colors.primary },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 1,
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 12,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 10,
        gap: 14,
    },
    itemLabelWrap: { flex: 1 },
    itemIcon: { fontSize: 20 },
    itemLabel: { fontSize: 16, fontWeight: '600', color: Colors.text },
    itemValue: { fontSize: 14, color: Colors.textSecondary },
    itemSubtext: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
    itemArrow: { fontSize: 24, color: Colors.textLight },
    logoutBtn: {
        marginHorizontal: 20,
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.red,
        alignItems: 'center',
    },
    logoutText: { fontSize: 16, fontWeight: '600', color: Colors.red },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.22)',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    pickerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        gap: 8,
    },
    pickerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    pickerOption: {
        height: 48,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pickerOptionText: {
        fontSize: 15,
        color: Colors.text,
        fontWeight: '500',
    },
    pickerCheck: {
        fontSize: 16,
        color: Colors.accent,
        fontWeight: '700',
    },
    pickerCancelBtn: {
        marginTop: 4,
        height: 44,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F7FA',
    },
    pickerCancelText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
});
