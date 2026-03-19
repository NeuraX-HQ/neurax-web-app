import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { saveOnboardingData, getOnboardingData, OnboardingData } from '../../src/store/userStore';
import { useAuthStore } from '../../src/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

export default function Step9() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const { t } = useAppLanguage();
    const [data, setData] = useState<OnboardingData | null>(null);
    const fadeAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        const load = async () => {
            const d = await getOnboardingData();
            setData(d);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        };
        load();
    }, []);

    const handleStart = async () => {
        await saveOnboardingData({ completed: true });
        
        if (isAuthenticated) {
            router.replace('/(tabs)/home');
        } else {
            // Nếu chưa login, yêu cầu tạo tài khoản để lưu lộ trình
            router.replace('/login');
        }
    };

    if (!data) return null;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.stepText}>{t('onboarding.step9.done')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <Animated.ScrollView
                style={[styles.content, { opacity: fadeAnim }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.checkContainer}>
                    <View style={styles.checkCircle}>
                        <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                    </View>
                </View>

                <View style={styles.titleRow}>
                    <Ionicons name="ribbon-outline" size={24} color={Colors.primary} style={styles.titleIcon} />
                    <Text style={styles.title}>{t('onboarding.step9.title')}</Text>
                </View>
                <Text style={styles.subtitle}>
                    {t('onboarding.step9.subtitle', { name: data.name || '' })}
                </Text>

                <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#F0F7F2' }]}>
                            <Ionicons name="flag-outline" size={20} color={Colors.primary} />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>MỤC TIÊU</Text>
                            <Text style={styles.summaryValue}>
                                {data.goal === 'lose' ? t('onboarding.goal.lose') :
                                    data.goal === 'gain' ? t('onboarding.goal.gain') : t('onboarding.goal.maintain')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#F0F4FF' }]}>
                            <Ionicons name="trending-down-outline" size={20} color="#4A90D9" />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>{t('onboarding.step9.targetWeight')}</Text>
                            <Text style={styles.summaryValue}>{data.targetWeight} kg</Text>
                        </View>
                    </View>

                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#F4F0FF' }]}>
                            <Ionicons name="flash-outline" size={20} color="#9B59B6" />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>{t('onboarding.step9.targetSpeed')}</Text>
                            <Text style={styles.summaryValue}>{data.weightChangeSpeed.toFixed(1)} kg/tuần</Text>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.summaryRow}>
                        <View style={[styles.summaryIcon, { backgroundColor: '#FFF9F0' }]}>
                            <Ionicons name="restaurant-outline" size={20} color="#F39C12" />
                        </View>
                        <View>
                            <Text style={styles.summaryLabel}>{t('onboarding.step9.dailyCalories')}</Text>
                            <Text style={styles.summaryValue}>1,850 kcal</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.aiMessage}>
                    <View style={styles.aiBubble}>
                        <Text style={styles.aiText}>
                            {t('onboarding.step9.aiMessage', {
                                weeks: Math.ceil(Math.abs(data.targetWeight - data.currentWeight) / data.weightChangeSpeed),
                            })}
                        </Text>
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </Animated.ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={handleStart}>
                    <Text style={styles.buttonText}>{t('onboarding.step9.startNow')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 12 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6F8',
    },
    stepText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '800', letterSpacing: 0.5 },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 24 },
    checkContainer: { alignSelf: 'center', marginBottom: 24 },
    checkCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
    subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
    summaryCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
    summaryIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '800', letterSpacing: 0.5 },
    summaryValue: { fontSize: 17, fontWeight: '700', color: Colors.primary, marginTop: 2 },
    divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
    aiMessage: { marginTop: 24 },
    aiBubble: {
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
    },
    aiText: { fontSize: 14, color: Colors.text, lineHeight: 20, fontStyle: 'italic', textAlign: 'center' },
    bold: { fontWeight: '700', color: Colors.primary },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    button: { backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
