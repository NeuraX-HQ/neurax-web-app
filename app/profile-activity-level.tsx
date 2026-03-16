import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { saveOnboardingData, getOnboardingData } from '../src/store/userStore';
import { activityLevels } from '../src/data/mockData';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileActivityLevelScreen() {
    const router = useRouter();
    const [selected, setSelected] = useState('');

    useEffect(() => {
        const loadData = async () => {
            const data = await getOnboardingData();
            if (data?.activityLevel) {
                setSelected(data.activityLevel);
            }
        };

        loadData();
    }, []);

    const handleSave = async () => {
        if (!selected) return;
        await saveOnboardingData({ activityLevel: selected });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mức độ hoạt động</Text>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.titleRow}>
                    <Ionicons name="flash-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>Mức độ vận động của bạn?</Text>
                </View>
                <Text style={styles.subtitle}>AI Bảo sẽ dựa vào đây để tính toán lượng calo cần thiết mỗi ngày cho bạn.</Text>

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
                            <Text style={[styles.optionTitle, selected === level.id && styles.optionTitleSelected]}>{level.label}</Text>
                            <Text style={styles.optionDesc}>{level.description}</Text>
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
                    onPress={handleSave}
                    disabled={!selected}
                >
                    <Text style={styles.buttonText}>Lưu thay đổi</Text>
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
