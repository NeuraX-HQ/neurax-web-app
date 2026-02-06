import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/Theme';
import { FridgeItem } from '../data/mockData';

interface FridgeItemCardProps {
    item: FridgeItem;
    onPress?: () => void;
    variant?: 'urgent' | 'normal' | 'compact';
}

const FridgeItemCard = memo(function FridgeItemCard({
    item,
    onPress,
    variant = 'normal',
}: FridgeItemCardProps) {
    const daysUntilExpiry = Math.ceil(
        (item.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const isUrgent = daysUntilExpiry <= 3;
    const displayVariant = variant === 'normal' && isUrgent ? 'urgent' : variant;

    const getExpiryStyle = () => {
        if (daysUntilExpiry <= 2) {
            return { bg: '#FEE2E2', text: '#DC2626', border: '#FEE2E2' };
        } else if (daysUntilExpiry <= 5) {
            return { bg: '#FEF3C7', text: '#D97706', border: '#FED7AA' };
        }
        return { bg: Colors.emeraldLight, text: Colors.primary, border: Colors.borderCream };
    };

    const expiryStyle = getExpiryStyle();

    const getExpiryText = () => {
        if (daysUntilExpiry <= 0) return 'EXPIRED';
        if (daysUntilExpiry === 1) return 'EXP: 1 DAY';
        return `EXP: ${daysUntilExpiry} DAYS`;
    };

    const getCategoryLabel = () => {
        switch (item.category) {
            case 'meat': return 'Meat';
            case 'produce': return 'Veg';
            case 'dairy': return 'Dairy';
            case 'condiment': return 'Condiment';
            case 'dry': return 'Dry goods';
            default: return 'Other';
        }
    };

    // Compact variant (for "This Week" section)
    if (displayVariant === 'compact') {
        return (
            <Pressable
                style={[styles.compactContainer, { borderColor: Colors.borderCream }]}
                onPress={onPress}
            >
                <View style={styles.compactImageBox}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.compactImage} />
                    ) : (
                        <View style={[styles.compactImage, styles.imagePlaceholder]}>
                            <Text style={styles.placeholderEmoji}>🥗</Text>
                        </View>
                    )}
                </View>
                <View style={styles.compactInfo}>
                    <Text style={styles.compactName}>{item.nameVi}</Text>
                    <Text style={styles.compactMeta}>
                        {item.quantity} • Exp: {daysUntilExpiry} days
                    </Text>
                </View>
                <View style={styles.chevronCircle}>
                    <Ionicons name="chevron-forward" size={16} color={Colors.textLight} />
                </View>
            </Pressable>
        );
    }

    // Urgent variant (for "Use Soon" section)
    if (displayVariant === 'urgent') {
        return (
            <Pressable
                style={[styles.urgentContainer, { borderColor: '#FEE2E2' }]}
                onPress={onPress}
            >
                {/* Expiry badge - top right corner */}
                <View style={styles.expiryBadge}>
                    <Text style={styles.expiryBadgeText}>{getExpiryText()}</Text>
                </View>

                {/* Image */}
                <View style={styles.urgentImageBox}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.urgentImage} />
                    ) : (
                        <View style={[styles.urgentImage, styles.imagePlaceholder]}>
                            <Text style={styles.placeholderEmoji}>🥩</Text>
                        </View>
                    )}
                </View>

                {/* Info */}
                <View style={styles.urgentInfo}>
                    <Text style={styles.urgentName}>{item.nameVi}</Text>
                    <Text style={styles.urgentMeta}>
                        {item.quantity} • {getCategoryLabel()}
                    </Text>

                    {/* Action buttons */}
                    <View style={styles.actionButtons}>
                        <Pressable style={styles.primaryButton}>
                            <Text style={styles.primaryButtonText}>Use now</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryButton}>
                            <Text style={styles.secondaryButtonText}>Extend</Text>
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        );
    }

    // Normal variant (default)
    return (
        <Pressable
            style={[styles.container, { borderColor: Colors.borderCream }]}
            onPress={onPress}
        >
            {/* Image */}
            <View style={styles.imageBox}>
                {item.imageUrl ? (
                    <Image source={{ uri: item.imageUrl }} style={styles.image} />
                ) : (
                    <View style={[styles.image, styles.imagePlaceholder]}>
                        <Text style={styles.placeholderEmoji}>🥗</Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.info}>
                <Text style={styles.name}>{item.nameVi}</Text>
                <Text style={styles.quantity}>{item.quantity}</Text>
            </View>

            {/* Expiry tag */}
            <View style={[styles.expiryTag, { backgroundColor: expiryStyle.bg }]}>
                <Text style={[styles.expiryText, { color: expiryStyle.text }]}>
                    {daysUntilExpiry}d
                </Text>
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    // ===== NORMAL VARIANT =====
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 24,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: 12,
        ...Shadows.soft,
    },
    imageBox: {
        width: 48,
        height: 48,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 14,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderEmoji: {
        fontSize: 24,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textDark,
        marginBottom: 2,
    },
    quantity: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
    },
    expiryTag: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    expiryText: {
        fontSize: 11,
        fontWeight: '700',
    },

    // ===== COMPACT VARIANT =====
    compactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginHorizontal: 24,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        marginBottom: 10,
        gap: 14,
        ...Shadows.soft,
    },
    compactImageBox: {
        width: 48,
        height: 48,
        borderRadius: 8,
        overflow: 'hidden',
    },
    compactImage: {
        width: '100%',
        height: '100%',
    },
    compactInfo: {
        flex: 1,
    },
    compactName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textDark,
    },
    compactMeta: {
        fontSize: 12,
        color: Colors.textLight,
        fontWeight: '500',
        marginTop: 2,
    },
    chevronCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // ===== URGENT VARIANT =====
    urgentContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        paddingRight: 48,
        marginHorizontal: 24,
        backgroundColor: Colors.surface,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: Colors.error,
        marginBottom: 12,
        gap: 14,
        position: 'relative',
        overflow: 'hidden',
        ...Shadows.soft,
    },
    expiryBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderBottomLeftRadius: 8,
    },
    expiryBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: Colors.error,
    },
    urgentImageBox: {
        width: 60,
        height: 60,
        borderRadius: 10,
        overflow: 'hidden',
    },
    urgentImage: {
        width: '100%',
        height: '100%',
    },
    urgentInfo: {
        flex: 1,
        paddingRight: 8,
    },
    urgentName: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textDark,
    },
    urgentMeta: {
        fontSize: 13,
        color: Colors.textLight,
        fontWeight: '500',
        marginTop: 2,
        marginBottom: 12,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    primaryButton: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 44,
        minHeight: 36, // Touch target: ≥ 36px (within 44px tap area)
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    secondaryButton: {
        backgroundColor: Colors.primaryLight,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        minWidth: 44,
        minHeight: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
    },
});

export default FridgeItemCard;
