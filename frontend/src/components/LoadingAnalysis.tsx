import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, Dimensions,
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAppLanguage } from '../i18n/LanguageProvider';

const { width } = Dimensions.get('window');

interface LoadingAnalysisProps {
    message?: string;
}

export function LoadingAnalysis({ message }: LoadingAnalysisProps) {
    const { t } = useAppLanguage();
    const loadingMessage = message || t('loading.analysis');
    const spinAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Spin animation
        Animated.loop(
            Animated.timing(spinAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const spin = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.spinner,
                    {
                        transform: [{ rotate: spin }, { scale: pulseAnim }],
                    },
                ]}
            >
                <View style={styles.spinnerInner} />
            </Animated.View>
            <Text style={styles.message}>{loadingMessage}</Text>
            <Text style={styles.submessage}>{t('loading.pleaseWait')}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    spinner: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: Colors.primary,
        borderTopColor: 'transparent',
        marginBottom: 24,
    },
    spinnerInner: {
        width: '100%',
        height: '100%',
        borderRadius: 40,
    },
    message: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 8,
        textAlign: 'center',
    },
    submessage: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});
