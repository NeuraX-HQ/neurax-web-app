import React from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows, BorderRadius, Spacing } from '../constants/Theme';
import { FridgeItem } from '../data/mockData';

interface UseNowModalProps {
    visible: boolean;
    item: FridgeItem | null;
    onClose: () => void;
    onGetRecipes: (item: FridgeItem) => void;
    onMarkUsed: (item: FridgeItem) => void;
    onLogMeal: (item: FridgeItem) => void;
}

export default function UseNowModal({
    visible,
    item,
    onClose,
    onGetRecipes,
    onMarkUsed,
    onLogMeal,
}: UseNowModalProps) {
    if (!item) return null;

    const daysUntilExpiry = Math.ceil(
        (item.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                    {/* Handle bar */}
                    <View style={styles.handleBar} />

                    {/* Header with item info */}
                    <View style={styles.header}>
                        <View style={styles.itemInfoRow}>
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                            ) : (
                                <View style={[styles.itemImage, styles.imagePlaceholder]}>
                                    <Ionicons name="cube-outline" size={28} color={Colors.textLight} />
                                </View>
                            )}
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.nameVi}</Text>
                                <Text style={styles.itemMeta}>
                                    {item.quantity} • {daysUntilExpiry <= 0 ? 'Expired!' : `${daysUntilExpiry} days left`}
                                </Text>
                            </View>
                        </View>
                        {daysUntilExpiry <= 3 && (
                            <View style={styles.urgentBadge}>
                                <Ionicons name="warning" size={14} color="#DC2626" />
                                <Text style={styles.urgentText}>Use soon!</Text>
                            </View>
                        )}
                    </View>

                    {/* Actions */}
                    <View style={styles.actions}>
                        {/* Get Recipes */}
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => {
                                onGetRecipes(item);
                                onClose();
                            }}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                                <Ionicons name="restaurant-outline" size={24} color={Colors.primary} />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Get recipe suggestions</Text>
                                <Text style={styles.actionDesc}>Find dishes using this ingredient</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                        </Pressable>

                        {/* Mark as Used */}
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => {
                                onMarkUsed(item);
                                onClose();
                            }}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                                <Ionicons name="checkmark-circle-outline" size={24} color="#D97706" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Mark as used/discarded</Text>
                                <Text style={styles.actionDesc}>Remove from your fridge</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                        </Pressable>

                        {/* Log as Meal */}
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => {
                                onLogMeal(item);
                                onClose();
                            }}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#E0F2FE' }]}>
                                <Ionicons name="add-circle-outline" size={24} color="#0284C7" />
                            </View>
                            <View style={styles.actionContent}>
                                <Text style={styles.actionTitle}>Log as meal</Text>
                                <Text style={styles.actionDesc}>Add to today's food log</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
                        </Pressable>
                    </View>

                    {/* Cancel */}
                    <Pressable style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 12,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    header: {
        marginBottom: 24,
    },
    itemInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemImage: {
        width: 56,
        height: 56,
        borderRadius: 12,
        marginRight: 16,
    },
    imagePlaceholder: {
        backgroundColor: Colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.textDark,
        marginBottom: 4,
    },
    itemMeta: {
        fontSize: 14,
        color: Colors.textLight,
    },
    urgentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 6,
        alignSelf: 'flex-start',
    },
    urgentText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#DC2626',
    },
    actions: {
        gap: 12,
        marginBottom: 24,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: 16,
        borderRadius: 16,
        gap: 16,
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textDark,
        marginBottom: 2,
    },
    actionDesc: {
        fontSize: 13,
        color: Colors.textLight,
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textMedium,
    },
});
