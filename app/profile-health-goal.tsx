import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { getOnboardingData, saveOnboardingData } from '../src/store/userStore';
import { goals } from '../src/data/mockData';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

export default function ProfileHealthGoalScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [selected, setSelected] = useState('');

    const getGoalLabel = (id: string) => {
        return t(`profile.goalOption.${id}`);
    };

    useEffect(() => {
        const loadData = async () => {
            const data = await getOnboardingData();
            if (data?.goal) {
                setSelected(data.goal);
            }
        };
        loadData();
    }, []);

    const handleSave = async () => {
        if (!selected) return;
        await saveOnboardingData({ goal: selected });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.healthGoal')}</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.titleRow}>
                    <Ionicons name="flag-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>{t('profile.hg.title')}</Text>
                </View>
                <Text style={styles.subtitle}>{t('profile.hg.subtitle')}</Text>

                {goals.map((goal) => (
                    <TouchableOpacity
                        key={goal.id}
                        style={[styles.option, selected === goal.id && styles.optionSelected]}
                        onPress={() => setSelected(goal.id)}
                    >
                        <View style={[styles.optionIconBox, selected === goal.id && styles.optionIconBoxSelected]}>
                            <Ionicons
                                name={(goal as any).vectorIcon || 'help-outline'}
                                size={20}
                                color={selected === goal.id ? '#FFFFFF' : Colors.primary}
                            />
                        </View>
                        <Text style={[styles.optionText, selected === goal.id && styles.optionTextSelected]}>{getGoalLabel(goal.id)}</Text>
                        <View style={[styles.radio, selected === goal.id && styles.radioSelected]}>
                            {selected === goal.id && <View style={styles.radioDot} />}
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.button, !selected && styles.buttonDisabled]}
                    onPress={handleSave}
                    disabled={!selected}
                >
                    <Text style={styles.buttonText}>{t('profile.saveChanges')}</Text>
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
        marginBottom: 24,
    },
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
    optionSelected: {
        backgroundColor: '#F0F7F2',
        borderColor: Colors.primary,
    },
    optionIconBox: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F5F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionIconBoxSelected: {
        backgroundColor: Colors.primary,
    },
    optionText: { flex: 1, fontSize: 16, fontWeight: '700', color: Colors.text },
    optionTextSelected: { color: Colors.primary },
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
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
    },
    buttonDisabled: { opacity: 0.5 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
