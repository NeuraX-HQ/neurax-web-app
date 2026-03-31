import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';
import { Image } from 'expo-image';

export default function Walkthrough2Screen() {
    const router = useRouter();
    const { t } = useAppLanguage();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            })
        ]).start();

        // Subtle pulse for background
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 3000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                })
            ])
        ).start();

        // Floating chat bubbles
        const createFloat = (anim: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: -10,
                        duration: 2500,
                        delay: delay,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 2500,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    })
                ])
            ).start();
        };

        createFloat(floatAnim1, 0);
        createFloat(floatAnim2, 1000);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={Colors.primary} />
                </TouchableOpacity>
                <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>NEURAX</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.contentContainer}>
                {/* Visual Area */}
                <View style={styles.visualArea}>
                    {/* Brackets */}
                    <View style={[styles.bracket, styles.bracketTL]} />
                    <View style={[styles.bracket, styles.bracketTR]} />
                    <View style={[styles.bracket, styles.bracketBL]} />
                    <View style={[styles.bracket, styles.bracketBR]} />

                    {/* Robot Image Card */}
                    <View style={styles.imageCard}>
                        <Image
                            source={require('../../assets/images/mascot_robot.png')}
                            style={styles.avatarImage}
                            contentFit="cover"
                        />
                    </View>

                    {/* Floating Chat 1 */}
                    <Animated.View style={[styles.chatBubble, styles.chat1, { transform: [{ translateY: floatAnim1 }] }]}>
                        <Text style={styles.chatText}>{t('walkthrough2.chat1')}</Text>
                    </Animated.View>

                    {/* Floating Chat 2 */}
                    <Animated.View style={[styles.chatBubble, styles.chat2, { transform: [{ translateY: floatAnim2 }] }]}>
                        <Text style={styles.chatText}>{t('walkthrough2.chat2')}</Text>
                    </Animated.View>

                    {/* Small icon bubble */}
                    <Animated.View style={[styles.iconBubble, { transform: [{ translateY: floatAnim1 }] }]}>
                        <Ionicons name="bar-chart" size={16} color={Colors.primary} />
                    </Animated.View>
                </View>

                {/* Text Content */}
                <Animated.View style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={styles.title}>{t('walkthrough2.title')}</Text>
                    <Text style={styles.description}>
                        {t('walkthrough2.desc')}
                    </Text>
                </Animated.View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/onboarding/walkthrough3')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{t('common.continue')}</Text>
                </TouchableOpacity>

                {/* Progress Indicators */}
                <View style={styles.progressRow}>
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressActive]} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        justifyContent: 'space-between',
    },
    bgCircle: {
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F6F8',
    },
    logoContainer: {
        flex: 1,
        alignItems: 'center',
    },
    logoText: {
        fontSize: 13,
        fontWeight: '800',
        color: Colors.textSecondary,
        letterSpacing: 2,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    visualArea: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 320,
        marginBottom: 30,
    },
    imageCard: {
        width: 260,
        height: 260,
        borderRadius: 24,
        backgroundColor: '#FFFFFF',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        overflow: 'hidden',
        shadowColor: '#191C1E',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.1,
        shadowRadius: 40,
        elevation: 10,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    bracket: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: Colors.primary,
    },
    bracketTL: { top: 10, left: 10, borderTopWidth: 2, borderLeftWidth: 2 },
    bracketTR: { top: 10, right: 10, borderTopWidth: 2, borderRightWidth: 2 },
    bracketBL: { bottom: 10, left: 10, borderBottomWidth: 2, borderLeftWidth: 2 },
    bracketBR: { bottom: 10, right: 10, borderBottomWidth: 2, borderRightWidth: 2 },
    chatBubble: {
        position: 'absolute',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 12,
        padding: 12,
        maxWidth: 160,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 5,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    chat1: {
        top: '10%',
        left: -10,
    },
    chat2: {
        bottom: '20%',
        right: -10,
    },
    chatHeader: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.primary,
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    chatText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
        lineHeight: 18,
    },
    iconBubble: {
        position: 'absolute',
        top: '40%',
        right: -10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 4,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 32,
        textAlign: 'center',
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E3E5',
    },
    progressActive: {
        width: 32,
        backgroundColor: Colors.primary,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    button: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    footerTag: {
        textAlign: 'center',
        fontSize: 10,
        color: Colors.textLight,
        letterSpacing: 2,
    }
});
