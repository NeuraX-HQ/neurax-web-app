import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Alert
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors, Shadows } from '../src/constants/colors';
import { useMealStore, MealType } from '../src/store/mealStore';
import { NutritionInfo } from '../src/services/geminiService';
import * as FileSystem from 'expo-file-system/legacy';

const MEAL_TYPES: { value: MealType; label: string; emoji: string; color: string }[] = [
    { value: 'BREAKFAST', label: 'Bữa sáng', emoji: '🌅', color: '#FFB84D' },
    { value: 'LUNCH', label: 'Bữa trưa', emoji: '☀️', color: '#FF9500' },
    { value: 'DINNER', label: 'Bữa tối', emoji: '🌙', color: '#5856D6' },
    { value: 'SNACK', label: 'Bữa phụ', emoji: '🍪', color: '#34C759' },
];

export default function FoodDetailScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const addMeal = useMealStore(state => state.addMeal);

    const [showMealTypeModal, setShowMealTypeModal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState<MealType>('LUNCH');
    const [isAdding, setIsAdding] = useState(false);
    const [portionCount, setPortionCount] = useState(1);
    const [portionUnit, setPortionUnit] = useState('tô');

    const setCurrentFoodItem = useMealStore(state => state.setCurrentFoodItem);
    const currentFoodItem = useMealStore(state => state.currentFoodItem);

    const source = params.source as string;
    const imageUri = params.image as string;

    // Initialize from params, and update global state if navigating to a new food item
    React.useEffect(() => {
        const paramData = params.foodData ? JSON.parse(params.foodData as string) : null;
        if (paramData && (!currentFoodItem || currentFoodItem.name !== paramData.name)) {
            setCurrentFoodItem(paramData);
        }
    }, [params.foodData]);

    // Use global state as source of truth if available, otherwise fallback to params
    const foodData: NutritionInfo | null = currentFoodItem || (params.foodData ? JSON.parse(params.foodData as string) : null);

    if (!foodData) {
        return (
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Không có dữ liệu món ăn</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const handleAddMeal = async () => {
        setIsAdding(true);

        try {
            let savedImageUri = imageUri;

            if (imageUri && imageUri.startsWith('file://')) {
                const filename = imageUri.split('/').pop() || `food_${Date.now()}.jpg`;
                const newPath = FileSystem.documentDirectory + filename;
                try {
                    await FileSystem.copyAsync({
                        from: imageUri,
                        to: newPath
                    });
                    savedImageUri = newPath;
                } catch (err) {
                    console.error('Lỗi khi copy file ảnh:', err);
                }
            }

            await addMeal({
                name: foodData.name,
                type: selectedMealType,
                calories: Math.round(foodData.calories * portionCount),
                protein: Math.round(foodData.protein * portionCount),
                carbs: Math.round(foodData.carbs * portionCount),
                fat: Math.round(foodData.fat * portionCount),
                servingSize: `${portionCount} ${portionUnit}`,
                ingredients: foodData.ingredients,
                image: savedImageUri || getEmojiForFood(foodData.name),
            });

            // Navigate back to home
            router.replace('/(tabs)/home');
        } catch (error) {
            Alert.alert('Lỗi', 'Không thể thêm món ăn');
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddToFridge = () => {
        router.push({
            pathname: '/add-to-fridge',
            params: {
                foodData: params.foodData,
                image: params.image,
                source: params.source
            }
        });
    };

    const handleEditIngredients = () => {
        router.push({
            pathname: '/edit-ingredients',
            // No need to pass params, we'll read and update global state
        });
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
        <View style={styles.container}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                {/* Food Image with overlay */}
                <View style={styles.imageSection}>
                    {imageUri ? (
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.foodImage}
                            contentFit="cover"
                            transition={500}
                            cachePolicy="memory-disk"
                        />
                    ) : (
                        <View style={styles.foodImagePlaceholder}>
                            <Text style={styles.foodEmojiLarge}>{getEmojiForFood(foodData.name)}</Text>
                        </View>
                    )}

                    {/* Back button */}
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    {/* Share button */}
                    <TouchableOpacity style={styles.shareButton}>
                        <Ionicons name="share-outline" size={24} color="#FFF" />
                    </TouchableOpacity>

                    {/* Food name overlay */}
                    <View style={styles.nameOverlay}>
                        <Text style={styles.foodNameLarge}>{foodData.name}</Text>
                    </View>
                </View>

                {/* Nutrition Info Card */}
                <View style={styles.nutritionSection}>
                    <View style={styles.nutritionHeader}>
                        <View>
                            <Text style={styles.totalEnergyLabel}>Total Energy</Text>
                            <View style={styles.calorieRow}>
                                <Text style={styles.calorieValueLarge}>{Math.round(foodData.calories * portionCount)}</Text>
                                <Text style={styles.calorieUnit}>kcal</Text>
                            </View>
                        </View>
                        <View style={styles.macrosColumn}>
                            <View style={styles.macroRowCompact}>
                                <Text style={styles.macroLabel}>Protein</Text>
                                <View style={styles.macroBar}>
                                    <View style={[styles.macroBarFill, { width: '60%', backgroundColor: '#FF6B6B' }]} />
                                </View>
                                <Text style={styles.macroValue}>{Math.round(foodData.protein * portionCount)}g</Text>
                            </View>
                            <View style={styles.macroRowCompact}>
                                <Text style={styles.macroLabel}>Carbs</Text>
                                <View style={styles.macroBar}>
                                    <View style={[styles.macroBarFill, { width: '80%', backgroundColor: '#FFA500' }]} />
                                </View>
                                <Text style={styles.macroValue}>{Math.round(foodData.carbs * portionCount)}g</Text>
                            </View>
                            <View style={styles.macroRowCompact}>
                                <Text style={styles.macroLabel}>Fat</Text>
                                <View style={styles.macroBar}>
                                    <View style={[styles.macroBarFill, { width: '40%', backgroundColor: '#FFD700' }]} />
                                </View>
                                <Text style={styles.macroValue}>{Math.round(foodData.fat * portionCount)}g</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Portion Size */}
                <View style={styles.portionSection}>
                    <View style={styles.portionHeader}>
                        <Text style={styles.portionTitle}>Portion Size</Text>
                        <TouchableOpacity>
                            <Text style={styles.editWeight}>Edit weight</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.portionControls}>
                        <TouchableOpacity
                            style={styles.portionButton}
                            onPress={() => setPortionCount(Math.max(1, portionCount - 1))}
                        >
                            <Text style={styles.portionButtonText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.portionDisplay}>
                            <Text style={styles.portionCount}>{portionCount}</Text>
                            <TouchableOpacity style={styles.portionUnitSelector}>
                                <Text style={styles.portionUnit}>{portionUnit}</Text>
                                <Ionicons name="chevron-down" size={16} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.portionButtonAdd}
                            onPress={() => setPortionCount(portionCount + 1)}
                        >
                            <Text style={styles.portionButtonAddText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* AI Suggestion */}
                <View style={styles.aiSuggestion}>
                    <View style={styles.aiIcon}>
                        <Text style={styles.aiEmoji}>🤖</Text>
                    </View>
                    <View style={styles.aiContent}>
                        <Text style={styles.aiTitle}>AI Bảo suggests</Text>
                        <Text style={styles.aiText}>
                            Great choice! <Text style={styles.aiBold}>{foodData.name}</Text> is high in protein which supports your muscle building goal.
                        </Text>
                    </View>
                </View>

                {/* Data Source Badge */}
                {(foodData.db_match_count !== undefined || foodData.ai_fallback_count !== undefined) && (
                    <View style={styles.sourceSection}>
                        <View style={styles.sourceBadge}>
                            <Ionicons name="server-outline" size={14} color="#10B981" />
                            <Text style={styles.sourceBadgeText}>
                                {foodData.db_match_count || 0} từ DB
                            </Text>
                        </View>
                        {(foodData.ai_fallback_count || 0) > 0 && (
                            <View style={[styles.sourceBadge, styles.sourceBadgeAI]}>
                                <Ionicons name="sparkles" size={14} color="#F59E0B" />
                                <Text style={[styles.sourceBadgeText, { color: '#92400E' }]}>
                                    {foodData.ai_fallback_count} AI ước tính
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Ingredients */}
                {foodData.ingredients && foodData.ingredients.length > 0 && (
                    <View style={styles.ingredientsSection}>
                        <View style={styles.ingredientsHeader}>
                            <Text style={styles.ingredientsTitle}>Ingredients</Text>
                            <TouchableOpacity style={styles.editButton} onPress={handleEditIngredients}>
                                <Ionicons name="create-outline" size={18} color="#666" />
                                <Text style={styles.editButtonText}>Edit</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.ingredientsList}>
                            {foodData.ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.ingredientRow}>
                                    <View style={styles.ingredientLeft}>
                                        <View style={[
                                            styles.ingredientCheckbox,
                                            ingredient.source === 'database' && styles.ingredientCheckboxDB,
                                            ingredient.source === 'ai_estimated' && styles.ingredientCheckboxAI,
                                        ]} />
                                        <View>
                                            <Text style={styles.ingredientName}>
                                                {typeof ingredient === 'string' ? ingredient : ingredient.name}
                                            </Text>
                                            {ingredient.calories !== undefined && (
                                                <Text style={styles.ingredientCalories}>
                                                    {Math.round(ingredient.calories)} kcal
                                                    {ingredient.source === 'database' ? ' ✓' : ' ~'}
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                    <Text style={styles.ingredientAmount}>
                                        {typeof ingredient === 'string'
                                            ? ''
                                            : ingredient.estimated_g
                                                ? `${ingredient.estimated_g} g`
                                                : ingredient.amount || ''}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* No spacer needed with flex sticky footer */}
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={[styles.bottomButtons, { paddingBottom: Math.max(insets.bottom, 16) }]}>
                <TouchableOpacity style={styles.fridgeButton} onPress={handleAddToFridge}>
                    <Ionicons name="cube-outline" size={20} color="#111827" />
                    <Text style={styles.fridgeButtonText}>Add to Fridge</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.logButton}
                    onPress={() => setShowMealTypeModal(true)}
                >
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                    <Text style={styles.logButtonText}>Log Meal</Text>
                </TouchableOpacity>
            </View>

            {/* Meal Type Selection Modal */}
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
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.mealTypeGrid}>
                            {MEAL_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type.value}
                                    style={[
                                        styles.mealTypeOption,
                                        selectedMealType === type.value && { backgroundColor: type.color + '20', borderColor: type.color }
                                    ]}
                                    onPress={() => setSelectedMealType(type.value)}
                                >
                                    <Text style={styles.mealTypeEmoji}>{type.emoji}</Text>
                                    <Text style={[
                                        styles.mealTypeLabel,
                                        selectedMealType === type.value && { color: type.color, fontWeight: '700' }
                                    ]}>{type.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        
                        <TouchableOpacity
                            style={[styles.confirmButton, isAdding && styles.confirmButtonDisabled]}
                            onPress={handleAddMeal}
                            disabled={isAdding}
                        >
                            <Text style={styles.confirmButtonText}>
                                {isAdding ? 'Đang thêm...' : 'Xác nhận Log Meal'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    imageSection: {
        position: 'relative',
        height: 400,
    },
    foodImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    foodImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodEmojiLarge: {
        fontSize: 120,
    },
    backButton: {
        position: 'absolute',
        top: 16,
        left: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 24,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    foodNameLarge: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    nutritionSection: {
        backgroundColor: '#FFFFFF',
        marginTop: -20,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
    },
    nutritionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    totalEnergyLabel: {
        fontSize: 13,
        color: '#999',
        marginBottom: 4,
    },
    calorieRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    calorieValueLarge: {
        fontSize: 56,
        fontWeight: '800',
        color: '#000',
    },
    calorieUnit: {
        fontSize: 18,
        color: '#999',
        fontWeight: '500',
    },
    macrosColumn: {
        gap: 12,
        flex: 1,
        marginLeft: 20,
    },
    macroRowCompact: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    macroLabel: {
        fontSize: 13,
        color: '#666',
        width: 50,
    },
    macroBar: {
        flex: 1,
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    macroBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    macroValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
        width: 40,
        textAlign: 'right',
    },
    portionSection: {
        backgroundColor: '#FFFFFF',
        marginTop: 12,
        padding: 24,
    },
    portionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    portionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    editWeight: {
        fontSize: 14,
        color: '#999',
    },
    portionControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    portionButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    portionButtonText: {
        fontSize: 28,
        color: '#666',
        fontWeight: '300',
    },
    portionDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
    },
    portionCount: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000',
    },
    portionUnitSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    portionUnit: {
        fontSize: 16,
        color: '#666',
    },
    portionButtonAdd: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    portionButtonAddText: {
        fontSize: 28,
        color: '#FFF',
        fontWeight: '300',
    },
    aiSuggestion: {
        backgroundColor: '#F0F4FF',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        gap: 12,
    },
    aiIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiEmoji: {
        fontSize: 24,
    },
    aiContent: {
        flex: 1,
    },
    aiTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
        marginBottom: 4,
    },
    aiText: {
        fontSize: 13,
        color: '#666',
        lineHeight: 18,
    },
    aiBold: {
        fontWeight: '700',
        color: '#000',
    },
    ingredientsSection: {
        backgroundColor: '#FFFFFF',
        marginTop: 12,
        padding: 24,
    },
    ingredientsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    ingredientsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    editButtonText: {
        fontSize: 13,
        color: '#666',
    },
    ingredientsList: {
        gap: 16,
    },
    ingredientRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    ingredientLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    ingredientCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    ingredientName: {
        fontSize: 15,
        color: '#000',
    },
    ingredientAmount: {
        fontSize: 14,
        color: '#999',
    },
    ingredientCalories: {
        fontSize: 12,
        color: '#7F8C9B',
        marginTop: 2,
    },
    ingredientCheckboxDB: {
        borderColor: '#10B981',
        backgroundColor: '#D1FAE5',
    },
    ingredientCheckboxAI: {
        borderColor: '#F59E0B',
        backgroundColor: '#FEF3C7',
    },
    sourceSection: {
        flexDirection: 'row',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 12,
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sourceBadgeAI: {
        backgroundColor: '#FFF7ED',
    },
    sourceBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#065F46',
    },
    bottomButtons: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        // Update shadow for better float effect
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
        zIndex: 100, // Ensure it stays above everything
    },
    fridgeButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#FFF',
        height: 56,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    fridgeButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    logButton: {
        flex: 1.5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#000',
        height: 56,
        borderRadius: 16,
        shadowColor: '#E5E7EB',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 15,
        elevation: 10,
    },
    logButtonDisabled: {
        opacity: 0.6,
    },
    logButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
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
    backButtonError: {
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#000',
    },
    mealTypeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    mealTypeOption: {
        width: '48%',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        gap: 8,
    },
    mealTypeEmoji: {
        fontSize: 32,
    },
    mealTypeLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#666',
    },
    confirmButton: {
        backgroundColor: '#000',
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        opacity: 0.6,
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
