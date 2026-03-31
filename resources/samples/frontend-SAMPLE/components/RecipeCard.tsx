import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, BorderRadius } from '../constants/Theme';
import { Recipe } from '../data/mockData';

interface RecipeCardProps {
    recipe: Recipe;
    onPress?: () => void;
    featured?: boolean;
}

// Calculate availability percentage and border color
const getAvailabilityInfo = (recipe: Recipe) => {
    // Mock calculation - in production, compare with fridge items
    const fromFridge = recipe.matchedFromFridge || 0;
    const total = 5; // Assume 5 ingredients on average
    const percentage = fromFridge / total;

    let borderColor = '#6B7280'; // Gray (<80%)
    let label = 'Some ingredients needed';
    let labelColor = Colors.textLight;

    if (percentage >= 1.0) {
        borderColor = '#10B981'; // Green (100%)
        label = 'All from fridge!';
        labelColor = '#059669';
    } else if (percentage >= 0.6) {
        borderColor = '#F59E0B'; // Amber (60%+)
        label = `${fromFridge} from fridge`;
        labelColor = '#D97706';
    }

    return { borderColor, label, labelColor, percentage };
};

const RecipeCard = memo(function RecipeCard({ recipe, onPress, featured = false }: RecipeCardProps) {
    const availability = getAvailabilityInfo(recipe);

    if (featured) {
        return (
            <Pressable
                style={[styles.featuredCard, { borderLeftColor: availability.borderColor }]}
                onPress={onPress}
            >
                {/* Image section */}
                <View style={styles.featuredImageContainer}>
                    {recipe.image ? (
                        <Image source={{ uri: recipe.image }} style={styles.featuredImage} />
                    ) : (
                        <View style={[styles.featuredImage, styles.imagePlaceholder]}>
                            <Ionicons name="restaurant-outline" size={48} color={Colors.textLight} />
                        </View>
                    )}
                    {/* Time badge */}
                    <View style={styles.timeBadge}>
                        <Ionicons name="time-outline" size={14} color={Colors.primary} />
                        <Text style={styles.timeBadgeText}>{recipe.prepTime + recipe.cookTime}m</Text>
                    </View>
                    {/* Difficulty badge */}
                    <View style={styles.difficultyBadge}>
                        <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
                    </View>
                </View>

                {/* Info section */}
                <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName}>{recipe.nameVi}</Text>
                    <Text style={styles.featuredDesc} numberOfLines={2}>{recipe.description}</Text>

                    {/* Availability indicator */}
                    <View style={styles.availabilityRow}>
                        <View style={[styles.availabilityBadge, { backgroundColor: `${availability.borderColor}15` }]}>
                            <Ionicons
                                name={availability.percentage >= 1 ? "checkmark-circle" : "basket-outline"}
                                size={14}
                                color={availability.borderColor}
                            />
                            <Text style={[styles.availabilityText, { color: availability.labelColor }]}>
                                {availability.label}
                            </Text>
                        </View>
                        <Text style={styles.calories}>{recipe.calories} kcal</Text>
                    </View>
                </View>
            </Pressable>
        );
    }

    // Compact card
    return (
        <Pressable
            style={[styles.card, { borderLeftColor: availability.borderColor }]}
            onPress={onPress}
        >
            {recipe.image ? (
                <Image source={{ uri: recipe.image }} style={styles.image} />
            ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                    <Ionicons name="restaurant-outline" size={28} color={Colors.textLight} />
                </View>
            )}
            <View style={styles.info}>
                <View style={styles.headerRow}>
                    <Text style={styles.name} numberOfLines={1}>{recipe.nameVi}</Text>
                    {recipe.matchedFromFridge && recipe.matchedFromFridge > 0 && (
                        <View style={[styles.matchBadge, { backgroundColor: `${availability.borderColor}15` }]}>
                            <Text style={[styles.matchText, { color: availability.borderColor }]}>
                                {recipe.matchedFromFridge} ✓
                            </Text>
                        </View>
                    )}
                </View>
                <Text style={styles.desc} numberOfLines={1}>{recipe.description}</Text>
                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <Ionicons name="time-outline" size={13} color={Colors.textLight} />
                        <Text style={styles.metaText}>{recipe.prepTime + recipe.cookTime}m</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Ionicons name="flame-outline" size={13} color={Colors.textLight} />
                        <Text style={styles.metaText}>{recipe.calories}</Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Text style={styles.metaText}>{recipe.protein}g P</Text>
                    </View>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
        </Pressable>
    );
});

export default RecipeCard;

const styles = StyleSheet.create({
    // Featured Card
    featuredCard: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 20,
        borderLeftWidth: 4,
        ...Shadows.soft,
    },
    featuredImageContainer: {
        height: 160,
        position: 'relative',
    },
    featuredImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        gap: 4,
    },
    timeBadgeText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    difficultyBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    difficultyText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
        textTransform: 'capitalize',
    },
    featuredInfo: {
        padding: 16,
    },
    featuredName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textDark,
        marginBottom: 6,
    },
    featuredDesc: {
        fontSize: 14,
        color: Colors.textMedium,
        lineHeight: 20,
        marginBottom: 12,
    },
    availabilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    availabilityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    availabilityText: {
        fontSize: 12,
        fontWeight: '600',
    },
    calories: {
        fontSize: 13,
        color: Colors.textLight,
    },

    // Compact Card
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: 14,
        padding: 12,
        marginBottom: 12,
        borderLeftWidth: 3,
        ...Shadows.soft,
    },
    image: {
        width: 64,
        height: 64,
        borderRadius: 10,
        marginRight: 14,
    },
    info: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textDark,
        flex: 1,
    },
    matchBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    matchText: {
        fontSize: 11,
        fontWeight: '700',
    },
    desc: {
        fontSize: 13,
        color: Colors.textMedium,
        marginBottom: 8,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 14,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
});
