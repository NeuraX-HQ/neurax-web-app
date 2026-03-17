import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

interface Exercise {
    id: string;
    name: string;
    nameVi: string;
    icon: string;
    sets: number;
    reps: number;
    completedSets: number[];
}

export default function WorkoutSessionScreen() {
    const router = useRouter();
    const { t, language } = useAppLanguage();
    const params = useLocalSearchParams();
    
    // Mock data - in real app, this would come from params
    const [exercises, setExercises] = useState<Exercise[]>([
        {
            id: '1',
            name: 'Push-ups',
            nameVi: 'Hít đất',
            icon: '↔️',
            sets: 3,
            reps: 12,
            completedSets: [],
        },
        {
            id: '2',
            name: 'Squats',
            nameVi: 'Squat',
            icon: '⬆️',
            sets: 4,
            reps: 15,
            completedSets: [],
        },
        {
            id: '3',
            name: 'Plank',
            nameVi: 'Plank',
            icon: '—',
            sets: 3,
            reps: 60,
            completedSets: [],
        },
    ]);

    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [workoutMode, setWorkoutMode] = useState<'circuit' | 'traditional'>('circuit'); // New: workout mode
    const [isBreak, setIsBreak] = useState(false);
    const [breakTime, setBreakTime] = useState(60); // seconds
    const [timer, setTimer] = useState(0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showBreakSettings, setShowBreakSettings] = useState(false);
    const [showModeSettings, setShowModeSettings] = useState(false); // New: mode settings
    const [defaultBreakTime, setDefaultBreakTime] = useState(60);
    const [workoutStartTime] = useState(Date.now());
    const [showCompleteModal, setShowCompleteModal] = useState(false);

    const currentExercise = exercises[currentExerciseIndex];
    const totalExercises = exercises.length;
    
    // Calculate total reps progress
    const totalReps = exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps), 0);
    const completedReps = exercises.reduce((sum, ex) => {
        return sum + (ex.completedSets.length * ex.reps);
    }, 0);
    const progressPercentage = Math.round((completedReps / totalReps) * 100);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => {
                    if (prev <= 1) {
                        setIsTimerRunning(false);
                        setIsBreak(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const completeSet = (exerciseIndex: number, setNumber: number) => {
        const newExercises = [...exercises];
        if (!newExercises[exerciseIndex].completedSets.includes(setNumber)) {
            newExercises[exerciseIndex].completedSets.push(setNumber);
            setExercises(newExercises);

            // Check if all exercises are complete
            const allComplete = newExercises.every(ex => ex.completedSets.length === ex.sets);
            if (allComplete) {
                setTimeout(() => {
                    setShowCompleteModal(true);
                }, 500);
            } else {
                // Start break after completing a set
                startBreak();
            }
        }
    };

    const switchExercise = (index: number) => {
        setCurrentExerciseIndex(index);
        setIsBreak(false);
        setIsTimerRunning(false);
    };

    const startBreak = () => {
        setIsBreak(true);
        setTimer(defaultBreakTime);
        setIsTimerRunning(true);
    };

    const skipBreak = () => {
        setIsBreak(false);
        setIsTimerRunning(false);
        setTimer(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getTotalWorkoutTime = () => {
        const elapsed = Math.floor((Date.now() - workoutStartTime) / 1000);
        return formatTime(elapsed);
    };

    const finishWorkout = () => {
        setShowCompleteModal(false);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{t('workout.title')}</Text>
                    <TouchableOpacity onPress={() => setShowModeSettings(true)}>
                        <Text style={styles.headerSubtitle}>
                            {workoutMode === 'circuit' ? t('workout.mode.circuit') : t('workout.mode.traditional')} • {completedReps}/{totalReps} {t('workout.repsShort')}
                        </Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity 
                    onPress={() => setShowBreakSettings(true)}
                    style={styles.settingsButton}
                >
                    <Ionicons name="settings-outline" size={24} color={Colors.text} />
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <View 
                        style={[
                            styles.progressFill, 
                            { width: `${progressPercentage}%` }
                        ]} 
                    />
                </View>
                <Text style={styles.progressText}>
                    {progressPercentage}%
                </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Break Timer */}
                {isBreak && (
                    <View style={[styles.breakCard, Shadows.medium]}>
                        <Text style={styles.breakTitle}>{t('workout.breakTime')}</Text>
                        <Text style={styles.breakTimer}>{formatTime(timer)}</Text>
                        <TouchableOpacity 
                            style={styles.skipBreakButton}
                            onPress={skipBreak}
                        >
                            <Text style={styles.skipBreakText}>{t('workout.skipBreak')}</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Current Exercise */}
                {!isBreak && currentExercise && (
                    <View style={[styles.currentExerciseCard, Shadows.medium]}>
                        <View style={styles.exerciseHeader}>
                            <View style={styles.exerciseIconLarge}>
                                <Text style={styles.exerciseIconLargeText}>{currentExercise.icon}</Text>
                            </View>
                            <View style={styles.exerciseHeaderInfo}>
                                <Text style={styles.exerciseNameLarge}>{language === 'vi' ? currentExercise.nameVi : currentExercise.name}</Text>
                                <Text style={styles.exerciseDetails}>
                                    {t('workout.setReps', { sets: currentExercise.sets, reps: currentExercise.reps })}
                                </Text>
                            </View>
                        </View>

                        {/* Sets Grid */}
                        <View style={styles.setsGrid}>
                            {Array.from({ length: currentExercise.sets }).map((_, index) => {
                                const setNumber = index + 1;
                                const isCompleted = currentExercise.completedSets.includes(setNumber);
                                return (
                                    <TouchableOpacity
                                        key={setNumber}
                                        style={[
                                            styles.setButton,
                                            isCompleted && styles.setButtonCompleted
                                        ]}
                                        onPress={() => completeSet(currentExerciseIndex, setNumber)}
                                        disabled={isCompleted}
                                    >
                                        {isCompleted ? (
                                            <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.setButtonText}>{setNumber}</Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <Text style={styles.setInstruction}>
                            {t('workout.tapSetInstruction')}
                        </Text>
                    </View>
                )}

                {/* All Exercises List */}
                <View style={styles.exercisesSection}>
                    <Text style={styles.sectionTitle}>{t('workout.allExercises')}</Text>
                    {exercises.map((exercise, index) => {
                        const isActive = index === currentExerciseIndex;
                        const isCompleted = exercise.completedSets.length === exercise.sets;
                        const progress = (exercise.completedSets.length / exercise.sets) * 100;

                        return (
                            <TouchableOpacity
                                key={exercise.id}
                                style={[
                                    styles.exerciseItem,
                                    isActive && styles.exerciseItemActive,
                                    isCompleted && styles.exerciseItemCompleted,
                                ]}
                                onPress={() => switchExercise(index)}
                                disabled={isCompleted}
                            >
                                <View style={styles.exerciseItemLeft}>
                                    <View style={[
                                        styles.exerciseItemIcon,
                                        isCompleted && styles.exerciseItemIconCompleted
                                    ]}>
                                        {isCompleted ? (
                                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                        ) : (
                                            <Text style={styles.exerciseItemIconText}>{exercise.icon}</Text>
                                        )}
                                    </View>
                                    <View style={styles.exerciseItemInfo}>
                                        <Text style={[
                                            styles.exerciseItemName,
                                            isCompleted && styles.exerciseItemNameCompleted
                                        ]}>
                                            {language === 'vi' ? exercise.nameVi : exercise.name}
                                        </Text>
                                        <Text style={styles.exerciseItemSets}>
                                            {t('workout.progressSetReps', {
                                                completed: exercise.completedSets.length,
                                                sets: exercise.sets,
                                                reps: exercise.reps,
                                            })}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.exerciseItemProgress}>
                                    {isActive && !isCompleted && (
                                        <View style={styles.activeIndicator}>
                                            <Ionicons name="play" size={16} color="#FFFFFF" />
                                        </View>
                                    )}
                                    {!isActive && !isCompleted && (
                                        <View style={styles.progressCircle}>
                                            <Text style={styles.progressCircleText}>
                                                {Math.round(progress)}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Break Settings Modal */}
            <Modal
                visible={showBreakSettings}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowBreakSettings(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('workout.breakSettings')}</Text>
                            <TouchableOpacity onPress={() => setShowBreakSettings(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.breakTimeOptions}>
                            {[30, 60, 90, 120].map((seconds) => (
                                <TouchableOpacity
                                    key={seconds}
                                    style={[
                                        styles.breakTimeOption,
                                        defaultBreakTime === seconds && styles.breakTimeOptionSelected
                                    ]}
                                    onPress={() => {
                                        setDefaultBreakTime(seconds);
                                        setShowBreakSettings(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.breakTimeOptionText,
                                        defaultBreakTime === seconds && styles.breakTimeOptionTextSelected
                                    ]}>
                                        {seconds}s
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Workout Mode Settings Modal */}
            <Modal
                visible={showModeSettings}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowModeSettings(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('workout.modeSettings')}</Text>
                            <TouchableOpacity onPress={() => setShowModeSettings(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.modeOption,
                                workoutMode === 'circuit' && styles.modeOptionSelected
                            ]}
                            onPress={() => {
                                setWorkoutMode('circuit');
                                setShowModeSettings(false);
                            }}
                        >
                            <View style={styles.modeOptionLeft}>
                                <Text style={styles.modeOptionIcon}>🔄</Text>
                                <View>
                                    <Text style={[
                                        styles.modeOptionTitle,
                                        workoutMode === 'circuit' && styles.modeOptionTitleSelected
                                    ]}>
                                        {t('workout.mode.circuitTitle')}
                                    </Text>
                                    <Text style={styles.modeOptionDesc}>
                                        {t('workout.mode.circuitDesc')}
                                    </Text>
                                </View>
                            </View>
                            {workoutMode === 'circuit' && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                styles.modeOption,
                                workoutMode === 'traditional' && styles.modeOptionSelected
                            ]}
                            onPress={() => {
                                setWorkoutMode('traditional');
                                setShowModeSettings(false);
                            }}
                        >
                            <View style={styles.modeOptionLeft}>
                                <Text style={styles.modeOptionIcon}>📋</Text>
                                <View>
                                    <Text style={[
                                        styles.modeOptionTitle,
                                        workoutMode === 'traditional' && styles.modeOptionTitleSelected
                                    ]}>
                                        {t('workout.mode.traditionalTitle')}
                                    </Text>
                                    <Text style={styles.modeOptionDesc}>
                                        {t('workout.mode.traditionalDesc')}
                                    </Text>
                                </View>
                            </View>
                            {workoutMode === 'traditional' && (
                                <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Workout Complete Modal */}
            <Modal
                visible={showCompleteModal}
                animationType="fade"
                transparent={true}
            >
                <View style={styles.completeOverlay}>
                    <View style={styles.completeCard}>
                        <Text style={styles.completeEmoji}>🎉</Text>
                        <Text style={styles.completeTitle}>{t('workout.completeTitle')}</Text>
                        <Text style={styles.completeMessage}>
                            {t('workout.completeMessage', { totalReps })}
                        </Text>
                        <Text style={styles.completeTime}>
                            {t('workout.completeTime', { time: getTotalWorkoutTime() })}
                        </Text>
                        <TouchableOpacity
                            style={styles.completeButton}
                            onPress={finishWorkout}
                        >
                            <Text style={styles.completeButtonText}>{t('workout.done')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 4,
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    settingsButton: {
        padding: 4,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    progressBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#E8E8E8',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        minWidth: 45,
        textAlign: 'right',
    },
    breakCard: {
        backgroundColor: '#FFF3E6',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 24,
        borderRadius: 16,
        alignItems: 'center',
    },
    breakTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 12,
    },
    breakTimer: {
        fontSize: 48,
        fontWeight: '800',
        color: Colors.streak,
        marginBottom: 16,
    },
    skipBreakButton: {
        paddingHorizontal: 24,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 20,
    },
    skipBreakText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    currentExerciseCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 20,
        borderRadius: 16,
    },
    exerciseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 16,
    },
    exerciseIconLarge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exerciseIconLargeText: {
        fontSize: 32,
    },
    exerciseHeaderInfo: {
        flex: 1,
    },
    exerciseNameLarge: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    exerciseDetails: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    setsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    setButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    setButtonCompleted: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    setButtonText: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
    },
    setInstruction: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    exercisesSection: {
        marginTop: 24,
        paddingHorizontal: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 12,
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
    },
    exerciseItemActive: {
        borderWidth: 2,
        borderColor: Colors.primary,
    },
    exerciseItemCompleted: {
        opacity: 0.6,
    },
    exerciseItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    exerciseItemIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exerciseItemIconCompleted: {
        backgroundColor: Colors.primary,
    },
    exerciseItemIconText: {
        fontSize: 20,
    },
    exerciseItemInfo: {
        flex: 1,
    },
    exerciseItemName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    exerciseItemNameCompleted: {
        textDecorationLine: 'line-through',
    },
    exerciseItemSets: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    exerciseItemProgress: {
        marginLeft: 12,
    },
    progressCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressCircleText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    breakTimeOptions: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    breakTimeOption: {
        flex: 1,
        paddingVertical: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    breakTimeOptionSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    breakTimeOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    breakTimeOptionTextSelected: {
        color: '#FFFFFF',
    },
    modeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    modeOptionSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: Colors.primary,
    },
    modeOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    modeOptionIcon: {
        fontSize: 28,
    },
    modeOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 2,
    },
    modeOptionTitleSelected: {
        color: Colors.primary,
    },
    modeOptionDesc: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    activeIndicator: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    completeOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    completeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 320,
    },
    completeEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    completeTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.text,
        marginBottom: 8,
    },
    completeMessage: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: 8,
    },
    completeTime: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
        marginBottom: 24,
    },
    completeButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 48,
        paddingVertical: 14,
        borderRadius: 24,
        width: '100%',
    },
    completeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
});
