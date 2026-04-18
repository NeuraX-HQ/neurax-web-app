import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Modal, Alert, TextInput
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { getUrl } from 'aws-amplify/storage';
import { Colors, Shadows } from '../src/constants/colors';
import { useMealStore, MealType } from '../src/store/mealStore';
import { NutritionInfo, fixFood } from '../src/services/aiService';
import { useAppLanguage } from '../src/i18n/LanguageProvider';
import { LoadingAnalysis } from '../src/components/LoadingAnalysis';

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
    const storeSelectedMealType = useMealStore(state => state.selectedMealType);
    const setStoreMealType = useMealStore(state => state.setSelectedMealType);

    const mealTypes: { value: MealType; label: string; emoji: string; color: string }[] = [
        { value: 'BREAKFAST', label: t('foodDetail.mealType.breakfast'), emoji: '🌅', color: '#FFB84D' },
        { value: 'LUNCH', label: t('foodDetail.mealType.lunch'), emoji: '☀️', color: '#FF9500' },
        { value: 'DINNER', label: t('foodDetail.mealType.dinner'), emoji: '🌙', color: '#5856D6' },
        { value: 'SNACK', label: t('foodDetail.mealType.snack'), emoji: '🍪', color: '#34C759' },
    ];

    const [showMealTypeModal, setShowMealTypeModal] = useState(false);
    const [showUnitModal, setShowUnitModal] = useState(false);
    // Pre-fill from global context (e.g. when user taps "Log Breakfast" on Home)
    const [selectedMealType, setSelectedMealType] = useState<MealType>(
        storeSelectedMealType ?? 'LUNCH'
    );
    const [isAdding, setIsAdding] = useState(false);
    const [portionCount, setPortionCount] = useState(1);
    const [portionUnit, setPortionUnit] = useState('serving');

    // AI Fix State
    const [showFixModal, setShowFixModal] = useState(false);
    const [fixQuery, setFixQuery] = useState('');
    const [isFixing, setIsFixing] = useState(false);

    const setCurrentFoodItem = useMealStore(state => state.setCurrentFoodItem);
    const currentFoodItem = useMealStore(state => state.currentFoodItem);

    const source = params.source as string;
    const imageParam = params.image as string; // s3Key (e.g. "incoming/us-east-1:xxx/photo.jpg") or empty
    const [imageUri, setImageUri] = useState<string>('');

    // Resolve S3 key → presigned URL for display
    useEffect(() => {
        if (!imageParam) return;
        getUrl({ path: imageParam })
            .then(({ url }) => setImageUri(url.toString()))
            .catch(() => setImageUri(''));
    }, [imageParam]);

    // Initialize from params, and update global state if navigating to a new food item
    React.useEffect(() => {
        const paramData = params.foodData ? JSON.parse(params.foodData as string) : null;
        if (paramData && (!currentFoodItem || currentFoodItem.name !== paramData.name)) {
            setCurrentFoodItem(paramData);
        }
    }, [params.foodData]);

    // Use global state as source of truth if available, otherwise fallback to params
    const foodData: NutritionInfo | null = currentFoodItem || (params.foodData ? JSON.parse(params.foodData as string) : null);

    const { language } = useAppLanguage();
    // Helper to resolve name based on language
    const resolveName = (item: any) => {
        if (typeof item === 'string') return item;
        if (!item) return '';
        return language === 'vi' ? (item.name_vi || item.name) : (item.name_en || item.name);
    };

    const displayFoodName = foodData ? resolveName(foodData) : '';

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
            await addMeal({
                name: foodData.name,
                name_en: foodData.name_en,
                name_vi: foodData.name_vi,
                type: selectedMealType,
                calories: Math.round(foodData.calories * nutritionMultiplier),
                protein: Math.round(foodData.protein * nutritionMultiplier),
                carbs: Math.round(foodData.carbs * nutritionMultiplier),
                fat: Math.round(foodData.fat * nutritionMultiplier),
                servingSize: `${portionCount} ${t(selectedPortionUnit.labelKey)}`,
                ingredients: foodData.ingredients,
                image: imageUri || getEmojiForFood(foodData.name_en || foodData.name),
                image_key: imageParam || undefined,
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
        const updatedFoodData = {
            ...foodData,
            servingSize: `${portionCount} ${t(selectedPortionUnit.labelKey)}`,
            calories: Math.round(foodData.calories * nutritionMultiplier),
            protein: Math.round(foodData.protein * nutritionMultiplier),
            carbs: Math.round(foodData.carbs * nutritionMultiplier),
            fat: Math.round(foodData.fat * nutritionMultiplier),
        };

        router.push({
            pathname: '/add-to-fridge',
            params: {
                foodData: JSON.stringify(updatedFoodData),
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

    const handleFixFood = async () => {
        if (!fixQuery.trim() || !foodData) return;
        
        setIsFixing(true);
        setShowFixModal(false);
        
        try {
            const result = await fixFood(foodData, fixQuery);
            if (result.success && result.data) {
                setCurrentFoodItem(result.data);
                setFixQuery('');
            } else {
                Alert.alert(t('common.error'), result.error || t('foodDetail.fixIssueError'));
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('foodDetail.fixConnectionError'));
        } finally {
            setIsFixing(false);
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

    const selectedMealTypeData = mealTypes.find(type => type.value === selectedMealType);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
                {/* Food Image or Compact Header */}
                {imageUri ? (
                    <View style={styles.imageSection}>
                        <Image
                            source={{ uri: imageUri }}
                            style={styles.foodImage}
                            contentFit="cover"
                            transition={500}
                            cachePolicy="memory-disk"
                        />

                        {/* Back button */}
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={22} color="#FFF" />
                        </TouchableOpacity>

                        {/* Share button */}
                        <TouchableOpacity style={styles.shareButton}>
                            <Ionicons name="share-outline" size={22} color="#FFF" />
                        </TouchableOpacity>

                        {/* Gradient name overlay at bottom of image */}
                        <View style={styles.nameOverlay}>
                            <Text style={styles.foodNameLarge}>{displayFoodName}</Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.compactHeader, { paddingTop: insets.top + 10 }]}>
                        <View style={styles.compactHeaderContent}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.compactBackButton}>
                                <Ionicons name="arrow-back" size={24} color="#0F172A" />
                            </TouchableOpacity>
                            <Text style={styles.compactTitle} numberOfLines={1}>{displayFoodName}</Text>
                            <TouchableOpacity style={styles.compactShareButton}>
                                <Ionicons name="share-outline" size={24} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* ── White card: Total Energy (left) + Macro bars (right) ── */}
                <View style={[styles.nutritionCard, !imageUri && { marginTop: 10 }]}>
                    {/* Left: big calorie number */}
                    <TouchableOpacity
                        style={styles.calorieBlock}
                        activeOpacity={0.85}
                        onPress={() => router.push('/edit-calories')}
                    >
                        <Text style={styles.totalEnergyLabel}>{t('foodDetail.totalEnergy')}</Text>
                        <View style={styles.calorieRow}>
                            <Text style={styles.calorieValueLarge}>{scaledCalories}</Text>
                            <Text style={styles.calorieUnitText}>kcal</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.nutritionDivider} />

                    {/* Right: macro progress bars */}
                    <TouchableOpacity
                        style={styles.macrosBarsBlock}
                        activeOpacity={0.85}
                        onPress={() => router.push('/edit-calories')}
                    >
                        {/* Protein row */}
                        <View style={styles.macroBarRow}>
                            <Text style={styles.macroBarLabel}>{t('foodDetail.protein')}</Text>
                            <View style={styles.macroBarTrack}>
                                <View style={[styles.macroBarFill, { width: `${Math.min(100, (scaledProtein / 140) * 100)}%`, backgroundColor: '#EF4444' }]} />
                            </View>
                            <Text style={styles.macroBarValue}>{scaledProtein}g</Text>
                        </View>
                        {/* Carbs row */}
                        <View style={styles.macroBarRow}>
                            <Text style={styles.macroBarLabel}>{t('foodDetail.carbs')}</Text>
                            <View style={styles.macroBarTrack}>
                                <View style={[styles.macroBarFill, { width: `${Math.min(100, (scaledCarbs / 280) * 100)}%`, backgroundColor: '#F97316' }]} />
                            </View>
                            <Text style={styles.macroBarValue}>{scaledCarbs}g</Text>
                        </View>
                        {/* Fat row */}
                        <View style={styles.macroBarRow}>
                            <Text style={styles.macroBarLabel}>{t('foodDetail.fat')}</Text>
                            <View style={styles.macroBarTrack}>
                                <View style={[styles.macroBarFill, { width: `${Math.min(100, (scaledFat / 75) * 100)}%`, backgroundColor: '#EAB308' }]} />
                            </View>
                            <Text style={styles.macroBarValue}>{scaledFat}g</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── AI Fix Button ── */}
                <TouchableOpacity 
                    style={styles.aiFixButton} 
                    onPress={() => setShowFixModal(true)}
                    activeOpacity={0.7}
                >
                    <View style={styles.aiFixIconBox}>
                        <Text style={{ fontSize: 18 }}>💡</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.aiFixTitle}>{t('foodDetail.aiFixTitle')}</Text>
                        <Text style={styles.aiFixSub}>{t('foodDetail.aiFixSubtitle')}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
                </TouchableOpacity>

                {/* ── Portion Size Card ── */}
                <View style={styles.portionCard}>
                    <View style={styles.portionCardHeader}>
                        <Text style={styles.portionTitle}>{t('foodDetail.portion')}</Text>
                        <Text style={styles.editWeightText}>{t('foodDetail.editWeight')}</Text>
                    </View>
                    <View style={styles.portionControls}>
                        <TouchableOpacity
                            style={styles.portionCircleBtn}
                            onPress={() => setPortionCount(Math.max(1, portionCount - 1))}
                        >
                            <Text style={styles.portionCircleBtnText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.portionCenterBox}>
                            <Text style={styles.portionCount}>{portionCount}</Text>
                            <TouchableOpacity
                                style={styles.portionUnitSelector}
                                onPress={() => setShowUnitModal(true)}
                            >
                                <Text style={styles.portionUnit} numberOfLines={1}>{t(selectedPortionUnit.labelKey)}</Text>
                                <Ionicons name="chevron-down" size={14} color="#666" />
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                            style={styles.portionCircleBtnPrimary}
                            onPress={() => setPortionCount(portionCount + 1)}
                        >
                            <Text style={styles.portionCircleBtnPrimaryText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Ingredient Breakdown ── */}
                {ingredientItems.length > 0 && (
                    <View style={styles.macroDetailSection}>
                        <View style={styles.ingredientsHeader}>
                            <Text style={styles.macroDetailTitle}>{t('foodDetail.ingredientDetails')}</Text>
                            <TouchableOpacity style={styles.editButton} onPress={handleEditIngredients}>
                                <Ionicons name="create-outline" size={18} color="#666" />
                                <Text style={styles.editButtonText}>{t('foodDetail.edit')}</Text>
                            </TouchableOpacity>
                        </View>
                        {ingredientItems.map((ingredient, index) => {
                            let item = ingredient;
                            // Defensive check: if it's a JSON-like string, parse it locally
                            if (typeof item === 'string' && (item as string).startsWith('{')) {
                                try { item = JSON.parse(item); } catch { /* fallback to string */ }
                            }

                            const isStringIngredient = typeof item === 'string';
                            const ingredientName = resolveName(item);

                            const ingredientAmount = isStringIngredient
                                ? ''
                                : item.estimated_g
                                    ? `${Math.round(item.estimated_g * nutritionMultiplier)} g`
                                    : item.amount || '';

                            const ingredientKcal = !isStringIngredient && item.calories !== undefined
                                ? `${Math.round(item.calories * nutritionMultiplier)} kcal`
                                : '';
                            return (
                                <View key={`${ingredientName}-${index}`} style={styles.macroDetailRow}>
                                    <View style={[
                                        styles.ingredientCheckbox,
                                        !isStringIngredient && item.source === 'database' && styles.ingredientCheckboxDB,
                                        !isStringIngredient && item.source === 'ai_estimated' && styles.ingredientCheckboxAI,
                                    ]} />
                                    <Text style={styles.macroDetailLabel}>{ingredientName}</Text>
                                    {!!ingredientAmount && <Text style={styles.macroDetailSub}>{ingredientAmount}</Text>}
                                    {!!ingredientKcal && <Text style={styles.macroDetailSub}>{ingredientKcal}</Text>}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Extra space at bottom so content isn't hidden by the absolute bottom bar */}
                <View style={{ height: 140 }} />
            </ScrollView>

            {/* Bottom Buttons */}
            <View style={[styles.bottomButtons, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                <TouchableOpacity style={styles.fridgeButton} onPress={handleAddToFridge}>
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

            {/* Fix Issues Input Modal */}
            <Modal
                visible={showFixModal}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowFixModal(false)}
            >
                <View style={styles.fixModalOverlay}>
                    <View style={styles.fixModalContent}>
                        <Text style={styles.modalTitle}>{t('foodDetail.fixIssueTitle')}</Text>
                        <Text style={styles.modalSub}>{t('foodDetail.fixIssueDescription')}</Text>
                        
                        <TextInput
                            style={styles.fixInput}
                            placeholder={t('foodDetail.fixIssuePlaceholder')}
                            placeholderTextColor="#94A3B8"
                            multiline
                            numberOfLines={3}
                            value={fixQuery}
                            onChangeText={setFixQuery}
                            autoFocus
                        />
                        
                        <View style={styles.fixModalButtons}>
                            <TouchableOpacity style={styles.fixCancelBtn} onPress={() => setShowFixModal(false)}>
                                <Text style={styles.fixCancelText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.fixConfirmBtn, !fixQuery.trim() && { opacity: 0.5 }]} 
                                onPress={handleFixFood}
                                disabled={!fixQuery.trim()}
                            >
                                <Text style={styles.fixConfirmText}>{t('common.continue')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Loading Overlay */}
            {isFixing && (
                <View style={StyleSheet.absoluteFill}>
                    <LoadingAnalysis message={t('foodDetail.fixingMessage')} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },

    // ── Hero ──────────────────────────────────────────
    imageSection: {
        position: 'relative',
        height: 420,
    },
    foodImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    foodImagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        alignItems: 'center',
    },
    foodEmojiLarge: {
        fontSize: 120,
    },
    backButton: {
        position: 'absolute',
        top: 52,
        left: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    shareButton: {
        position: 'absolute',
        top: 52,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nameOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 22,
        paddingBottom: 28,
        paddingTop: 60,
    },
    foodNameLarge: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FFFFFF',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },

    // ── Compact Header (When no image) ───────────────
    compactHeader: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    compactHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    compactBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    compactTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
        textAlign: 'center',
    },
    compactShareButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },

    // ── Nutrition Card (Calorie + Macro bars) ─────────
    nutritionCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: -24,
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        zIndex: 10,
    },
    calorieBlock: {
        justifyContent: 'center',
        paddingRight: 16,
    },
    totalEnergyLabel: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    calorieRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    calorieValueLarge: {
        fontSize: 40,
        fontWeight: '800',
        color: '#0F172A',
        lineHeight: 52,
    },
    calorieUnitText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '600',
    },
    nutritionDivider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 4,
    },
    macrosBarsBlock: {
        flex: 1,
        paddingLeft: 16,
        justifyContent: 'center',
        gap: 10,
    },
    macroBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    macroBarLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        width: 44,
    },
    macroBarTrack: {
        flex: 1,
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 999,
        overflow: 'hidden',
    },
    macroBarFill: {
        height: '100%',
        borderRadius: 999,
    },
    macroBarValue: {
        fontSize: 10,
        fontWeight: '700',
        color: '#334155',
        minWidth: 28,
        textAlign: 'right',
    },

    // ── Portion Card ──────────────────────────────────
    portionCard: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    portionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    portionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    editWeightText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    portionControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    portionCircleBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    portionCircleBtnText: {
        fontSize: 26,
        color: '#374151',
        fontWeight: '400',
        lineHeight: 30,
    },
    portionCenterBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    portionCount: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    portionUnitSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    portionUnit: {
        fontSize: 15,
        color: '#6B7280',
        fontWeight: '600',
    },
    portionCircleBtnPrimary: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    portionCircleBtnPrimaryText: {
        fontSize: 26,
        color: '#FFFFFF',
        fontWeight: '400',
        lineHeight: 30,
    },

    // ── Ingredients ───────────────────────────────────
    macroDetailSection: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 16,
        marginTop: 14,
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
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
    ingredientsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    ingredientCheckbox: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#E0E0E0',
    },
    ingredientCheckboxDB: {
        borderColor: '#10B981',
        backgroundColor: '#D1FAE5',
    },
    ingredientCheckboxAI: {
        borderColor: '#F59E0B',
        backgroundColor: '#FEF3C7',
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

    // ── Modals & Bottom Buttons (unchanged) ──────────
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
    bottomButtons: {
        flexDirection: 'row',
        gap: 12,
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 20,
        zIndex: 100,
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

    // ── AI Fix ────────────────────────────────────────
    aiFixButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        marginHorizontal: 16,
        marginTop: 14,
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 12,
    },
    aiFixIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    aiFixTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0F172A',
    },
    aiFixSub: {
        fontSize: 11,
        color: '#64748B',
        marginTop: 1,
    },

    // Fix Modal
    fixModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    fixModalContent: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        gap: 16,
    },
    modalSub: {
        fontSize: 13,
        color: '#64748B',
        marginTop: -8,
        lineHeight: 18,
    },
    fixInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        fontSize: 15,
        color: '#0F172A',
        height: 100,
        textAlignVertical: 'top',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    fixModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    fixCancelBtn: {
        flex: 1,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
    },
    fixCancelText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748B',
    },
    fixConfirmBtn: {
        flex: 2,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary,
    },
    fixConfirmText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
