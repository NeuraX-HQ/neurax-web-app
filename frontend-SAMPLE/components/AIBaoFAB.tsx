import React, { memo, useEffect, useRef } from 'react';
import { Pressable, Text, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shadows } from '../constants/Theme';

interface AIBaoFABProps {
    onPress?: () => void;
}

const AIBaoFAB = memo(function AIBaoFAB({ onPress }: AIBaoFABProps) {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Subtle pulsing animation for "alive" feel
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 1200,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim]);

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: pulseAnim }] }]}>
            <Pressable onPress={onPress}>
                <View style={styles.borderRing}>
                    <LinearGradient
                        colors={['#14B8A6', '#0D9488', '#0F766E']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradient}
                    >
                        <Text style={styles.sparkle}>✨</Text>
                        <Text style={styles.label}>BẢO</Text>
                    </LinearGradient>
                </View>
            </Pressable>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        zIndex: 90,
    },
    borderRing: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: '#FFFFFF',
        padding: 3,
        ...Shadows.float,
        shadowColor: '#14B8A6',
        elevation: 8,
    },
    gradient: {
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sparkle: {
        fontSize: 20,
        lineHeight: 22,
    },
    label: {
        fontSize: 8,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginTop: 1,
    },
});

export default AIBaoFAB;

