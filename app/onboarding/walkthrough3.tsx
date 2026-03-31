import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

export default function Walkthrough3Screen() {
    const router = useRouter();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const { t } = useAppLanguage();
    const slideLeftAnim = useRef(new Animated.Value(50)).current;
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
            Animated.timing(slideLeftAnim, {
                toValue: 0,
                duration: 600,
                delay: 100,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            })
        ]).start();

        // Floating UI cards
        const createFloat = (anim: Animated.Value, delay: number, distance: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: -distance,
                        duration: 3000,
                        delay: delay,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 3000,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    })
                ])
            ).start();
        };

        createFloat(floatAnim1, 0, 10);
        createFloat(floatAnim2, 1200, 15);
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
                    <View style={styles.mainImageContainer}>
                        <Image
                            source={{ uri: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop" }}
                            style={styles.mainImage}
                            contentFit="cover"
                        />
                        {/* Overlay to dim image slightly */}
                        <View style={styles.imageOverlay} />
                    </View>

                    {/* Inventory HUD */}
                    <Animated.View style={[styles.hudCard, styles.hudPosition, { transform: [{ translateY: floatAnim1 }] }]}>
                        <View style={styles.hudList}>
                            <View style={styles.hudItem}>
                                <View style={styles.hudItemLeft}>
                                    <Ionicons name="egg" size={14} color={Colors.primary} />
                                    <Text style={styles.hudItemText}>Trứng</Text>
                                </View>
                                <View style={[styles.tag, styles.tagRed]}>
                                    <Text style={styles.tagTextRed}>Còn 2 ngày</Text>
                                </View>
                            </View>

                            <View style={styles.hudItem}>
                                <View style={styles.hudItemLeft}>
                                    <Ionicons name="restaurant" size={14} color={Colors.primary} />
                                    <Text style={styles.hudItemText}>{t('walkthrough3.hudItem')}</Text>
                                </View>
                                <View style={[styles.tag, styles.tagGray]}>
                                    <Text style={styles.tagTextGray}>{t('walkthrough3.tag')}</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>

                    {/* Recipe Card */}
                    <Animated.View style={[styles.recipeCard, styles.recipePosition, { transform: [{ translateY: floatAnim2 }] }]}>
                        <Image
                            source={{ uri: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop" }}
                            style={styles.recipeImage}
                            contentFit="cover"
                        />
                        <View style={styles.recipeContent}>
                            <Text style={styles.recipeTag}>{t('walkthrough3.recipeTag')}</Text>
                            <Text style={styles.recipeTitle}>Healthy Salad</Text>
                            <View style={styles.recipeStats}>
                                <View style={styles.recipeStat}>
                                    <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
                                    <Text style={styles.recipeStatText}>15 ph</Text>
                                </View>
                                <View style={styles.recipeStat}>
                                    <Ionicons name="flame-outline" size={12} color={Colors.textSecondary} />
                                    <Text style={styles.recipeStatText}>320 kcal</Text>
                                </View>
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* Text Content */}
                <Animated.View style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateX: slideLeftAnim }] }]}>
                    <Text style={styles.categoryLabel}>{t('walkthrough3.categoryLabel', { defaultValue: 'KITCHEN INTELLIGENCE' })}</Text>
                    <Text style={styles.title}>{t('walkthrough3.title1')}<Text style={styles.titleItalic}>{t('walkthrough3.title2')}</Text></Text>
                    <Text style={styles.description}>
                        {t('walkthrough3.desc')}
                    </Text>

                    {/* Features list */}
                    <View style={styles.featuresList}>
                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="cube" size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.featureTexts}>
                                <Text style={styles.featureTitle}>{t('walkthrough3.feature1.title')}</Text>
                                <Text style={styles.featureDesc}>{t('walkthrough3.feature1.desc')}</Text>
                            </View>
                        </View>

                        <View style={styles.featureItem}>
                            <View style={styles.featureIcon}>
                                <Ionicons name="color-wand" size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.featureTexts}>
                                <Text style={styles.featureTitle}>{t('walkthrough3.feature2.title')}</Text>
                                <Text style={styles.featureDesc}>{t('walkthrough3.feature2.desc')}</Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>

            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/onboarding/walkthrough4')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>{t('common.continue')}</Text>
                </TouchableOpacity>

                {/* Progress Indicators */}
                <View style={styles.progressRow}>
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                    <View style={[styles.progressDot, styles.progressActive]} />
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
        paddingHorizontal: 24,
        paddingTop: 10,
    },
    visualArea: {
        height: 320,
        width: '100%',
        marginBottom: 30,
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainImageContainer: {
        width: 260,
        height: 260,
        borderRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#E0E3E5',
    },
    mainImage: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(245, 247, 250, 0.2)', // Slight blend
    },
    hudCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: 16,
        padding: 16,
        width: 200,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    hudPosition: {
        position: 'absolute',
        top: 10,
        left: 0,
    },
    hudHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    hudTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: Colors.textSecondary,
        letterSpacing: 1,
    },
    pulseDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    hudList: {
        gap: 8,
    },
    hudItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        padding: 8,
        borderRadius: 8,
    },
    hudItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    hudItemText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.text,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    tagRed: { backgroundColor: '#FFDAD7' },
    tagTextRed: { color: '#410005', fontSize: 9, fontWeight: '700' },
    tagGray: { backgroundColor: '#E2E2E2' },
    tagTextGray: { color: '#1B1B1B', fontSize: 9, fontWeight: '700' },
    recipeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        width: 170,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.12,
        shadowRadius: 25,
        elevation: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    recipePosition: {
        position: 'absolute',
        bottom: 10,
        right: 0,
    },
    recipeImage: {
        width: '100%',
        height: 80,
        borderRadius: 10,
        marginBottom: 10,
    },
    recipeContent: {
        gap: 4,
    },
    recipeTag: {
        fontSize: 9,
        fontWeight: '800',
        color: Colors.primary,
        letterSpacing: 1,
    },
    recipeTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.text,
    },
    recipeStats: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 4,
    },
    recipeStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    recipeStatText: {
        fontSize: 10,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    textContainer: {
        flex: 1,
        marginTop: 10,
    },
    categoryLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 0.5,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 16,
    },
    titleItalic: {
        fontStyle: 'italic',
        color: Colors.primary,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 24,
    },
    featuresList: {
        gap: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    featureIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#E6E8EA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureTexts: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
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
        marginBottom: 20,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
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
