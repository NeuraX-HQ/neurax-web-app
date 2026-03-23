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
        const onboardingData = await getOnboardingData();
        
        // Kiểm tra xem user đã tồn tại trong DB chưa
        const existingUser = await fetchUserProfile(userId);

        if (existingUser) {
            // Cập nhật nếu cần
            const { data: updatedUser, errors } = await client.models.user.update({
                user_id: userId,
                display_name: onboardingData.name,
                onboarding_status: onboardingData.completed,
                biometric: {
                    gender: onboardingData.gender,
                    height_cm: onboardingData.height,
                    weight_kg: onboardingData.currentWeight,
                    active_level: onboardingData.activityLevel,
                },
                goal: {
                    target_weight_kg: onboardingData.targetWeight,
                    daily_calories: 2000,
                },
                dietary_profile: {
                    allergies: onboardingData.dietaryRestrictions,
                },
                updated_at: new Date().toISOString(),
            });
            return updatedUser;
        } else {
            // Tạo mới
            return await createUserProfile(userId, email, onboardingData);
        }
    } catch (error) {
        console.error('Lỗi syncOnboardingWithDB:', error);
        return null;
    }
};
