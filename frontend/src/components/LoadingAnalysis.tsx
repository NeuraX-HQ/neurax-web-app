import React, { useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, Animated, ActivityIndicator
} from 'react-native';
import { Colors } from '../constants/colors';
import { useAppLanguage } from '../i18n/LanguageProvider';

interface LoadingAnalysisProps {
    message?: string;
}

export function LoadingAnalysis({ message }: LoadingAnalysisProps) {
    const { t } = useAppLanguage();
    const loadingMessage = message || t('loading.analysis');
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Pulse animation for text only - very light
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.spinnerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} style={{ transform: [{ scale: 2 }] }} />
            </View>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Text style={styles.message}>{loadingMessage}</Text>
                <Text style={styles.submessage}>{t('loading.pleaseWait')}</Text>
            </Animated.View>
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
    spinnerContainer: {
        marginBottom: 32,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
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
