import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/welcome');
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <View style={styles.logo}>
                    <View style={styles.barLeft} />
                    <View style={styles.barCenter} />
                    <View style={styles.barRight} />
                </View>
            </View>
            <Text style={styles.appName}>NutriTrack 2.0</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        width: 120,
        height: 120,
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 24,
        elevation: 8,
    },
    logo: {
        width: 70,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    barLeft: {
        width: 14,
        height: 50,
        backgroundColor: Colors.primary,
        borderRadius: 7,
    },
    barCenter: {
        width: 14,
        height: 40,
        backgroundColor: Colors.accent,
        borderRadius: 7,
        transform: [{ rotate: '-30deg' }],
    },
    barRight: {
        width: 14,
        height: 50,
        backgroundColor: Colors.primary,
        borderRadius: 7,
    },
    appName: {
        marginTop: 20,
        fontSize: 18,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
});
