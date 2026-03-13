import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Animated, LayoutAnimation, Platform, UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { useWorkoutStore, Exercise, WorkoutExercise, ExerciseType } from '../../src/store/workoutStore';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MOODS = [
    { id: 'sleepy', label: 'Sleepy', icon: 'moon-outline' },
    { id: 'strong', label: 'Strong', icon: 'flash-outline' },
    { id: 'fire', label: 'Fire', icon: 'flame-outline' },
];

export default function WorkoutScreen() {
    const { availableExercises, history, addWorkoutToHistory } = useWorkoutStore();
    const [selectedMood, setSelectedMood] = useState<'sleepy' | 'strong' | 'fire'>('strong');
    const [showSelectionModal, setShowSelectionModal] = useState(false);
    const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

    const toggleHistoryExpand = (id: string) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedHistoryId(expandedHistoryId === id ? null : id);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1D3E31" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Session</Text>
                <TouchableOpacity style={styles.iconBtn}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#1D3E31" />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Burn Stats Card */}
                <View style={styles.burnCard}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>ESTIMATED BURN</Text>
                        <View style={styles.statValueRow}>
                            <Text style={styles.statValue}>482</Text>
                            <Text style={styles.statUnit}>kcal</Text>
                        </View>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>DURATION</Text>
                        <Text style={styles.statValue}>45:12</Text>
                    </View>
                </View>

                {/* Mood Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>TODAY'S MOOD</Text>
                </View>
                <View style={styles.moodRow}>
                    {MOODS.map(mood => (
                        <TouchableOpacity
                            key={mood.id}
                            style={[styles.moodItem, selectedMood === mood.id && styles.moodItemActive]}
                            onPress={() => setSelectedMood(mood.id as any)}
                        >
                            <Ionicons
                                name={mood.icon as any}
                                size={28}
                                color={selectedMood === mood.id ? '#1D3E31' : '#A0AEC0'}
                            />
                            <Text style={[styles.moodLabel, selectedMood === mood.id && styles.moodLabelActive]}>
                                {mood.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* History Section */}
                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                    <Text style={styles.sectionTitle}>Recent History</Text>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setShowSelectionModal(true)}>
                        <Ionicons name="add" size={18} color="#FFF" />
                        <Text style={styles.addBtnText}>Add New</Text>
                    </TouchableOpacity>
                </View>

                {history.map(session => (
                    <TouchableOpacity
                        key={session.id}
                        style={styles.historyCard}
                        onPress={() => toggleHistoryExpand(session.id)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.historyTop}>
                            <View style={styles.historyIconBox}>
                                <Ionicons name="calendar-outline" size={20} color="#1D3E31" />
                            </View>
                            <View style={styles.historyInfo}>
                                <Text style={styles.historyName}>{session.date} • {session.duration}</Text>
                                <Text style={styles.historyDetail}>{session.caloriesBurned} kcal</Text>
                            </View>
                            <Ionicons
                                name={expandedHistoryId === session.id ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#A0AEC0"
                            />
                        </View>

                        {expandedHistoryId === session.id && (
                            <View style={styles.historyExpanded}>
                                <View style={styles.divider} />
                                {session.exercises.length > 0 ? (
                                    session.exercises.map((ex, i) => (
                                        <Text key={i} style={styles.exListText}>• {ex.name}</Text>
                                    ))
                                ) : (
                                    <Text style={styles.emptyText}>No exercises recorded</Text>
                                )}
                            </View>
                        )}
                    </TouchableOpacity>
                ))}

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Exercise Selection Modal */}
            <ExerciseSelectionModal
                visible={showSelectionModal}
                onClose={() => setShowSelectionModal(false)}
                availableExercises={availableExercises}
            />
        </SafeAreaView>
    );
}

