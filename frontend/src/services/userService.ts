import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../../backend/amplify/data/resource';
import { getOnboardingData, getUserData, OnboardingData, saveOnboardingData, saveUserData } from '../store/userStore';

/** Tính calo mục tiêu từ dữ liệu onboarding (same formula as step9.tsx & home.tsx). */
function computeDailyCalories(data: OnboardingData): number {
    const age = data.age || 25;
    let bmr = (10 * data.currentWeight) + (6.25 * data.height) - (5 * age);
    bmr += data.gender === 'male' ? 5 : -161;
    const activityMap: Record<string, number> = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extreme: 1.9,
    };
    const tdee = bmr * (activityMap[data.activityLevel] || 1.2);
    let target = tdee;
    if (data.goal === 'lose') {
        target = Math.max(1200, tdee - (data.weightChangeSpeed * 1100));
    } else if (data.goal === 'gain') {
        target = tdee + (data.weightChangeSpeed * 1100);
    }
    return Math.round(target);
}

const client = generateClient<Schema>();

// Generate friend code: 8 chars, excludes I/O/0/1 to avoid ambiguity
const FRIEND_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateFriendCode(): string {
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += FRIEND_CODE_CHARS[Math.floor(Math.random() * FRIEND_CODE_CHARS.length)];
    }
    return code;
}

/**
 * Pushes the current local Profile/Onboarding state to the cloud.
 * Run this after any successful local save to ensure sync.
 */
export const pushLocalProfileToCloud = async (userId: string) => {
    try {
        const [localOnboarding, localUserData, localUserCloud] = await Promise.all([
            getOnboardingData(),
            getUserData(),
            client.models.user.get({ user_id: userId }) // Get current cloud state to merge
        ]);

        if (!localOnboarding.completed || !localOnboarding.name) {
            console.log('[USER] Skipping sync: onboarding not complete');
            return;
        }

        const existing = localUserCloud?.data;
        const existingBio = existing?.biometric as any;
        const existingGoal = existing?.goal as any;

        const input: any = {
            user_id: userId,
            display_name: localOnboarding.name,
            onboarding_status: localOnboarding.completed,
            avatar_url: localUserData.avatar_url,
            updated_at: new Date().toISOString(),
            biometric: {
                ...existingBio,
                gender: localOnboarding.gender,
                height_cm: localOnboarding.height,
                weight_kg: localOnboarding.currentWeight,
                active_level: localOnboarding.activityLevel,
            },
            goal: {
                ...existingGoal,
                target_weight_kg: localOnboarding.targetWeight,
                daily_calories: computeDailyCalories(localOnboarding),
            },
            dietary_profile: {
                ...(existing?.dietary_profile as any),
                allergies: localOnboarding.dietaryRestrictions,
            }
        };

        const { errors } = await client.models.user.update(input);
        if (errors) console.error('[USER] Cloud sync failed:', errors);
        else console.log('[USER] Cloud sync successful');

    } catch (error) {
        console.error('[USER] pushLocalProfileToCloud error:', error);
    }
};

export const createUserProfile = async (userId: string, email: string, onboardingData?: OnboardingData) => {
    try {
        const input: any = {
            user_id: userId,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarding_status: onboardingData ? onboardingData.completed : false,
            friend_code: generateFriendCode(),
        };

        if (onboardingData) {
            input.display_name = onboardingData.name;
            input.biometric = {
                gender: onboardingData.gender,
                height_cm: onboardingData.height,
                weight_kg: onboardingData.currentWeight,
                active_level: onboardingData.activityLevel,
            };
            input.goal = {
                target_weight_kg: onboardingData.targetWeight,
                daily_calories: computeDailyCalories(onboardingData),
            };
            input.dietary_profile = {
                allergies: onboardingData.dietaryRestrictions,
                preferences: [],
            };
        }

        const { data: newUser, errors } = await client.models.user.create(input);

        if (errors) {
            // User may already exist (race condition: auth ready after first check).
            // Try to return the existing record instead of failing.
            const existing = await fetchUserProfile(userId);
            if (existing) return existing;
            console.error('Lỗi khi tạo user profile:', errors);
            return null;
        }

        return newUser;
    } catch (error) {
        console.error('Lỗi createUserProfile:', error);
        return null;
    }
};

export const fetchUserProfile = async (userId: string) => {
    try {
        const { data: user, errors } = await client.models.user.get({ user_id: userId });
        if (errors) {
            console.error('Lỗi khi fetch user profile:', errors);
            return null;
        }
        return user;
    } catch (error) {
        console.error('Lỗi fetchUserProfile:', error);
        return null;
    }
};

/**
 * Update weight + dailyCalories in DynamoDB after weekly weight check-in
 */
