import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WORKOUT_STORAGE_KEY = '@nutritrack_workout_routines';

export interface Exercise {
    id: string;
    name: string;
    nameVi: string;
    icon: string;
    category: string;
    description: string;
    instructions: string;
    type: 'reps' | 'duration';
    metValue: number;
    sets?: number;
    reps?: number;
    durationMinutes?: number;
    videoUrl?: string;
}

export interface Routine {
    id: string;
    name: string;
    exercises: Exercise[];
    createdAt: string;
}

interface WorkoutState {
    routines: Routine[];
    isHydrated: boolean;
    loadRoutines: () => Promise<void>;
    addRoutine: (name: string, exercises: Exercise[]) => Promise<void>;
    deleteRoutine: (id: string) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
    routines: [],
    isHydrated: false,

    loadRoutines: async () => {
        try {
            const stored = await AsyncStorage.getItem(WORKOUT_STORAGE_KEY);
            if (stored) {
                set({ routines: JSON.parse(stored), isHydrated: true });
            } else {
                set({ isHydrated: true });
            }
        } catch (error) {
            console.warn('Failed to load workout routines:', error);
            set({ isHydrated: true });
        }
    },

    addRoutine: async (name, exercises) => {
        const newRoutine: Routine = {
            id: Date.now().toString(),
            name,
            exercises,
            createdAt: new Date().toISOString(),
        };
        const updatedRoutines = [newRoutine, ...get().routines];
        set({ routines: updatedRoutines });
        await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(updatedRoutines));
    },

    deleteRoutine: async (id) => {
        const updatedRoutines = get().routines.filter((r) => r.id !== id);
        set({ routines: updatedRoutines });
        await AsyncStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(updatedRoutines));
    },
}));