function ExerciseSelectionModal({ visible, onClose, availableExercises }: { visible: boolean, onClose: () => void, availableExercises: Exercise[] }) {
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Exercise</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    {selectedExercise ? (
                        <SetEditor exercise={selectedExercise} onBack={() => setSelectedExercise(null)} onDone={onClose} />
                    ) : (
                        <ScrollView style={styles.exerciseList}>
                            {availableExercises.map(ex => (
                                <TouchableOpacity
                                    key={ex.id}
                                    style={styles.exerciseItem}
                                    onPress={() => setSelectedExercise(ex)}
                                >
                                    <View style={styles.exIconContainer}>
                                        <Text style={styles.exEmoji}>{ex.icon}</Text>
                                    </View>
                                    <View style={styles.exInfo}>
                                        <Text style={styles.exName}>{ex.name}</Text>
                                        <Text style={styles.exCategory}>{ex.description || ex.category}</Text>
                                    </View>
                                    <View style={styles.exAddBtn}>
                                        <Ionicons name="add" size={20} color="#1D3E31" />
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>
    );
}

function SetEditor({ exercise, onBack, onDone }: { exercise: Exercise, onBack: () => void, onDone: () => void }) {
    const [sets, setSets] = useState(3);
    const [reps, setReps] = useState(12);
    const [weight, setWeight] = useState(20);

    return (
        <View style={styles.setEditorContainer}>
            <TouchableOpacity onPress={onBack} style={styles.exBadge}>
                <View style={styles.exIconSmall}>
                    <Text style={{ fontSize: 16 }}>{exercise.icon}</Text>
                </View>
                <View>
                    <Text style={styles.exBadgeName}>{exercise.name}</Text>
                    <Text style={styles.exBadgeDesc}>{exercise.description}</Text>
                </View>
                <Ionicons name="chevron-up" size={18} color="#1D3E31" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <View style={styles.controlSection}>
                <View style={styles.controlHeader}>
                    <Text style={styles.controlLabel}>SETS</Text>
                    <Text style={styles.controlValue}>{sets}</Text>
                </View>
                <View style={styles.counterRow}>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => setSets(Math.max(1, sets - 1))}>
                        <Ionicons name="remove" size={24} color="#1D3E31" />
                    </TouchableOpacity>
                    <Text style={styles.counterLargeText}>{sets}</Text>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => setSets(sets + 1)}>
                        <Ionicons name="add" size={24} color="#1D3E31" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.controlSection}>
                <View style={styles.controlHeader}>
                    <Text style={styles.controlLabel}>REPS</Text>
                    <Text style={styles.controlValue}>{reps}</Text>
                </View>
                <View style={styles.counterRow}>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => setReps(Math.max(1, reps - 1))}>
                        <Ionicons name="remove" size={24} color="#1D3E31" />
                    </TouchableOpacity>
                    <Text style={styles.counterLargeText}>{reps}</Text>
                    <TouchableOpacity style={styles.counterBtn} onPress={() => setReps(reps + 1)}>
                        <Ionicons name="add" size={24} color="#1D3E31" />
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.controlSection}>
                <View style={styles.controlHeader}>
                    <Text style={styles.controlLabel}>WEIGHT (kg)</Text>
                    <Text style={styles.controlValue}>{weight}</Text>
                </View>
                <View style={styles.weightOptions}>
                    {[10, 20, 30, 40].map(w => (
                        <TouchableOpacity
                            key={w}
                            style={[styles.weightBtn, weight === w && styles.weightBtnActive]}
                            onPress={() => setWeight(w)}
                        >
                            <Text style={[styles.weightBtnText, weight === w && styles.weightBtnTextActive]}>{w}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
                <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAF9' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    iconBtn: { padding: 8 },
    headerTitle: { fontSize: 20, fontWeight: '700', color: '#1D3E31' },
    scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
    statUnit: { fontSize: 14, color: '#829C92', marginLeft: 4 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    sectionTitle: { fontSize: 13, fontWeight: '700', color: '#1D3E31', letterSpacing: 1 },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
    moodItem: {
        width: '31%',
        aspectRatio: 1.1,
        backgroundColor: '#FFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
    },
    moodItemActive: { borderColor: '#1D3E31', borderWidth: 2 },
    moodLabel: { fontSize: 12, color: '#A0AEC0', marginTop: 8, fontWeight: '600' },
    moodLabelActive: { color: '#1D3E31' },
    addBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1D3E31',
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    addBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700', marginLeft: 4 },
    historyCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#F0F0F0',
    },
    historyTop: { flexDirection: 'row', alignItems: 'center' },
    historyIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyInfo: { flex: 1 },
    historyName: { fontSize: 15, fontWeight: '700', color: '#1D3E31' },
    historyDetail: { fontSize: 13, color: '#A0AEC0', marginTop: 2 },
    historyExpanded: { marginTop: 12 },
    divider: { height: 1.5, backgroundColor: '#F5F5F5', marginBottom: 12 },
    exListText: { fontSize: 14, color: '#1D3E31', marginBottom: 8, marginLeft: 8 },
    emptyText: { fontSize: 13, color: '#A0AEC0', textAlign: 'center', marginVertical: 10 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '85%',
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    modalTitle: { fontSize: 18, fontWeight: '800', color: '#1D3E31' },
    exerciseList: { padding: 16 },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F9FAF9',
        borderRadius: 16,
        marginBottom: 12,
    },
    exIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#E8F2EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    exEmoji: { fontSize: 24 },
    exInfo: { flex: 1 },
    exName: { fontSize: 16, fontWeight: '700', color: '#1D3E31' },
    exCategory: { fontSize: 13, color: '#A0AEC0', marginTop: 2 },
    exAddBtn: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: '#E8F2EE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    setEditorContainer: { padding: 24 },
    exBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAF9',
        padding: 12,
        borderRadius: 16,
        marginBottom: 32,
    },
    exIconSmall: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E8F2EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    exBadgeName: { fontSize: 16, fontWeight: '700', color: '#1D3E31' },
    exBadgeDesc: { fontSize: 12, color: '#A0AEC0' },
    controlSection: { marginBottom: 32 },
    controlHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
    controlLabel: { fontSize: 13, fontWeight: '800', color: '#829C92' },
    controlValue: { fontSize: 18, fontWeight: '800', color: '#1D3E31' },
    counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    counterBtn: {
        width: 60,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterLargeText: { fontSize: 36, fontWeight: '400', color: '#1D3E31' },
    weightOptions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    weightBtn: {
        flex: 1,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    weightBtnActive: { backgroundColor: '#E8F2EE', borderWidth: 1.5, borderColor: '#1D3E31' },
    weightBtnText: { fontSize: 14, fontWeight: '700', color: '#A0AEC0' },
    weightBtnTextActive: { color: '#1D3E31' },
    doneBtn: {
        backgroundColor: '#1D3E31',
        height: 60,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
    },
    doneBtnText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
});
