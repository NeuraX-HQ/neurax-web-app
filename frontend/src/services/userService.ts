import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../../backend/amplify/data/resource';
import { getOnboardingData, OnboardingData, saveOnboardingData, saveUserData } from '../store/userStore';

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
        await client.models.user.update({
            user_id: userId,
            biometric: { weight_kg: weight },
            goal: { daily_calories: dailyCalories },
            updated_at: new Date().toISOString(),
        });
    } catch (error) {
        console.error('updateWeightInDB error:', error);
    }
};

export const syncOnboardingWithDB = async (userId: string, email: string) => {
    try {
        const localData = await getOnboardingData();
        const localHasData = localData.completed && localData.name !== '';

        // Kiểm tra xem user đã tồn tại trong DB chưa
        const existingUser = await fetchUserProfile(userId);

        if (existingUser) {
            // Backfill friend_code for existing users who don't have one
            if (!existingUser.friend_code) {
                try {
                    await client.models.user.update({
                        user_id: userId,
                        friend_code: generateFriendCode(),
                        updated_at: new Date().toISOString(),
                    });
                } catch (e) {
                    console.warn('[USER] Failed to backfill friend_code:', e);
                }
            }

            if (localHasData) {
                // Local có data thật → push lên cloud
                const { data: updatedUser } = await client.models.user.update({
                    user_id: userId,
                    display_name: localData.name,
                    onboarding_status: localData.completed,
                    biometric: {
                        gender: localData.gender,
                        height_cm: localData.height,
                        weight_kg: localData.currentWeight,
                        active_level: localData.activityLevel,
                    },
                    goal: {
                        target_weight_kg: localData.targetWeight,
                        daily_calories: computeDailyCalories(localData),
                    },
                    dietary_profile: {
                        allergies: localData.dietaryRestrictions,
                    },
                    updated_at: new Date().toISOString(),
                });
                return updatedUser;
            } else {
                // Local trống (mới login / đổi device) → restore từ cloud
                const bio = existingUser.biometric as any;
                const goal = existingUser.goal as any;
                const diet = existingUser.dietary_profile as any;
                await saveOnboardingData({
                    name: existingUser.display_name || '',
                    gender: bio?.gender || '',
                    height: bio?.height_cm || 170,
                    currentWeight: bio?.weight_kg || 65,
                    activityLevel: bio?.active_level || '',
                    targetWeight: goal?.target_weight_kg || 55,
                    dietaryRestrictions: diet?.allergies || [],
                    completed: existingUser.onboarding_status ?? false,
                });
                // Restore dailyCalories to USER_KEY so home.tsx reads the right value
                const restoredCalories = Number(goal?.daily_calories) || 0;
                if (restoredCalories > 0) {
                    await saveUserData({ dailyCalories: restoredCalories });
                }
                return existingUser;
            }
        } else {
            // User chưa tồn tại trong DB → tạo mới
            return await createUserProfile(userId, email, localHasData ? localData : undefined);
        }
    } catch (error) {
        console.error('Lỗi syncOnboardingWithDB:', error);
        return null;
    }
};
