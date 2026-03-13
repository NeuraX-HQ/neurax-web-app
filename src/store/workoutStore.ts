import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExerciseType = 'STRENGTH' | 'CARDIO' | 'YOGA' | 'CORE';

export interface Exercise {
    id: string;
    name: string;
    category: ExerciseType;
    icon: string;
    description?: string;
}

export interface WorkoutSet {
    id: string;
    reps: number;
    weight?: number;
    completed: boolean;
}

export interface WorkoutExercise extends Exercise {
    sets: WorkoutSet[];
}

export interface WorkoutSession {
    id: string;
    date: string;
    duration: string;
    caloriesBurned: number;
    mood: 'sleepy' | 'strong' | 'fire';
    exercises: WorkoutExercise[];
}

interface WorkoutState {
    availableExercises: Exercise[];
    history: WorkoutSession[];
    addWorkoutToHistory: (session: WorkoutSession) => void;
}

export const useWorkoutStore = create<WorkoutState>()(
    persist(
        (set) => ({
            availableExercises: [
                { id: '1', name: 'Goblet Squats', category: 'STRENGTH', icon: '🏋️', description: 'Lower body strength' },
                { id: '2', name: 'Push-ups', category: 'STRENGTH', icon: '💪', description: 'Upper body strength' },
                { id: '3', name: 'Pull-ups', category: 'STRENGTH', icon: '🧗', description: 'Upper body strength' },
                { id: '4', name: 'Mountain Climbers', category: 'CARDIO', icon: '🏃', description: 'High intensity cardio' },
                { id: '5', name: 'Plank', category: 'CORE', icon: '🧘', description: 'Core stability' },
                { id: '6', name: 'Jump Rope', category: 'CARDIO', icon: '🪢', description: 'Cardio endurance' },
                { id: '7', name: 'Deadlift', category: 'STRENGTH', icon: '🏗️', description: 'Full body power' },
            ],
            history: [
                {
                    id: 'hist1',
                    date: 'Yesterday',
                    duration: '52 min',
                    caloriesBurned: 520,
                    mood: 'strong',
                    exercises: []
                },
                {
                    id: 'hist2',
                    date: 'Oct 24',
                    duration: '30 min',
                    caloriesBurned: 180,
                    mood: 'fire',
                    exercises: []
                }
            ],
            addWorkoutToHistory: (session) => set((state) => ({
                history: [session, ...state.history]
            })),
        }),
        {
            name: 'workout-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
