import React, { useState } from "react";
import {
    View,
    Text,
    Pressable,
    StyleSheet,
    TextInput,
    ScrollView,
    Switch,
    ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/AuthContext";
import { Colors, Shadows } from "../../constants/Theme";

const STEPS = [
    { id: 1, title: "Goals & Privacy" },
    { id: 2, title: "Basic Measurements" },
    { id: 3, title: "Dietary Preferences" },
    { id: 4, title: "Notifications" },
];

const GOALS = [
    { id: "lose_weight", label: "Giảm cân", icon: "🎯" },
    { id: "muscle_gain", label: "Tăng cơ", icon: "💪" },
    { id: "eat_healthy", label: "Ăn uống healthy", icon: "🥗" },
    { id: "track_macros", label: "Track macros", icon: "📊" },
    { id: "save_money", label: "Tiết kiệm chi tiêu", icon: "💰" },
];

const ACTIVITY_LEVELS = [
    { id: "sedentary", label: "Ít vận động (văn phòng)" },
    { id: "moderate", label: "Vận động vừa (gym 3x/week)" },
    { id: "active", label: "Vận động nhiều (athlete)" },
];

const DIETARY_RESTRICTIONS = [
    { id: "vegetarian", label: "Ăn chay (vegetarian)" },
    { id: "vegan", label: "Ăn thuần chay (vegan)" },
    { id: "gluten_free", label: "Không gluten" },
    { id: "lactose_free", label: "Không lactose" },
    { id: "halal", label: "Halal" },
];

export default function OnboardingScreen() {
    const { completeOnboarding, updateOnboardingStep, isLoading } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);

    // Form state
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [weight, setWeight] = useState("60");
    const [height, setHeight] = useState("165");
    const [age, setAge] = useState("25");
    const [gender, setGender] = useState<"male" | "female" | "other">("female");
    const [targetWeight, setTargetWeight] = useState("");
    const [activityLevel, setActivityLevel] = useState<"sedentary" | "moderate" | "active">("moderate");
    const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
    const [allergies, setAllergies] = useState("");
    const [notifications, setNotifications] = useState({
        mealReminders: true,
        streakAlerts: true,
        challengeUpdates: true,
        dailyTips: false,
    });

    const toggleGoal = (id: string) => {
        setSelectedGoals((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    };

    const toggleRestriction = (id: string) => {
        setDietaryRestrictions((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const handleNext = () => {
        if (currentStep < 4) {
            setCurrentStep((prev) => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleComplete = async () => {
        try {
            await completeOnboarding({
                goals: selectedGoals,
                weight: parseFloat(weight),
                height: parseFloat(height),
                age: parseInt(age),
                gender,
                activityLevel,
                targetWeight: targetWeight ? parseFloat(targetWeight) : undefined,
                dietaryRestrictions,
                allergies: allergies.split(",").map((a) => a.trim()).filter(Boolean),
                notificationPreferences: notifications,
                reminderTimes: {
                    morning: "08:00",
                    lunch: "12:00",
                    dinner: "18:00",
                },
            });
        } catch (error) {
            console.error("Onboarding failed:", error);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>🎯 Mục tiêu của bạn là gì?</Text>
                        <Text style={styles.stepHint}>(Có thể chọn nhiều)</Text>

                        <View style={styles.optionsGrid}>
                            {GOALS.map((goal) => (
                                <Pressable
                                    key={goal.id}
                                    style={[
                                        styles.optionCard,
                                        selectedGoals.includes(goal.id) && styles.optionCardSelected,
                                    ]}
                                    onPress={() => toggleGoal(goal.id)}
                                >
                                    <Text style={styles.optionIcon}>{goal.icon}</Text>
                                    <Text
                                        style={[
                                            styles.optionLabel,
                                            selectedGoals.includes(goal.id) && styles.optionLabelSelected,
                                        ]}
                                    >
                                        {goal.label}
                                    </Text>
                                    {selectedGoals.includes(goal.id) && (
                                        <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                                    )}
                                </Pressable>
                            ))}
                        </View>

                        {/* Privacy section */}
                        <View style={styles.privacySection}>
                            <Text style={styles.privacyTitle}>🔒 Cam kết của chúng tôi:</Text>
                            <View style={styles.privacyItem}>
                                <Ionicons name="checkmark" size={16} color={Colors.success} />
                                <Text style={styles.privacyText}>Dữ liệu được mã hóa</Text>
                            </View>
                            <View style={styles.privacyItem}>
                                <Ionicons name="checkmark" size={16} color={Colors.success} />
                                <Text style={styles.privacyText}>Không bán thông tin cá nhân</Text>
                            </View>
                            <View style={styles.privacyItem}>
                                <Ionicons name="checkmark" size={16} color={Colors.success} />
                                <Text style={styles.privacyText}>AI chỉ chạy trên cloud AWS</Text>
                            </View>
                            <View style={styles.privacyItem}>
                                <Ionicons name="checkmark" size={16} color={Colors.success} />
                                <Text style={styles.privacyText}>Xóa tài khoản bất cứ lúc nào</Text>
                            </View>
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>📏 Thông tin cơ bản</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Cân nặng hiện tại (kg)</Text>
                            <TextInput
                                style={styles.input}
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="numeric"
                                placeholder="60"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
                            <TextInput
                                style={styles.input}
                                value={height}
                                onChangeText={setHeight}
                                keyboardType="numeric"
                                placeholder="165"
                            />
                        </View>

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Tuổi</Text>
                                <TextInput
                                    style={styles.input}
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="numeric"
                                    placeholder="25"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>Giới tính</Text>
                                <View style={styles.genderButtons}>
                                    {(["female", "male", "other"] as const).map((g) => (
                                        <Pressable
                                            key={g}
                                            style={[
                                                styles.genderButton,
                                                gender === g && styles.genderButtonSelected,
                                            ]}
                                            onPress={() => setGender(g)}
                                        >
                                            <Text
                                                style={[
                                                    styles.genderButtonText,
                                                    gender === g && styles.genderButtonTextSelected,
                                                ]}
                                            >
                                                {g === "female" ? "Nữ" : g === "male" ? "Nam" : "Khác"}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Cân nặng mục tiêu (optional)</Text>
                            <TextInput
                                style={styles.input}
                                value={targetWeight}
                                onChangeText={setTargetWeight}
                                keyboardType="numeric"
                                placeholder="55"
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoTitle}>💡 Tại sao cần thông tin này?</Text>
                            <Text style={styles.infoText}>→ Tính TDEE (Total Daily Energy)</Text>
                            <Text style={styles.infoText}>→ Đề xuất macro phù hợp</Text>
                            <Text style={styles.infoText}>→ Tracking progress chính xác</Text>
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>🍽️ Sở thích ăn uống</Text>

                        <Text style={styles.sectionLabel}>Activity level:</Text>
                        {ACTIVITY_LEVELS.map((level) => (
                            <Pressable
                                key={level.id}
                                style={[
                                    styles.radioOption,
                                    activityLevel === level.id && styles.radioOptionSelected,
                                ]}
                                onPress={() => setActivityLevel(level.id as any)}
                            >
                                <View style={styles.radioCircle}>
                                    {activityLevel === level.id && <View style={styles.radioFill} />}
                                </View>
                                <Text style={styles.radioLabel}>{level.label}</Text>
                            </Pressable>
                        ))}

                        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>
                            Dietary restrictions:
                        </Text>
                        {DIETARY_RESTRICTIONS.map((restriction) => (
                            <Pressable
                                key={restriction.id}
                                style={[
                                    styles.checkOption,
                                    dietaryRestrictions.includes(restriction.id) && styles.checkOptionSelected,
                                ]}
                                onPress={() => toggleRestriction(restriction.id)}
                            >
                                <View
                                    style={[
                                        styles.checkBox,
                                        dietaryRestrictions.includes(restriction.id) && styles.checkBoxSelected,
                                    ]}
                                >
                                    {dietaryRestrictions.includes(restriction.id) && (
                                        <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                    )}
                                </View>
                                <Text style={styles.checkLabel}>{restriction.label}</Text>
                            </Pressable>
                        ))}

                        <View style={[styles.inputGroup, { marginTop: 24 }]}>
                            <Text style={styles.inputLabel}>Allergies (optional):</Text>
                            <TextInput
                                style={styles.input}
                                value={allergies}
                                onChangeText={setAllergies}
                                placeholder="Ví dụ: Hải sản, đậu phộng"
                            />
                        </View>
                    </View>
                );

            case 4:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>🔔 Nhắc nhở để giữ streak</Text>

                        <Text style={styles.sectionLabel}>Cho phép thông báo:</Text>

                        {Object.entries({
                            mealReminders: "Nhắc log bữa ăn",
                            streakAlerts: "Streak sắp mất",
                            challengeUpdates: "Challenge updates",
                            dailyTips: "Tips & tricks hàng ngày",
                        }).map(([key, label]) => (
                            <View key={key} style={styles.switchRow}>
                                <Text style={styles.switchLabel}>{label}</Text>
                                <Switch
                                    value={notifications[key as keyof typeof notifications]}
                                    onValueChange={(value) =>
                                        setNotifications((prev) => ({ ...prev, [key]: value }))
                                    }
                                    trackColor={{ false: "#E5E7EB", true: Colors.primaryLight }}
                                    thumbColor={
                                        notifications[key as keyof typeof notifications]
                                            ? Colors.primary
                                            : "#f4f3f4"
                                    }
                                />
                            </View>
                        ))}

                        <View style={styles.motivationBox}>
                            <Text style={styles.motivationTitle}>💪 Câu nói động viên:</Text>
                            <Text style={styles.motivationQuote}>"Consistency {">"} Perfection"</Text>
                            <Text style={styles.motivationQuote}>"Log 1 meal today = Win"</Text>
                            <Text style={styles.motivationQuote}>"You got this! 🔥"</Text>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {currentStep > 1 ? (
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.textDark} />
                    </Pressable>
                ) : (
                    <View style={styles.backButton} />
                )}
                <Text style={styles.stepIndicator}>Bước {currentStep}/4</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressBar}>
                <View
                    style={[styles.progressFill, { width: `${(currentStep / 4) * 100}%` }]}
                />
            </View>

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {renderStepContent()}
            </ScrollView>

            {/* Bottom button */}
            <View style={styles.bottomButton}>
                <Pressable
                    style={styles.continueButton}
                    onPress={handleNext}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color={Colors.textOnPrimary} />
                    ) : (
                        <Text style={styles.continueButtonText}>
                            {currentStep === 4 ? "Bắt đầu ngay! →" : "Tiếp tục →"}
                        </Text>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
    },
    stepIndicator: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.textMedium,
    },
    progressBar: {
        height: 4,
        backgroundColor: "#E5E7EB",
        marginHorizontal: 24,
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    stepContent: {},
    stepTitle: {
        fontSize: 24,
        fontWeight: "600",
        color: Colors.textDark,
        marginBottom: 8,
        fontFamily: "Playfair Display",
    },
    stepHint: {
        fontSize: 14,
        color: Colors.textLight,
        marginBottom: 24,
    },
    optionsGrid: {
        gap: 12,
    },
    optionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: "transparent",
        ...Shadows.soft,
    },
    optionCardSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.primaryLight,
    },
    optionIcon: {
        fontSize: 24,
    },
    optionLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: "500",
        color: Colors.textDark,
    },
    optionLabelSelected: {
        color: Colors.primary,
        fontWeight: "600",
    },
    privacySection: {
        marginTop: 32,
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 16,
        ...Shadows.soft,
    },
    privacyTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textDark,
        marginBottom: 12,
    },
    privacyItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
    },
    privacyText: {
        fontSize: 14,
        color: Colors.textMedium,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: Colors.textMedium,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.surface,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.textDark,
        ...Shadows.soft,
    },
    inputRow: {
        flexDirection: "row",
        gap: 16,
    },
    genderButtons: {
        flexDirection: "row",
        gap: 8,
    },
    genderButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: Colors.surface,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#E5E7EB",
    },
    genderButtonSelected: {
        backgroundColor: Colors.primaryLight,
        borderColor: Colors.primary,
    },
    genderButtonText: {
        fontSize: 13,
        fontWeight: "500",
        color: Colors.textMedium,
    },
    genderButtonTextSelected: {
        color: Colors.primary,
        fontWeight: "600",
    },
    infoBox: {
        backgroundColor: Colors.primaryLight,
        padding: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    infoTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: Colors.primary,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 13,
        color: Colors.primary,
        marginBottom: 4,
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: "600",
        color: Colors.textDark,
        marginBottom: 12,
    },
    radioOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        ...Shadows.soft,
    },
    radioOptionSelected: {
        backgroundColor: Colors.primaryLight,
    },
    radioCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.textLight,
        alignItems: "center",
        justifyContent: "center",
    },
    radioFill: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
    },
    radioLabel: {
        fontSize: 15,
        color: Colors.textDark,
    },
    checkOption: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        ...Shadows.soft,
    },
    checkOptionSelected: {
        backgroundColor: Colors.primaryLight,
    },
    checkBox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.textLight,
        alignItems: "center",
        justifyContent: "center",
    },
    checkBoxSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    checkLabel: {
        fontSize: 15,
        color: Colors.textDark,
    },
    switchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: Colors.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 8,
        ...Shadows.soft,
    },
    switchLabel: {
        fontSize: 15,
        color: Colors.textDark,
    },
    motivationBox: {
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 16,
        marginTop: 24,
        ...Shadows.soft,
    },
    motivationTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textDark,
        marginBottom: 12,
    },
    motivationQuote: {
        fontSize: 15,
        color: Colors.primary,
        fontStyle: "italic",
        marginBottom: 8,
    },
    bottomButton: {
        padding: 24,
        paddingTop: 16,
    },
    continueButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: Colors.textOnPrimary,
    },
});
