import React, { memo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/Theme';
import { FridgeItem } from '../data/mockData';

interface FridgeItemCardProps {
    item: FridgeItem;
    onPress?: () => void;
}

const FridgeItemCard = memo(function FridgeItemCard({
    item,
    onPress,
}: FridgeItemCardProps) {
    const daysUntilExpiry = Math.ceil(
        (item.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    const getExpiryStyle = () => {
        if (daysUntilExpiry <= 2) {
            return { bg: '#FEE2E2', text: '#DC2626' };
        } else if (daysUntilExpiry <= 5) {
            return { bg: '#FEF3C7', text: '#D97706' };
        }
        return { bg: Colors.primaryLight, text: Colors.primary };
    };

    const expiryStyle = getExpiryStyle();

    const getExpiryText = () => {
        if (daysUntilExpiry <= 0) return 'Expired';
        if (daysUntilExpiry === 1) return 'Tomorrow';
        if (daysUntilExpiry <= 5) return `${daysUntilExpiry} days`;
        return `${daysUntilExpiry}d`;
    };

    const getCategoryIcon = () => {
        switch (item.category) {
            case 'meat':
                return '🥩';
            case 'produce':
                return '🥬';
            case 'dairy':
                return '🥛';
            case 'condiment':
                return '🧂';
            case 'dry':
                return '🍚';
            default:
                return '📦';
        }
    };

    return (
        <Pressable style={styles.container} onPress={onPress}>
            {/* Icon */}
            <View style={styles.iconBox}>
                <Text style={styles.icon}>{getCategoryIcon()}</Text>
            </View>

            {/* Info */}
            <View style={styles.info}>
                <Text style={styles.name}>{item.nameVi}</Text>
                <Text style={styles.quantity}>{item.quantity}</Text>
            </View>

            {/* Expiry tag */}
            <View style={[styles.expiryTag, { backgroundColor: expiryStyle.bg }]}>
                <Text style={[styles.expiryText, { color: expiryStyle.text }]}>
                    {getExpiryText()}
                </Text>
            </View>
        </Pressable>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.surface,
        borderRadius: 20,
        marginBottom: 12,
        ...Shadows.soft,
    },
    iconBox: {
        width: 44,
        height: 44,
        backgroundColor: Colors.primaryLight,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 22,
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
        fontSize: 13,
        color: Colors.textMedium,
    },
    expiryTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    expiryText: {
        fontSize: 10,
        fontWeight: '600',
    },
});

export default FridgeItemCard;
