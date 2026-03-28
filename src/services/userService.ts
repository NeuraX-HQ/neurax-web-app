import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import { getOnboardingData, OnboardingData, saveOnboardingData } from '../store/userStore';

const client = generateClient<Schema>();

export const createUserProfile = async (userId: string, email: string, onboardingData?: OnboardingData) => {
    try {
        const input: any = {
            user_id: userId,
            email: email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            onboarding_status: onboardingData ? onboardingData.completed : false,
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
                // Placeholder cho calo, có thể tính toán chính xác hơn sau
                daily_calories: 2000, 
            };
            input.dietary_profile = {
                allergies: onboardingData.dietaryRestrictions,
                preferences: [],
            };
        }

        const { data: newUser, errors } = await client.models.user.create(input);

        if (errors) {
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

export const syncOnboardingWithDB = async (userId: string, email: string) => {
    try {
        const localData = await getOnboardingData();
        const localHasData = localData.completed && localData.name !== '';

        // Kiểm tra xem user đã tồn tại trong DB chưa
        const existingUser = await fetchUserProfile(userId);

        if (existingUser) {
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
                        daily_calories: 2000,
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
