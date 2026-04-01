import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

export default function Walkthrough4Screen() {
    const router = useRouter();
    const { t } = useAppLanguage();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: 100,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                delay: 100,
                useNativeDriver: true,
            })
        ]).start();

        // Subtle floating for dragon stage cards
        const createFloat = (anim: Animated.Value, delay: number, distance: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: -distance,
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

        createFloat(floatAnim1, 0, 8);
        createFloat(floatAnim2, 800, 12);
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Decor */}
            <View style={styles.bgBlobLeft} />
            <View style={styles.bgBlobRight} />
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

                    {/* Stage Presentation Area */}
                    <Animated.View style={[styles.stageContainer, { transform: [{ scale: scaleAnim }] }]}>
                        {/* Island Glow */}
                        <View style={styles.islandGlow} />

                        {/* Stages */}
                        <View style={styles.stagesRow}>
                            {/* Stage 1 */}
                            <Animated.View style={[styles.stageCardContainer, styles.stage1, { transform: [{ translateY: floatAnim1 }] }]}>
                                <View style={styles.stageCard}>
                                    <View style={styles.stageImagePlaceholder}>
                                        <Image
                                            source={require('../../assets/images/dragon_stage1.png')}
                                            style={styles.stageImage}
                                            contentFit="contain"
                                            cachePolicy="memory-disk"
                                        />
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Stage 2 */}
                            <Animated.View style={[styles.stageCardContainer, styles.stage2, { transform: [{ translateY: floatAnim2 }] }]}>
                                <View style={[styles.stageCard, styles.stageCardM]}>
                                    <View style={[styles.stageImagePlaceholder, styles.stageImageM]}>
                                        <Image
                                            source={require('../../assets/images/dragon_stage2.png')}
                                            style={styles.stageImage}
                                            contentFit="contain"
                                            cachePolicy="memory-disk"
                                        />
                                    </View>
                                </View>
                            </Animated.View>

                            {/* Stage 3 (Final) */}
                            <Animated.View style={[styles.stageCardContainer, styles.stage3, { transform: [{ translateY: floatAnim1 }] }]}>
                                <View style={[styles.stageCardContainer, styles.stage3]}>
                                    <View style={[styles.stageCard, styles.stageCardL, styles.stageCardActive]}>
                                        <View style={[styles.stageImagePlaceholder, styles.stageImageL]}>
                                            <Image
                                                source={require('../../assets/images/dragon_stage3.png')}
                                                style={styles.stageImage}
                                                contentFit="contain"
                                                cachePolicy="memory-disk"
                                            />
                                        </View>
                                    </View>
                                </View>
                            </Animated.View>
                        </View>
                    </Animated.View>
                </View>

                {/* Text Content */}
                <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>{t('walkthrough4.title')}</Text>
                    <Text style={styles.description}>
                        {t('walkthrough4.desc1')}<Text style={styles.descriptionHighlight}>(Streak)</Text>{t('walkthrough4.desc2')}
                    </Text>

                    {/* Level Progress Visual */}
                    <View style={styles.progressVisual}>
                        <View style={styles.progressVisualTop}>
                            <Text style={styles.progressVisualLabel}>{t('walkthrough4.level')}</Text>
                            <Text style={styles.progressVisualValue}>75% EXP</Text>
                        </View>
                        <View style={styles.progressBarTrack}>
                            <LinearGradient
                                colors={[Colors.primary, '#10b981']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.progressBarFill}
                            />
                        </View>
                    </View>
                </Animated.View>

            </View>

            {/* Fixed Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/onboarding/step1')}
                    activeOpacity={0.9}
                >
                    <Text style={styles.buttonText}>{t('walkthrough4.start')}</Text>
                </TouchableOpacity>

                {/* Main Progress Indicators */}
                <View style={styles.progressRow}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressActive]} />
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
    bgBlobLeft: {
        position: 'absolute',
        top: -10,
        right: -10,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: 'rgba(78, 222, 163, 0.05)',
        alignSelf: 'flex-start',
    },
    bgBlobRight: {
        position: 'absolute',
        bottom: '20%',
        left: -20,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(252, 124, 120, 0.05)',
        alignSelf: 'flex-end',
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    visualArea: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 360,
        marginBottom: 20,
        position: 'relative',
    },
    streakBadgeContainer: {
        zIndex: 20,
        marginBottom: 32,
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    streakText: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 1.5,
    },
    stageContainer: {
        width: '100%',
        height: 200,
        alignItems: 'center',
        justifyContent: 'center',
    },
    islandGlow: {
        position: 'absolute',
        bottom: 20,
        width: '80%',
        height: 60,
        borderRadius: 150,
        backgroundColor: '#D8DADC',
        opacity: 0.6,
        shadowColor: '#191C1E',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
    },
    stagesRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 12,
        width: '100%',
    },
    stageCardContainer: {
        alignItems: 'center',
    },
    stageCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 15,
        elevation: 4,
        marginBottom: 8,
    },
    stageCardM: {
        padding: 6,
        borderRadius: 16,
    },
    stageCardL: {
        padding: 8,
        borderRadius: 20,
    },
    stageCardActive: {
        borderColor: 'rgba(16, 185, 129, 0.3)',
        borderWidth: 2,
        shadowColor: Colors.primary,
        shadowOpacity: 0.15,
        shadowRadius: 20,
    },
    stageImagePlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 10,
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    stageImageM: {
        width: 115,
        height: 115,
    },
    stageImageL: {
        width: 150,
        height: 150,
    },
    stage1: {
        transform: [{ translateY: -16 }],
    },
    stage2: {
        transform: [{ translateY: -30 }],
        zIndex: 10,
    },
    stage3: {
        zIndex: 20,
    },
    stageImage: {
        width: '100%',
        height: '100%',
    },
    stageLabel: {
        fontSize: 8,
        fontWeight: '900',
        color: Colors.textSecondary,
        letterSpacing: 0.5,
        opacity: 0.5,
    },
    stageLabelActive: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 1.5,
    },
    levelMarker: {
        position: 'absolute',
        top: '25%',
        left: '10%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        transform: [{ rotate: '-6deg' }],
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 28,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    descriptionHighlight: {
        fontWeight: 'bold',
        color: '#FF6B35',
    },
    progressVisual: {
        width: '100%',
        maxWidth: 300,
        marginBottom: 20,
    },
    progressVisualTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingHorizontal: 4,
        marginBottom: 8,
    },
    progressVisualLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    progressVisualValue: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 1,
    },
    progressBarTrack: {
        height: 12,
        width: '100%',
        backgroundColor: '#E6E8EA',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
        overflow: 'hidden',
    },
    progressBarFill: {
        width: '75%',
        height: '100%',
        borderRadius: 6,
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
        marginBottom: 24,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 8,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
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
    }
});
