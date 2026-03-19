import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Dimensions, Platform, Modal, Alert, StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { analyzeFoodImage, NutritionInfo } from '../services/geminiService';
import { useRouter } from 'expo-router';
import { useAppLanguage } from '../i18n/LanguageProvider';
import { BlurView } from 'expo-blur';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Emerald accent — primary-container from mockup
const EMERALD = '#10b981';
const EMERALD_DIM = 'rgba(16,185,129,0.15)';

type ScanMode = 'FOOD' | 'BARCODE' | 'LABEL';

interface CameraScannerProps {
    visible: boolean;
    onClose: () => void;
    onAnalyzing?: (analyzing: boolean) => void;
}

export function CameraScanner({ visible, onClose, onAnalyzing }: CameraScannerProps) {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t } = useAppLanguage();
    const cameraRef = useRef<any>(null);
    const webVideoRef = useRef<HTMLVideoElement | null>(null);
    const webStreamRef = useRef<MediaStream | null>(null);

    const [mode, setMode] = useState<ScanMode>('FOOD');
    const [analyzing, setAnalyzing] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [webCameraReady, setWebCameraReady] = useState(false);

    // Scanning line animation for BARCODE mode
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const scanLineLoop = useRef<Animated.CompositeAnimation | null>(null);

    // Dot pulse animation for LABEL mode
    const dotPulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (mode === 'BARCODE') {
            scanLineLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(scanLineAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
                    Animated.timing(scanLineAnim, { toValue: 0, duration: 1800, useNativeDriver: true }),
                ])
            );
            scanLineLoop.current.start();
        } else {
            scanLineLoop.current?.stop();
            scanLineAnim.setValue(0.5);
        }

        if (mode === 'LABEL') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dotPulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
                    Animated.timing(dotPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [mode]);

    // WEB: Manage webcam stream
    useEffect(() => {
        if (Platform.OS !== 'web' || !visible) return;
        let stream: MediaStream | null = null;
        const startWebCamera = async () => {
            try {
                stream = await (navigator as any).mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                webStreamRef.current = stream;
                const checkVideo = setInterval(() => {
                    if (webVideoRef.current) {
                        clearInterval(checkVideo);
                        webVideoRef.current.srcObject = stream;
                        webVideoRef.current.play().then(() => setWebCameraReady(true));
                    }
                }, 100);
                setTimeout(() => clearInterval(checkVideo), 3000);
            } catch (err) {
                Alert.alert(t('camera.error.title'), t('camera.error.noAccess'));
            }
        };
        startWebCamera();
        return () => {
            stream?.getTracks().forEach(t => t.stop());
            webStreamRef.current = null;
            setWebCameraReady(false);
        };
    }, [visible]);

    const captureWebFrame = useCallback((): string | null => {
        const video = webVideoRef.current;
        if (!video || video.videoWidth === 0) return null;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        ctx.drawImage(video, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        return dataUrl.split(',')[1] || null;
    }, []);

    const handleCapture = async () => {
        if (analyzing) return;
        setAnalyzing(true);
        onAnalyzing?.(true);

        try {
            let base64Data: string | null = null;
            let imageUri: string | undefined;

            if (Platform.OS === 'web') {
                base64Data = captureWebFrame();
                if (!base64Data) throw new Error(t('camera.error.captureWebcam'));
            } else {
                onClose();
                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.6,
                    base64: true,
                    allowsEditing: false,
                });
                if (result.canceled || !result.assets?.length) return;
                const asset = result.assets[0];
                base64Data = asset.base64 || null;
                imageUri = asset.uri;
                if (!base64Data && asset.uri) {
                    base64Data = await FileSystem.readAsStringAsync(asset.uri, { encoding: 'base64' as any });
                }
            }

            if (!base64Data) throw new Error(t('camera.error.readData'));

            const analysisResult = await analyzeFoodImage(base64Data);
            if (analysisResult.success && analysisResult.data) {
                onClose();
                router.push({
                    pathname: '/food-detail',
                    params: { foodData: JSON.stringify(analysisResult.data), source: 'camera', image: imageUri || '' },
                });
            } else {
                Alert.alert(t('common.error'), analysisResult.error || t('camera.error.analysisError'));
            }
        } catch (error) {
            Alert.alert(t('camera.error.captureTitle'), error instanceof Error ? error.message : t('camera.error.captureFailed'));
        } finally {
            setAnalyzing(false);
            onAnalyzing?.(false);
        }
    };

    if (!permission) return null;

    if (!permission.granted && visible) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={[s.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
                    <Ionicons name="camera-outline" size={52} color={EMERALD} />
                    <Text style={{ color: '#FFF', fontSize: 16, textAlign: 'center', marginVertical: 20, lineHeight: 24 }}>
                        {t('camera.needPermission')}
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: EMERALD, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 }}
                        onPress={requestPermission}
                    >
                        <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>{t('camera.grantPermission')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    // ── Viewfinder dimensions per mode ──────────────────────────────
    const isBarcode = mode === 'BARCODE';
    const isLabel   = mode === 'LABEL';
    const isFood    = mode === 'FOOD';

    // BARCODE: wide rectangle; LABEL: portrait rect; FOOD: square
    const frameW = isBarcode ? SCREEN_W * 0.85 : SCREEN_W * 0.72;
    const frameH = isBarcode ? SCREEN_H * 0.22 : isLabel ? SCREEN_H * 0.45 : SCREEN_H * 0.40;

    const scanLineTranslate = scanLineAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, frameH - 2],
    });

    return (
        <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
            <View style={s.container}>

                {/* ── Camera feed ──────────────────────────────────────── */}
                {Platform.OS === 'web' ? (
                    <video
                        ref={(el: any) => { webVideoRef.current = el; }}
                        autoPlay playsInline muted
                        style={{ position: 'absolute' as any, inset: 0, width: '100%', height: '100%', objectFit: 'cover' as any }}
                    />
                ) : (
                    <CameraView
                        ref={cameraRef}
                        style={StyleSheet.absoluteFill}
                        facing="back"
                        onCameraReady={() => setIsCameraReady(true)}
                        onMountError={() => Alert.alert(t('camera.error.title'), t('camera.error.initFailed'))}
                    />
                )}


                {/* ══ HEADER ══════════════════════════════════════════════ */}
                <SafeAreaView style={s.headerWrap} edges={['top']}>
                    <BlurView intensity={Platform.OS === 'ios' ? 30 : 60} tint="dark" style={s.header}>
                        {/* Close */}
                        <TouchableOpacity style={s.headerIconBtn} onPress={onClose} activeOpacity={0.75}>
                            <Ionicons name="close" size={22} color="rgba(255,255,255,0.85)" />
                        </TouchableOpacity>

                        {/* Title */}
                        <Text style={s.headerTitle}>PRECISION SCAN</Text>

                        {/* Right placeholder — NO flashlight per spec */}
                        <View style={{ width: 38 }} />
                    </BlurView>
                </SafeAreaView>

                {/* ══ VIEWFINDER ═══════════════════════════════════════════ */}
                <View style={s.viewfinderArea} pointerEvents="none">
                    {/* HUD top-left */}
                    {isFood && (
                        <View style={s.hudTopLeft}>
                            <Text style={s.hudLabel}>FOCUS: OPTIMAL</Text>
                        </View>
                    )}
                    {isBarcode && (
                        <View style={s.hudTopLeft}>
                            <Text style={s.hudMini}>MODE</Text>
                            <Text style={s.hudValue}>BARCODE_DETECTION_v2</Text>
                        </View>
                    )}

                    {/* Corner bracket frame */}
                    <View style={[s.frame, { width: frameW, height: frameH }]}>
                        <View style={[s.corner, s.cornerTL]} />
                        <View style={[s.corner, s.cornerTR]} />
                        <View style={[s.corner, s.cornerBL]} />
                        <View style={[s.corner, s.cornerBR]} />

                        {/* Center circle (food only) */}
                        {isFood && <View style={s.focusDot} />}

                        {/* Animated scan line (barcode + label) */}
                        {(isBarcode || isLabel) && (
                            <Animated.View
                                style={[
                                    s.scanLine,
                                    { transform: [{ translateY: scanLineTranslate }] },
                                ]}
                            />
                        )}

                        {/* LABEL: animated glow pulse dot in center */}
                        {isLabel && (
                            <Animated.View style={[s.labelPulseDot, { transform: [{ scale: dotPulse }] }]} />
                        )}
                    </View>

                    {/* HUD bottom hint */}
                    {isBarcode && (
                        <View style={s.hudBottomCenter}>
                            <Text style={s.frameHint}>Align barcode within the frame</Text>
                        </View>
                    )}
                    {isLabel && (
                        <View style={[s.labelPill, { marginTop: 20 }]}>
                            <View style={s.labelPingDot} />
                            <Text style={s.labelPillText}>Scanning Nutrition Label...</Text>
                        </View>
                    )}
                    {isFood && (
                        <View style={s.hudBottomRight}>
                            <Text style={s.hudLabel}>AI_DETECTION: ACTIVE</Text>
                        </View>
                    )}
                </View>

                {/* ══ CONTROLS ════════════════════════════════════════════ */}
                <View style={[s.controlsWrap, { paddingBottom: insets.bottom + 90 }]}>


                    {/* Shutter row */}
                    <View style={s.shutterRow}>
                        {/* Gallery */}
                        <TouchableOpacity style={s.sideBtn} activeOpacity={0.75}>
                            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                            <Ionicons name="images-outline" size={22} color="#FFF" style={{ zIndex: 1 }} />
                        </TouchableOpacity>

                        {/* Shutter / capture */}
                        {isFood ? (
                            // Food: white circle shutter
                            <TouchableOpacity
                                style={s.shutterFood}
                                onPress={handleCapture}
                                activeOpacity={0.85}
                            >
                                <View style={s.shutterFoodInner} />
                            </TouchableOpacity>
                        ) : isBarcode ? (
                            // Barcode: dark circle with barcode icon + green glow
                            <TouchableOpacity
                                style={s.shutterBarcode}
                                onPress={handleCapture}
                                activeOpacity={0.85}
                            >
                                <Ionicons name="barcode-outline" size={28} color="#FFF" />
                            </TouchableOpacity>
                        ) : (
                            // Label: white blur button with sparkles icon
                            <TouchableOpacity
                                style={s.shutterLabel}
                                onPress={handleCapture}
                                activeOpacity={0.85}
                            >
                                <View style={s.shutterLabelInner}>
                                    <Ionicons name="sparkles" size={28} color="#1B2838" />
                                </View>
                            </TouchableOpacity>
                        )}

                        {/* Flash/zoom */}
                        <TouchableOpacity style={s.sideBtn} activeOpacity={0.75}>
                            <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
                            <Ionicons
                                name={isBarcode ? 'add-circle-outline' : 'flash-outline'}
                                size={22}
                                color="#FFF"
                                style={{ zIndex: 1 }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ══ BOTTOM MODE NAV ══════════════════════════════════════ */}
                <View style={[s.bottomNav, { paddingBottom: insets.bottom + 4 }]}>
                    <BlurView intensity={Platform.OS === 'ios' ? 50 : 80} tint="dark" style={StyleSheet.absoluteFill} />
                    {([ 
                        { id: 'FOOD',    icon: 'camera-outline',   iconActive: 'camera',        label: 'FOOD'    },
                        { id: 'BARCODE', icon: 'barcode-outline',   iconActive: 'barcode',       label: 'BARCODE' },
                        { id: 'LABEL',   icon: 'document-outline',  iconActive: 'document-text', label: 'LABEL'   },
                    ] as const).map(tab => {
                        const active = mode === tab.id;
                        return (
                            <TouchableOpacity
                                key={tab.id}
                                style={[s.navTab, active && s.navTabActive]}
                                onPress={() => setMode(tab.id)}
                                activeOpacity={0.75}
                            >
                                <Ionicons
                                    name={active ? tab.iconActive : tab.icon}
                                    size={22}
                                    color={active ? EMERALD : 'rgba(255,255,255,0.45)'}
                                />
                                <Text style={[s.navLabel, active && s.navLabelActive]}>{tab.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Analyzing overlay */}
                {analyzing && (
                    <View style={s.analyzingOverlay}>
                        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={s.analyzingDot} />
                        <Text style={s.analyzingText}>AI ANALYZING...</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },

    // ── Header
    headerWrap: {
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 14,
    },
    headerIconBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center', alignItems: 'center',
    },
    headerTitle: {
        color: EMERALD, fontSize: 11, fontWeight: '800',
        letterSpacing: 4, textTransform: 'uppercase',
    },

    // ── Viewfinder
    viewfinderArea: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2,
        justifyContent: 'center', alignItems: 'center',
    },
    frame: {
        position: 'relative', justifyContent: 'center', alignItems: 'center',
        overflow: 'hidden',
    },

    // Corner brackets — emerald, 2pt
    corner: {
        position: 'absolute', width: 40, height: 40,
        borderColor: EMERALD, borderWidth: 2,
    },
    cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

    // Focus dot
    focusDot: {
        width: 16, height: 16, borderRadius: 8,
        borderWidth: 1, borderColor: 'rgba(16,185,129,0.4)',
    },

    // Barcode scan line
    scanLine: {
        position: 'absolute', left: 0, right: 0, height: 2,
        backgroundColor: EMERALD,
        shadowColor: EMERALD,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 8,
    },

    // Label pulse dot
    labelPulseDot: {
        width: 16, height: 16, borderRadius: 8,
        backgroundColor: EMERALD,
        opacity: 0.6,
    },

    // HUD misc
    hudTopLeft: {
        position: 'absolute', top: '12%', left: 20, alignItems: 'flex-start',
    },
    hudBottomRight: {
        position: 'absolute', bottom: '12%', right: 20, alignItems: 'flex-end',
    },
    hudBottomCenter: {
        marginTop: 16,
    },
    hudLabel: {
        color: EMERALD, fontSize: 9, fontWeight: '800',
        letterSpacing: 3, textTransform: 'uppercase',
    },
    hudMini: {
        color: 'rgba(255,255,255,0.45)', fontSize: 8,
        letterSpacing: 3, fontWeight: '600', textTransform: 'uppercase',
    },
    hudValue: {
        color: EMERALD, fontSize: 9, fontWeight: '800',
        letterSpacing: 2, textTransform: 'uppercase', marginTop: 2,
    },
    frameHint: {
        color: 'rgba(255,255,255,0.75)', fontSize: 12,
        fontWeight: '500', letterSpacing: 0.5,
    },

    // Label scanning pill
    labelPill: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(15,23,42,0.55)',
        paddingHorizontal: 18, paddingVertical: 8,
        borderRadius: 99, borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    labelPingDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: EMERALD,
    },
    labelPillText: {
        color: '#FFF', fontSize: 10, fontWeight: '700',
        letterSpacing: 2, textTransform: 'uppercase',
    },

    // Mode dots row (Food mode)
    modeDotsRow: {
        flexDirection: 'row', alignItems: 'center', gap: 32, marginBottom: 28,
    },
    modeActivePill: { alignItems: 'center' },
    modeDotActive: {
        color: EMERALD, fontSize: 10, fontWeight: '800', letterSpacing: 3,
    },
    modeDotIndicator: {
        width: 4, height: 4, borderRadius: 2, backgroundColor: EMERALD, marginTop: 4,
    },
    modeDotInactive: {
        color: 'rgba(255,255,255,0.35)', fontSize: 10, fontWeight: '700', letterSpacing: 3,
    },

    // ── Controls
    controlsWrap: {
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        alignItems: 'center',
    },
    shutterRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 40,
    },
    sideBtn: {
        width: 48, height: 48, borderRadius: 12,
        overflow: 'hidden', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },

    // FOOD shutter
    shutterFood: {
        width: 80, height: 80, borderRadius: 40,
        borderWidth: 3.5, borderColor: '#FFF',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'transparent',
    },
    shutterFoodInner: {
        width: 64, height: 64, borderRadius: 32,
        backgroundColor: '#FFF',
    },

    // BARCODE shutter
    shutterBarcode: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: '#191c1e',
        borderWidth: 4, borderColor: EMERALD,
        justifyContent: 'center', alignItems: 'center',
        shadowColor: EMERALD,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 18,
        elevation: 10,
    },

    // LABEL shutter
    shutterLabel: {
        width: 80, height: 80, borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
        padding: 5,
        justifyContent: 'center', alignItems: 'center',
    },
    shutterLabelInner: {
        flex: 1, borderRadius: 35,
        backgroundColor: '#FFF',
        justifyContent: 'center', alignItems: 'center',
        width: '100%',
    },

    // ── Bottom nav
    bottomNav: {
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
        flexDirection: 'row', justifyContent: 'space-around',
        alignItems: 'center',
        paddingTop: 12,
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    },
    navTab: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 8, paddingHorizontal: 8, gap: 4,
        borderRadius: 12, marginHorizontal: 4,
    },
    navTabActive: {
        backgroundColor: EMERALD_DIM,
    },
    navLabel: {
        fontSize: 9, fontWeight: '700', letterSpacing: 2,
        color: 'rgba(255,255,255,0.40)', textTransform: 'uppercase',
    },
    navLabelActive: {
        color: EMERALD,
    },

    // Analyzing overlay
    analyzingOverlay: {
        position: 'absolute', bottom: 160, left: '50%',
        transform: [{ translateX: -90 }],
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderRadius: 99, paddingHorizontal: 20, paddingVertical: 10,
        overflow: 'hidden', zIndex: 100,
        width: 180,
    },
    analyzingDot: {
        width: 8, height: 8, borderRadius: 4, backgroundColor: EMERALD, zIndex: 1,
    },
    analyzingText: {
        color: '#FFF', fontSize: 10, fontWeight: '800',
        letterSpacing: 2, zIndex: 1,
    },
});
