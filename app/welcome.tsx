import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

const { width, height } = Dimensions.get('window');

const WELCOME_IMAGES = [
    require('../assets/images/welcome0.jpg'),
    require('../assets/images/welcome5.jpg'),
    require('../assets/images/friends.png'),
];

export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useAppLanguage();

    const [currentIndex, setCurrentIndex] = useState(0);

    const features = [
        {
            titleStr: t('welcome.feature1.title'),
            subtitle: t('welcome.feature1.subtitle'),
        },
        {
            titleStr: t('welcome.feature2.title'),
            subtitle: t('welcome.feature2.subtitle'),
        },
        {
            titleStr: t('welcome.feature3.title'),
            subtitle: t('welcome.feature3.subtitle'),
        },
    ];

    const stats = [
        { label: t('welcome.stats.users'), value: '10K+' },
        { label: t('welcome.stats.recipes'), value: '500+' },
        { label: t('welcome.stats.rating'), value: '4.9★' },
    ];

    // Text fade: text fades out then in
    const textOpacity = React.useRef(new Animated.Value(1)).current;

    // Pre-fetch images on mount
    useEffect(() => {
        Asset.loadAsync(WELCOME_IMAGES).catch(console.warn);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            // Phase 1: Fade out text
            Animated.timing(textOpacity, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }).start(() => {
                // Change index after text is hidden
                setCurrentIndex((prev) => (prev + 1) % WELCOME_IMAGES.length);

                // Phase 2: Fade text back in
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }).start();
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const feature = features[currentIndex];

    return (
        <View style={styles.container}>
            {/* Background image — using expo-image native transition */}
            <Image
                source={WELCOME_IMAGES[currentIndex]}
                style={styles.bgImage}
                contentFit="cover"
                transition={1000}
                cachePolicy="memory-disk"
            />

            {/* Gradient overlay — white fade from transparent → cream white */}
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.72)', '#000000']}
                locations={[0, 0.42, 1]}
                style={styles.gradient}
            />

            {/* Content overlay — sits on top of image */}
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: textOpacity,
                        paddingBottom: Math.max(insets.bottom, 24),
                    },
                ]}
            >
                {/* Pagination dots */}
                <View style={styles.pagination}>
                    {WELCOME_IMAGES.map((_, i) => (
                        <View
                            key={i}
                            style={[styles.dot, i === currentIndex && styles.dotActive]}
                        />
                    ))}
                </View>

                <Text style={styles.title}>{feature.titleStr}</Text>
                <Text style={styles.subtitle}>{feature.subtitle}</Text>

                {/* Stats row */}
                <View style={styles.statsRow}>
                    {stats.map((stat, i) => (
                        <View key={i} style={styles.statCard}>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </View>
                    ))}
                </View>

                {/* CTA */}
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => router.push('/onboarding/walkthrough1')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.primaryButtonText}>{t('welcome.getStarted')}</Text>
                </TouchableOpacity>

                <View style={styles.loginFooter}>
                    <Text style={styles.loginText}>{t('welcome.haveAccount')} </Text>
                    <TouchableOpacity onPress={() => router.push('/login' as any)}>
                        <Text style={styles.loginLink}>{t('welcome.login')}</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111111',
    },
    bgImage: {
        position: 'absolute',
        width,
        height,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: height * 0.62,
        zIndex: 10,
    },
    content: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    pagination: {
        flexDirection: 'row',
        marginBottom: 14,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.25)',
        marginRight: 6,
    },
    dotActive: {
        width: 24,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: height > 700 ? 26 : 22,
        fontWeight: '900',
        color: '#FFFFFF',
        lineHeight: height > 700 ? 34 : 30,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.92)',
        lineHeight: 22,
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 22,
    },
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 16,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
    },
    statValue: {
        fontSize: 17,
        fontWeight: '800',
        color: '#5eb684ff',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '500',
    },
    primaryButton: {
        backgroundColor: '#2b533cff',
        borderRadius: 20,
        paddingVertical: 17,
        alignItems: 'center',
        marginBottom: 14,
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    loginFooter: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    loginText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.72)',
    },
    loginLink: {
        fontSize: 13,
        color: '#FFFFFF',
        fontWeight: '700',
        textDecorationLine: 'underline',
    },
});
