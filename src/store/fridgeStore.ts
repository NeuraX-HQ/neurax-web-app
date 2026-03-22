import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FridgeItem {
    id: string;
    name: string;
    amount: string;
    location: string;
    daysLeft: number;
    expiryDate: string; // ISO string
    emoji: string;
    addedDate: string; // ISO string
}

interface FridgeState {
    items: FridgeItem[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addItem: (item: Omit<FridgeItem, 'id' | 'addedDate'>) => Promise<void>;
    updateItem: (id: string, updatedData: Partial<FridgeItem>) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    loadItems: () => Promise<void>;
}

const STORAGE_KEY = '@nutritrack_fridge';

export const useFridgeStore = create<FridgeState>((set, get) => ({
    items: [],
    isLoading: false,
    error: null,

    addItem: async (itemData) => {
        try {
            set({ isLoading: true, error: null });
            const newItem: FridgeItem = {
                ...itemData,
                id: `fridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                addedDate: new Date().toISOString(),
            };

            const updatedItems = [...get().items, newItem];
            set({ items: updatedItems });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
            set({ isLoading: false });
        } catch (error) {
            console.error('Error adding to fridge:', error);
            set({ error: 'Failed to add item', isLoading: false });
        }
    },

    updateItem: async (id, updatedData) => {
        try {
            set({ isLoading: true, error: null });
            const updatedItems = get().items.map(i => i.id === id ? { ...i, ...updatedData } : i);
            set({ items: updatedItems });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
            set({ isLoading: false });
        } catch (error) {
            console.error('Error updating fridge item:', error);
            set({ error: 'Failed to update item', isLoading: false });
        }
    },

    removeItem: async (id) => {
        try {
            set({ isLoading: true, error: null });
            const updatedItems = get().items.filter(i => i.id !== id);
            set({ items: updatedItems });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
            set({ isLoading: false });
        } catch (error) {
            console.error('Error removing from fridge:', error);
            set({ error: 'Failed to remove item', isLoading: false });
        }
    },

    loadItems: async () => {
        try {
            set({ isLoading: true, error: null });
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                set({ items: JSON.parse(stored) });
            }
            set({ isLoading: false });
        } catch (error) {
            console.error('Error loading fridge:', error);
            set({ error: 'Failed to load fridge items', isLoading: false });
        }
    },
}));
