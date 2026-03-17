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
import { useAppLanguage } from '../src/i18n/LanguageProvider';

type CanonicalUnit = 'g' | 'ml';

type PortionUnitOption = {
    value: string;
    labelKey: string;
    toBase: number;
};

const parseServingSizeToBase = (servingSize?: string): { amount: number; unit: CanonicalUnit } | null => {
    if (!servingSize) return null;

    const normalized = servingSize.toLowerCase().replace(',', '.');
    const match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|gram|grams|lb|lbs|oz|l|ml)/i);
    if (!match) return null;

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    if (!Number.isFinite(amount) || amount <= 0) return null;

    if (unit === 'g' || unit === 'gram' || unit === 'grams') return { amount, unit: 'g' };
    if (unit === 'kg') return { amount: amount * 1000, unit: 'g' };
    if (unit === 'oz') return { amount: amount * 28.3495, unit: 'g' };
    if (unit === 'lb' || unit === 'lbs') return { amount: amount * 453.592, unit: 'g' };
    if (unit === 'ml') return { amount, unit: 'ml' };
    if (unit === 'l') return { amount: amount * 1000, unit: 'ml' };

    return null;
};

const getPortionUnitOptions = (servingSize?: string): PortionUnitOption[] => {
    const parsed = parseServingSizeToBase(servingSize);

    if (!parsed) {
        return [
            { value: 'serving', labelKey: 'foodDetail.unit.serving', toBase: 1 },
            { value: 'half-serving', labelKey: 'foodDetail.unit.halfServing', toBase: 0.5 },
            { value: 'double-serving', labelKey: 'foodDetail.unit.doubleServing', toBase: 2 },
        ];
    }

    if (parsed.unit === 'g') {
        return [
            { value: 'g', labelKey: 'foodDetail.unit.g', toBase: 1 },
            { value: 'kg', labelKey: 'foodDetail.unit.kg', toBase: 1000 },
            { value: 'oz', labelKey: 'foodDetail.unit.oz', toBase: 28.3495 },
            { value: 'lb', labelKey: 'foodDetail.unit.lb', toBase: 453.592 },
            { value: 'serving', labelKey: 'foodDetail.unit.serving', toBase: parsed.amount },
        ];
    }

    return [
        { value: 'ml', labelKey: 'foodDetail.unit.ml', toBase: 1 },
        { value: 'l', labelKey: 'foodDetail.unit.l', toBase: 1000 },
        { value: 'cup', labelKey: 'foodDetail.unit.cup', toBase: 240 },
        { value: 'tbsp', labelKey: 'foodDetail.unit.tbsp', toBase: 15 },
        { value: 'tsp', labelKey: 'foodDetail.unit.tsp', toBase: 5 },
        { value: 'serving', labelKey: 'foodDetail.unit.serving', toBase: parsed.amount },
    ];
};

