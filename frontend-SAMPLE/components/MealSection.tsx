import React, { memo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Theme';
import { MealLog } from '../data/mockData';
import MealCard from './MealCard';

interface MealSectionProps {
    title: string;
    icon: string;
    meals: MealLog[];
    onAddMeal?: () => void;
    onMealPress?: (meal: MealLog) => void;
}

const MealSection = memo(function MealSection({
    title,
    icon,
    meals,
    onAddMeal,
    onMealPress,
}: MealSectionProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    const totalCalories = meals.reduce((sum, meal) => {
        const multiplier = meal.grams / meal.food.servingGrams;
        return sum + Math.round(meal.food.calories * multiplier);
    }, 0);

    return (
        <View style={styles.container}>
            {/* Header */}
            <Pressable
                style={styles.header}
                onPress={() => setIsExpanded(!isExpanded)}
            >
                <View style={styles.titleContainer}>
                    <Text style={styles.icon}>{icon}</Text>
                    <Text style={styles.title}>{title}</Text>
                    {meals.length > 0 && (
                        <Text style={styles.caloriesBadge}>{totalCalories} kcal</Text>
                    )}
                </View>
                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={Colors.textMedium}
                />
            </Pressable>

            {/* Content */}
            {isExpanded && (
                <View style={styles.content}>
                    {meals.length > 0 ? (
                        meals.map(meal => (
                            <MealCard
                                key={meal.id}
                                meal={meal}
                                onPress={() => onMealPress?.(meal)}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>🍽️</Text>
                            <Text style={styles.emptyText}>Chưa log {title.toLowerCase()}</Text>
                        </View>
                    )}

                    {/* Add meal button */}
                    <Pressable style={styles.addButton} onPress={onAddMeal}>
                        <Ionicons name="add" size={20} color={Colors.primary} />
                        <Text style={styles.addButtonText}>Add meal</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: Colors.primaryLight,
        marginBottom: 12,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    icon: {
        fontSize: 18,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textDark,
        fontFamily: 'Playfair Display',
    },
    caloriesBadge: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    content: {},
    emptyState: {
        alignItems: 'center',
        paddingVertical: 24,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        marginBottom: 12,
    },
    emptyIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textLight,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        backgroundColor: Colors.primaryLight,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary,
        borderStyle: 'dashed',
    },
    addButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
});

export default MealSection;
