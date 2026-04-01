import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TouchableWithoutFeedback, Modal, FlatList, Animated, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, TouchableOpacity as GHTouchableOpacity } from 'react-native-gesture-handler';
import { Colors, Shadows } from '../../src/constants/colors';
import { NotificationIcon, SettingsIcon, ProfileIcon } from '../../src/components/TabIcons';
import { drinkTypes } from '../../src/data/constants';
import { CalorieGauge } from '../../src/components/CalorieGauge';
import { useMealStore, Meal } from '../../src/store/mealStore';
import { getOnboardingData, getUserData, saveUserData } from '../../src/store/userStore';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';
import { getCurrentStreak } from '../../src/utils/streak';
import Svg, { Path } from 'react-native-svg';
import AnimatedTransitionText from '../../src/components/AnimatedTransitionText';
import StreakMilestoneModal from '../../src/components/StreakMilestoneModal';
import WeightCheckinModal from '../../src/components/WeightCheckinModal';
import AiAdjustmentModal from '../../src/components/AiAdjustmentModal';

const WEEKDAY_LABELS_BY_LANG: Record<'vi' | 'en', string[]> = {
    vi: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

const toIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fromIsoDate = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const addDaysToIso = (iso: string, days: number) => {
    const d = fromIsoDate(iso);
    d.setDate(d.getDate() + days);
    return toIsoDate(d);
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

export default function HomeScreen() {
    const router = useRouter();
    const { width: windowWidth } = useWindowDimensions();
    const flatListRef = useRef<FlatList>(null);

    const { t, language } = useAppLanguage();
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    const weekdayLabels = WEEKDAY_LABELS_BY_LANG[language];
    const todayIso = toIsoDate(new Date());

    useFocusEffect(
        useCallback(() => {
            // Only scroll to current week, but don't force select today
            // so the user stays on the date they were just logging for.
            flatListRef.current?.scrollToIndex({ index: 500, animated: true });
        }, [])
    );

    const [refreshing, setRefreshing] = useState(false);
    const [gender, setGender] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [dailyCalorieTarget, setDailyCalorieTarget] = useState(1800);
    const [showCaloriesEaten, setShowCaloriesEaten] = useState(true);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(startOfMonth(new Date()));
    const userEmail = useAuthStore((state) => state.email);
    const { unreadCount } = useNotificationStore();

    // Smart Notification Modal States
    const [showStreakModal, setShowStreakModal] = useState(false);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [userWeight, setUserWeight] = useState(65);
    const [lastWeight, setLastWeight] = useState(65);
    const [lastWeightUpdateDate, setLastWeightUpdateDate] = useState('');
    const [oldCalories, setOldCalories] = useState(1800);
    const [newCalories, setNewCalories] = useState(1800);
    const modalCheckedRef = useRef(false);

    // Meal store
    const {
        meals, activities, loadMeals, getMealsByDate, removeMeal,
        selectedDateStr: storeSelectedDateStr,
        setSelectedDateStr,
        setSelectedMealType,
        setAddMenuOpen,
    } = useMealStore();
    const selectedDateStr = storeSelectedDateStr || todayIso;
    const [stripBaseDateStr, setStripBaseDateStr] = useState(selectedDateStr);

    const hasAnyMeals = meals && meals.length > 0;
    const displayedMeals = getMealsByDate(selectedDateStr);
    const usedMealDates = useMemo(() => new Set(meals.map((meal) => meal.date)), [meals]);
    const currentStreak = useMemo(() => getCurrentStreak(usedMealDates, todayIso), [usedMealDates, todayIso]);

    const { caloriesByDate, burnedByDate, minutesByDate, earliestLogDate } = useMemo(() => {
        const eatenMap: Record<string, number> = {};
        const burnedMap: Record<string, number> = {};
        const minsMap: Record<string, number> = {};
        let minDate = todayIso;

        for (const meal of meals) {
            eatenMap[meal.date] = (eatenMap[meal.date] ?? 0) + meal.calories;
            if (meal.date < minDate) {
                minDate = meal.date;
            }
        }

        for (const act of activities || []) {
            burnedMap[act.date] = (burnedMap[act.date] ?? 0) + act.caloriesBurned;
            minsMap[act.date] = (minsMap[act.date] ?? 0) + act.durationMinutes;
            if (act.date < minDate) {
                minDate = act.date;
            }
        }

        return { caloriesByDate: eatenMap, burnedByDate: burnedMap, minutesByDate: minsMap, earliestLogDate: minDate };
    }, [meals, activities, todayIso]);

    const dateStrip = useMemo(() => {
        const baseDate = fromIsoDate(stripBaseDateStr);
        const dayOfWeek = (baseDate.getDay() + 6) % 7;
        const currentMonday = new Date(baseDate);
        currentMonday.setDate(baseDate.getDate() - dayOfWeek);

        const weeks = [];
        for (let weekOffset = -500; weekOffset <= 500; weekOffset++) {
            const week = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(currentMonday);
                d.setDate(currentMonday.getDate() + (weekOffset * 7) + i);
                week.push({
                    iso: toIsoDate(d),
                    weekdayIndex: i,
                    day: d.getDate(),
                });
            }
            weeks.push(week);
        }
        return weeks;
    }, [stripBaseDateStr]);

    const selectedDate = useMemo(() => fromIsoDate(selectedDateStr), [selectedDateStr]);
    const monthName = useMemo(
        () => selectedDate.toLocaleDateString(locale, { month: 'short', year: 'numeric' }).toUpperCase(),
        [locale, selectedDate]
    );

    const displayedDateLabel = useMemo(() => {
        return selectedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    }, [locale, selectedDate]);

    const greetingName = useMemo(() => {
        if (userName) return userName;
        if (!userEmail) return t('home.greetingFallback');
        const localPart = userEmail.split('@')[0];
        return localPart || t('home.greetingFallback');
    }, [t, userEmail, userName]);

    const mealTypeLabel = (type: Meal['type']) => {
        if (type === 'BREAKFAST') return t('home.mealType.breakfast');
        if (type === 'LUNCH') return t('home.mealType.lunch');
        if (type === 'DINNER') return t('home.mealType.dinner');
        return t('home.mealType.snack');
    };

    const swipeableRefs = useRef(new Map<string, any>());
    const openMealIdRef = useRef<string | null>(null);
    const swipeOpenedAtRef = useRef(0);

    const closeOpenRow = () => {
        if (openMealIdRef.current) {
            const ref = swipeableRefs.current.get(openMealIdRef.current);
            if (ref) ref.close();
            openMealIdRef.current = null;
            return true;
        }
        return false;
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await loadMeals();
        } finally {
            setRefreshing(false);
        }
    }, [loadMeals]);

    const withAutoClose = (action: () => void) => () => {
        if (closeOpenRow()) return;
        action();
    };

    const stats = displayedMeals.reduce(
        (acc, meal) => ({
            totalCalories: acc.totalCalories + meal.calories,
            totalProtein: acc.totalProtein + meal.protein,
            totalCarbs: acc.totalCarbs + meal.carbs,
            totalFat: acc.totalFat + meal.fat,
        }),
        { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
    );

    const calorieWindow = useMemo(() => {
        const dailyTarget = Math.max(0, Math.round(dailyCalorieTarget));
        const mealDates = Object.keys(caloriesByDate);

        if (!mealDates.length) {
            return {
                dailyTarget,
                effectiveTarget: dailyTarget,
                eaten: 0,
                left: dailyTarget,
                carryOverToNextDay: 0,
            };
        }

        const startDate = earliestLogDate;

        let carryOver = 0;
        let cursor = startDate;
        let effectiveTargetForSelected = dailyTarget;
        let eatenForSelected = 0;
        let leftForSelected = dailyTarget;

        while (cursor <= selectedDateStr) {
            const eaten = Math.round(caloriesByDate[cursor] ?? 0);
            const burned = Math.round(burnedByDate[cursor] ?? 0);

            const totalAllowance = dailyTarget + burned;
            const totalEatenIncludingDebt = eaten + carryOver;

            const left = Math.max(totalAllowance - totalEatenIncludingDebt, 0);
            const nextCarryOver = Math.max(totalEatenIncludingDebt - totalAllowance, 0);

            if (cursor === selectedDateStr) {
                effectiveTargetForSelected = totalAllowance;
                eatenForSelected = totalEatenIncludingDebt;
                leftForSelected = left;
            }

            carryOver = nextCarryOver;
            cursor = addDaysToIso(cursor, 1);
        }

        return {
            dailyTarget,
            effectiveTarget: effectiveTargetForSelected,
            eaten: eatenForSelected,
            left: leftForSelected,
            carryOverToNextDay: carryOver,
        };
    }, [caloriesByDate, burnedByDate, dailyCalorieTarget, selectedDateStr]);

    const maxCalories = Math.max(1, calorieWindow.effectiveTarget);
    const caloriesEaten = Math.round(calorieWindow.eaten);
    const caloriesLeft = Math.round(calorieWindow.left);
    const isCaloriesOver = !showCaloriesEaten && caloriesEaten > maxCalories;
    const overAmount = Math.round(caloriesEaten - maxCalories);
    const calorieGaugeValue = showCaloriesEaten
        ? `${caloriesEaten}/${maxCalories}`
        : isCaloriesOver ? `${overAmount}` : `${caloriesLeft}`;
    const calorieGaugeLabel = showCaloriesEaten
        ? t('home.caloriesEaten')
        : isCaloriesOver ? t('home.caloriesOver') : t('home.caloriesLeft');
    const calorieAccentColor = isCaloriesOver ? Colors.danger : undefined;

    // Macro Logic Calculation Helper
    const getMacroStatus = (current: number, max: number, labelName: string, defaultColor: string) => {
        const isOver = !showCaloriesEaten && current > max;
        const oAmount = Math.round(current - max);
        const lAmount = Math.round(max - current);

        const mainValue = showCaloriesEaten
            ? `${current}g`
            : isOver ? `${oAmount}g` : `${Math.max(0, lAmount)}g`;

        const maxValue = showCaloriesEaten ? `/${max}g` : undefined;

        const label = t(labelName);

        return {
            current,
            max,
            mainValue,
            maxValue,
            label,
            color: isOver ? Colors.danger : defaultColor
        };
    };

    // Dynamic Macro Splits (30% Protein, 40% Carbs, 30% Fat)
    const MACROS = useMemo(() => {
        const p = Math.round((dailyCalorieTarget * 0.3) / 4) || 140;
        const c = Math.round((dailyCalorieTarget * 0.4) / 4) || 280;
        const f = Math.round((dailyCalorieTarget * 0.3) / 9) || 75;
        return { p, c, f };
    }, [dailyCalorieTarget]);

    const protein = getMacroStatus(Math.round(stats.totalProtein), MACROS.p, 'home.protein', Colors.protein);
    const carbs = getMacroStatus(Math.round(stats.totalCarbs), MACROS.c, 'home.carbs', Colors.carbs);
    const fat = getMacroStatus(Math.round(stats.totalFat), MACROS.f, 'home.fat', Colors.fat);
    const [waterByDate, setWaterByDate] = useState<Record<string, number>>({});
    const waterMax = 2000;
    const waterCurrent = waterByDate[selectedDateStr] ?? 0;

    // Use actual calories burned from workout activities (goal: 400 kcal)
    const exerciseKcal = Math.round(burnedByDate[selectedDateStr] ?? 0);
    const exerciseKcalTarget = 400;

    // Load meals on mount
    useFocusEffect(
        useCallback(() => {
            loadMeals();
            const fetchUserData = async () => {
                const [onboarding, user] = await Promise.all([getOnboardingData(), getUserData()]);
                if (onboarding?.gender) {
                    setGender(onboarding.gender.toLowerCase());
                }
                if (user?.dailyCalories && Number.isFinite(user.dailyCalories)) {
                    setDailyCalorieTarget(Math.max(1, Math.round(user.dailyCalories)));
                }
                const name = onboarding?.name?.trim() || user?.name?.trim();
                if (name) {
                    setUserName(name);
                }
                if (user?.avatar_url) {
                    setAvatarUri(user.avatar_url);
                }
            };
            fetchUserData();
        }, [loadMeals])
    );

    // Smart Notification Modal trigger logic
    useFocusEffect(
        useCallback(() => {
            if (modalCheckedRef.current) return;
            modalCheckedRef.current = true;

            const checkModals = async () => {
                const [onboarding, user] = await Promise.all([getOnboardingData(), getUserData()]);
                const streak = user?.streak || 0;
                const weight = user?.weight || 65;
                const lastMilestoneShown = user?.lastMilestoneShown || 0;
                const lastUpdateStr = user?.lastWeightUpdate;

                setUserWeight(weight);
                setLastWeight(weight);

                // Calculate days since last weight update
                let daysSinceUpdate = 999;
                let updateDateLabel = 'chưa cập nhật';
                if (lastUpdateStr) {
                    const lastDate = new Date(lastUpdateStr);
                    const now = new Date();
                    daysSinceUpdate = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                    updateDateLabel = `${daysSinceUpdate} ngày trước`;
                }
                setLastWeightUpdateDate(updateDateLabel);

                // Check for streak milestones (7, 14, 21, 30, 60, 90)
                const milestones = [7, 14, 21, 30, 60, 90];
                const currentMilestone = milestones.reverse().find(m => streak >= m);
                if (currentMilestone && currentMilestone > lastMilestoneShown) {
                    setShowStreakModal(true);
                    await saveUserData({ lastMilestoneShown: currentMilestone });
                    return;
                }

                // Check if weight update is needed (Every Monday)
                const isMonday = new Date().getDay() === 1;
                const wasUpdatedToday = lastUpdateStr && toIsoDate(new Date(lastUpdateStr)) === todayIso;

                if (isMonday && !wasUpdatedToday) {
                    setShowWeightModal(true);
                }
            };

            // Delay to let the screen settle
            const timer = setTimeout(checkModals, 1500);
            return () => clearTimeout(timer);
        }, [])
    );

    // Handle weight save from WeightCheckinModal
    const handleWeightSave = async (newWeight: number) => {
        const todayStr = new Date().toISOString();
        const previousCalories = dailyCalorieTarget;

        // Save weight and update date
        await saveUserData({
            weight: newWeight,
            lastWeightUpdate: todayStr,
        });

        setShowWeightModal(false);

        // Recalculate TDEE and see if calories changed
        const onboarding = await getOnboardingData();
        if (onboarding) {
            const age = onboarding.age || 25;
            let bmr = (10 * newWeight) + (6.25 * onboarding.height) - (5 * age);
            if (onboarding.gender === 'male') {
                bmr += 5;
            } else {
                bmr -= 161;
            }

            const activityMultipliers: Record<string, number> = {
                sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, extreme: 1.9,
            };
            const tdee = bmr * (activityMultipliers[onboarding.activityLevel] || 1.2);

            let targetCalories = tdee;
            if (onboarding.goal === 'lose') {
                targetCalories = tdee - (onboarding.weightChangeSpeed * 1100);
                targetCalories = Math.max(1200, targetCalories);
            } else if (onboarding.goal === 'gain') {
                targetCalories = tdee + (onboarding.weightChangeSpeed * 1100);
            }
            const recalculated = Math.round(targetCalories);

            // If calories changed significantly (> 20 kcal diff), show AI Adjustment modal
            if (Math.abs(recalculated - previousCalories) > 20) {
                setOldCalories(previousCalories);
                setNewCalories(recalculated);
                // Small delay so the weight modal closes first
                setTimeout(() => setShowAiModal(true), 400);
            }
        }
    };

    // Handle AI adjustment accept
    const handleAiAccept = async () => {
        setDailyCalorieTarget(newCalories);
        await saveUserData({ dailyCalories: newCalories });
        setShowAiModal(false);
    };

    // Hydration modal state
    const [showHydration, setShowHydration] = useState(false);
    const [selectedDrink, setSelectedDrink] = useState('water');
    const [drinkAmount, setDrinkAmount] = useState(200);
    const drinkFillAnim = useRef(new Animated.Value(200)).current;

    const GLASS_H = 240;
    const addWater = () => {
        setWaterByDate((prev) => ({
            ...prev,
            [selectedDateStr]: Math.min((prev[selectedDateStr] ?? 0) + drinkAmount, waterMax),
        }));
        setShowHydration(false);
    };

    const openAddMenu = (mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK') => {
        setSelectedMealType(mealType);
        setAddMenuOpen(true);
    };


    useEffect(() => {
        Animated.timing(drinkFillAnim, {
            toValue: (drinkAmount / 250) * GLASS_H,
            duration: 180,
            useNativeDriver: false,
        }).start();
    }, [drinkAmount, drinkFillAnim]);

    const prevMonth = () => {
        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const monthPickerGrid = useMemo(() => {
        const year = calendarMonth.getFullYear();
        const month = calendarMonth.getMonth();
        const first = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayMondayBased = (first.getDay() + 6) % 7;

        const cells: Array<{ type: 'empty' } | { type: 'day'; iso: string; day: number }> = [];
        for (let i = 0; i < firstDayMondayBased; i++) {
            cells.push({ type: 'empty' });
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const d = new Date(year, month, day);
            cells.push({ type: 'day', iso: toIsoDate(d), day });
        }

        return cells;
    }, [calendarMonth]);

    // Group meals by type
    const getMealsByType = (type: Meal['type']) => {
        return displayedMeals.filter(meal => meal.type === type);
    };

    const renderRightActions = (mealId: string) => {
        return (
            <GHTouchableOpacity
                style={[styles.deleteAction, { height: '100%' }]}
                onPress={() => {
                    removeMeal(mealId);
                    const ref = swipeableRefs.current.get(mealId);
                    if (ref) ref.close();
                    if (openMealIdRef.current === mealId) {
                        openMealIdRef.current = null;
                    }
                }}
            >
                <Text style={styles.deleteActionText}>Delete</Text>
            </GHTouchableOpacity>
        );
    };

    const renderMealPressable = (meal: Meal) => {
        const displayMealName = language === 'vi' ? (meal.name_vi || meal.name) : (meal.name_en || meal.name);
        return (
            <TouchableOpacity
                style={[styles.mealCard, Shadows.small, { marginHorizontal: 0, marginBottom: 0 }]}
                onPress={() => {
                    // Ignore accidental tap generated right after a swipe release on web.
                    if (Date.now() - swipeOpenedAtRef.current < 300) {
                        return;
                    }
                    if (openMealIdRef.current) {
                        return;
                    }

                    router.push({
                        pathname: '/food-detail',
                        params: {
                            foodData: JSON.stringify({
                                name: meal.name,
                                name_vi: meal.name_vi,
                                name_en: meal.name_en,
                                calories: meal.calories,
                                protein: meal.protein,
                                carbs: meal.carbs,
                                fat: meal.fat,
                                servingSize: meal.servingSize,
                                ingredients: meal.ingredients,
                            }),
                            source: 'meal',
                            mealId: meal.id,
                            image: meal.image,
                        }
                    });
                }}
            >
                <View style={styles.mealImage}>
                    {meal.image && (meal.image.startsWith('file://') || meal.image.startsWith('http') || meal.image.length > 30) ? (
                        <Image source={{ uri: meal.image }} style={styles.mealCardImg} contentFit="cover" />
                    ) : (
                        <Text style={styles.mealEmoji}>{(!meal.image || meal.image.length > 10) ? '🍽️' : meal.image}</Text>
                    )}
                </View>
                <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{displayMealName}</Text>
                    <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
            </TouchableOpacity>
        );
    };

    const renderMealCard = (meal: Meal) => {
        const canQuickDelete = true;

        if (!canQuickDelete) {
            return (
                <View key={meal.id} style={{ marginHorizontal: 16, marginBottom: 8 }}>
                    {renderMealPressable(meal)}
                </View>
            );
        }

        return (
            <Swipeable
                key={meal.id}
                rightThreshold={10}
                overshootRight={false}
                ref={(ref) => {
                    if (ref) swipeableRefs.current.set(meal.id, ref);
                    else swipeableRefs.current.delete(meal.id);
                }}
                onSwipeableOpen={(direction) => {
                    if (direction === 'right') {
                        openMealIdRef.current = meal.id;
                        swipeOpenedAtRef.current = Date.now();
                    }
                }}
                onSwipeableWillOpen={() => {
                    if (openMealIdRef.current && openMealIdRef.current !== meal.id) {
                        const prevRef = swipeableRefs.current.get(openMealIdRef.current);
                        if (prevRef) prevRef.close();
                    }
                    openMealIdRef.current = meal.id;
                }}
                onSwipeableWillClose={() => {
                    if (openMealIdRef.current === meal.id) {
                        openMealIdRef.current = null;
                    }
                }}
                renderRightActions={() => renderRightActions(meal.id)}
                containerStyle={{ marginHorizontal: 16, marginBottom: 8 }}
            >
                {renderMealPressable(meal)}
            </Swipeable>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={{ flex: 1 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity style={styles.avatar} onPress={withAutoClose(() => router.push('/profile'))}>
                                {avatarUri ? (
                                    <Image source={{ uri: avatarUri }} style={styles.avatarIcon} />
                                ) : gender === 'male' ? (
                                    <Image source={require('../../assets/images/male.png')} style={styles.avatarIcon} />
                                ) : gender === 'female' ? (
                                    <Image source={require('../../assets/images/female.png')} style={styles.avatarIcon} />
                                ) : (
                                    <ProfileIcon size={20} color="#000" />
                                )}
                                <View style={styles.statusDot} />
                            </TouchableOpacity>
                            <Text style={styles.greeting}>{t('home.greeting', { name: greetingName })}</Text>
                        </View>
                        <View style={styles.headerRight}>
                            <TouchableOpacity style={{ position: 'relative' }} onPress={withAutoClose(() => router.push('/notifications'))}>
                                <NotificationIcon size={20} color="#000" />
                                {unreadCount > 0 && <View style={styles.notificationBadge} />}
                            </TouchableOpacity>
                            {/* Settings icon removed as requested */}
                        </View>
                    </View>

                    {/* Month & Streak */}
                    <View style={styles.monthRow}>
                        <TouchableOpacity
                            style={styles.monthDropdown}
                            onPress={withAutoClose(() => {
                                setCalendarMonth(startOfMonth(selectedDate));
                                setShowMonthPicker(true);
                            })}
                        >
                            <Text style={styles.monthText}>{monthName} ▾</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.streakBadge} onPress={withAutoClose(() => router.push('/achievements'))}>
                            <Text style={styles.streakText}>{t('home.streakDays', { count: currentStreak })} 🔥</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Sliding Date Strip */}
                    <FlatList
                        ref={flatListRef}
                        data={dateStrip}
                        keyExtractor={(week) => week[0].iso}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        initialScrollIndex={500}
                        getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
                        renderItem={({ item: week }: { item: { iso: string; weekdayIndex: number; day: number }[] }) => (
                            <View style={[styles.weekContainer, { width: windowWidth }]}>
                                {week.map(item => {
                                    const isSelected = item.iso === selectedDateStr;
                                    const isPast = item.iso < todayIso;
                                    const isToday = item.iso === todayIso;
                                    const isAfterOrOnStart = item.iso >= earliestLogDate;

                                    let ringStyle = {};
                                    if (isPast && isAfterOrOnStart) {
                                        const eaten = caloriesByDate[item.iso];
                                        if (eaten === undefined) {
                                            ringStyle = styles.dayRingDashed;
                                        } else {
                                            const excess = eaten - dailyCalorieTarget;
                                            if (excess <= 100) {
                                                ringStyle = styles.dayRingGreen;
                                            } else if (excess <= 200) {
                                                ringStyle = styles.dayRingYellow;
                                            } else {
                                                ringStyle = styles.dayRingRed;
                                            }
                                        }
                                    }

                                    return (
                                        <View key={item.iso} style={styles.dayContainer}>
                                            <View style={[styles.dayRingWrapper, ringStyle]}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.dayItem,
                                                        isSelected && styles.dayItemSelected,
                                                        !isSelected && isToday && styles.dayItemToday,
                                                    ]}
                                                    onPress={withAutoClose(() => setSelectedDateStr(item.iso))}
                                                >
                                                    <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                                                        {weekdayLabels[item.weekdayIndex]}
                                                    </Text>
                                                    <Text style={[styles.dayDate, isSelected && styles.dayDateSelected]}>
                                                        {item.day}
                                                    </Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    />

                    {/* Calorie Card */}
                    <View style={[styles.card, Shadows.medium]}>
                        {/* Calorie Ring */}
                        <TouchableOpacity
                            activeOpacity={0.85}
                            style={styles.calorieRingWrapper}
                            onPress={withAutoClose(() => setShowCaloriesEaten((prev) => !prev))}
                        >
                            <CalorieGauge
                                current={showCaloriesEaten ? caloriesEaten : (isCaloriesOver ? maxCalories : caloriesLeft)}
                                max={maxCalories}
                                size={120}
                                strokeWidth={10}
                                displayValue={calorieGaugeValue}
                                label={calorieGaugeLabel}
                                accentColor={calorieAccentColor}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Macro Mini-Ring Grid (Standalone Cards) */}
                    <View style={styles.macroGrid}>
                        {/* Protein */}
                        <TouchableOpacity
                            style={[styles.macroGridItem, Shadows.small]}
                            activeOpacity={0.85}
                            onPress={withAutoClose(() => setShowCaloriesEaten((prev) => !prev))}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                                <AnimatedTransitionText text={protein.mainValue} style={[styles.macroGridValue, protein.current > protein.max && !showCaloriesEaten ? { color: Colors.danger } : {}]} direction="down" />
                                {protein.maxValue && <Text style={styles.macroGridValueMax}>{protein.maxValue}</Text>}
                            </View>
                            <AnimatedTransitionText text={protein.label} style={styles.macroGridLabel} />
                            <View style={styles.macroRingWrap}>
                                <Svg width={44} height={44} viewBox="0 0 52 52">
                                    <Path d={`M 26 4 A 22 22 0 1 1 25.999 4`} fill="none" stroke="#F0F0F0" strokeWidth={5} strokeLinecap="round" />
                                    {(showCaloriesEaten ? (protein.current > 0) : true) && (
                                        <Path
                                            d={(() => {
                                                const r = 22; const cx = 26; const cy = 26;
                                                const isOver = !showCaloriesEaten && protein.current > protein.max;
                                                const circleVal = showCaloriesEaten ? protein.current : (isOver ? protein.max : Math.max(0, protein.max - protein.current));
                                                const prog = Math.min(circleVal / protein.max, 1);
                                                const arc = 359.9 * prog;
                                                const s = { x: cx, y: cy - r };
                                                const e = { x: cx + r * Math.sin(arc * Math.PI / 180), y: cy - r * Math.cos(arc * Math.PI / 180) };
                                                return `M ${s.x} ${s.y} A ${r} ${r} 0 ${arc > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
                                            })()}
                                            fill="none" stroke={protein.color} strokeWidth={5} strokeLinecap="round"
                                        />
                                    )}
                                </Svg>
                                <Text style={styles.macroRingEmoji}>🥩</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Carbs */}
                        <TouchableOpacity
                            style={[styles.macroGridItem, Shadows.small]}
                            activeOpacity={0.85}
                            onPress={withAutoClose(() => setShowCaloriesEaten((prev) => !prev))}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                                <AnimatedTransitionText text={carbs.mainValue} style={[styles.macroGridValue, carbs.current > carbs.max && !showCaloriesEaten ? { color: Colors.danger } : {}]} direction="down" />
                                {carbs.maxValue && <Text style={styles.macroGridValueMax}>{carbs.maxValue}</Text>}
                            </View>
                            <AnimatedTransitionText text={carbs.label} style={styles.macroGridLabel} />
                            <View style={styles.macroRingWrap}>
                                <Svg width={44} height={44} viewBox="0 0 52 52">
                                    <Path d={`M 26 4 A 22 22 0 1 1 25.999 4`} fill="none" stroke="#F0F0F0" strokeWidth={5} strokeLinecap="round" />
                                    {(showCaloriesEaten ? (carbs.current > 0) : true) && (
                                        <Path
                                            d={(() => {
                                                const r = 22; const cx = 26; const cy = 26;
                                                const isOver = !showCaloriesEaten && carbs.current > carbs.max;
                                                const circleVal = showCaloriesEaten ? carbs.current : (isOver ? carbs.max : Math.max(0, carbs.max - carbs.current));
                                                const prog = Math.min(circleVal / carbs.max, 1);
                                                const arc = 359.9 * prog;
                                                const s = { x: cx, y: cy - r };
                                                const e = { x: cx + r * Math.sin(arc * Math.PI / 180), y: cy - r * Math.cos(arc * Math.PI / 180) };
                                                return `M ${s.x} ${s.y} A ${r} ${r} 0 ${arc > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
                                            })()}
                                            fill="none" stroke={carbs.color} strokeWidth={5} strokeLinecap="round"
                                        />
                                    )}
                                </Svg>
                                <Text style={styles.macroRingEmoji}>🍞</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Fat */}
                        <TouchableOpacity
                            style={[styles.macroGridItem, Shadows.small]}
                            activeOpacity={0.85}
                            onPress={withAutoClose(() => setShowCaloriesEaten((prev) => !prev))}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' }}>
                                <AnimatedTransitionText text={fat.mainValue} style={[styles.macroGridValue, fat.current > fat.max && !showCaloriesEaten ? { color: Colors.danger } : {}]} direction="down" />
                                {fat.maxValue && <Text style={styles.macroGridValueMax}>{fat.maxValue}</Text>}
                            </View>
                            <AnimatedTransitionText text={fat.label} style={styles.macroGridLabel} />
                            <View style={styles.macroRingWrap}>
                                <Svg width={44} height={44} viewBox="0 0 52 52">
                                    <Path d={`M 26 4 A 22 22 0 1 1 25.999 4`} fill="none" stroke="#F0F0F0" strokeWidth={5} strokeLinecap="round" />
                                    {(showCaloriesEaten ? (fat.current > 0) : true) && (
                                        <Path
                                            d={(() => {
                                                const r = 22; const cx = 26; const cy = 26;
                                                const isOver = !showCaloriesEaten && fat.current > fat.max;
                                                const circleVal = showCaloriesEaten ? fat.current : (isOver ? fat.max : Math.max(0, fat.max - fat.current));
                                                const prog = Math.min(circleVal / fat.max, 1);
                                                const arc = 359.9 * prog;
                                                const s = { x: cx, y: cy - r };
                                                const e = { x: cx + r * Math.sin(arc * Math.PI / 180), y: cy - r * Math.cos(arc * Math.PI / 180) };
                                                return `M ${s.x} ${s.y} A ${r} ${r} 0 ${arc > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
                                            })()}
                                            fill="none" stroke={fat.color} strokeWidth={5} strokeLinecap="round"
                                        />
                                    )}
                                </Svg>
                                <Text style={styles.macroRingEmoji}>🧈</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Quick Metrics Row: Water + Exercise side by side */}
                    <View style={styles.metricsRow}>
                        {/* Water Card */}
                        <View style={[styles.metricCard, Shadows.small]}>
                            <View style={styles.metricCardHeader}>
                                <View style={[styles.metricIconBg, { backgroundColor: '#EBF3FB' }]}>
                                    <Text style={styles.metricIconText}>💧</Text>
                                </View>
                                <TouchableOpacity style={styles.metricAddBtn} onPress={withAutoClose(() => setShowHydration(true))}>
                                    <Text style={styles.metricAddBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.metricCardBody}>
                                <Text style={styles.metricCardTitle} numberOfLines={1} adjustsFontSizeToFit>{t('home.waterIntake')}</Text>
                                <Text style={styles.metricCardSubtitle}>{waterCurrent}/{waterMax}ml</Text>
                            </View>
                            <View style={styles.metricBarBg}>
                                <View style={[styles.metricBar, { width: `${Math.min((waterCurrent / waterMax) * 100, 100)}%`, backgroundColor: Colors.water }]} />
                            </View>
                        </View>

                        {/* Exercise Card */}
                        <TouchableOpacity
                            style={[styles.metricCard, Shadows.small]}
                            onPress={withAutoClose(() => router.push('/exercise-library'))}
                            activeOpacity={0.85}
                        >
                            <View style={styles.metricCardHeader}>
                                <View style={[styles.metricIconBg, { backgroundColor: '#FFF3E6' }]}>
                                    <Text style={styles.metricIconText}>🏃</Text>
                                </View>
                                <Text style={styles.metricChevron}>›</Text>
                            </View>
                            <View style={styles.metricCardBody}>
                                <Text style={styles.metricCardTitle} numberOfLines={1} adjustsFontSizeToFit>{t('home.exercise')}</Text>
                                <Text style={styles.metricCardSubtitle}>{exerciseKcal}/{exerciseKcalTarget} kcal</Text>
                            </View>
                            <View style={styles.metricBarBg}>
                                <View style={[styles.metricBar, { width: `${Math.min((exerciseKcal / exerciseKcalTarget) * 100, 100)}%`, backgroundColor: Colors.streak }]} />
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Today's Meals */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>{t('home.meals')}</Text>
                        <Text style={styles.sectionSubtitle}>{Math.round(stats.totalCalories)} {t('home.kcalTotal')}</Text>
                    </View>

                    {/* Breakfast Section */}
                    <View style={styles.mealSection}>
                        <Text style={styles.mealSectionLabel}>{mealTypeLabel('BREAKFAST')}</Text>
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
                            onPress={withAutoClose(() => openAddMenu('BREAKFAST'))}
                        >
                            <Text style={styles.logMealText}>{t('home.logMeal.breakfast')}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Lunch Section */}
                    <View style={styles.mealSection}>
                        <Text style={styles.mealSectionLabel}>{mealTypeLabel('LUNCH')}</Text>
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
                            onPress={withAutoClose(() => openAddMenu('LUNCH'))}
                        >
                            <Text style={styles.logMealText}>{t('home.logMeal.lunch')}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Dinner Section */}
                    <View style={styles.mealSection}>
                        <Text style={styles.mealSectionLabel}>{mealTypeLabel('DINNER')}</Text>
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
                            onPress={withAutoClose(() => openAddMenu('DINNER'))}
                        >
                            <Text style={styles.logMealText}>{t('home.logMeal.dinner')}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Snack Section */}
                    <View style={styles.mealSection}>
                        <Text style={styles.mealSectionLabel}>{mealTypeLabel('SNACK')}</Text>
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
                            onPress={withAutoClose(() => openAddMenu('SNACK'))}
                        >
                            <Text style={styles.logMealText}>{t('home.logMeal.snack')}</Text>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: 90 }} />
                </View>
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
                            <Text style={hStyles.title}>{t('home.addHydration')}</Text>
                            <Text style={hStyles.subtitle}>{displayedDateLabel}</Text>
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
                            <View style={hStyles.tapZonesOverlay}>
                                {[250, 200, 150, 100, 50].map((amount) => (
                                    <TouchableOpacity
                                        key={amount}
                                        style={[
                                            hStyles.tapZone,
                                            drinkAmount >= amount && hStyles.tapZoneActive,
                                        ]}
                                        activeOpacity={1}
                                        onPress={() => setDrinkAmount(amount)}
                                    />
                                ))}
                            </View>
                            {/* Ruler: full-width horizontal lines, no labels */}
                            <View style={hStyles.rulerInner} pointerEvents="none">
                                {[200, 150, 100, 50].map((threshold, idx) => (
                                    <View key={idx} style={[
                                        hStyles.rulerLine,
                                        drinkAmount >= threshold ? hStyles.rulerLineActive : null
                                    ]} />
                                ))}
                            </View>
                            {/* Water fill */}
                            <Animated.View pointerEvents="none" style={[hStyles.waterFill, { height: drinkFillAnim }]} />
                        </View>
                        <Text style={hStyles.glassHint}>{t('home.tapToSetAmount')}</Text>
                    </View>

                    {/* Amount Controls */}
                    <View style={hStyles.controlsArea}>
                        <View style={hStyles.amountRow}>
                            <TouchableOpacity
                                style={hStyles.amountBtn}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                onPress={() => setDrinkAmount(Math.max(50, drinkAmount - 50))}
                            >
                                <Text style={hStyles.amountBtnText}>—</Text>
                            </TouchableOpacity>
                            <View style={hStyles.amountDisplay}>
                                <Text style={hStyles.amountValue}>{drinkAmount} ml</Text>
                            </View>
                            <TouchableOpacity
                                style={[hStyles.amountBtn, hStyles.amountBtnPlus]}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                onPress={() => setDrinkAmount(Math.min(250, drinkAmount + 50))}
                            >
                                <Text style={[hStyles.amountBtnText, hStyles.amountBtnPlusText]}>+</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Add Button */}
                        <TouchableOpacity style={hStyles.addBtn} onPress={addWater}>
                            <Text style={hStyles.addBtnIcon}>💧</Text>
                            <Text style={hStyles.addBtnText}>{t('home.addDrink')}</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Month Picker */}
            <Modal visible={showMonthPicker} animationType="fade" transparent>
                <TouchableWithoutFeedback onPress={() => setShowMonthPicker(false)}>
                    <View style={styles.calendarBackdrop}>
                        <TouchableWithoutFeedback>
                            <View style={styles.calendarCard}>
                                <View style={styles.calendarHeader}>
                                    <TouchableOpacity onPress={prevMonth} style={styles.calendarNavBtn}>
                                        <Text style={styles.calendarNavText}>‹</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.calendarHeaderTitle}>
                                        {calendarMonth.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                                    </Text>
                                    <TouchableOpacity onPress={nextMonth} style={styles.calendarNavBtn}>
                                        <Text style={styles.calendarNavText}>›</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.calendarWeekHeader}>
                                    {weekdayLabels.map((d, index) => (
                                        <Text key={`${d}-${index}`} style={styles.calendarWeekLabel}>{d}</Text>
                                    ))}
                                </View>

                                <View style={styles.calendarGrid}>
                                    {monthPickerGrid.map((cell, index) => {
                                        if (cell.type === 'empty') {
                                            return <View key={`e-${index}`} style={styles.calendarCell} />;
                                        }

                                        const isSelected = cell.iso === selectedDateStr;
                                        const isPast = cell.iso < todayIso;
                                        const isToday = cell.iso === todayIso;

                                        return (
                                            <TouchableOpacity
                                                key={cell.iso}
                                                style={[
                                                    styles.calendarCell,
                                                    styles.calendarDay,
                                                    isSelected && styles.calendarDaySelected,
                                                    !isSelected && isToday && styles.calendarDayToday,
                                                ]}
                                                onPress={() => {
                                                    setSelectedDateStr(cell.iso);
                                                    setStripBaseDateStr(cell.iso);
                                                    setShowMonthPicker(false);
                                                    setTimeout(() => {
                                                        flatListRef.current?.scrollToIndex({ index: 500, animated: true });
                                                    }, 100);
                                                }}
                                            >
                                                <Text
                                                    style={[
                                                        styles.calendarDayText,
                                                        isSelected && styles.calendarDayTextSelected,
                                                        !isSelected && isPast && styles.calendarDayTextPast,
                                                    ]}
                                                >
                                                    {cell.day}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

            {/* Smart Notification Modals */}
            <StreakMilestoneModal
                visible={showStreakModal}
                streak={currentStreak}
                userName={greetingName}
                onUpdateWeight={() => {
                    setShowStreakModal(false);
                    setTimeout(() => setShowWeightModal(true), 300);
                }}
                onDismiss={() => setShowStreakModal(false)}
            />

            <WeightCheckinModal
                visible={showWeightModal}
                currentWeight={userWeight}
                lastWeight={lastWeight}
                lastUpdateDate={lastWeightUpdateDate}
                onSave={handleWeightSave}
                onDismiss={() => setShowWeightModal(false)}
            />

            <AiAdjustmentModal
                visible={showAiModal}
                oldCalories={oldCalories}
                newCalories={newCalories}
                onAccept={handleAiAccept}
                onDismiss={() => setShowAiModal(false)}
            />

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
    tapZonesOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 4,
    },
    tapZone: {
        flex: 1,
        width: '100%',
    },
    tapZoneActive: {
        backgroundColor: '#2F80ED',
    },
    waterFill: {
        backgroundColor: '#5BA3F5',
    },
    glassHint: {
        marginTop: 12,
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '500',
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
        height: 2,
        backgroundColor: 'rgba(47, 128, 237, 0.08)',
    },
    rulerLineActive: { backgroundColor: '#2F80ED' },
    controlsArea: { paddingHorizontal: 20, paddingBottom: 24, position: 'relative', zIndex: 3, elevation: 3 },
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
    avatarIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
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
    notificationBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.danger,
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
    monthDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakBadge: {
        backgroundColor: '#FFF3E6',
        borderRadius: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    streakText: { fontSize: 12, color: Colors.streak, fontWeight: '600' },
    weekContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    dayContainer: {
        flex: 1,
        alignItems: 'center',
    },
    dayItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        width: 46,
        borderRadius: 12,
    },
    dayRingWrapper: {
        borderRadius: 14,
        padding: 2,
        borderWidth: 1.5,
        borderColor: 'transparent',
    },
    dayRingDashed: {
        borderColor: '#9CA3AF',
        borderStyle: 'dashed',
    },
    dayRingGreen: {
        borderColor: '#10B981',
    },
    dayRingYellow: {
        borderColor: '#F59E0B',
    },
    dayRingRed: {
        borderColor: '#EF4444',
    },
    dayItemToday: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
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
        backgroundColor: '#FF3B30',
        justifyContent: 'center',
        alignItems: 'center',
        width: 92,
        borderRadius: 14,
        marginLeft: 8,
    },
    deleteActionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    mealCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 0,
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
        overflow: 'hidden',
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
    addMethodBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 90,
    },
    addMethodPopup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 20,
        width: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    addMethodHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    addMethodTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    addMethodCloseBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addMethodOptionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    addMethodOptionCard: {
        flex: 1,
        backgroundColor: '#F7F8FA',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 6,
    },
    addMethodOptionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EDEDEF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    addMethodOptionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    addMethodOptionDesc: {
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
    },
    calendarBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.28)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    calendarCard: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        padding: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    calendarNavBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
    },
    calendarNavText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    calendarHeaderTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.text,
    },
    calendarWeekHeader: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    calendarWeekLabel: {
        flex: 1,
        textAlign: 'center',
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    calendarCell: {
        width: '14.2857%',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 3,
    },
    calendarDay: {
        height: 36,
        borderRadius: 10,
    },
    calendarDayToday: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
    },
    calendarDaySelected: {
        backgroundColor: Colors.primary,
    },
    calendarDayText: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '600',
    },
    calendarDayTextSelected: {
        color: '#FFFFFF',
    },
    calendarDayTextPast: {
        color: '#9CA3AF',
    },

    // ── Redesigned Calorie Card ─────────────────────────────────────────────
    calorieRingWrapper: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    macroGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 12,
    },
    macroGridItem: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
        gap: 6,
    },
    macroRingWrap: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginTop: 4,
    },
    macroRingEmoji: {
        position: 'absolute',
    },
    macroGridLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#A0A0A0',
        textTransform: 'none',
    },
    macroGridValue: {
        fontSize: 16,
        fontWeight: '800',
        color: Colors.text,
    },
    macroGridValueMax: {
        fontSize: 12,
        fontWeight: '600',
        color: '#A0A0A0',
        marginLeft: 2,
    },

    // ── Quick Metrics Row (Water + Exercise) ───────────────────────────────
    metricsRow: {
        flexDirection: 'row',
        gap: 12,
        marginHorizontal: 16,
        marginBottom: 16,
    },
    metricCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        gap: 10,
    },
    metricCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metricIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricIconText: {
        fontSize: 20,
    },
    metricAddBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F1F4F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    metricAddBtnText: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
        lineHeight: 20,
    },
    metricCardBody: {
        gap: 2,
    },
    metricCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.text,
    },
    metricCardSubtitle: {
        fontSize: 11,
        fontWeight: '500',
        color: '#999',
    },
    metricBarBg: {
        width: '100%',
        height: 6,
        backgroundColor: '#F0F0F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    metricBar: {
        height: '100%',
        borderRadius: 3,
    },
    metricChevron: {
        fontSize: 22,
        color: '#BBBBBB',
        fontWeight: '300',
    },
});
