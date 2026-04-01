import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../src/constants/colors';
import { getRecipeById } from '../src/data/recipes';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

const formatTimer = (seconds: number) => {
    const safeValue = Math.max(0, seconds);
    const mins = Math.floor(safeValue / 60);
    const secs = safeValue % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function RecipeCookingScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const params = useLocalSearchParams<{ recipeId?: string; checked?: string }>();
    const recipeId = params.recipeId || '1';
    const recipe = getRecipeById(recipeId);

    const selectedIngredientIds = useMemo(() => {
        if (!params.checked) return [] as string[];
        try {
            return JSON.parse(params.checked) as string[];
        } catch {
            return [] as string[];
        }
    }, [params.checked]);

    const [stepIndex, setStepIndex] = useState(0);
    const currentStep = recipe?.steps[stepIndex];
    const [remainingSec, setRemainingSec] = useState(currentStep?.durationSec || 0);
    const [isStarted, setIsStarted] = useState(false);
    const [isPaused, setIsPaused] = useState(true);
    const [elapsedSec, setElapsedSec] = useState(0);

    useEffect(() => {
        setRemainingSec(currentStep?.durationSec || 0);
        setIsStarted(false);
        setIsPaused(true);
    }, [stepIndex, currentStep?.durationSec]);

    useEffect(() => {
        if (!isStarted || isPaused) return;
        const timer = setInterval(() => {
            setRemainingSec((prev) => {
                if (prev > 0) {
                    setElapsedSec((elapsed) => elapsed + 1);
                    return prev - 1;
                }
                return 0;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isStarted, isPaused]);

    if (!recipe || !currentStep) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.centerState}>
                    <Text style={styles.emptyTitle}>{t('recipeCooking.notFound')}</Text>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backSimpleBtn}>
                        <Text style={styles.backSimpleText}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const progress = ((stepIndex + 1) / recipe.steps.length) * 100;

    const prevStep = () => {
        if (stepIndex === 0) {
            router.back();
            return;
        }
        setStepIndex((prev) => Math.max(0, prev - 1));
    };

    const nextStep = () => {
        if (stepIndex >= recipe.steps.length - 1) {
            router.push({
                pathname: '/recipe-complete',
                params: {
                    recipeId,
                    checked: JSON.stringify(selectedIngredientIds),
                    elapsedSec: String(elapsedSec),
                },
            });
            return;
        }
        setStepIndex((prev) => prev + 1);
    };

    const checkedCount = selectedIngredientIds.length;

    const togglePause = () => {
        setIsPaused((prev) => !prev);
    };

    const fastForward = () => {
        setRemainingSec((prev) => {
            const reduced = Math.min(60, prev);
            if (reduced > 0) {
                setElapsedSec((elapsed) => elapsed + reduced);
            }
            return Math.max(0, prev - 60);
        });
    };

    const handleStartTimer = () => {
        setIsStarted(true);
        setIsPaused(false);
    };

    const adjustTime = (amount: number) => {
        setRemainingSec((prev) => Math.max(0, prev + amount));
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.accent} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.recipeName}>{recipe.name}</Text>
                    <Text style={styles.modeText}>{t('recipeCooking.mode')}</Text>
                </View>
                <TouchableOpacity style={styles.headerIconBtn}>
                    <Ionicons name="ellipsis-vertical" size={18} color={Colors.accent} />
                </TouchableOpacity>
            </View>

            <View style={styles.progressSection}>
                <View style={styles.progressTopRow}>
                    <View>
                        <Text style={styles.progressLabel}>{t('recipeCooking.progress')}</Text>
                        <Text style={styles.progressValue}>{t('recipeCooking.step', { current: stepIndex + 1, total: recipe.steps.length })}</Text>
                    </View>
                    <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
            </View>

            <View style={styles.content}>
                <Text style={styles.stepTitle}>{currentStep.title}</Text>
                <Text style={styles.stepInstruction}>{currentStep.instruction}</Text>
                {currentStep.tip ? (
                    <View style={styles.tipCard}>
                        <Ionicons name="bulb-outline" size={16} color={Colors.accent} />
                        <Text style={styles.tipText}>{currentStep.tip}</Text>
                    </View>
                ) : null}
                <Text style={styles.subInfo}>{t('recipeCooking.prepared', { checked: checkedCount, total: recipe.ingredients.length })}</Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.prevBtn} onPress={prevStep}>
                    <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
                    <Text style={styles.prevBtnText}>{t('recipeCooking.prev')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.nextBtn} onPress={nextStep}>
                    <Text style={styles.nextBtnText}>{stepIndex === recipe.steps.length - 1 ? t('recipeCooking.complete') : t('recipeCooking.next')}</Text>
                    <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FDFB' },
    header: {
        backgroundColor: '#F8FDFB',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(46, 204, 113, 0.12)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    headerIconBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerCenter: { alignItems: 'center' },
    recipeName: { fontSize: 18, fontWeight: '800', color: Colors.text },
    modeText: { marginTop: 2, fontSize: 11, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
    progressSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 6 },
    progressTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    progressLabel: { fontSize: 11, color: Colors.accent, textTransform: 'uppercase', fontWeight: '800', letterSpacing: 0.6 },
    progressValue: { marginTop: 2, fontSize: 15, fontWeight: '700', color: Colors.text },
    progressPercent: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.accent,
        backgroundColor: 'rgba(46, 204, 113, 0.12)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    progressTrack: { marginTop: 10, height: 10, borderRadius: 8, backgroundColor: 'rgba(46, 204, 113, 0.2)', overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 8 },
    timerSection: {
        marginHorizontal: 16,
        marginTop: 14,
        alignItems: 'center',
    },
    timerCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.accent,
        paddingVertical: 14,
        paddingHorizontal: 16,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    timerIconWrap: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(46, 204, 113, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerLabel: { fontSize: 10, color: Colors.textSecondary, textTransform: 'uppercase', fontWeight: '700' },
    timerValueRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
    timerValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
    timerMain: { flex: 1 },
    adjustBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 8 },
    timerActionBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: '#D4DBE3',
        backgroundColor: '#F7FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    startTimerBtn: {
        backgroundColor: Colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        gap: 6,
    },
    startTimerBtnText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 14,
    },
    content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
    stepTitle: { fontSize: 25, fontWeight: '800', color: Colors.text, lineHeight: 32 },
    stepInstruction: { fontSize: 16, color: '#4D5A69', lineHeight: 25 },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderLeftWidth: 4,
        borderLeftColor: Colors.accent,
        backgroundColor: 'rgba(46, 204, 113, 0.08)',
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10,
    },
    tipText: { flex: 1, color: '#4B5C6E', fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
    subInfo: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: 'rgba(46, 204, 113, 0.15)',
        backgroundColor: '#F8FDFB',
    },
    prevBtn: {
        flex: 1,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#E8EDF2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    prevBtnText: { color: '#556273', fontSize: 16, fontWeight: '700' },
    nextBtn: {
        flex: 2,
        height: 52,
        borderRadius: 12,
        backgroundColor: Colors.accent,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
    backSimpleBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
    backSimpleText: { color: '#FFFFFF', fontWeight: '700' },
});
