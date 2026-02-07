import React, { memo, useCallback } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/Theme';
import { MealLog } from '../data/mockData';

interface MealCardProps {
    meal: MealLog;
    onPress?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
}

const MealCard = memo(function MealCard({
    meal,
    onPress,
    onEdit,
    onDelete,
}: MealCardProps) {
    const multiplier = meal.grams / meal.food.servingGrams;
    const calories = Math.round(meal.food.calories * multiplier);
    const protein = Math.round(meal.food.protein * multiplier);
    const carbs = Math.round(meal.food.carbs * multiplier);
    const fat = Math.round(meal.food.fat * multiplier);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getLogIcon = () => {
        switch (meal.loggedVia) {
            case 'voice':
                return '🎤';
            case 'photo':
                return '📸';
            default:
                return '✍️';
        }
    };

    return (
        <Pressable style={styles.container} onPress={onPress}>
            {/* Thumbnail */}
            {meal.food.image ? (
                <Image source={{ uri: meal.food.image }} style={styles.thumbnail} />
            ) : (
                <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
                    <Text style={styles.thumbnailIcon}>{getLogIcon()}</Text>
                </View>
            )}

            {/* Info */}
            <View style={styles.info}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>{meal.food.nameVi}</Text>
                </View>
                <Text style={styles.calories}>{calories} kcal</Text>
                <View style={styles.macroRow}>
                    <Text style={styles.macroText}>{protein}g protein</Text>
                    <Text style={styles.macroDivider}>|</Text>
                    <Text style={styles.macroText}>{carbs}g carbs</Text>
                </View>
                <Text style={styles.time}>{formatTime(meal.timestamp)}</Text>
            </View>

            {/* Actions */}
            <Pressable style={styles.menuButton} onPress={onEdit}>
                <Ionicons name="ellipsis-horizontal" size={20} color={Colors.textLight} />
            </Pressable>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: Colors.surface,
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        ...Shadows.soft,
    },
    thumbnail: {
        width: 64,
        height: 64,
        borderRadius: 16,
    },
    thumbnailPlaceholder: {
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    thumbnailIcon: {
        fontSize: 24,
    },
    info: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textDark,
        marginBottom: 2,
    },
    calories: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 4,
    },
    macroRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    macroText: {
        fontSize: 12,
        color: Colors.textMedium,
    },
    macroDivider: {
        fontSize: 12,
        color: Colors.textLight,
    },
    time: {
        fontSize: 11,
        color: Colors.textLight,
        marginTop: 4,
    },
    menuButton: {
        padding: 8,
    },
});

export default MealCard;
