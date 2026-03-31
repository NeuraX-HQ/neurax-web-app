import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { saveOnboardingData } from '../../src/store/userStore';
import { dietaryRestrictions } from '../../src/data/mockData';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

export default function Step8() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [selected, setSelected] = useState<string[]>([]);
    const [custom, setCustom] = useState('');

    const toggleSelection = (id: string) => {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleNext = async () => {
        await saveOnboardingData({ dietaryRestrictions: selected });
        router.push('/onboarding/step9');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <View key={i} style={[styles.stepDot, i === 7 && styles.stepDotActive]} />
                    ))}
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.titleRow}>
                    <Ionicons name="nutrition-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>{t('onboarding.step8.title')}</Text>
                </View>
                <Text style={styles.subtitle}>
                    {t('onboarding.step8.subtitle')}
                </Text>

                <View style={styles.grid}>
                    {dietaryRestrictions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[
                                styles.gridItem,
                                selected.includes(item.id) && styles.gridItemSelected
                            ]}
                            onPress={() => toggleSelection(item.id)}
                        >
                            <View style={[
                                styles.gridIconBox,
                                selected.includes(item.id) && styles.gridIconBoxSelected
                            ]}>
                                <Ionicons
                                    name={(item as any).vectorIcon || 'leaf-outline'}
                                    size={24}
                                    color={selected.includes(item.id) ? '#FFFFFF' : Colors.primary}
                                />
                            </View>
                            <Text style={[
                                styles.gridLabel,
                                selected.includes(item.id) && styles.gridLabelSelected
                            ]}>
                                {t(`onboarding.dietary.${item.id}`)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.customContainer}>
                    <Text style={styles.customLabel}>{t('onboarding.step8.customLabel')}</Text>
                    <TextInput
                        style={styles.customInput}
                        placeholder={t('onboarding.step8.placeholder')}
                        placeholderTextColor={Colors.textLight}
                        value={custom}
                        onChangeText={setCustom}
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleNext}>
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    gridItem: {
        width: '48%',
        aspectRatio: 1.1,
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
    },
    gridItemSelected: { borderColor: Colors.primary, backgroundColor: '#F0F7F2' },
    gridIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F5F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    gridIconBoxSelected: { backgroundColor: Colors.primary },
    gridLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, textAlign: 'center' },
    gridLabelSelected: { color: Colors.primary },
    customContainer: { marginTop: 24 },
    customLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 4, fontWeight: '600' },
    customInput: {
        fontSize: 14,
        color: Colors.text,
        paddingVertical: 12,
        borderWidth: 0,
        borderBottomWidth: 1.5,
        borderBottomColor: '#F0F0F0',
    },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    button: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
