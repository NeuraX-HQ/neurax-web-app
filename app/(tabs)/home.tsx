import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors, Shadows } from '../../src/constants/colors';
import { ProfileIcon, SettingsIcon, NotificationIcon } from '../../src/components/TabIcons';
import { drinkTypes } from '../../src/data/mockData';
import { CalorieGauge } from '../../src/components/CalorieGauge';
import { useMealStore, MealType } from '../../src/store/mealStore';

export default function HomeScreen() {
    const router = useRouter();

    // Generate dynamic calendar dates
    const { weekDaysLabels, dates, fullDates, monthName, todayIndex } = useMemo(() => {
        const today = new Date();
        const currentMonthName = today.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        const dayOfWeek = today.getDay();
        const diffToMonday = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const monday = new Date(today);
        monday.setDate(diffToMonday);
        
        const d_labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        const d_dates = [];
        const d_fullDates = [];
        let tIndex = 0;
        
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            d_dates.push(d.getDate());
            
            const isoDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            d_fullDates.push(isoDate);
            
            if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) {
                tIndex = i;
            }
        }
        
        return { weekDaysLabels: d_labels, dates: d_dates, fullDates: d_fullDates, monthName: currentMonthName, todayIndex: tIndex };
    }, []);

    const [selectedDay, setSelectedDay] = useState(todayIndex);
    const selectedDateStr = fullDates[selectedDay];

    // Meal store
    const { loadMeals, getMealsByDate, removeMeal } = useMealStore();
    const displayedMeals = getMealsByDate(selectedDateStr);

    const stats = displayedMeals.reduce(
        (acc, meal) => ({
            totalCalories: acc.totalCalories + meal.calories,
            totalProtein: acc.totalProtein + meal.protein,
            totalCarbs: acc.totalCarbs + meal.carbs,
            totalFat: acc.totalFat + meal.fat,
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    );

    const maxCalories = 2500;
    const protein = { current: Math.round(stats.totalProtein), max: 140 };
    const carbs = { current: Math.round(stats.totalCarbs), max: 280 };
    const fat = { current: Math.round(stats.totalFat), max: 75 };
    const [waterCurrent, setWaterCurrent] = useState(800);
    const waterMax = 2500;

    // Load meals on mount
    useEffect(() => {
        loadMeals();
    }, []);

    // Hydration modal state
    const [showHydration, setShowHydration] = useState(false);
    const [selectedDrink, setSelectedDrink] = useState('water');
    const [drinkAmount, setDrinkAmount] = useState(200);

    const STEPS = [50, 100, 150, 200, 250];
    const GLASS_H = 240;

    const addWater = () => {
        setWaterCurrent(prev => Math.min(prev + drinkAmount, waterMax));
        setShowHydration(false);
    };

    // Group meals by type
    const getMealsByType = (type: MealType) => {
        return displayedMeals.filter(meal => meal.type === type);
    };

    const confirmDelete = (mealId: string, mealName: string) => {
        Alert.alert(
            'Xóa món ăn',
            `Bạn có chắc chắn muốn xóa "${mealName}" khỏi nhật ký không?`,
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Xóa', style: 'destructive', onPress: () => removeMeal(mealId) },
            ]
        );
    };

    const renderRightActions = (mealId: string, mealName: string) => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => confirmDelete(mealId, mealName)}
            >
                <Ionicons name="trash-outline" size={24} color="#FFF" />
            </TouchableOpacity>
        );
    };

    const renderMealCard = (meal: any) => (
        <Swipeable 
            key={meal.id}
            renderRightActions={() => renderRightActions(meal.id, meal.name)}
            containerStyle={{ marginHorizontal: 16, marginBottom: 8 }}
        >
            <TouchableOpacity
                style={[styles.mealCard, Shadows.small, { marginHorizontal: 0, marginBottom: 0 }]}
                onPress={() => router.push({
                    pathname: '/food-detail',
                    params: {
                        foodData: JSON.stringify({
                            name: meal.name,
                            calories: meal.calories,
                            protein: meal.protein,
                            carbs: meal.carbs,
                            fat: meal.fat,
                            servingSize: meal.servingSize,
                            ingredients: meal.ingredients,
                        }),
                        source: 'meal',
                        mealId: meal.id,
                    }
                })}
            >
                <View style={styles.mealImage}>
                    {meal.image && meal.image.startsWith('file://') ? (
                        <Image source={{ uri: meal.image }} style={styles.mealCardImg} contentFit="cover" />
                    ) : (
                        <Text style={styles.mealEmoji}>{meal.image || '🍽️'}</Text>
                    )}
                </View>
                <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
            </TouchableOpacity>
        </Swipeable>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity style={styles.avatar} onPress={() => router.push('/profile')}>
                            <ProfileIcon size={20} color="#000" />
                            <View style={styles.statusDot} />
                        </TouchableOpacity>
                        <Text style={styles.greeting}>Hi Admin!</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={() => router.push('/notifications')}>
                            <NotificationIcon size={20} color="#000" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push('/settings')}>
                            <SettingsIcon size={20} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Month & Streak */}
                <View style={styles.monthRow}>
                    <Text style={styles.monthText}>{monthName} ▾</Text>
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>14 days 🔥</Text>
                    </View>
                </View>

                {/* Week Days */}
                <View style={styles.weekRow}>
                    {weekDaysLabels.map((day, i) => (
                        <TouchableOpacity
                            key={i}
                            style={[styles.dayItem, selectedDay === i && styles.dayItemSelected]}
                            onPress={() => setSelectedDay(i)}
                        >
                            <Text style={[styles.dayLabel, selectedDay === i && styles.dayLabelSelected]}>{day}</Text>
                            <Text style={[styles.dayDate, selectedDay === i && styles.dayDateSelected]}>{dates[i]}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Calorie Card */}
                <View style={[styles.card, Shadows.medium]}>
                    <View style={styles.calorieRow}>
                        <CalorieGauge current={Math.round(stats.totalCalories)} max={maxCalories} size={120} strokeWidth={7} />
                        <View style={styles.macros}>
                            <View style={styles.macroRow}>
                                <Text style={styles.macroEmoji}>🥩</Text>
                                <View style={styles.macroInfo}>
                                    <View style={styles.macroHeader}>
                                        <Text style={styles.macroName}>Protein</Text>
                                        <Text style={styles.macroValue}>{protein.current}/{protein.max}g</Text>
                                    </View>
                                    <View style={styles.macroBarBg}>
                                        <View style={[styles.macroBar, { width: `${(protein.current / protein.max) * 100}%`, backgroundColor: Colors.protein }]} />
                                    </View>
                                </View>
                            </View>
                            <View style={styles.macroRow}>
                                <Text style={styles.macroEmoji}>🍞</Text>
                                <View style={styles.macroInfo}>
                                    <View style={styles.macroHeader}>
                                        <Text style={styles.macroName}>Carbs</Text>
                                        <Text style={styles.macroValue}>{carbs.current}/{carbs.max}g</Text>
                                    </View>
                                    <View style={styles.macroBarBg}>
                                        <View style={[styles.macroBar, { width: `${(carbs.current / carbs.max) * 100}%`, backgroundColor: Colors.carbs }]} />
                                    </View>
                                </View>
                            </View>
                            <View style={styles.macroRow}>
                                <Text style={styles.macroEmoji}>🧀</Text>
                                <View style={styles.macroInfo}>
                                    <View style={styles.macroHeader}>
                                        <Text style={styles.macroName}>Fat</Text>
                                        <Text style={styles.macroValue}>{fat.current}/{fat.max}g</Text>
                                    </View>
                                    <View style={styles.macroBarBg}>
                                        <View style={[styles.macroBar, { width: `${Math.min((fat.current / fat.max) * 100, 100)}%`, backgroundColor: Colors.fat }]} />
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Water Intake */}
                <View style={[styles.card, Shadows.small, styles.waterCard]}>
                    <View style={styles.waterRow}>
                        <Text style={styles.waterIcon}>💧</Text>
                        <View style={styles.waterInfo}>
                            <Text style={styles.waterTitle}>Water Intake</Text>
                            <View style={styles.waterBarBg}>
                                <View style={[styles.waterBar, { width: `${(waterCurrent / waterMax) * 100}%` }]} />
                            </View>
                        </View>
                        <Text style={styles.waterValue}>{waterCurrent}/{waterMax}ml</Text>
                        <TouchableOpacity style={styles.waterAdd} onPress={() => setShowHydration(true)}>
                            <Text style={styles.waterAddText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Exercise */}
                <TouchableOpacity
                    style={[styles.card, Shadows.small, styles.exerciseCard]}
                    onPress={() => router.push('/exercise-library')}
                >
                    <View style={styles.exerciseRow}>
                        <Text style={styles.exerciseIcon}>🏃</Text>
                        <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseTitle}>Exercise</Text>
                        </View>
                        <Text style={styles.exerciseValue}>0 / 45 min</Text>
                        <View style={styles.exerciseArrow}>
                            <Text style={styles.exerciseArrowText}>›</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Today's Meals */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Today's Meals</Text>
                    <Text style={styles.sectionSubtitle}>{Math.round(stats.totalCalories)} kcal total</Text>
                </View>

                {/* Breakfast Section */}
                <View style={styles.mealSection}>
                    <Text style={styles.mealSectionLabel}>BREAKFAST</Text>
                    {getMealsByType('BREAKFAST').length > 0 && (
                        <Text style={styles.mealSectionCalories}>
                            {getMealsByType('BREAKFAST').reduce((sum, m) => sum + m.calories, 0)} kcal
                        </Text>
                    )}
                </View>
                {getMealsByType('BREAKFAST').map(renderMealCard)}
                {getMealsByType('BREAKFAST').length === 0 && (
                    <TouchableOpacity
                        style={[styles.logMealCard, Shadows.small]}
                        onPress={() => router.push('/(tabs)/add')}
                    >
                        <Text style={styles.logMealText}>+ Log breakfast</Text>
                    </TouchableOpacity>
                )}

                {/* Lunch Section */}
                <View style={styles.mealSection}>
                    <Text style={styles.mealSectionLabel}>LUNCH</Text>
                    {getMealsByType('LUNCH').length > 0 && (
                        <Text style={styles.mealSectionCalories}>
                            {getMealsByType('LUNCH').reduce((sum, m) => sum + m.calories, 0)} kcal
                        </Text>
                    )}
                </View>
                {getMealsByType('LUNCH').map(renderMealCard)}
                {getMealsByType('LUNCH').length === 0 && (
                    <TouchableOpacity
                        style={[styles.logMealCard, Shadows.small]}
                        onPress={() => router.push('/(tabs)/add')}
                    >
                        <Text style={styles.logMealText}>+ Log lunch</Text>
                    </TouchableOpacity>
                )}

                {/* Dinner Section */}
                <View style={styles.mealSection}>
                    <Text style={styles.mealSectionLabel}>DINNER</Text>
                    {getMealsByType('DINNER').length > 0 && (
                        <Text style={styles.mealSectionCalories}>
                            {getMealsByType('DINNER').reduce((sum, m) => sum + m.calories, 0)} kcal
                        </Text>
                    )}
                </View>
                {getMealsByType('DINNER').map(renderMealCard)}
                {getMealsByType('DINNER').length === 0 && (
                    <TouchableOpacity
                        style={[styles.logMealCard, Shadows.small]}
                        onPress={() => router.push('/(tabs)/add')}
                    >
                        <Text style={styles.logMealText}>+ Log dinner</Text>
                    </TouchableOpacity>
                )}

                {/* Snack Section */}
                <View style={styles.mealSection}>
                    <Text style={styles.mealSectionLabel}>SNACK</Text>
                    {getMealsByType('SNACK').length > 0 && (
                        <Text style={styles.mealSectionCalories}>
                            {getMealsByType('SNACK').reduce((sum, m) => sum + m.calories, 0)} kcal
                        </Text>
                    )}
                </View>
                {getMealsByType('SNACK').map(renderMealCard)}
                {getMealsByType('SNACK').length === 0 && (
                    <TouchableOpacity
                        style={[styles.logMealCard, Shadows.small]}
                        onPress={() => router.push('/(tabs)/add')}
                    >
                        <Text style={styles.logMealText}>+ Log snack</Text>
                    </TouchableOpacity>
                )}

                <View style={{ height: 90 }} />
            </ScrollView>

            {/* Hydration Modal */}
            <Modal visible={showHydration} animationType="slide" transparent={false}>
                <SafeAreaView style={hStyles.container}>
                    {/* Header */}
                    <View style={hStyles.header}>
                        <TouchableOpacity onPress={() => setShowHydration(false)}>
                            <Text style={hStyles.backArrow}>←</Text>
                        </TouchableOpacity>
                        <View style={hStyles.headerCenter}>
                            <Text style={hStyles.title}>Add Hydration</Text>
                            <Text style={hStyles.subtitle}>Today, Feb 2, 2026</Text>
                        </View>
                        <View style={{ width: 24 }} />
                    </View>

                    {/* Drink Types */}
                    <View style={hStyles.drinkTypes}>
                        {drinkTypes.map((drink) => (
                            <TouchableOpacity
                                key={drink.id}
                                style={[hStyles.drinkItem, selectedDrink === drink.id && hStyles.drinkItemSelected]}
                                onPress={() => setSelectedDrink(drink.id)}
                            >
                                <View style={[hStyles.drinkCircle, selectedDrink === drink.id && hStyles.drinkCircleSelected]}>
                                    <Text style={hStyles.drinkEmoji}>{drink.emoji}</Text>
                                    {selectedDrink === drink.id && (
                                        <View style={hStyles.checkBadge}>
                                            <Text style={hStyles.checkText}>✓</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={[hStyles.drinkLabel, selectedDrink === drink.id && hStyles.drinkLabelSelected]}>
                                    {drink.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Water Glass Visualization */}
                    <View style={hStyles.glassArea}>
                        <View style={hStyles.glass}>
                            {/* Ruler: full-width horizontal lines, no labels */}
                            <View style={hStyles.rulerInner}>
                                {[200, 150, 100, 50].map((threshold, idx) => (
                                    <View key={idx} style={[
                                        hStyles.rulerLine,
                                        drinkAmount >= threshold ? hStyles.rulerLineActive : null
                                    ]} />
                                ))}
                            </View>
                            {/* Water fill */}
                            <View style={[hStyles.waterFill, { height: `${(drinkAmount / 250) * 100}%` }]} />
                        </View>
                    </View>

                    {/* Amount Controls */}
                    <View style={hStyles.controlsArea}>
                        <View style={hStyles.amountRow}>
                            <TouchableOpacity
                                style={hStyles.amountBtn}
                                onPress={() => setDrinkAmount(Math.max(50, drinkAmount - 50))}
                            >
                                <Text style={hStyles.amountBtnText}>—</Text>
                            </TouchableOpacity>
                            <View style={hStyles.amountDisplay}>
                                <Text style={hStyles.amountValue}>{drinkAmount} ml</Text>
                            </View>
                            <TouchableOpacity
                                style={[hStyles.amountBtn, hStyles.amountBtnPlus]}
                                onPress={() => setDrinkAmount(Math.min(250, drinkAmount + 50))}
                            >
                                <Text style={[hStyles.amountBtnText, hStyles.amountBtnPlusText]}>+</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Add Button */}
                        <TouchableOpacity style={hStyles.addBtn} onPress={addWater}>
                            <Text style={hStyles.addBtnIcon}>💧</Text>
                            <Text style={hStyles.addBtnText}>Add Drink</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

// Hydration modal styles
const hStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 8,
    },
    backArrow: { fontSize: 22, color: Colors.primary },
    headerCenter: { flex: 1, alignItems: 'center' },
    title: { fontSize: 17, fontWeight: '700', color: Colors.primary },
    subtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
    drinkTypes: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    drinkItem: { alignItems: 'center' },
    drinkCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F5F6F8',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    drinkCircleSelected: {
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: '#FFFFFF',
    },
    drinkEmoji: { fontSize: 24 },
    checkBadge: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
    drinkLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },
    drinkLabelSelected: { color: Colors.primary, fontWeight: '600' },
    drinkItemSelected: {},
    glassArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },
    glass: {
        width: 200,
        height: 240,
        borderRadius: 28,
        backgroundColor: '#E8F0FE',
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    waterFill: {
        backgroundColor: '#5BA3F5',
    },
    // ruler inside glass — full-width horizontal lines
    rulerInner: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        zIndex: 2,
    },
    rulerLine: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    rulerLineActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
    controlsArea: { paddingHorizontal: 20, paddingBottom: 24 },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
    },
    amountBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    amountBtnPlus: { backgroundColor: '#111111' },
    amountBtnText: { fontSize: 20, color: Colors.text, fontWeight: '400' },
    amountBtnPlusText: { color: '#FFFFFF' },
    amountDisplay: {
        backgroundColor: '#F5F6F8',
        borderRadius: 16,
        paddingHorizontal: 32,
        paddingVertical: 14,
    },
    amountValue: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    addBtn: {
        flexDirection: 'row',
        backgroundColor: '#111111',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    addBtnIcon: { fontSize: 18 },
    addBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#E8E8E8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: { fontSize: 18 },
    greeting: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    headerRight: { flexDirection: 'row', gap: 12 },
    statusDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#000000',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    headerIcon: { fontSize: 20 },
    monthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    monthText: { fontSize: 15, fontWeight: '600', color: Colors.text },
    streakBadge: {
        backgroundColor: '#FFF3E6',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    streakText: { fontSize: 12, color: Colors.streak, fontWeight: '600' },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    dayItem: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 12 },
    dayItemSelected: { backgroundColor: Colors.primary },
    dayLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginBottom: 3 },
    dayLabelSelected: { color: '#FFFFFF' },
    dayDate: { fontSize: 14, fontWeight: '700', color: Colors.text },
    dayDateSelected: { color: '#FFFFFF' },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginHorizontal: 16,
        padding: 16,
        marginBottom: 12,
    },
    calorieRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    calorieRing: { alignItems: 'center', justifyContent: 'center' },
    calorieRingOuter: {
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 8,
        borderColor: Colors.primary,
        borderBottomColor: '#E8E8E8',
        justifyContent: 'center',
        alignItems: 'center',
    },
    calorieRingInner: {
        alignItems: 'center',
    },
    fireEmoji: { fontSize: 16, marginBottom: 1 },
    calorieValue: { fontSize: 22, fontWeight: '800', color: Colors.primary },
    calorieLabel: { fontSize: 8, color: Colors.textSecondary, letterSpacing: 1.5, fontWeight: '600' },
    macros: { flex: 1, gap: 8 },
    macroRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    macroEmoji: { fontSize: 16 },
    macroInfo: { flex: 1 },
    macroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
    macroName: { fontSize: 12, fontWeight: '600', color: Colors.text },
    macroValue: { fontSize: 10, color: Colors.textSecondary },
    macroBarBg: { height: 5, backgroundColor: '#F0F0F0', borderRadius: 3 },
    macroBar: { height: 5, borderRadius: 3 },
    waterCard: { paddingVertical: 14 },
    waterRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    waterIcon: { fontSize: 22 },
    waterInfo: { flex: 1 },
    waterTitle: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 5 },
    waterBarBg: { height: 5, backgroundColor: '#E8F4FD', borderRadius: 3 },
    waterBar: { height: 5, backgroundColor: Colors.water, borderRadius: 3 },
    waterValue: { fontSize: 11, color: Colors.water, fontWeight: '600' },
    waterAdd: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    waterAddText: { fontSize: 16, color: Colors.text },
    exerciseCard: { paddingVertical: 14 },
    exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    exerciseIcon: { fontSize: 22 },
    exerciseInfo: { flex: 1 },
    exerciseTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
    exerciseValue: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
    exerciseArrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    exerciseArrowText: { fontSize: 20, color: Colors.text },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 10,
        marginTop: 8,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
    sectionSubtitle: { fontSize: 12, color: Colors.textSecondary },
    mealSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
    },
    mealSectionLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
    mealSectionCalories: { fontSize: 11, color: Colors.textSecondary },
    deleteAction: {
        backgroundColor: '#FFE5E5',
        justifyContent: 'center',
        alignItems: 'center',
        width: 70,
        borderRadius: 14,
        marginLeft: 8,
    },
    mealCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mealImage: {
        width: 52,
        height: 52,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mealEmoji: { fontSize: 26 },
    mealCardImg: { width: '100%', height: '100%', borderRadius: 12 },
    mealInfo: { flex: 1, justifyContent: 'center' },
    mealName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 4 },
    mealTime: { fontSize: 12, color: Colors.textSecondary },
    mealCalories: { fontSize: 13, fontWeight: '600', color: Colors.primary, marginLeft: 8 },
    logMealCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E8E8E8',
        borderStyle: 'dashed',
    },
    logMealText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
});
