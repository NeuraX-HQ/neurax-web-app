import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

import { useMealStore } from '../src/store/mealStore';

interface Exercise {
    id: string;
    name: string;
    nameVi: string;
    icon: string;
    type: 'reps' | 'duration';
    metValue: number;
    sets?: number;
    reps?: number;
    durationMinutes?: number;
    completedSets: number[];
}

export default function WorkoutSessionScreen() {
    const router = useRouter();
    const { t, language } = useAppLanguage();
    const params = useLocalSearchParams();
    const { addActivity } = useMealStore();
    
    // Parse from params
    const [exercises, setExercises] = useState<Exercise[]>(() => {
        if (params.workoutList && typeof params.workoutList === 'string') {
            try {
                const parsed = JSON.parse(params.workoutList);
                return parsed.map((ex: any) => ({
                    ...ex,
                    completedSets: [],
                }));
            } catch (e) {
                console.error('Failed to parse workout list', e);
            }
        }
        return [
            {
                id: '1',
                name: 'Push-ups',
                nameVi: 'Hít đất',
                icon: '↔️',
                type: 'reps',
                metValue: 3.8,
                sets: 3,
                reps: 12,
                completedSets: [],
            },
            {
                id: '2',
                name: 'Plank',
                nameVi: 'Plank',
                icon: '—',
                type: 'duration',
                metValue: 3.0,
                durationMinutes: 2,
                completedSets: [],
            },
        ];
    });

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

    // Duration timer state
    const [durationTimer, setDurationTimer] = useState(() => {
        if (exercises[0]?.type === 'duration') {
            return (exercises[0].durationMinutes || 0) * 60;
        }
        return 0;
    });
    const [isDurationTimerRunning, setIsDurationTimerRunning] = useState(false);

    // Effect for duration timer
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isDurationTimerRunning && durationTimer > 0) {
            interval = setInterval(() => {
                setDurationTimer(prev => {
                    if (prev <= 1) {
                        setIsDurationTimerRunning(false);
                        completeSet(currentExerciseIndex, 1);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isDurationTimerRunning, durationTimer]);

    const currentExercise = exercises[currentExerciseIndex];
    const totalExercises = exercises.length;
    
    const totalSets = exercises.reduce((sum, ex) => sum + (ex.type === 'reps' ? (ex.sets || 1) : 1), 0);
    const completedSets = exercises.reduce((sum, ex) => sum + ex.completedSets.length, 0);
    const progressPercentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
    
    const [totalBurnedKcal, setTotalBurnedKcal] = useState(0);

    // Generate Rounds for Circuit mode
    const rounds = useMemo(() => {
        if (workoutMode !== 'circuit') return [];
        
        const maxSets = Math.max(...exercises.map(ex => ex.type === 'reps' ? (ex.sets || 1) : 1));
        const circuitRounds = [];
        
        for (let s = 1; s <= maxSets; s++) {
            const items = [];
            for (let i = 0; i < exercises.length; i++) {
                const ex = exercises[i];
                const totalExSets = ex.type === 'reps' ? (ex.sets || 1) : 1;
                if (s <= totalExSets) {
                    items.push({
                        exercise: ex,
                        originalIndex: i,
                        setNumber: s,
                        isCompleted: ex.completedSets.includes(s)
                    });
                }
            }
            if (items.length > 0) {
                circuitRounds.push({ roundNumber: s, items });
            }
        }
        return circuitRounds;
    }, [exercises, workoutMode]);

    // Find next target for auto-advance
    const getNextStep = (currentIdx: number, completedSet: number) => {
        if (workoutMode === 'traditional') {
            const currentEx = exercises[currentIdx];
            const totalExSets = currentEx.type === 'reps' ? (currentEx.sets || 1) : 1;
            
            // If still has sets in current exercise, stay there
            if (currentEx.completedSets.length < totalExSets) {
                return { nextIdx: currentIdx };
            }

            // Otherwise, find next incomplete exercise
            for (let i = 1; i < exercises.length; i++) {
                const nextIdx = (currentIdx + i) % exercises.length;
                const nextEx = exercises[nextIdx];
                const nextTotal = nextEx.type === 'reps' ? (nextEx.sets || 1) : 1;
                if (nextEx.completedSets.length < nextTotal) {
                    return { nextIdx };
                }
            }
        } else {
            // Circuit mode: use the flat list of rounds/items
            const flatItems = rounds.flatMap(r => r.items);
            const currentItemIndex = flatItems.findIndex(
                item => item.originalIndex === currentIdx && item.setNumber === completedSet
            );
            
            if (currentItemIndex !== -1 && currentItemIndex < flatItems.length - 1) {
                // Find next incomplete item in circuit
                for (let i = currentItemIndex + 1; i < flatItems.length; i++) {
                    if (!flatItems[i].isCompleted) {
                        return { nextIdx: flatItems[i].originalIndex };
                    }
                }
            }
        }
        return null; // All done or no specific next step
    };

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
        const targetEx = newExercises[exerciseIndex];

        // Bug 3 Fix: Enforce sequential set completion
        if (setNumber > 1 && !targetEx.completedSets.includes(setNumber - 1)) {
            return;
        }

        if (!targetEx.completedSets.includes(setNumber)) {
            targetEx.completedSets.push(setNumber);
            setExercises(newExercises);

            // Check if all exercises are complete
            const allComplete = newExercises.every(ex => {
                if (ex.type === 'reps') return ex.completedSets.length === (ex.sets || 1);
                return ex.completedSets.length > 0;
            });

            if (allComplete) {
                calculateAndShowCompleteModal(newExercises);
            } else {
                // Auto-advance logic
                const nextStep = getNextStep(exerciseIndex, setNumber);
                if (nextStep) {
                    // We'll actually switch indices AFTER the break or immediately?
                    // Let's set it now so the "Next" experience is smooth
                    setTimeout(() => {
                        setCurrentExerciseIndex(nextStep.nextIdx);
                    }, 100);
                }
                startBreak();
            }
        }
    };

    const calculateAndShowCompleteModal = (data: Exercise[]) => {
        const totalCaloriesBurned = Math.round(data.reduce((sum, ex) => {
            if (ex.completedSets.length === 0) return sum;
            const weight = 65; // standard avg weight
            let timeInHours = 0;
            if (ex.type === 'reps') {
                timeInHours = (ex.completedSets.length * 1) / 60; // assume 1 min per set
            } else {
                timeInHours = (ex.durationMinutes || 0) / 60;
            }
            return sum + (ex.metValue * weight * timeInHours);
        }, 0));
        setTotalBurnedKcal(totalCaloriesBurned);
        setTimeout(() => {
            setShowCompleteModal(true);
        }, 500);
    };

    const switchExercise = (index: number) => {
        setCurrentExerciseIndex(index);
        setIsBreak(false);
        setIsTimerRunning(false);
        setIsDurationTimerRunning(false);
        const ex = exercises[index];
        setDurationTimer(ex.type === 'duration' ? (ex.durationMinutes || 0) * 60 : 0);
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

    const finishWorkout = async () => {
        // Ensure we calculate latest calories if not already done
        const finalCalories = totalBurnedKcal > 0 ? totalBurnedKcal : Math.round(exercises.reduce((sum, ex) => {
            if (ex.completedSets.length === 0) return sum;
            const weight = 65;
            let timeInHours = 0;
            if (ex.type === 'reps') {
                timeInHours = (ex.completedSets.length * 1) / 60;
            } else {
                timeInHours = (ex.durationMinutes || 0) / 60;
            }
            return sum + (ex.metValue * weight * timeInHours);
        }, 0));

        if (finalCalories > 0) {
            const totalLoggedDuration = exercises.reduce((sum, ex) => {
                if (ex.completedSets.length === 0) return sum;
                if (ex.type === 'reps') return sum + ex.completedSets.length;
                return sum + (ex.durationMinutes || 0);
            }, 0);

            await addActivity({
                name: language === 'vi' ? 'Buổi tập' : 'Workout Session',
                caloriesBurned: finalCalories,
                durationMinutes: Math.max(1, totalLoggedDuration),
            });
        }
        setShowCompleteModal(false);
        router.back();
    };

    const finishEarly = () => {
        calculateAndShowCompleteModal(exercises);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={Colors.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{t('workout.sessionTitle')}</Text>
                    <Text style={styles.headerSubtitle}>{getTotalWorkoutTime()}</Text>
                </View>
                <TouchableOpacity onPress={finishEarly} style={styles.finishEarlyButton}>
                    <Text style={styles.finishEarlyText}>{language === 'vi' ? 'Kết thúc' : 'Finish'}</Text>
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
                                    {currentExercise.type === 'reps' 
                                        ? t('workout.setReps', { sets: currentExercise.sets || 0, reps: currentExercise.reps || 0 })
                                        : `${currentExercise.durationMinutes || 0} phút`}
                                </Text>
                            </View>
                        </View>

                        {/* Sets Grid OR Duration completion */}
                        {currentExercise.type === 'reps' ? (
                            <>
                                <View style={styles.setsGrid}>
                                    {Array.from({ length: currentExercise.sets || 1 }).map((_, index) => {
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
                            </>
                        ) : (
                            <View style={styles.durationContainer}>
                                <Text style={styles.durationTimerDisplay}>
                                    {isDurationTimerRunning || durationTimer > 0 
                                        ? formatTime(durationTimer) 
                                        : `${currentExercise.durationMinutes || 0}:00`}
                                </Text>
                                
                                {!currentExercise.completedSets.includes(1) && (
                                    <View style={styles.durationActionRow}>
                                        {!isDurationTimerRunning ? (
                                            <TouchableOpacity 
                                                style={styles.durationPlayBtn} 
                                                onPress={() => {
                                                    if (durationTimer === 0) setDurationTimer((currentExercise.durationMinutes || 0) * 60);
                                                    setIsDurationTimerRunning(true);
                                                }}
                                            >
                                                <Ionicons name="play" size={32} color="#FFF" />
                                            </TouchableOpacity>
                                        ) : (
                                            <TouchableOpacity 
                                                style={styles.durationPauseBtn} 
                                                onPress={() => setIsDurationTimerRunning(false)}
                                            >
                                                <Ionicons name="pause" size={32} color="#FFF" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                <TouchableOpacity
                                    style={[
                                        styles.durationCompleteButton,
                                        currentExercise.completedSets.includes(1) && styles.durationCompleteButtonDone
                                    ]}
                                    onPress={() => {
                                        setIsDurationTimerRunning(false);
                                        completeSet(currentExerciseIndex, 1);
                                    }}
                                    disabled={currentExercise.completedSets.includes(1)}
                                >
                                    <Text style={styles.durationCompleteButtonText}>
                                        {currentExercise.completedSets.includes(1) 
                                            ? (language === 'vi' ? 'Đã hoàn thành' : 'Completed') 
                                            : (language === 'vi' ? 'Đánh dấu hoàn thành' : 'Mark as Completed')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* All Exercises List */}
                <View style={styles.exercisesSection}>
                    <Text style={styles.sectionTitle}>{t('workout.allExercises')}</Text>
                    
                    {workoutMode === 'circuit' ? (
                        // Circuit Mode Rendering (Grouped by Rounds)
                        rounds.map((round) => (
                            <View key={`round-${round.roundNumber}`} style={styles.roundGroup}>
                                <Text style={styles.roundTitle}>Vòng {round.roundNumber}</Text>
                                {round.items.map((item, idx) => {
                                    const isActive = item.originalIndex === currentExerciseIndex && !item.isCompleted;
                                    const isCurrentEx = item.originalIndex === currentExerciseIndex;
                                    
                                    return (
                                        <TouchableOpacity
                                            key={`${item.exercise.id}-r${round.roundNumber}-${idx}`}
                                            style={[
                                                styles.exerciseItem,
                                                isCurrentEx && styles.exerciseItemActive,
                                                item.isCompleted && styles.exerciseItemCompleted,
                                            ]}
                                            onPress={() => switchExercise(item.originalIndex)}
                                            disabled={item.isCompleted}
                                        >
                                            <View style={styles.exerciseItemLeft}>
                                                <View style={[
                                                    styles.exerciseItemIcon,
                                                    item.isCompleted && styles.exerciseItemIconCompleted
                                                ]}>
                                                    {item.isCompleted ? (
                                                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                                                    ) : (
                                                        <Text style={styles.exerciseItemIconText}>{item.exercise.icon}</Text>
                                                    )}
                                                </View>
                                                <View style={styles.exerciseItemInfo}>
                                                    <Text style={[
                                                        styles.exerciseItemName,
                                                        item.isCompleted && styles.exerciseItemNameCompleted
                                                    ]}>
                                                        {language === 'vi' ? item.exercise.nameVi : item.exercise.name}
                                                    </Text>
                                                    <Text style={styles.exerciseItemSets}>
                                                        Hiệp {item.setNumber} • {item.exercise.reps} lần
                                                    </Text>
                                                </View>
                                            </View>
                                            {isCurrentEx && !item.isCompleted && (
                                                <View style={styles.activeIndicator}>
                                                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))
                    ) : (
                        // Traditional Mode Rendering (Current existing logic)
                        exercises.map((exercise, index) => {
                            const isActive = index === currentExerciseIndex;
                            const isCompleted = exercise.type === 'reps' 
                                ? exercise.completedSets.length === (exercise.sets || 1)
                                : exercise.completedSets.length > 0;
                            const progress = exercise.type === 'reps'
                                ? (exercise.completedSets.length / (exercise.sets || 1)) * 100
                                : (exercise.completedSets.length > 0 ? 100 : 0);

                            return (
                                <TouchableOpacity
                                    key={`${exercise.id}-${index}`}
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
                                                {exercise.type === 'reps' ? t('workout.progressSetReps', {
                                                    completed: exercise.completedSets.length,
                                                    sets: exercise.sets || 0,
                                                    reps: exercise.reps || 0,
                                                }) : `${exercise.durationMinutes || 0} phút`}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.exerciseItemProgress}>
                                        {isActive && !isCompleted && (
                                            <View style={styles.activeIndicator}>
                                                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
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
                        })
                    )}
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
                            Đã đốt cháy {totalBurnedKcal} kcal
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
    durationContainer: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    durationTimerDisplay: {
        fontSize: 48,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 16,
    },
    durationActionRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    durationPlayBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    durationPauseBtn: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: Colors.danger,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
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
    durationCompleteButton: {
        marginTop: 16,
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    durationCompleteButtonDone: {
        backgroundColor: Colors.success,
    },
    durationCompleteButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    roundGroup: {
        marginBottom: 24,
    },
    roundTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 12,
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        overflow: 'hidden',
    },
    finishEarlyButton: {
        backgroundColor: '#FFF0F0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFCACA',
    },
    finishEarlyText: {
        color: Colors.danger,
        fontSize: 12,
        fontWeight: '700',
    },
});
