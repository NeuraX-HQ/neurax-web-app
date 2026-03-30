import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';
import { Image } from 'expo-image';

export default function Walkthrough1Screen() {
    const router = useRouter();
    const { t } = useAppLanguage();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideUpAnim = useRef(new Animated.Value(30)).current;
    const floatAnim1 = useRef(new Animated.Value(0)).current;
    const floatAnim2 = useRef(new Animated.Value(0)).current;
    const floatAnim3 = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entry animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                delay: 100,
                useNativeDriver: true,
            }),
            Animated.timing(slideUpAnim, {
                toValue: 0,
                duration: 600,
                delay: 100,
                useNativeDriver: true,
            })
        ]).start();

        // Floating animations for icons
        const createFloatAnim = (anim: Animated.Value, delay: number, duration: number) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: -8,
                        duration: duration,
                        easing: Easing.inOut(Easing.sin),
                        delay: delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: duration,
                        easing: Easing.inOut(Easing.sin),
                        useNativeDriver: true,
                    })
                ])
            );
        };

        createFloatAnim(floatAnim1, 0, 2000).start();
        createFloatAnim(floatAnim2, 500, 2200).start();
        createFloatAnim(floatAnim3, 1000, 1800).start();

        // Pulse animation for scan bracket
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.5,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                })
            ])
        ).start();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Blob */}
            <View style={styles.bgBlob} />

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
                    <View style={styles.glassCircle}>
                        {/* Brackets */}
                        <Animated.View style={[styles.bracket, styles.bracketTL, { opacity: pulseAnim }]} />
                        <Animated.View style={[styles.bracket, styles.bracketTR, { opacity: pulseAnim }]} />
                        <Animated.View style={[styles.bracket, styles.bracketBL, { opacity: pulseAnim }]} />
                        <Animated.View style={[styles.bracket, styles.bracketBR, { opacity: pulseAnim }]} />

                        {/* Main Image */}
                        <View style={styles.imageContainer}>
                            <Image
                                source={{ uri: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop" }}
                                style={styles.mainImage}
                                contentFit="cover"
                            />
                        </View>
                    </View>

                    {/* Floating Icons */}
                    <Animated.View style={[styles.floatingIcon, styles.icon1, { transform: [{ translateY: floatAnim1 }] }]}>
                        <Ionicons name="camera" size={26} color={Colors.primary} />
                    </Animated.View>

                    <Animated.View style={[styles.floatingIcon, styles.icon2, { transform: [{ translateY: floatAnim2 }] }]}>
                        <Ionicons name="barcode-outline" size={24} color={Colors.text} />
                    </Animated.View>

                    <Animated.View style={[styles.floatingIcon, styles.icon3, { transform: [{ translateY: floatAnim3 }] }]}>
                        <Ionicons name="document-text-outline" size={24} color={Colors.text} />
                    </Animated.View>

                    <Animated.View style={[styles.floatingIcon, styles.icon4, { transform: [{ translateY: floatAnim1 }] }]}>
                        <Ionicons name="mic-outline" size={24} color={Colors.text} />
                    </Animated.View>
                </View>

                {/* Text Content */}
                <Animated.View style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateY: slideUpAnim }] }]}>
                    <Text style={styles.title}>Ghi chép siêu tốc</Text>
                    <Text style={styles.description}>
                        Quét món ăn, mã vạch, nhãn dán hay chỉ cần ra lệnh bằng giọng nói. <Text style={styles.descriptionBold}>NeuraX</Text> tích hợp mọi cách thức để việc theo dõi trở nên dễ dàng nhất.
                    </Text>
                </Animated.View>
            </View>

            {/* Footer Action */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/onboarding/walkthrough2')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>Tiếp tục</Text>
                </TouchableOpacity>

                {/* Progress Indicators */}
                <View style={styles.progressRow}>
                    <View style={[styles.progressDot, styles.progressActive]} />
                    <View style={styles.progressDot} />
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
    bgBlob: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(27, 40, 56, 0.05)',
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
        height: 300,
        marginBottom: 40,
    },
    glassCircle: {
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#191C1E',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.06,
        shadowRadius: 40,
        elevation: 10,
    },
    bracket: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: Colors.primary,
    },
    bracketTL: { top: 30, left: 30, borderTopWidth: 2, borderLeftWidth: 2 },
    bracketTR: { top: 30, right: 30, borderTopWidth: 2, borderRightWidth: 2 },
    bracketBL: { bottom: 30, left: 30, borderBottomWidth: 2, borderLeftWidth: 2 },
    bracketBR: { bottom: 30, right: 30, borderBottomWidth: 2, borderRightWidth: 2 },
    imageContainer: {
        width: 200,
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
    },
    mainImage: {
        width: '100%',
        height: '100%',
    },
    statusLabel: {
        display: 'none',
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 1.5,
    },
    floatingIcon: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.9)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    icon1: { top: 20, right: 20 },
    icon2: { top: '50%', left: -5, marginTop: -25 },
    icon3: { bottom: 10, right: 30 },
    icon4: { bottom: 40, left: 20 },
    textContainer: {
        marginTop: 20,
    },
    phaseLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.primary,
        marginBottom: 16,
    },
    description: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: 24,
    },
    descriptionBold: {
        fontWeight: '700',
        color: Colors.text,
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
        marginBottom: 12,
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
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    }
});
