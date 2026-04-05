import { create } from 'zustand';

export interface ChatMessage {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    time: string;
    foodCards?: {
        name: string;
        description: string;
        calories: number;
        protein_g?: number;
        carbs_g?: number;
        fat_g?: number;
        time?: string;
        ingredients?: { name: string; amount: string }[];
        steps?: { title: string; instruction: string }[];
        emoji: string;
    }[];
}

interface ChatState {
    messages: ChatMessage[];
    isLoading: boolean;
    setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
    addMessage: (message: ChatMessage) => void;
    setIsLoading: (isLoading: boolean) => void;
    clearChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isLoading: false,
    setMessages: (msgs) => set((state) => ({ 
        messages: typeof msgs === 'function' ? msgs(state.messages) : msgs 
    })),
    addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
    setIsLoading: (isLoading) => set({ isLoading }),
    clearChat: () => set({ messages: [] }),
}));