export default function FoodDetailScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const params = useLocalSearchParams();
    const insets = useSafeAreaInsets();
    const addMeal = useMealStore(state => state.addMeal);

    const mealTypes: { value: MealType; label: string; emoji: string; color: string }[] = [
        { value: 'BREAKFAST', label: t('foodDetail.mealType.breakfast'), emoji: '🌅', color: '#FFB84D' },
        { value: 'LUNCH', label: t('foodDetail.mealType.lunch'), emoji: '☀️', color: '#FF9500' },
        { value: 'DINNER', label: t('foodDetail.mealType.dinner'), emoji: '🌙', color: '#5856D6' },
        { value: 'SNACK', label: t('foodDetail.mealType.snack'), emoji: '🍪', color: '#34C759' },
    ];

    const [showMealTypeModal, setShowMealTypeModal] = useState(false);
    const [showUnitModal, setShowUnitModal] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState<MealType>('LUNCH');
    const [isAdding, setIsAdding] = useState(false);
    const [portionCount, setPortionCount] = useState(1);
    const [portionUnit, setPortionUnit] = useState('serving');

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
                    <Text style={styles.errorText}>{t('foodDetail.noData')}</Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backButtonText}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const baseServing = parseServingSizeToBase(foodData.servingSize);
    const portionUnits = getPortionUnitOptions(foodData.servingSize);
    const selectedPortionUnit = portionUnits.find((unit) => unit.value === portionUnit) || portionUnits[0];
    const baseAmount = baseServing ? baseServing.amount : 1;
    const nutritionMultiplier = (portionCount * selectedPortionUnit.toBase) / baseAmount;
    const scaledCalories = Math.round(foodData.calories * nutritionMultiplier);
    const scaledProtein = Math.round(foodData.protein * nutritionMultiplier);
    const scaledCarbs = Math.round(foodData.carbs * nutritionMultiplier);
    const scaledFat = Math.round(foodData.fat * nutritionMultiplier);

    const ingredientItems = foodData.ingredients || [];

    React.useEffect(() => {
        if (!portionUnits.some((unit) => unit.value === portionUnit)) {
            setPortionUnit(portionUnits[0].value);
        }
    }, [foodData.servingSize]);

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
                calories: Math.round(foodData.calories * nutritionMultiplier),
                protein: Math.round(foodData.protein * nutritionMultiplier),
                carbs: Math.round(foodData.carbs * nutritionMultiplier),
                fat: Math.round(foodData.fat * nutritionMultiplier),
                servingSize: `${portionCount} ${t(selectedPortionUnit.labelKey)}`,
                ingredients: foodData.ingredients,
                image: savedImageUri || getEmojiForFood(foodData.name),
            });

            // Navigate back to home
            router.replace('/(tabs)/home');
        } catch (error) {
            Alert.alert(t('common.error'), t('foodDetail.addMealError'));
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

    const selectedMealTypeData = mealTypes.find(type => type.value === selectedMealType);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
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

                {/* Portion Size */}
                <View style={styles.portionSection}>
                    <View style={styles.portionHeader}>
                        <Text style={styles.portionTitle}>{t('foodDetail.portion')}</Text>
                    </View>
                    <View style={styles.portionControls}>
                        <View style={styles.portionDisplay}>
                            <TouchableOpacity
                                style={styles.portionButton}
                                onPress={() => setPortionCount(Math.max(1, portionCount - 1))}
                            >
                                <Text style={styles.portionButtonText}>−</Text>
                            </TouchableOpacity>
                            <View style={styles.portionCountBox}>
                                <Text style={styles.portionCount}>{portionCount}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.portionButtonAdd}
                                onPress={() => setPortionCount(portionCount + 1)}
                            >
                                <Text style={styles.portionButtonAddText}>+</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.portionUnitSelector}
                            onPress={() => setShowUnitModal(true)}
                        >
                            <Text style={styles.portionUnit} numberOfLines={1}>{t(selectedPortionUnit.labelKey)}</Text>
                            <Ionicons name="chevron-down" size={16} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Macro Summary Grid */}
                <View style={styles.macroGridSection}>
                    <View style={styles.macroGrid}>
                        <TouchableOpacity style={styles.macroCard} activeOpacity={0.85} onPress={() => router.push('/edit-calories')}>
                            <Text style={styles.macroCardLabel}>Calories</Text>
                            <Text style={[styles.macroCardValue, styles.macroCardCalories]}>{scaledCalories}<Text style={styles.macroCardUnit}> kcal</Text></Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.macroCard} activeOpacity={0.85} onPress={() => router.push('/edit-protein')}>
                            <Text style={styles.macroCardLabel}>{t('foodDetail.protein')}</Text>
                            <Text style={styles.macroCardValue}>{scaledProtein}<Text style={styles.macroCardUnit}> g</Text></Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.macroCard} activeOpacity={0.85} onPress={() => router.push('/edit-carbs')}>
                            <Text style={styles.macroCardLabel}>{t('foodDetail.carbs')}</Text>
                            <Text style={styles.macroCardValue}>{scaledCarbs}<Text style={styles.macroCardUnit}> g</Text></Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.macroCard} activeOpacity={0.85} onPress={() => router.push('/edit-fat')}>
                            <Text style={styles.macroCardLabel}>{t('foodDetail.fat')}</Text>
                            <Text style={styles.macroCardValue}>{scaledFat}<Text style={styles.macroCardUnit}> g</Text></Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Detailed Ingredient Breakdown */}
                <View style={styles.macroDetailSection}>
                    <View style={styles.ingredientsHeader}>
                        <Text style={styles.macroDetailTitle}>Chi tiết thành phần</Text>
                        <TouchableOpacity style={styles.editButton} onPress={handleEditIngredients}>
                            <Ionicons name="create-outline" size={18} color="#666" />
                            <Text style={styles.editButtonText}>{t('foodDetail.edit')}</Text>
                        </TouchableOpacity>
                    </View>
                    {ingredientItems.length > 0 ? (
                        ingredientItems.map((ingredient, index) => {
                            const isStringIngredient = typeof ingredient === 'string';
                            const ingredientName = isStringIngredient ? ingredient : ingredient.name;
                            const ingredientAmount = isStringIngredient
                                ? ''
                                : ingredient.estimated_g
                                    ? `${ingredient.estimated_g} g`
                                    : ingredient.amount || '';
                            const ingredientKcal = !isStringIngredient && ingredient.calories !== undefined
                                ? `${Math.round(ingredient.calories)} kcal`
                                : '';

                            return (
                                <View key={`${ingredientName}-${index}`} style={styles.macroDetailRow}>
                                    <View style={[
                                        styles.ingredientCheckbox,
                                        !isStringIngredient && ingredient.source === 'database' && styles.ingredientCheckboxDB,
                                        !isStringIngredient && ingredient.source === 'ai_estimated' && styles.ingredientCheckboxAI,
                                    ]} />
                                    <Text style={styles.macroDetailLabel}>{ingredientName}</Text>
                                    {!!ingredientAmount && <Text style={styles.macroDetailSub}>{ingredientAmount}</Text>}
                                    {!!ingredientKcal && <Text style={styles.macroDetailSub}>{ingredientKcal}</Text>}
                                </View>
                            );
                        })
                    ) : (
                        <Text style={styles.macroDetailHint}>Chưa có dữ liệu thành phần chi tiết cho món này.</Text>
                    )}
                </View>

                {/* AI Suggestion */}
                <View style={styles.aiSuggestion}>
                    <View style={styles.aiIcon}>
                        <Text style={styles.aiEmoji}>🤖</Text>
                    </View>
                    <View style={styles.aiContent}>
                        <Text style={styles.aiTitle}>{t('foodDetail.aiSuggestionTitle')}</Text>
                        <Text style={styles.aiText}>
                            {t('foodDetail.aiSuggestionText', { foodName: foodData.name })}
                        </Text>
                    </View>
                </View>

                {/* Data Source Badge */}
                {(foodData.db_match_count !== undefined || foodData.ai_fallback_count !== undefined) && (
                    <View style={styles.sourceSection}>
                        <View style={styles.sourceBadge}>
                            <Ionicons name="server-outline" size={14} color="#10B981" />
                            <Text style={styles.sourceBadgeText}>
                                {t('foodDetail.dbMatches', { count: foodData.db_match_count || 0 })}
                            </Text>
                        </View>
                        {(foodData.ai_fallback_count || 0) > 0 && (
                            <View style={[styles.sourceBadge, styles.sourceBadgeAI]}>
                                <Ionicons name="sparkles" size={14} color="#F59E0B" />
                                <Text style={[styles.sourceBadgeText, { color: '#92400E' }]}>
                                    {t('foodDetail.aiEstimated', { count: foodData.ai_fallback_count || 0 })}
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Extra space at bottom so content isn't hidden by the absolute bottom bar */}
                <View style={{ height: 140 }} />
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={[styles.bottomButtons, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.fridgeButton} onPress={handleAddToFridge}>
                    <Ionicons name="cube-outline" size={20} color="#111827" />
                    <Text style={styles.fridgeButtonText}>{t('foodDetail.addToFridge')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.logButton}
                    onPress={() => setShowMealTypeModal(true)}
                >
                    <Ionicons name="checkmark" size={20} color="#FFF" />
                    <Text style={styles.logButtonText}>{t('foodDetail.logMeal')}</Text>
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
                            <Text style={styles.modalTitle}>{t('foodDetail.selectMealType')}</Text>
                            <TouchableOpacity onPress={() => setShowMealTypeModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>
                        
                        <View style={styles.mealTypeGrid}>
                            {mealTypes.map((type) => (
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
                                {isAdding ? t('foodDetail.adding') : t('foodDetail.confirmLogMeal')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Portion Unit Selection Modal */}
            <Modal
                visible={showUnitModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowUnitModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t('foodDetail.selectUnit')}</Text>
                            <TouchableOpacity onPress={() => setShowUnitModal(false)}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.unitList}>
                            {portionUnits.map((unit) => {
                                const isSelected = unit.value === portionUnit;
                                return (
                                    <TouchableOpacity
                                        key={unit.value}
                                        style={[styles.unitOption, isSelected && styles.unitOptionSelected]}
                                        onPress={() => {
                                            setPortionUnit(unit.value);
                                            setShowUnitModal(false);
                                        }}
                                    >
                                        <Text style={[styles.unitOptionText, isSelected && styles.unitOptionTextSelected]}>
                                            {t(unit.labelKey)}
                                        </Text>
                                        {isSelected && <Ionicons name="checkmark" size={18} color="#000" />}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
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
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    portionHeader: {
        marginBottom: 10,
    },
    portionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    portionControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    portionButton: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    portionButtonText: {
        fontSize: 22,
        color: '#666',
        fontWeight: '500',
    },
    portionDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 8,
        gap: 8,
    },
    portionCountBox: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    portionCount: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
    },
    portionUnitSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '34%',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
    },
    portionUnit: {
        fontSize: 14,
        color: '#666',
        fontWeight: '600',
        flex: 1,
    },
    macroGridSection: {
        backgroundColor: '#FFFFFF',
        marginTop: 12,
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    macroGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    macroCard: {
        width: '48.5%',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    macroCardLabel: {
        fontSize: 13,
        color: '#64748B',
        marginBottom: 8,
        fontWeight: '500',
    },
    macroCardValue: {
        fontSize: 40,
        color: '#0F172A',
        fontWeight: '800',
        lineHeight: 42,
    },
    macroCardCalories: {
        color: '#10B981',
    },
    macroCardUnit: {
        fontSize: 17,
        fontWeight: '500',
        color: '#334155',
    },
    macroDetailSection: {
        backgroundColor: '#FFFFFF',
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    macroDetailTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
    },
    macroDetailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 8,
    },
    macroDetailDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    macroDetailLabel: {
        flex: 1,
        fontSize: 14,
        color: '#0F172A',
        fontWeight: '600',
    },
    macroDetailSub: {
        fontSize: 13,
        color: '#64748B',
        minWidth: 62,
        textAlign: 'right',
    },
    macroDetailPercent: {
        fontSize: 13,
        color: '#0F172A',
        fontWeight: '700',
        minWidth: 38,
        textAlign: 'right',
    },
    macroDetailHint: {
        marginTop: 4,
        fontSize: 12,
        color: '#94A3B8',
        lineHeight: 18,
    },
    unitList: {
        gap: 10,
    },
    unitOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFF',
    },
    unitOptionSelected: {
        borderColor: '#111827',
        backgroundColor: '#F9FAFB',
    },
    unitOptionText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '600',
    },
    unitOptionTextSelected: {
        color: '#111827',
        fontWeight: '700',
    },
    portionButtonAdd: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    portionButtonAddText: {
        fontSize: 22,
        color: '#666',
        fontWeight: '500',
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
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        gap: 12,
        padding: 24,
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
