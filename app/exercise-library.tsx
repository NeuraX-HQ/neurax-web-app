import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Shadows } from '../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

interface Exercise {
    id: string;
    name: string;
    nameVi: string;
    icon: string;
    category: string;
    description: string;
    instructions: string;
    sets: number;
    reps: number;
    videoUrl?: string;
}

const exercises: Exercise[] = [
    {
        id: '1',
        name: 'Push-ups',
        nameVi: 'Hít đất',
        icon: '↔️',
        category: 'NGỰC & BẮP TAY SAU',
        description: 'Bài tập cơ bản cho ngực, vai và tay sau',
        instructions: 'Bắt đầu ở tư thế plank cao, tay rộng hơn vai một chút. Giữ cơ thể thành một đường thẳng từ đầu đến gót chân. Hạ thấp người cho đến khi ngực gần chạm sàn, sau đó đẩy mạnh trở lại vị trí bắt đầu.',
        sets: 3,
        reps: 12,
    },
    {
        id: '2',
        name: 'Squats',
        nameVi: 'Squat',
        icon: '⬆️',
        category: 'CHÂN & MÔng',
        description: 'Bài tập cơ bản cho chân và mông',
        instructions: 'Đứng thẳng, chân rộng bằng vai. Hạ người xuống như ngồi xuống ghế, giữ lưng thẳng và đầu gối không vượt quá mũi chân. Đẩy mạnh trở lại vị trí đứng.',
        sets: 4,
        reps: 15,
    },
    {
        id: '3',
        name: 'Lunges',
        nameVi: 'Lunge',
        icon: '⊕',
        category: 'CHÂN & MÔng',
        description: 'Bài tập cho chân và cân bằng',
        instructions: 'Bước một chân ra phía trước, hạ người xuống cho đến khi cả hai đầu gối tạo góc 90 độ. Đẩy trở lại vị trí ban đầu và đổi chân.',
        sets: 3,
        reps: 10,
    },
    {
        id: '4',
        name: 'Plank',
        nameVi: 'Plank',
        icon: '—',
        category: 'CORE & BỤNG',
        description: 'Bài tập tăng cường core',
        instructions: 'Nằm sấp, nâng người lên bằng cẳng tay và mũi chân. Giữ cơ thể thẳng như một đường thẳng, không để hông sụp xuống hay nâng cao.',
        sets: 3,
        reps: 60, // seconds
    },
    {
        id: '5',
        name: 'Deadlifts',
        nameVi: 'Deadlift',
        icon: '≡',
        category: 'LƯNG & CHÂN',
        description: 'Bài tập toàn thân với trọng lượng',
        instructions: 'Đứng với chân rộng bằng vai, cầm tạ ở phía trước. Cúi người về phía trước từ hông, giữ lưng thẳng. Đẩy hông về phía trước để trở lại vị trí đứng.',
        sets: 4,
        reps: 8,
    },
    {
        id: '6',
        name: 'Pull-ups',
        nameVi: 'Kéo xà',
        icon: '⬆',
        category: 'LƯNG & TAY',
        description: 'Bài tập cho lưng và tay trước',
        instructions: 'Treo người trên xà đơn, tay rộng hơn vai. Kéo người lên cho đến khi cằm vượt qua xà. Hạ người xuống một cách kiểm soát.',
        sets: 3,
        reps: 8,
    },
];

export default function ExerciseLibraryScreen() {
    const router = useRouter();
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showWorkoutList, setShowWorkoutList] = useState(false);
    const [workoutList, setWorkoutList] = useState<Exercise[]>([]);
    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(12);

    const openExerciseDetail = (exercise: Exercise) => {
        setSelectedExercise(exercise);
        setSets(exercise.sets);
        setReps(exercise.reps);
        setShowDetail(true);
    };

    const addToWorkout = () => {
        if (selectedExercise) {
            setWorkoutList([...workoutList, { ...selectedExercise, sets, reps }]);
            setShowDetail(false);
        }
    };

    const removeFromWorkout = (index: number) => {
        setWorkoutList(workoutList.filter((_, i) => i !== index));
    };

    const startWorkout = () => {
        // Navigate to workout session screen
        setShowWorkoutList(false);
        router.push('/workout-session');
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
                <Text style={styles.headerTitle}>Exercise Library</Text>
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
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
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
                        {workoutList.length} bài tập đã chọn • Xem chi tiết
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
                                        <Text style={styles.modalTitle}>{selectedExercise.nameVi}</Text>
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
                                        <Text style={styles.sectionTitle}>HƯỚNG DẪN KỸ THUẬT</Text>
                                        <Text style={styles.instructionsText}>
                                            {selectedExercise.instructions}
                                        </Text>
                                    </View>

                                    {/* Sets and Reps Controls */}
                                    <View style={styles.controlsSection}>
                                        <View style={styles.controlGroup}>
                                            <Text style={styles.controlLabel}>SỐ HIỆP (SETS)</Text>
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
                                            <Text style={styles.controlLabel}>SỐ LẦN (REPS)</Text>
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
                                    </View>

                                    {/* Add to Workout Button */}
                                    <TouchableOpacity
                                        style={styles.addToWorkoutButton}
                                        onPress={addToWorkout}
                                    >
                                        <Ionicons name="add" size={20} color="#FFFFFF" />
                                        <Text style={styles.addToWorkoutText}>Thêm vào buổi tập</Text>
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
                                <Text style={styles.modalTitle}>Buổi tập của bạn</Text>
                                <Text style={styles.modalCategory}>
                                    {workoutList.length} bài tập • {workoutList.reduce((sum, ex) => sum + ex.sets * ex.reps, 0)} lần
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
                                            <Text style={styles.workoutItemName}>{exercise.nameVi}</Text>
                                            <Text style={styles.workoutItemDetails}>
                                                {exercise.sets} hiệp × {exercise.reps} lần
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
                                        Chưa có bài tập nào được chọn
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
                                    <Text style={styles.startWorkoutText}>Bắt đầu tập</Text>
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
