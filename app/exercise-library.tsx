import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

interface Exercise {
    id: string;
    name: string;
    nameVi: string;
    icon: string;
    category: string;
    description: string;
    instructions: string;
    type: 'reps' | 'duration';
    metValue: number; // Metabolic Equivalent of Task
    sets?: number;
    reps?: number;
    durationMinutes?: number;
    videoUrl?: string;
}

const exercises: Exercise[] = [
    // --- NÀI TẬP NGOÀI TRỜI (DURATION) ---
    {
        id: '1',
        name: 'Running',
        nameVi: 'Chạy bộ',
        icon: '🏃‍♂️',
        category: 'CARDIO & NGOÀI TRỜI',
        description: 'Đốt calo mạnh mẽ và tăng cường tim mạch',
        instructions: 'Chạy với tốc độ ổn định, giữ nhịp thở đều đặn và đáp đất bằng giữa bàn chân để giảm chấn thương.',
        type: 'duration',
        metValue: 9.8,
        durationMinutes: 30,
    },
    {
        id: '2',
        name: 'Walking',
        nameVi: 'Đi bộ',
        icon: '🚶‍♂️',
        category: 'CARDIO & NGOÀI TRỜI',
        description: 'Vận động nhẹ nhàng, dễ bắt đầu cho mọi người',
        instructions: 'Đi thành những bước dài vừa phải, đánh tay nhẹ nhàng và giữ thẳng lưng.',
        type: 'duration',
        metValue: 3.8,
        durationMinutes: 45,
    },
    {
        id: '3',
        name: 'Cycling',
        nameVi: 'Đạp xe',
        icon: '🚴‍♂️',
        category: 'CARDIO & NGOÀI TRỜI',
        description: 'Tốt cho khớp gối và tim mạch',
        instructions: 'Đạp với nhịp độ khoảng 60-80 vòng/phút. Điều chỉnh yên xe phù hợp với chiều dài chân.',
        type: 'duration',
        metValue: 7.5,
        durationMinutes: 45,
    },
    {
        id: '4',
        name: 'Swimming',
        nameVi: 'Bơi lội',
        icon: '🏊‍♂️',
        category: 'CARDIO & NGOÀI TRỜI',
        description: 'Vận động toàn thân không gây áp lực lên khớp',
        instructions: 'Bơi sải hoặc bơi nghiêng, chú ý nhịp thở và giữ cơ thể nổi đều.',
        type: 'duration',
        metValue: 8.0,
        durationMinutes: 30,
    },
    {
        id: '5',
        name: 'Skipping Rope',
        nameVi: 'Nhảy dây',
        icon: '➰',
        category: 'CARDIO & NGOÀI TRỜI',
        description: 'Đốt calo cực nhanh và tăng sự linh hoạt',
        instructions: 'Nhảy bằng mũi chân, chỉ cao đủ để qua dây. Quất dây bằng cổ tay chứ không phải cả cánh tay.',
        type: 'duration',
        metValue: 11.0,
        durationMinutes: 15,
    },
    {
        id: '6',
        name: 'Badminton',
        nameVi: 'Cầu lông',
        icon: '🏸',
        category: 'THỂ THAO',
        description: 'Tăng phản xạ và sự nhanh nhẹn',
        instructions: 'Đánh đơn hoặc đôi, tập trung vào bộ pháp di chuyển và sức bật.',
        type: 'duration',
        metValue: 5.5,
        durationMinutes: 60,
    },

    // --- BÀI TẬP TẠI NHÀ (REPS & DURATION) ---
    {
        id: '7',
        name: 'Push-ups',
        nameVi: 'Hít đất',
        icon: '↔️',
        category: 'NGỰC & BẮP TAY SAU',
        description: 'Bài tập cơ bản cho ngực, vai và tay sau',
        instructions: 'Bắt đầu ở tư thế plank cao. Thân người là một đường thẳng. Hạ thấp người cho đến khi ngực gần chạm sàn, sau đó đẩy trở lại.',
        type: 'reps',
        metValue: 3.8,
        sets: 3,
        reps: 15,
    },
    {
        id: '8',
        name: 'Squats',
        nameVi: 'Squat',
        icon: '⬆️',
        category: 'CHÂN & MÔNG',
        description: 'Bài tập cơ bản cho chân và mông',
        instructions: 'Đứng thẳng, chân rộng bằng vai. Hạ người xuống như ngồi xuống ghế, giữ lưng thẳng và đầu gối không vượt quá mũi chân.',
        type: 'reps',
        metValue: 5.0,
        sets: 4,
        reps: 20,
    },
    {
        id: '9',
        name: 'Pull-ups',
        nameVi: 'Kéo xà',
        icon: '⬆',
        category: 'LƯNG & TAY TRƯỚC',
        description: 'Bài tập cho lưng và tay trước',
        instructions: 'Treo người trên xà đơn, tay rộng hơn vai. Kéo người lên cho đến khi cằm vượt qua xà. Hạ người xuống chậm rãi.',
        type: 'reps',
        metValue: 3.8,
        sets: 3,
        reps: 8,
    },
    {
        id: '10',
        name: 'Crunches',
        nameVi: 'Gập bụng',
        icon: '〽️',
        category: 'CORE & BỤNG',
        description: 'Làm săn chắc cơ bụng',
        instructions: 'Nằm ngửa, gập đầu gối. Đặt tay sau đầu, nâng vai rời khỏi sàn và siết chặt cơ bụng. Không dùng tay kéo đầu.',
        type: 'reps',
        metValue: 2.8,
        sets: 3,
        reps: 20,
    },
    {
        id: '11',
        name: 'Burpees',
        nameVi: 'Nhảy ếch',
        icon: '⚡',
        category: 'TOÀN THÂN',
        description: 'Kết hợp squat, hít đất và nhảy, đốt calo cực đỉnh',
        instructions: 'Squat xuống, hai tay chạm đất. Bật chân ra sau thành tư thế hít đất. Làm 1 cái hít đất, bật chân lên lại và nhảy cao lên trời.',
        type: 'reps',
        metValue: 8.0,
        sets: 3,
        reps: 10,
    },
    {
        id: '12',
        name: 'Plank',
        nameVi: 'Plank',
        icon: '—',
        category: 'CORE & BỤNG',
        description: 'Bài tập tăng cường sức bền core',
        instructions: 'Nằm sấp, nâng người lên bằng cẳng tay và mũi chân. Giữ cơ thể thẳng như một đường thẳng, siết chặt bụng.',
        type: 'duration',
        metValue: 3.8,
        durationMinutes: 1, // 1 Minute per set usually, but here just total duration
    },
];