export const updateWeightInDB = async (userId: string, weight: number, dailyCalories: number) => {
    try {
        const existing = await fetchUserProfile(userId);
        const bio = (existing?.biometric as any) || {};
        const goal = (existing?.goal as any) || {};
        await client.models.user.update({
            user_id: userId,
            biometric: { ...bio, weight_kg: weight },
            goal: { ...goal, daily_calories: dailyCalories },
            updated_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('updateWeightInDB error:', error);
    }
};

/**
 * Update top-level user fields (avatar, display_name) in DynamoDB
 */
export const updateUserProfileInDB = async (userId: string, updates: {
    display_name?: string;
    avatar_url?: string;
}) => {
    try {
        await client.models.user.update({
            user_id: userId,
            ...updates,
            updated_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('updateUserProfileInDB error:', error);
    }
};

export const syncOnboardingWithDB = async (userId: string, email: string) => {
    try {
        const localOnboarding = await getOnboardingData();
        const localUser = await getUserData();
        const existingUser = await fetchUserProfile(userId);

        if (existingUser) {
            // Backfill friend_code if missing
            if (!existingUser.friend_code) {
                client.models.user.update({
                    user_id: userId,
                    friend_code: generateFriendCode(),
                    updated_at: new Date().toISOString(),
                }).catch(() => {});
            }

            const localUpdatedAt = localUser.updated_at || localOnboarding.updated_at || '';
            const cloudUpdatedAt = existingUser.updated_at || '';

            console.log(`[USER] Sync Check - Local: ${localUpdatedAt}, Cloud: ${cloudUpdatedAt}`);

            // CASE 1: Cloud is newer OR Local is empty/stale (New Device / Re-login)
            if (cloudUpdatedAt > localUpdatedAt || (!localOnboarding.completed && existingUser.onboarding_status)) {
                console.log('[USER] Cloud is newer. PULLING from cloud...');
                
                const bio = existingUser.biometric as any;
                const goal = existingUser.goal as any;
                const diet = existingUser.dietary_profile as any;

                // Sync Onboarding Store
                await saveOnboardingData({
                    name: existingUser.display_name || '',
                    gender: bio?.gender || '',
                    height: bio?.height_cm || 170,
                    currentWeight: bio?.weight_kg || 65,
                    activityLevel: bio?.active_level || '',
                    targetWeight: goal?.target_weight_kg || 55,
                    dietaryRestrictions: diet?.allergies || [],
                    completed: existingUser.onboarding_status ?? false,
                    updated_at: cloudUpdatedAt, // Sync the timestamp too
                });

                // Sync User Store
                await saveUserData({
                    name: existingUser.display_name || '',
                    dailyCalories: Number(goal?.daily_calories) || 1800,
                    weight: Number(bio?.weight_kg) || 0,
                    goalWeight: Number(goal?.target_weight_kg) || 0,
                    avatar_url: existingUser.avatar_url || '',
                    updated_at: cloudUpdatedAt, // Sync the timestamp too
                });

                return existingUser;
            } 
            
            // CASE 2: Local is newer (User edited data while offline or on this device recently)
            if (localUpdatedAt > cloudUpdatedAt && localOnboarding.completed) {
                console.log('[USER] Local is newer. PUSHING to cloud...');
                
                const existingBio = existingUser.biometric as any;
                const existingGoal = existingUser.goal as any;
                const existingDiet = existingUser.dietary_profile as any;

                const { data: updatedUser } = await client.models.user.update({
                    user_id: userId,
                    display_name: localOnboarding.name,
                    onboarding_status: localOnboarding.completed,
                    avatar_url: localUser.avatar_url,
                    biometric: {
                        ...existingBio,
                        gender: localOnboarding.gender,
                        height_cm: localOnboarding.height,
                        weight_kg: localOnboarding.currentWeight,
                        active_level: localOnboarding.activityLevel,
                    },
                    goal: {
                        ...existingGoal,
                        target_weight_kg: localOnboarding.targetWeight,
                        daily_calories: computeDailyCalories(localOnboarding),
                    },
                    dietary_profile: {
                        ...existingDiet,
                        allergies: localOnboarding.dietaryRestrictions,
                    },
                    updated_at: localUpdatedAt,
                });
                return updatedUser;
            }

            console.log('[USER] Sync - Already up to date');
            return existingUser;

        } else {
            // User doesn't exist in DB -> Create new
            const localHasData = localOnboarding.completed && localOnboarding.name !== '';
            return await createUserProfile(userId, email, localHasData ? localOnboarding : undefined);
        }
    } catch (error) {
        console.error('Lỗi syncOnboardingWithDB:', error);
        return null;
    }
};
