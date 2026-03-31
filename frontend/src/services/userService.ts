import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import { getOnboardingData, OnboardingData, saveOnboardingData } from '../store/userStore';

const client = generateClient<Schema>();

const calculateTargetCalories = (data: OnboardingData): number => {
    const activityMultipliers: Record<string, number> = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extreme: 1.9 };
    let bmr = (10 * data.currentWeight) + (6.25 * data.height) - (5 * (data.age || 25));
    bmr += data.gender === 'male' ? 5 : -161;
    const tdee = bmr * (activityMultipliers[data.activityLevel] || 1.2);
    
    let targetCals = tdee;
    if (data.goal === 'lose') {
        targetCals = Math.max(1200, tdee - (data.weightChangeSpeed * 1100));
    } else if (data.goal === 'gain') {
        targetCals = tdee + (data.weightChangeSpeed * 1100);
    }
    return Math.round(targetCals);
};

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
                age: onboardingData.age || 25,
                gender: onboardingData.gender,
                height_cm: onboardingData.height,
                weight_kg: onboardingData.currentWeight,
                active_level: onboardingData.activityLevel,
            };
            input.goal = {
                target_weight_kg: onboardingData.targetWeight,
                daily_calories: calculateTargetCalories(onboardingData),
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
        
        const existingUser = await fetchUserProfile(userId);

        if (existingUser) {
            // Chỉ cập nhật nếu user vừa hoàn thành onboarding ở máy này
            if (onboardingData && onboardingData.completed) {
                const { data: updatedUser, errors } = await client.models.user.update({
                    user_id: userId,
                    display_name: onboardingData.name,
                    onboarding_status: true,
                    biometric: {
                        age: onboardingData.age || 25,
                        gender: onboardingData.gender,
                        height_cm: onboardingData.height,
                        weight_kg: onboardingData.currentWeight,
                        active_level: onboardingData.activityLevel,
                    },
                    goal: {
                        target_weight_kg: onboardingData.targetWeight,
                        daily_calories: calculateTargetCalories(onboardingData),
                    },
                    dietary_profile: {
                        allergies: onboardingData.dietaryRestrictions,
                    },
                    updated_at: new Date().toISOString(),
                });
                
                // Sau khi map xong có thể xoá onboarding data local để login lần tới không bị ghi đè
                // Xoá tạm bỏ qua, đợi test kĩ hơn
                
                return updatedUser;
            } else {
                return existingUser;
            }
        } else {
            // Tạo mới
            return await createUserProfile(userId, email, onboardingData);
        }
    } catch (error) {
        console.error('Lỗi syncOnboardingWithDB:', error);
        return null;
    }
};