export default function ExerciseLibraryScreen() {
    const router = useRouter();
    const { t, language } = useAppLanguage();
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showWorkoutList, setShowWorkoutList] = useState(false);
    const [workoutList, setWorkoutList] = useState<Exercise[]>([]);
    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(12);
    const [durationMinutes, setDurationMinutes] = useState(30);

    const openExerciseDetail = (exercise: Exercise) => {
        setSelectedExercise(exercise);
        setSets(exercise.sets || 3);
        setReps(exercise.reps || 12);
        setDurationMinutes(exercise.durationMinutes || 30);
        setShowDetail(true);
    };

    const addToWorkout = () => {
        if (selectedExercise) {
            setWorkoutList([...workoutList, { ...selectedExercise, sets, reps, durationMinutes }]);
            setShowDetail(false);
        }
    };

    const removeFromWorkout = (index: number) => {
        setWorkoutList(workoutList.filter((_, i) => i !== index));
    };

    const startWorkout = () => {
        // Navigate to workout session screen
        setShowWorkoutList(false);
        router.push({
            pathname: '/workout-session',
            params: { workoutList: JSON.stringify(workoutList) }
        });
    };

    const adjustValue = (value: number, delta: number, min: number = 1) => {
        return Math.max(min, value + delta);
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('exerciseLibrary.title')}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Exercise List */}
                {exercises.map((exercise) => (
                    <TouchableOpacity
                        key={exercise.id}
                        style={[styles.exerciseCard, Shadows.small]}
                        onPress={() => openExerciseDetail(exercise)}
                    >
                        <View style={styles.exerciseIcon}>
                            <Text style={styles.exerciseIconText}>{exercise.icon}</Text>
                        </View>
                        <Text style={styles.exerciseName}>{language === 'vi' ? exercise.nameVi : exercise.name}</Text>
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => openExerciseDetail(exercise)}
                        >
                            <Ionicons name="add" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Workout List Badge */}
            {workoutList.length > 0 && (
                <TouchableOpacity 
                    style={styles.workoutBadge}
                    onPress={() => setShowWorkoutList(true)}
                >
                    <Text style={styles.workoutBadgeText}>
                        {t('exerciseLibrary.selectedCount', { count: workoutList.length })}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Exercise Detail Modal */}
            <Modal
                visible={showDetail}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowDetail(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedExercise && (
                            <>
                                {/* Modal Header */}
                                <View style={styles.modalHeader}>
                                    <View>
                                        <Text style={styles.modalTitle}>{language === 'vi' ? selectedExercise.nameVi : selectedExercise.name}</Text>
                                        <Text style={styles.modalCategory}>{selectedExercise.category}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setShowDetail(false)}
                                        style={styles.closeButton}
                                    >
                                        <Ionicons name="close" size={24} color={Colors.textSecondary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {/* Video Thumbnail */}
                                    <View style={styles.videoContainer}>
                                        <View style={styles.videoPlaceholder}>
                                            <View style={styles.playButton}>
                                                <Ionicons name="play" size={32} color="#FFFFFF" />
                                            </View>
                                        </View>
                                    </View>

                                    {/* Instructions */}
                                    <View style={styles.instructionsSection}>
                                        <Text style={styles.sectionTitle}>{t('exerciseLibrary.instructions')}</Text>
                                        <Text style={styles.instructionsText}>
                                            {selectedExercise.instructions}
                                        </Text>
                                    </View>

                                    {/* Sets and Reps Controls */}
                                    <View style={styles.controlsSection}>
                                        {selectedExercise.type === 'reps' ? (
                                            <>
                                                <View style={styles.controlGroup}>
                                                    <Text style={styles.controlLabel}>{t('exerciseLibrary.sets')}</Text>
                                                    <View style={styles.controlRow}>
                                                        <TouchableOpacity
                                                            style={styles.controlButton}
                                                            onPress={() => setSets(adjustValue(sets, -1))}
                                                        >
                                                            <Text style={styles.controlButtonText}>−</Text>
                                                        </TouchableOpacity>
                                                        <View style={styles.controlValue}>
                                                            <Text style={styles.controlValueText}>{sets}</Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            style={styles.controlButton}
                                                            onPress={() => setSets(adjustValue(sets, 1))}
                                                        >
                                                            <Text style={styles.controlButtonText}>+</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>

                                                <View style={styles.controlGroup}>
                                                    <Text style={styles.controlLabel}>{t('exerciseLibrary.reps')}</Text>
                                                    <View style={styles.controlRow}>
                                                        <TouchableOpacity
                                                            style={styles.controlButton}
                                                            onPress={() => setReps(adjustValue(reps, -1))}
                                                        >
                                                            <Text style={styles.controlButtonText}>−</Text>
                                                        </TouchableOpacity>
                                                        <View style={styles.controlValue}>
                                                            <Text style={styles.controlValueText}>{reps}</Text>
                                                        </View>
                                                        <TouchableOpacity
                                                            style={styles.controlButton}
                                                            onPress={() => setReps(adjustValue(reps, 1))}
                                                        >
                                                            <Text style={styles.controlButtonText}>+</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </>
                                        ) : (
                                            <View style={styles.controlGroup}>
                                                <Text style={styles.controlLabel}>{language === 'vi' ? 'Thời gian (phút)' : 'Duration (minutes)'}</Text>
                                                <View style={styles.controlRow}>
                                                    <TouchableOpacity
                                                        style={styles.controlButton}
                                                        onPress={() => setDurationMinutes(adjustValue(durationMinutes, -5, 5))}
                                                    >
                                                        <Text style={styles.controlButtonText}>−</Text>
                                                    </TouchableOpacity>
                                                    <View style={styles.controlValue}>
                                                        <Text style={styles.controlValueText}>{durationMinutes}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        style={styles.controlButton}
                                                        onPress={() => setDurationMinutes(adjustValue(durationMinutes, 5, 5))}
                                                    >
                                                        <Text style={styles.controlButtonText}>+</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        )}
                                    </View>

                                    {/* Add to Workout Button */}
                                    <TouchableOpacity
                                        style={styles.addToWorkoutButton}
                                        onPress={addToWorkout}
                                    >
                                        <Ionicons name="add" size={20} color="#FFFFFF" />
                                        <Text style={styles.addToWorkoutText}>{t('exerciseLibrary.addToWorkout')}</Text>
                                    </TouchableOpacity>

                                    <View style={{ height: 20 }} />
                                </ScrollView>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Workout List Modal */}
            <Modal
                visible={showWorkoutList}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowWorkoutList(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>{t('exerciseLibrary.yourWorkout')}</Text>
                                <Text style={styles.modalCategory}>
                                    {t('exerciseLibrary.workoutSummary', {
                                        count: workoutList.length,
                                        reps: workoutList.reduce((sum, ex) => sum + (ex.type === 'reps' ? ((ex.sets||0) * (ex.reps||0)) : 0), 0),
                                    })}
                                    {workoutList.some(ex => ex.type === 'duration') && 
                                        ` • ${workoutList.reduce((sum, ex) => sum + (ex.type === 'duration' ? (ex.durationMinutes||0) : 0), 0)} phút`}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowWorkoutList(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Workout List */}
                            {workoutList.map((exercise, index) => (
                                <View key={index} style={styles.workoutItem}>
                                    <View style={styles.workoutItemLeft}>
                                        <View style={styles.workoutItemIcon}>
                                            <Text style={styles.workoutItemIconText}>{exercise.icon}</Text>
                                        </View>
                                        <View style={styles.workoutItemInfo}>
                                            <Text style={styles.workoutItemName}>{language === 'vi' ? exercise.nameVi : exercise.name}</Text>
                                            <Text style={styles.workoutItemDetails}>
                                                {exercise.type === 'reps' 
                                                    ? t('exerciseLibrary.setReps', { sets: exercise.sets || 0, reps: exercise.reps || 0 })
                                                    : `${exercise.durationMinutes || 0} phút`
                                                }
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeFromWorkout(index)}
                                    >
                                        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {workoutList.length === 0 && (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyStateText}>
                                        {t('exerciseLibrary.empty')}
                                    </Text>
                                </View>
                            )}

                            <View style={{ height: 100 }} />
                        </ScrollView>

                        {/* Start Workout Button */}
                        {workoutList.length > 0 && (
                            <View style={styles.startWorkoutContainer}>
                                <TouchableOpacity
                                    style={styles.startWorkoutButton}
                                    onPress={startWorkout}
                                >
                                    <Ionicons name="play" size={20} color="#FFFFFF" />
                                    <Text style={styles.startWorkoutText}>{t('exerciseLibrary.startWorkout')}</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    exerciseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 12,
        padding: 16,
        borderRadius: 12,
        gap: 12,
    },
    exerciseIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exerciseIconText: {
        fontSize: 20,
    },
    exerciseName: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    addButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutBadge: {
        position: 'absolute',
        bottom: 90,
        alignSelf: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
        ...Shadows.medium,
    },
    workoutBadgeText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
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
        paddingTop: 20,
        paddingHorizontal: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    modalCategory: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
        letterSpacing: 0.5,
    },
    closeButton: {
        padding: 4,
    },
    videoContainer: {
        marginBottom: 20,
    },
    videoPlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: 16,
        backgroundColor: '#E8F0E8',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    playButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    instructionsSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: 12,
    },
    instructionsText: {
        fontSize: 14,
        lineHeight: 22,
        color: Colors.text,
    },
    controlsSection: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    controlGroup: {
        flex: 1,
    },
    controlLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: 8,
        textAlign: 'center',
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    controlButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    controlButtonText: {
        fontSize: 20,
        color: Colors.text,
        fontWeight: '400',
    },
    controlValue: {
        minWidth: 60,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        alignItems: 'center',
    },
    controlValueText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    addToWorkoutButton: {
        flexDirection: 'row',
        backgroundColor: '#000000',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addToWorkoutText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    workoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F8F9FA',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    workoutItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    workoutItemIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    workoutItemIconText: {
        fontSize: 24,
    },
    workoutItemInfo: {
        flex: 1,
    },
    workoutItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    workoutItemDetails: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    removeButton: {
        padding: 8,
    },
    emptyState: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyStateText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    startWorkoutContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    startWorkoutButton: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...Shadows.medium,
    },
    startWorkoutText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
