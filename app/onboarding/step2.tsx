import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { saveOnboardingData } from '../../src/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

const { width } = Dimensions.get('window');

export default function Step2() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [selected, setSelected] = useState('');

    const handleNext = async () => {
        await saveOnboardingData({ gender: selected });
        router.push('/onboarding/step-age');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <View key={i} style={[styles.stepDot, i === 1 && styles.stepDotActive]} />
                    ))}
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.titleRow}>
                    <Ionicons name="transgender-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>{t('onboarding.step2.title')}</Text>
                </View>
                <Text style={styles.subtitle}>
                    {t('onboarding.step2.subtitle')}
                </Text>

                <View style={styles.genderContainer}>
                    <TouchableOpacity
                        style={[styles.genderCard, selected === 'male' && styles.genderCardSelected]}
                        onPress={() => setSelected('male')}
                    >
                        <View style={[styles.iconCircle, selected === 'male' && styles.iconCircleSelected]}>
                            <Ionicons name="male" size={32} color={selected === 'male' ? '#FFFFFF' : Colors.primary} />
                        </View>
                        <Text style={[styles.genderLabel, selected === 'male' && styles.genderLabelSelected]}>{t('onboarding.step2.male')}</Text>
                        {selected === 'male' && <View style={styles.checkIcon}><Ionicons name="checkmark-circle" size={20} color={Colors.primary} /></View>}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.genderCard, selected === 'female' && styles.genderCardSelected]}
                        onPress={() => setSelected('female')}
                    >
                        <View style={[styles.iconCircle, selected === 'female' && styles.iconCircleSelected]}>
                            <Ionicons name="female" size={32} color={selected === 'female' ? '#FFFFFF' : Colors.primary} />
                        </View>
                        <Text style={[styles.genderLabel, selected === 'female' && styles.genderLabelSelected]}>{t('onboarding.step2.female')}</Text>
                        {selected === 'female' && <View style={styles.checkIcon}><Ionicons name="checkmark-circle" size={20} color={Colors.primary} /></View>}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.otherBtn}
                    onPress={() => setSelected('other')}
                >
                    <Text style={[styles.otherText, selected === 'other' && styles.otherTextSelected]}>{t('onboarding.step2.other')}</Text>
                </TouchableOpacity>
            </View>

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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
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
    stepIndicator: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    stepDot: {
        width: 12,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
    },
    stepDotActive: {
        backgroundColor: Colors.primary,
        width: 20,
    },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 24, alignItems: 'center' },
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
        textAlign: 'center',
    },
    genderContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    genderCard: {
        width: (width - 64) / 2,
        backgroundColor: '#F8F9FA',
        borderRadius: 20,
        paddingVertical: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
        position: 'relative',
    },
    genderCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: '#FFFFFF',
    },
    iconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#F0F7F2',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    iconCircleSelected: {
        backgroundColor: Colors.primary,
    },
    genderLabel: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    genderLabelSelected: {
        color: Colors.primary,
    },
    checkIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
    },
    otherBtn: {
        padding: 8,
    },
    otherText: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    otherTextSelected: {
        color: Colors.primary,
    },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
