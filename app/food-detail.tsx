import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Image, Modal, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../src/constants/colors';
import { useMealStore, MealType } from '../src/store/mealStore';
import { NutritionInfo } from '../src/services/geminiService';

const MEAL_TYPES: { value: MealType; label: string; emoji: string; color: string }[] = [
    { value: 'BREAKFAST', label: 'Bữa sáng', emoji: '🌅', color: '#FFB84D' },
    { value: 'LUNCH', label: 'Bữa trưa', emoji: '☀️', color: '#FF9500' },
    { value: 'DINNER', label: 'Bữa tối', emoji: '🌙', color: '#5856D6' },
    { value: 'SNACK', label: 'Bữa phụ', emoji: '🍪', color: '#34C759' },
];

export default function FoodDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const addMeal = useMealStore(state => state.addMeal);
    
    const [showMealTypeModal, setShowMealTypeModal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState<MealType>('LUNCH');
    const [isAdding, setIsAdding] = useState(false);

    // Parse food data from params
    const foodData: NutritionInfo = params.foodData 
        ? JSON.parse(params.foodData as string)
        : null;
    
    const source = params.source as string;
    const imageUri = params.image as string;

    if (!foodData) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Không có dữ liệu món ăn</Text>
                    <TouchableOpacity 
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const handleAddMeal = async () => {
        setIsAdding(true);
        
        try {
            await addMeal({
                name: foodData.name,
                type: selectedMealType,
                calories: foodData.calories,
                protein: foodData.protein,
                carbs: foodData.carbs,
                fat: foodData.fat,
                servingSize: foodData.servingSize,
                ingredients: foodData.ingredients,
                image: getEmojiForFood(foodData.name),
            });

            Alert.alert(
                'Thành công!',
                'Món ăn đã được thêm vào nhật ký',
                [
                    {
                        text: 'OK',
                        onPress: () => router.push('/(tabs)/home')
                    }
                ]
            );
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thêm món ăn');
        } finally {
            setIsAdding(false);
        }
    };

    const getEmojiForFood = (name: string): string => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('phở')) return '🍜';
        if (lowerName.includes('cơm')) return '🍚';
        if (lowerName.includes('bánh mì')) return '🥖';
        if (lowerName.includes('bún')) return '🍲';
        if (lowerName.includes('gà') || lowerName.includes('chicken')) return '🍗';
        if (lowerName.includes('salad')) return '🥗';
        if (lowerName.includes('burger')) return '🍔';
        if (lowerName.includes('pizza')) return '🍕';
        return '🍽️';
    };

    const selectedMealTypeData = MEAL_TYPES.find(t => t.value === selectedMealType);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Chi tiết món ăn</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Food Image/Icon */}
                <View style={styles.imageContainer}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.foodImage} />
                    ) : (
                        <View style={styles.emojiContainer}>
                            <Text style={styles.foodEmoji}>{getEmojiForFood(foodData.name)}</Text>
                        </View>
                    )}
                    <View style={styles.sourceBadge}>
                        <Ionicons 
                            name={source === 'voice' ? 'mic' : 'camera'} 
                            size={14} 
                            color="#FFF" 
                        />
                        <Text style={styles.sourceBadgeText}>
                            {source === 'voice' ? 'Giọng nói' : 'AI Scan'}
                        </Text>
                    </View>
                </View>

                {/* Food Name */}
                <View style={styles.nameSection}>
                    <Text style={styles.foodName}>{foodData.name}</Text>
                    <Text style={styles.servingSize}>{foodData.servingSize}</Text>
                </View>

                {/* Nutrition Card */}
                <View style={[styles.nutritionCard, Shadows.medium]}>
                    <Text style={styles.sectionTitle}>Thông tin dinh dưỡng</Text>
                    
                    <View style={styles.calorieRow}>
                        <View style={styles.calorieMain}>
                            <Text style={styles.calorieValue}>{foodData.calories}</Text>
                            <Text style={styles.calorieLabel}>kcal</Text>
                        </View>
                    </View>

                    <View style={styles.macrosGrid}>
                        <View style={styles.macroItem}>
                            <Text style={styles.macroEmoji}>🥩</Text>
                            <Text style={styles.macroValue}>{foodData.protein}g</Text>
                            <Text style={styles.macroLabel}>Protein</Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={styles.macroEmoji}>🍚</Text>
                            <Text style={styles.macroValue}>{foodData.carbs}g</Text>
                            <Text style={styles.macroLabel}>Carbs</Text>
                        </View>
                        <View style={styles.macroItem}>
                            <Text style={styles.macroEmoji}>🥑</Text>
                            <Text style={styles.macroValue}>{foodData.fat}g</Text>
                            <Text style={styles.macroLabel}>Fat</Text>
                        </View>
                    </View>
                </View>

                {/* Ingredients */}
                {foodData.ingredients && foodData.ingredients.length > 0 && (
                    <View style={[styles.ingredientsCard, Shadows.medium]}>
                        <Text style={styles.sectionTitle}>Thành phần</Text>
                        <View style={styles.ingredientsList}>
                            {foodData.ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.ingredientItem}>
                                    <View style={styles.ingredientDot} />
                                    <Text style={styles.ingredientText}>{ingredient}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Meal Type Selection */}
                <View style={[styles.mealTypeCard, Shadows.medium]}>
                    <Text style={styles.sectionTitle}>Phân loại bữa ăn</Text>
                    <TouchableOpacity 
                        style={styles.mealTypeSelector}
                        onPress={() => setShowMealTypeModal(true)}
                    >
                        <View style={styles.mealTypeSelectorLeft}>
                            <Text style={styles.mealTypeEmoji}>{selectedMealTypeData?.emoji}</Text>
                            <Text style={styles.mealTypeText}>{selectedMealTypeData?.label}</Text>
                        </View>
                        <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomBar}>
                <TouchableOpacity 
                    style={[styles.addButton, isAdding && styles.addButtonDisabled]}
                    onPress={handleAddMeal}
                    disabled={isAdding}
                >
                    <Text style={styles.addButtonText}>
                        {isAdding ? 'Đang thêm...' : 'Thêm vào nhật ký'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Meal Type Modal */}
            <Modal
                visible={showMealTypeModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowMealTypeModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Chọn bữa ăn</Text>
                            <TouchableOpacity onPress={() => setShowMealTypeModal(false)}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {MEAL_TYPES.map((mealType) => (
                            <TouchableOpacity
                                key={mealType.value}
                                style={[
                                    styles.mealTypeOption,
                                    selectedMealType === mealType.value && styles.mealTypeOptionSelected
                                ]}
                                onPress={() => {
                                    setSelectedMealType(mealType.value);
                                    setShowMealTypeModal(false);
                                }}
                            >
                                <View style={styles.mealTypeOptionLeft}>
                                    <Text style={styles.mealTypeOptionEmoji}>{mealType.emoji}</Text>
                                    <Text style={styles.mealTypeOptionText}>{mealType.label}</Text>
                                </View>
                                {selectedMealType === mealType.value && (
                                    <Ionicons name="checkmark-circle" size={24} color={Colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    imageContainer: {
        alignItems: 'center',
        paddingVertical: 24,
        position: 'relative',
    },
    foodImage: {
        width: 200,
        height: 200,
        borderRadius: 16,
    },
    emojiContainer: {
        width: 200,
        height: 200,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodEmoji: {
        fontSize: 100,
    },
    sourceBadge: {
        position: 'absolute',
        top: 32,
        right: 32,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    sourceBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    nameSection: {
        paddingHorizontal: 20,
        marginBottom: 20,
        alignItems: 'center',
    },
    foodName: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    servingSize: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    nutritionCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 16,
    },
    calorieRow: {
        alignItems: 'center',
        marginBottom: 20,
    },
    calorieMain: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    calorieValue: {
        fontSize: 48,
        fontWeight: '800',
        color: Colors.primary,
    },
    calorieLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    macrosGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    macroItem: {
        alignItems: 'center',
    },
    macroEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    macroValue: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 4,
    },
    macroLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    ingredientsCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
    },
    ingredientsList: {
        gap: 12,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    ingredientDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },
    ingredientText: {
        fontSize: 14,
        color: Colors.text,
        flex: 1,
    },
    mealTypeCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 20,
        borderRadius: 16,
    },
    mealTypeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
    },
    mealTypeSelectorLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mealTypeEmoji: {
        fontSize: 24,
    },
    mealTypeText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    addButton: {
        backgroundColor: Colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    addButtonDisabled: {
        opacity: 0.6,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    mealTypeOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    mealTypeOptionSelected: {
        backgroundColor: '#E8F5E9',
        borderColor: Colors.primary,
    },
    mealTypeOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mealTypeOptionEmoji: {
        fontSize: 28,
    },
    mealTypeOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 20,
    },
    backButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
