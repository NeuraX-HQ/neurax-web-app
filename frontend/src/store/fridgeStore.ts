import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as fridgeService from '../services/fridgeService';

export interface FridgeItem {
    id: string;
    name: string;
    amount: string;
    location: string;
    daysLeft: number;
    expiryDate: string; // ISO string
    emoji: string;
    addedDate: string; // ISO string
    syncStatus?: 'synced' | 'pending' | 'error';
    remoteId?: string; // DynamoDB record id
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
}

interface FridgeState {
    items: FridgeItem[];
    isLoading: boolean;
    error: string | null;

    // Actions
    addItem: (item: Omit<FridgeItem, 'id' | 'addedDate'>) => Promise<void>;
    removeItem: (id: string) => Promise<void>;
    loadItems: () => Promise<void>;
    syncWithCloud: () => Promise<void>;
    syncPendingItems: () => Promise<void>;
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
                syncStatus: 'pending',
            };

            // Optimistic update
            const updatedItems = [...get().items, newItem];
            set({ items: updatedItems });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
            set({ isLoading: false });

            // Background sync to DynamoDB
            fridgeService.createFridgeItem({
                name: newItem.name,
                quantity: parseFloat(newItem.amount) || 1,
                unit: newItem.location,
                expiry_date: newItem.expiryDate?.split('T')[0],
                emoji: newItem.emoji,
                calories: newItem.calories,
                protein_g: newItem.protein,
                carbs_g: newItem.carbs,
                fat_g: newItem.fat,
            }).then((remote) => {
                const items = get().items.map(i =>
                    i.id === newItem.id
                        ? { ...i, syncStatus: (remote ? 'synced' : 'error') as 'synced' | 'error', remoteId: remote?.id }
                        : i
                );
                set({ items });
                AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            });
        } catch (error) {
            console.error('Error adding to fridge:', error);
            set({ error: 'Failed to add item', isLoading: false });
        }
    },

    removeItem: async (id) => {
        try {
            set({ isLoading: true, error: null });
            const item = get().items.find(i => i.id === id);
            const updatedItems = get().items.filter(i => i.id !== id);
            set({ items: updatedItems });
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedItems));
            set({ isLoading: false });

            // Background: delete from DynamoDB if synced
            if (item?.remoteId) {
                fridgeService.deleteFridgeItem(item.remoteId);
            }
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
                const items: FridgeItem[] = JSON.parse(stored);
                // Recalculate daysLeft based on current date
                const now = Date.now();
                for (const item of items) {
                    if (item.expiryDate) {
                        item.daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
                    }
                }
                set({ items });
            }
            set({ isLoading: false });
        } catch (error) {
            console.error('Error loading fridge:', error);
            set({ error: 'Failed to load fridge items', isLoading: false });
        }
    },

    syncWithCloud: async () => {
        try {
            const remoteItems = await fridgeService.fetchFridgeItems();
            if (remoteItems.length === 0) return;

            const existingIds = new Set(get().items.map(i => i.remoteId).filter(Boolean));
            const newItems: FridgeItem[] = remoteItems
                .filter(item => !existingIds.has(item.id))
                .map(item => {
                    const expiryDate = item.expiry_date || '';
                    const daysLeft = expiryDate
                        ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                        : 0;
                    return {
                        id: `fridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        remoteId: item.id,
                        name: item.name,
                        amount: String(item.quantity ?? 1),
                        location: item.unit || '',
                        daysLeft,
                        expiryDate: expiryDate,
                        emoji: item.emoji || '',
                        addedDate: item.added_date || new Date().toISOString(),
                        syncStatus: 'synced' as const,
                        calories: item.calories ?? 0,
                        protein: item.protein_g ?? 0,
                        carbs: item.carbs_g ?? 0,
                        fat: item.fat_g ?? 0,
                    };
                });

            if (newItems.length > 0) {
                const merged = [...get().items, ...newItems];
                set({ items: merged });
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            }
        } catch (error) {
            console.error('Error syncing fridge with cloud:', error);
        }
    },

    syncPendingItems: async () => {
        const pending = get().items.filter(i => i.syncStatus === 'pending' || i.syncStatus === 'error');
        for (const item of pending) {
            const remote = await fridgeService.createFridgeItem({
                name: item.name,
                quantity: parseFloat(item.amount) || 1,
                unit: item.location,
                expiry_date: item.expiryDate?.split('T')[0],
                emoji: item.emoji,
                calories: item.calories,
                protein_g: item.protein,
                carbs_g: item.carbs,
                fat_g: item.fat,
            });
            if (remote) {
                const items = get().items.map(i =>
                    i.id === item.id ? { ...i, syncStatus: 'synced' as const, remoteId: remote.id } : i
                );
                set({ items });
            }
        }
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(get().items));
    },
}));
