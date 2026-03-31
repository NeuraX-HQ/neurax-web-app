import { create } from 'zustand';

export interface Notification {
    id: string;
    title: string;
    body: string;
    time: string;
    icon: string;
    color: string;
    section: 'TODAY' | 'EARLIER';
    read: boolean;
}

interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    loadNotifications: () => void;
}

const initialMockNotifications: Notification[] = [
    {
        id: '1',
        title: "AI Bảo: Don't forget your water goal! 💧",
        body: 'Keep hydrated to maintain energy.',
        time: '2m ago',
        icon: '💧',
        color: '#4A90D9',
        section: 'TODAY',
        read: false,
    },
    {
        id: '2',
        title: 'Streak kept! 🔥',
        body: "You've logged meals for 14 days straight.",
        time: '2h ago',
        icon: '🔥',
        color: '#E74C3C',
        section: 'TODAY',
        read: false,
    },
    {
        id: '3',
        title: 'Lunch time 🥗',
        body: 'Time to log your lunch. Keep it balanced!',
        time: '4h ago',
        icon: '🍴',
        color: '#F39C12',
        section: 'TODAY',
        read: false,
    },
    {
        id: '4',
        title: 'Leaderboard Update 👑',
        body: 'You reached the top 5% in your community!',
        time: '1d ago',
        icon: '🏆',
        color: '#7F8C9B',
        section: 'EARLIER',
        read: true,
    },
    {
        id: '5',
        title: 'Daily Goal Met ✅',
        body: 'Great job hitting your protein target yesterday.',
        time: '1d ago',
        icon: '✅',
        color: '#2ECC71',
        section: 'EARLIER',
        read: true,
    },
];

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: initialMockNotifications,
    unreadCount: initialMockNotifications.filter(n => !n.read).length,

    markAsRead: (id) => {
        set((state) => {
            const updated = state.notifications.map(n =>
                n.id === id ? { ...n, read: true } : n
            );
            return {
                notifications: updated,
                unreadCount: updated.filter(n => !n.read).length,
            };
        });
    },

    markAllAsRead: () => {
        set((state) => {
            const updated = state.notifications.map(n => ({ ...n, read: true }));
            return {
                notifications: updated,
                unreadCount: 0,
            };
        });
    },

    loadNotifications: () => {
        // In a real app, fetch from backend here
    },
}));
