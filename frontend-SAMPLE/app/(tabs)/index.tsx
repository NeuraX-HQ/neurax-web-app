import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Colors, Shadows, BorderRadius, Spacing } from '../../constants/Theme';
import MacroRing from '../../components/MacroRing';
import CalendarStrip from '../../components/CalendarStrip';
import AICoachCard from '../../components/AICoachCard';
import MealSection from '../../components/MealSection';
import ChallengeCard from '../../components/ChallengeCard';
import MicroCommitmentCard from '../../components/MicroCommitmentCard';
import WaterIntakeCard from '../../components/WaterIntakeCard';
import AIBaoFAB from '../../components/AIBaoFAB';


export default function HomeScreen() {
  const { user } = useAuth();
  const {
    todaysMeals,
    todaysMacros,
    macroTargets,
    currentStreak,
    weekData,
    challenges,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Group meals by type
  const mealsByType = useMemo(() => {
    const grouped = {
      breakfast: todaysMeals.filter(m => m.mealType === 'breakfast'),
      lunch: todaysMeals.filter(m => m.mealType === 'lunch'),
      dinner: todaysMeals.filter(m => m.mealType === 'dinner'),
    };
    return grouped;
  }, [todaysMeals]);

  // Format date for header
  const formatDate = () => {
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
    return `📅 ${dateStr}`;
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Header - Greeting + Icons */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingTitle}>{getGreeting()}, {user?.name || 'Guest'}</Text>
            <Text style={styles.greetingSubtitle}>Let's keep the momentum going.</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={24} color={Colors.textDark} />
              <View style={styles.notificationBadge} />
            </Pressable>
            <Image
              source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100' }}
              style={styles.avatar}
            />
          </View>
        </View>

        {/* Date + Streak Row */}
        <View style={styles.dateStreakRow}>
          <Text style={styles.dateLabel}>{formatDate()}</Text>
          <View style={styles.streakPill}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{currentStreak} Day Streak</Text>
          </View>
        </View>

        {/* Calendar Strip */}
        <CalendarStrip
          weekData={weekData}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          streak={currentStreak}
        />

        {/* Macro Rings - Matches Home_style_style_reference.html layout */}
        <View style={styles.macrosGrid}>
          {/* Primary - Calories */}
          <View style={styles.macroPrimary}>
            <MacroRing
              value={todaysMacros.calories}
              max={macroTargets.calories}
              color={Colors.calories}
              label="Calories"
              unit=""
              size="large"
            />
          </View>

          {/* Secondary Column 1 - Protein & Carbs */}
          <View style={styles.macroColumn}>
            <View style={styles.macroSecondary}>
              <MacroRing
                value={todaysMacros.protein}
                max={macroTargets.protein}
                color={Colors.protein}
                label="Protein"
                unit="g"
                size="small"
              />
            </View>
            <View style={styles.macroSecondary}>
              <MacroRing
                value={todaysMacros.carbs}
                max={macroTargets.carbs}
                color={Colors.carbs}
                label="Carbs"
                unit="g"
                size="small"
              />
            </View>
          </View>

          {/* Secondary Column 2 - Fat & Steps */}
          <View style={styles.macroColumn}>
            <View style={styles.macroSecondary}>
              <MacroRing
                value={todaysMacros.fat}
                max={macroTargets.fat}
                color={Colors.fat}
                label="Fat"
                unit="g"
                size="small"
              />
            </View>
            <View style={styles.macroSecondarySteps}>
              <Text style={styles.stepsEmoji}>🚶</Text>
              <Text style={styles.stepsValue}>8.2k</Text>
              <Text style={styles.stepsLabel}>Steps</Text>
            </View>
          </View>
        </View>

        {/* AI Coach Card */}
        <AICoachCard
          type={todaysMacros.protein > 40 ? 'praise' : 'morning'}
          onAskBao={() => { }}
          onDismiss={() => { }}
        />

        {/* Meal Sections */}
        <MealSection
          title="Breakfast"
          icon="🌅"
          meals={mealsByType.breakfast}
          onAddMeal={() => { }}
        />
        <MealSection
          title="Lunch"
          icon="☀️"
          meals={mealsByType.lunch}
          onAddMeal={() => { }}
        />
        <MealSection
          title="Dinner"
          icon="🌙"
          meals={mealsByType.dinner}
          onAddMeal={() => { }}
        />

        {/* Active Challenges Preview */}
        {challenges.length > 0 && (
          <View style={styles.challengesPreview}>
            <View style={styles.challengesHeader}>
              <Text style={styles.sectionTitle}>Active Challenges</Text>
              <Pressable>
                <Text style={styles.seeAllText}>See all →</Text>
              </Pressable>
            </View>
            <ChallengeCard challenge={challenges[0]} />
          </View>
        )}

        {/* Today's Micro-Commitment */}
        <MicroCommitmentCard
          title="Today's Micro-Commitment"
          description="Drink one glass of water before each meal"
          completed={2}
          total={3}
          onCheckIn={() => { }}
        />

        {/* Water Intake */}
        <WaterIntakeCard
          current={1800}
          goal={2500}
          glassSize={250}
          onLogGlass={() => { }}
        />

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* AI Bảo FAB */}
      <AIBaoFAB onPress={() => { }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 16,
  },
  // Header - Date left, icons + avatar right
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: Colors.surface,
    ...Shadows.soft,
  },
  // Greeting Section
  greetingSection: {
    marginBottom: 16,
  },
  greetingTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.textDark,
    fontFamily: 'Playfair Display',
    marginBottom: 4,
    lineHeight: 34,
  },
  greetingSubtitle: {
    fontSize: 16,
    color: Colors.textMedium,
  },
  // Date + Streak Row
  dateStreakRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMedium,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    gap: 6,
    ...Shadows.soft,
  },
  streakEmoji: {
    fontSize: 14,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textDark,
  },
  // Macros Grid - Matches HTML reference layout
  macrosGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 32,
  },
  macroPrimary: {
    backgroundColor: Colors.surface,
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
    ...Shadows.soft,
  },
  macroColumn: {
    flex: 1,
    gap: 8,
  },
  macroSecondary: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  macroSecondarySteps: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  stepsEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  stepsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textDark,
  },
  stepsLabel: {
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 4,
  },
  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textDark,
    fontFamily: 'Playfair Display',
  },
  // Challenges Preview
  challengesPreview: {
    marginTop: 8,
  },
  challengesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
});
