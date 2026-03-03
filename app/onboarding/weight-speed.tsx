import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { saveOnboardingData, getOnboardingData } from '../../src/store/userStore';
import { Ionicons } from '@expo/vector-icons';

const speeds = [
    { value: 0.2, label: 'Thong thả', effort: 'Dễ', icon: 'bicycle-outline', color: '#2ECC71', desc: 'Dành cho người mới bắt đầu, không quá khắt khe.' },
    { value: 0.4, label: 'Bền vững', effort: 'Vừa', icon: 'walk-outline', color: '#4A90D9', desc: 'Tốc độ lý tưởng để duy trì thói quen lâu dài.' },
    { value: 0.6, label: 'Cân bằng', effort: 'Trung bình', icon: 'fitness-outline', color: '#F39C12', desc: 'Sự kết hợp hoàn hảo giữa nỗ lực và kết quả.' },
    { value: 0.8, label: 'Quyết tâm', effort: 'Khó', icon: 'trending-up-outline', color: '#E67E22', desc: 'Đòi hỏi sự kỷ luật cao trong ăn uống và tập luyện.' },
    { value: 1.0, label: 'Cực độ', effort: 'Rất khó', icon: 'flash-outline', color: '#E74C3C', desc: 'Tốc độ nhanh nhất, yêu cầu cam kết tuyệt đối.' },
];

export default function WeightSpeed() {
    const router = useRouter();
    const [selected, setSelected] = useState(0.4);
    const [goalType, setGoalType] = useState('');

    useEffect(() => {
        const init = async () => {
            const data = await getOnboardingData();
            setGoalType(data.goal);
            if (data.weightChangeSpeed) {
                // Đảm bảo giá trị đã chọn hợp lệ với danh sách mới
                const exists = speeds.find(s => s.value === data.weightChangeSpeed);
                if (exists) setSelected(data.weightChangeSpeed);
            }
        };
        init();
    }, []);

    const handleNext = async () => {
        await saveOnboardingData({ weightChangeSpeed: selected });
        router.push('/onboarding/step7');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.stepIndicator}>
                    {Array.from({ length: 9 }).map((_, i) => (
                        <View key={i} style={[styles.stepDot, i === 5 && styles.stepDotActive]} />
                    ))}
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.titleRow}>
                    <Ionicons name="speedometer-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>Tốc độ mục tiêu?</Text>
                </View>
                <Text style={styles.subtitle}>
                    {goalType === 'lose' ? 'Chọn mức độ nỗ lực bạn muốn bỏ ra để giảm cân.' : 'Chọn mức độ nỗ lực bạn muốn bỏ ra để tăng cân.'}
                </Text>

                <View style={styles.cardContainer}>
                    {speeds.map((item) => (
                        <TouchableOpacity
                            key={item.value.toString()}
                            style={[
                                styles.speedCard,
                                selected === item.value && { borderColor: item.color, backgroundColor: item.color + '08' }
                            ]}
                            onPress={() => setSelected(item.value)}
                        >
                            <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                                <Ionicons name={item.icon as any} size={28} color={item.color} />
                            </View>

                            <View style={styles.cardInfo}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardLabel}>{item.label}</Text>
                                    <View style={[styles.effortTag, { backgroundColor: item.color }]}>
                                        <Text style={styles.effortText}>{item.effort}</Text>
                                    </View>
                                </View>
                                <Text style={styles.speedValue}>{item.value.toFixed(1)} kg/tuần</Text>
                                <Text style={styles.cardDesc}>{item.desc}</Text>
                            </View>

                            <View style={styles.radioBox}>
                                <View style={[
                                    styles.radioOuter,
                                    selected === item.value && { borderColor: item.color }
                                ]}>
                                    {selected === item.value && <View style={[styles.radioInner, { backgroundColor: item.color }]} />}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleNext}>
                    <Text style={styles.buttonText}>Tiếp tục  →</Text>
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
    titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    titleIcon: { marginRight: 10 },
    title: { fontSize: 22, fontWeight: '800', color: Colors.primary },
    subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20, marginBottom: 24 },
    cardContainer: { gap: 12 },
    speedCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    iconBox: {
        width: 54,
        height: 54,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardInfo: { flex: 1, marginLeft: 16, marginRight: 8 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    cardLabel: { fontSize: 16, fontWeight: '800', color: Colors.text },
    effortTag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    effortText: { fontSize: 10, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' },
    speedValue: { fontSize: 14, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
    cardDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 16 },
    radioBox: { width: 24, justifyContent: 'center', alignItems: 'center' },
    radioOuter: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    button: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
