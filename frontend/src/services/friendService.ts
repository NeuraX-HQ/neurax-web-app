import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';

const client = generateClient<Schema>();

export interface FriendshipRecord {
    id: string;
    friend_id: string;
    friend_code: string | null;
    friend_name: string | null;
    friend_avatar: string | null;
    status: 'pending' | 'accepted' | 'blocked';
    direction: 'sent' | 'received';
    linked_id: string | null;
    createdAt: string | null;
}

export interface PublicStats {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
    current_streak: number | null;
    longest_streak: number | null;
    pet_score: number | null;
    pet_level: number | null;
    total_log_days: number | null;
    last_log_date: string | null;
}

// ─── Friend Request Actions (via Lambda) ───

async function callFriendLambda(action: string, payload: Record<string, any>) {
    // Check if mutation exists (requires backend deployment with friendRequest Lambda)
    if (!(client.mutations as any).friendRequest) {
        throw new Error('Friend system chưa sẵn sàng — cần deploy backend trước');
    }
    const { data, errors } = await (client.mutations as any).friendRequest({
        action,
        payload: JSON.stringify(payload),
    });
    if (errors?.length) {
        throw new Error(errors[0].message);
    }
    const result = JSON.parse(data as string);
    if (!result.success) {
        throw new Error(result.error || 'Unknown error');
    }
    return result;
}

export async function sendFriendRequest(friendCode: string) {
    return callFriendLambda('sendRequest', { friend_code: friendCode.toUpperCase().trim() });
}

export async function acceptFriendRequest(friendshipId: string) {
    return callFriendLambda('acceptRequest', { friendship_id: friendshipId });
}

export async function declineFriendRequest(friendshipId: string) {
    return callFriendLambda('declineRequest', { friendship_id: friendshipId });
}

export async function removeFriend(friendshipId: string) {
    return callFriendLambda('removeFriend', { friendship_id: friendshipId });
}

export async function blockFriend(friendshipId: string) {
    return callFriendLambda('blockFriend', { friendship_id: friendshipId });
}

// ─── Read Operations (via Amplify client) ───

export async function getMyFriends(): Promise<FriendshipRecord[]> {
    try {
        if (!client.models.Friendship) return [];
        const { data, errors } = await client.models.Friendship.list({
            filter: { status: { eq: 'accepted' } },
        });
        if (errors?.length) {
            console.error('[FRIEND] getMyFriends errors:', errors);
            return [];
        }
        return (data || []) as unknown as FriendshipRecord[];
    } catch (error) {
        console.error('[FRIEND] getMyFriends error:', error);
        return [];
    }
}

export async function getPendingRequests(): Promise<FriendshipRecord[]> {
    try {
        if (!client.models.Friendship) return [];
        const { data, errors } = await client.models.Friendship.list({
            filter: {
                status: { eq: 'pending' },
                direction: { eq: 'received' },
            },
        });
        if (errors?.length) {
            console.error('[FRIEND] getPendingRequests errors:', errors);
            return [];
        }
        return (data || []) as unknown as FriendshipRecord[];
    } catch (error) {
        console.error('[FRIEND] getPendingRequests error:', error);
        return [];
    }
}

export async function getSentRequests(): Promise<FriendshipRecord[]> {
    try {
        if (!client.models.Friendship) return [];
        const { data, errors } = await client.models.Friendship.list({
            filter: {
                status: { eq: 'pending' },
                direction: { eq: 'sent' },
            },
        });
        if (errors?.length) return [];
        return (data || []) as unknown as FriendshipRecord[];
    } catch (error) {
        console.error('[FRIEND] getSentRequests error:', error);
        return [];
    }
}

// ─── Friend Code ───

export async function getMyFriendCode(userId: string): Promise<string | null> {
    try {
        const { data } = await client.models.user.get({ user_id: userId });
        return data?.friend_code || null;
    } catch {
        return null;
    }
}

// ─── Public Stats ───

export async function getPublicStats(userId: string): Promise<PublicStats | null> {
    try {
        const { data } = await client.models.UserPublicStats.get({ user_id: userId });
        return data as unknown as PublicStats | null;
    } catch {
        return null;
    }
}

export async function updateMyPublicStats(stats: Partial<PublicStats> & { user_id: string }) {
    try {
        if (!client.models.UserPublicStats) return null;
        // Try update first, create if doesn't exist
        const { data: existing } = await client.models.UserPublicStats.get({ user_id: stats.user_id });
        if (existing) {
            const { data } = await client.models.UserPublicStats.update(stats);
            return data;
        } else {
            const { data } = await client.models.UserPublicStats.create(stats);
            return data;
        }
    } catch (error) {
        console.error('[FRIEND] updateMyPublicStats error:', error);
        return null;
    }
}

export async function getFriendsPublicStats(friendIds: string[]): Promise<PublicStats[]> {
    try {
        const results: PublicStats[] = [];
        // Batch fetch — Amplify doesn't support batch get, so parallel individual gets
        const promises = friendIds.map(id => getPublicStats(id));
        const stats = await Promise.all(promises);
        for (const s of stats) {
            if (s) results.push(s);
        }
        return results;
    } catch (error) {
        console.error('[FRIEND] getFriendsPublicStats error:', error);
        return [];
    }
}
