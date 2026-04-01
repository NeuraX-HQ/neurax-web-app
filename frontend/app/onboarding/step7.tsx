import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { saveOnboardingData } from '../../src/store/userStore';
import { activityLevels } from '../../src/data/constants';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

export default function Step7() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [selected, setSelected] = useState('');

    const handleNext = async () => {
        await saveOnboardingData({ activityLevel: selected });
        router.push('/onboarding/step8');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <View key={i} style={[styles.stepDot, i === 6 && styles.stepDotActive]} />
                    ))}
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.titleRow}>
                    <Ionicons name="flash-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>{t('onboarding.step7.title')}</Text>
                </View>
                <Text style={styles.subtitle}>
                    {t('onboarding.step7.subtitle')}
                </Text>

                {activityLevels.map((level) => (
                    <TouchableOpacity
                        key={level.id}
                        style={[styles.option, selected === level.id && styles.optionSelected]}
                        onPress={() => setSelected(level.id)}
                    >
                        <View style={[styles.iconBox, selected === level.id && styles.iconBoxSelected]}>
                            <Ionicons
                                name={(level as any).vectorIcon || 'pulse-outline'}
                                size={20}
                                color={selected === level.id ? '#FFFFFF' : Colors.primary}
                            />
                        </View>
                        <View style={styles.optionContent}>
                            <Text style={[styles.optionTitle, selected === level.id && styles.optionTitleSelected]}>
                                {t(`onboarding.activity.${level.id}.label`)}
                            </Text>
                            <Text style={styles.optionDesc}>
                                {t(`onboarding.activity.${level.id}.desc`)}
                            </Text>
                        </View>
                        <View style={[styles.radio, selected === level.id && styles.radioSelected]}>
                            {selected === level.id && <View style={styles.radioDot} />}
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, !selected && styles.buttonDisabled]}
                    onPress={handleNext}
                    disabled={!selected}
                >
                    <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6F8',
    },
    stepIndicator: { flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 4 },
    stepDot: { width: 12, height: 4, backgroundColor: '#E0E0E0', borderRadius: 2 },
    stepDotActive: { backgroundColor: Colors.primary, width: 20 },
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
    subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 24 },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
    },
    optionSelected: { borderColor: Colors.primary, backgroundColor: '#F0F7F2' },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F5F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconBoxSelected: { backgroundColor: Colors.primary },
    optionContent: { flex: 1 },
    optionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 2 },
    optionTitleSelected: { color: Colors.primary },
    optionDesc: { fontSize: 12, color: Colors.textSecondary },
    radio: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#D0D0D0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioSelected: { borderColor: Colors.primary },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    button: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
