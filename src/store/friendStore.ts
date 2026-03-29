import { create } from 'zustand';
import * as friendService from '../services/friendService';
import type { FriendshipRecord, PublicStats } from '../services/friendService';

interface LeaderboardEntry {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    current_streak: number;
    pet_score: number;
    pet_level: number;
    total_log_days: number;
    isMe?: boolean;
}

interface FriendState {
    // Data
    friends: FriendshipRecord[];
    pendingRequests: FriendshipRecord[];
    sentRequests: FriendshipRecord[];
    myFriendCode: string | null;
    leaderboard: LeaderboardEntry[];

    // UI state
    sendingRequest: boolean;
    acceptingId: string | null;
    decliningId: string | null;
    removingId: string | null;
    error: string | null;

    // Actions
    loadFriends: () => Promise<void>;
    loadPendingRequests: () => Promise<void>;
    loadMyFriendCode: (userId: string) => Promise<void>;
    loadLeaderboard: (myUserId: string, myDisplayName: string, myMeals: any[]) => Promise<void>;
    sendRequest: (friendCode: string) => Promise<{ success: boolean; friend_name?: string; error?: string }>;
    acceptRequest: (friendshipId: string) => Promise<void>;
    declineRequest: (friendshipId: string) => Promise<void>;
    removeFriend: (friendshipId: string) => Promise<void>;
    clearError: () => void;
}

export const useFriendStore = create<FriendState>((set, get) => ({
    friends: [],
    pendingRequests: [],
    sentRequests: [],
    myFriendCode: null,
    leaderboard: [],
    sendingRequest: false,
    acceptingId: null,
    decliningId: null,
    removingId: null,
    error: null,

    loadFriends: async () => {
        try {
            const friends = await friendService.getMyFriends();
            set({ friends });
        } catch (error: any) {
            console.error('[FRIEND_STORE] loadFriends error:', error);
        }
    },

    loadPendingRequests: async () => {
        try {
            const [pending, sent] = await Promise.all([
                friendService.getPendingRequests(),
                friendService.getSentRequests(),
            ]);
            set({ pendingRequests: pending, sentRequests: sent });
        } catch (error: any) {
            console.error('[FRIEND_STORE] loadPendingRequests error:', error);
        }
    },

    loadMyFriendCode: async (userId: string) => {
        try {
            const code = await friendService.getMyFriendCode(userId);
            set({ myFriendCode: code });
        } catch (error: any) {
            console.error('[FRIEND_STORE] loadMyFriendCode error:', error);
        }
    },

    loadLeaderboard: async (myUserId: string, myDisplayName: string, myMeals: any[]) => {
        try {
            const friends = get().friends;
            if (friends.length === 0) {
                // Only show "me" with no friends
                const myDays = new Set(myMeals.map((m: any) => m.date)).size;
                set({
                    leaderboard: [{
                        user_id: myUserId,
                        display_name: myDisplayName,
                        avatar_url: null,
                        current_streak: myDays,
                        pet_score: myDays * 20,
                        pet_level: myDays <= 0 ? 1 : Math.min(5, Math.floor((myDays - 1) / 36) + 1),
                        total_log_days: myDays,
                        isMe: true,
                    }],
                });
                return;
            }

            // Fetch all friends' public stats
            const friendIds = friends.map(f => f.friend_id);
            const stats = await friendService.getFriendsPublicStats(friendIds);

            // Build leaderboard entries from stats
            const entries: LeaderboardEntry[] = stats.map(s => ({
                user_id: s.user_id,
                display_name: s.display_name || 'User',
                avatar_url: s.avatar_url,
                current_streak: s.current_streak || 0,
                pet_score: s.pet_score || 0,
                pet_level: s.pet_level || 1,
                total_log_days: s.total_log_days || 0,
                isMe: false,
            }));

            // Add "me"
            const myDays = new Set(myMeals.map((m: any) => m.date)).size;
            entries.push({
                user_id: myUserId,
                display_name: myDisplayName,
                avatar_url: null,
                current_streak: myDays,
                pet_score: myDays * 20,
                pet_level: myDays <= 0 ? 1 : Math.min(5, Math.floor((myDays - 1) / 36) + 1),
                total_log_days: myDays,
                isMe: true,
            });

            set({ leaderboard: entries });
        } catch (error: any) {
            console.error('[FRIEND_STORE] loadLeaderboard error:', error);
        }
    },

    sendRequest: async (friendCode: string) => {
        try {
            set({ sendingRequest: true, error: null });
            const result = await friendService.sendFriendRequest(friendCode);
            set({ sendingRequest: false });
            // Refresh sent requests (non-critical — don't fail the whole action)
            friendService.getSentRequests().then(sent => set({ sentRequests: sent })).catch(() => {});
            return { success: true, friend_name: result.friend_name };
        } catch (error: any) {
            const msg = error.message || 'Lỗi gửi lời mời';
            set({ error: msg, sendingRequest: false });
            return { success: false, error: msg };
        }
    },

    acceptRequest: async (friendshipId: string) => {
        try {
            set({ acceptingId: friendshipId, error: null });
            await friendService.acceptFriendRequest(friendshipId);
            const [friends, pending] = await Promise.all([
                friendService.getMyFriends(),
                friendService.getPendingRequests(),
            ]);
            set({ friends, pendingRequests: pending, acceptingId: null });
        } catch (error: any) {
            set({ error: error.message || 'Lỗi chấp nhận lời mời', acceptingId: null });
        }
    },

    declineRequest: async (friendshipId: string) => {
        try {
            set({ decliningId: friendshipId, error: null });
            await friendService.declineFriendRequest(friendshipId);
            const pending = await friendService.getPendingRequests();
            set({ pendingRequests: pending, decliningId: null });
        } catch (error: any) {
            set({ error: error.message || 'Lỗi từ chối lời mời', decliningId: null });
        }
    },

    removeFriend: async (friendshipId: string) => {
        try {
            set({ removingId: friendshipId, error: null });
            await friendService.removeFriend(friendshipId);
            const friends = await friendService.getMyFriends();
            set({ friends, removingId: null });
        } catch (error: any) {
            set({ error: error.message || 'Lỗi xóa bạn bè', removingId: null });
        }
    },

    clearError: () => set({ error: null }),
}));
