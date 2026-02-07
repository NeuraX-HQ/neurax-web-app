import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../constants/Theme';

interface LogSheetProps {
    onVoice?: () => void;
    onPhoto?: () => void;
    onManual?: () => void;
    onClose?: () => void;
}

const LogSheet = forwardRef<BottomSheet, LogSheetProps>(function LogSheet(
    { onVoice, onPhoto, onManual, onClose },
    ref
) {
    const snapPoints = useMemo(() => ['50%'], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.4}
            />
        ),
        []
    );

    const options = [
        {
            id: 'voice',
            icon: 'mic-outline' as const,
            emoji: '🎤',
            title: 'Voice',
            subtitle: 'Say "Ăn phở bò"',
            onPress: onVoice,
        },
        {
            id: 'photo',
            icon: 'camera-outline' as const,
            emoji: '📸',
            title: 'Photo',
            subtitle: 'Meal or Groceries',
            onPress: onPhoto,
        },
        {
            id: 'manual',
            icon: 'create-outline' as const,
            emoji: '✍️',
            title: 'Manual',
            subtitle: 'Search food database',
            onPress: onManual,
        },
    ];

    return (
        <BottomSheet
            ref={ref}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            backgroundStyle={styles.background}
            handleIndicatorStyle={styles.handle}
            onChange={(index) => {
                if (index === -1) onClose?.();
            }}
        >
            <BottomSheetView style={styles.content}>
                <Text style={styles.title}>How do you want to log?</Text>

                <View style={styles.optionsGrid}>
                    {options.map(option => (
                        <Pressable
                            key={option.id}
                            style={styles.optionCard}
                            onPress={() => {
                                option.onPress?.();
                            }}
                        >
                            <View style={styles.optionIconBox}>
                                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                            </View>
                            <View style={styles.optionText}>
                                <Text style={styles.optionTitle}>{option.title}</Text>
                                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                            </View>
                        </Pressable>
                    ))}
                </View>

                <Pressable style={styles.cancelButton} onPress={onClose}>
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
            </BottomSheetView>
        </BottomSheet>
    );
});

const styles = StyleSheet.create({
    background: {
        backgroundColor: Colors.background,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
    },
    handle: {
        backgroundColor: '#CED6E0',
        width: 40,
        height: 4,
    },
    content: {
        flex: 1,
        padding: 24,
        paddingTop: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: Colors.textDark,
        marginBottom: 24,
        textAlign: 'center',
        fontFamily: 'Playfair Display',
    },
    optionsGrid: {
        gap: 16,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: Colors.surface,
        padding: 20,
        borderRadius: 20,
        ...Shadows.soft,
    },
    optionIconBox: {
        width: 48,
        height: 48,
        backgroundColor: Colors.primaryLight,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    optionEmoji: {
        fontSize: 24,
    },
    optionText: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textDark,
        marginBottom: 2,
    },
    optionSubtitle: {
        fontSize: 13,
        color: Colors.textMedium,
    },
    cancelButton: {
        marginTop: 24,
        alignItems: 'center',
        paddingVertical: 12,
    },
    cancelText: {
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textMedium,
    },
});

export default LogSheet;
