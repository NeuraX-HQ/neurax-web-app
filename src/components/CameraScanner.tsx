import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Animated, Dimensions, Platform, Modal, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors } from '../constants/colors';
import { analyzeFoodImage, NutritionInfo } from '../services/geminiService';
import { useRouter } from 'expo-router';
import { LoadingAnalysis } from './LoadingAnalysis';
import { useAppLanguage } from '../i18n/LanguageProvider';

const { width } = Dimensions.get('window');

type CameraMode = 'AI Scan' | 'Barcode';

interface CameraScannerProps {
    visible: boolean;
    onClose: () => void;
    onAnalyzing?: (analyzing: boolean) => void;
}

export function CameraScanner({ visible, onClose, onAnalyzing }: CameraScannerProps) {
    const router = useRouter();
    const { t } = useAppLanguage();
    const cameraRef = useRef<any>(null);
    const webVideoRef = useRef<HTMLVideoElement | null>(null);
    const webStreamRef = useRef<MediaStream | null>(null);
    const [mode, setMode] = useState<CameraMode>('AI Scan');
    const [analyzing, setAnalyzing] = useState(false);
    const [foodData, setFoodData] = useState<NutritionInfo | null>(null);
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [webCameraReady, setWebCameraReady] = useState(false);

    // === WEB: Manage webcam stream via getUserMedia ===
    useEffect(() => {
        if (Platform.OS !== 'web' || !visible) return;

        let stream: MediaStream | null = null;

        const startWebCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false,
                });
                webStreamRef.current = stream;

                // Wait for the video element to be mounted
                const checkVideo = setInterval(() => {
                    if (webVideoRef.current) {
                        clearInterval(checkVideo);
                        webVideoRef.current.srcObject = stream;
                        webVideoRef.current.play().then(() => {
                            setWebCameraReady(true);
                            console.log('Web camera stream active!');
                        });
                    }
                }, 100);

                // Timeout after 3s
                setTimeout(() => clearInterval(checkVideo), 3000);
            } catch (err) {
                console.error('Web getUserMedia error:', err);
                Alert.alert(t('camera.error.title'), t('camera.error.noAccess'));
            }
        };

        startWebCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            webStreamRef.current = null;
            setWebCameraReady(false);
        };
    }, [visible]);

    // Web: capture frame from video via canvas
    const captureWebFrame = useCallback((): string | null => {
        const video = webVideoRef.current;
        if (!video || video.videoWidth === 0) return null;

        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(video, 0, 0);
        // Get base64 JPEG, strip the data URL prefix
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        return dataUrl.split(',')[1] || null;
    }, []);

    const handleCapture = async () => {
        if (analyzing) return;

        setAnalyzing(true);
        onAnalyzing?.(true);
        setFoodData(null);

        try {
            let base64Data: string | null = null;
            let imageUri: string | undefined;

            if (Platform.OS === 'web') {
                // === WEB: Capture frame from live video via canvas ===
                console.log('Web: Capturing frame from webcam...');
                base64Data = captureWebFrame();
                if (!base64Data) {
                    throw new Error(t('camera.error.captureWebcam'));
                }
            } else {
                // === NATIVE: Use ImagePicker for reliable camera ===
                onClose(); // Close modal before launching native camera

                console.log('Native: Launching camera via ImagePicker...');
                const result = await ImagePicker.launchCameraAsync({
                    mediaTypes: ['images'],
                    quality: 0.6,
                    base64: true,
                    allowsEditing: false,
                });

                if (result.canceled || !result.assets || result.assets.length === 0) {
                    console.log('Camera cancelled by user');
                    return;
                }

                const asset = result.assets[0];
                base64Data = asset.base64 || null;
                imageUri = asset.uri;

                // If base64 not available, read from file system
                if (!base64Data && asset.uri) {
                    console.log('Reading photo as base64 from file...');
                    base64Data = await FileSystem.readAsStringAsync(asset.uri, {
                        encoding: 'base64' as any,
                    });
                }
            }

            if (!base64Data) {
                throw new Error(t('camera.error.readData'));
            }

            console.log('Base64 ready, length:', base64Data.length);
            console.log('Sending to Gemini for analysis...');

            // Analyze with Gemini
            const analysisResult = await analyzeFoodImage(base64Data);

            console.log('Gemini result:', { success: analysisResult.success, hasData: !!analysisResult.data });

            if (analysisResult.success && analysisResult.data) {
                setFoodData(analysisResult.data);
                onClose(); // Close camera on web after success
                router.push({
                    pathname: '/food-detail',
                    params: {
                        foodData: JSON.stringify(analysisResult.data),
                        source: 'camera',
                        image: imageUri || '',
                    }
                });
            } else {
                Alert.alert(t('common.error'), analysisResult.error || t('camera.error.analysisError'));
            }
        } catch (error) {
            console.error('Camera capture error:', error);
            Alert.alert(
                t('camera.error.captureTitle'),
                error instanceof Error ? error.message : t('camera.error.captureFailed')
            );
        } finally {
            setAnalyzing(false);
            onAnalyzing?.(false);
        }
    };

    const modes: CameraMode[] = ['Barcode', 'AI Scan'];

    if (!permission) return null;

    if (!permission.granted && visible) {
        return (
            <Modal visible={visible} animationType="slide">
                <View style={[camStyles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                    <Text style={{ color: '#FFF', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
                        {t('camera.needPermission')}
                    </Text>
                    <TouchableOpacity
                        style={{ backgroundColor: '#2ECC71', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                        onPress={requestPermission}
                    >
                        <Text style={{ color: '#FFF', fontWeight: '700' }}>{t('camera.grantPermission')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
                        <Text style={{ color: 'rgba(255,255,255,0.6)' }}>{t('common.back')}</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={camStyles.container}>
                {/* Camera: HTML5 video on Web, CameraView on Native */}
                {Platform.OS === 'web' ? (
                    <video
                        ref={(el: any) => { webVideoRef.current = el; }}
                        autoPlay
                        playsInline
                        muted
                        style={{
                            position: 'absolute' as any,
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover' as any,
                            zIndex: 0,
                        }}
                    />
                ) : (
                    <CameraView
                        ref={cameraRef}
                        style={camStyles.cameraArea}
                        facing="back"
                        onCameraReady={() => {
                            console.log('Camera is ready!');
                            setIsCameraReady(true);
                        }}
                        onMountError={(error) => {
                            console.error('Camera mount error:', error);
                            Alert.alert(t('camera.error.title'), t('camera.error.initFailed'));
                        }}
                    />
                )}

                {/* Overlays - Positioned absolutely */}
                <View style={camStyles.scanFrame}>
                    <View style={[camStyles.corner, camStyles.cornerTL]} />
                    <View style={[camStyles.corner, camStyles.cornerTR]} />
                    <View style={[camStyles.corner, camStyles.cornerBL]} />
                    <View style={[camStyles.corner, camStyles.cornerBR]} />
                    <Ionicons name="scan-outline" size={32} color="rgba(255,255,255,0.5)" style={camStyles.focusIcon} />
                </View>

                {analyzing && (
                    <View style={camStyles.analyzingBanner}>
                        <Ionicons name="nutrition-outline" size={22} color="#FFF" />
                        <View>
                            <Text style={camStyles.analyzingTitle}>{t('camera.analyzing')}</Text>
                            <Text style={camStyles.analyzingDesc}>{t('camera.holdSteady')}</Text>
                        </View>
                    </View>
                )}

                <SafeAreaView style={camStyles.overlayHeader}>
                    <View style={camStyles.header}>
                        <TouchableOpacity style={camStyles.iconBtn} onPress={onClose}>
                            <Ionicons name="close" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <View style={camStyles.aiBadge}>
                            <View style={camStyles.dot} />
                            <Text style={camStyles.aiText}>AI ACTIVE</Text>
                        </View>
                        <TouchableOpacity style={camStyles.iconBtn}>
                            <Ionicons name="ellipsis-horizontal" size={22} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                <View style={camStyles.overlayBottom}>
                    <View style={camStyles.modeTabs}>
                        {modes.map(m => (
                            <TouchableOpacity key={m} style={camStyles.modeTab} onPress={() => setMode(m)}>
                                <Text style={[camStyles.modeText, mode === m && camStyles.modeTextActive]}>{m === 'AI Scan' ? t('camera.mode.aiScan') : t('camera.mode.barcode')}</Text>
                                {mode === m && <View style={camStyles.modeUnderline} />}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={camStyles.controls}>
                        <TouchableOpacity style={camStyles.sideBtn}>
                            <Ionicons name="images-outline" size={22} color="#FFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={camStyles.captureBtn} onPress={handleCapture} activeOpacity={0.85}>
                            <View style={camStyles.captureBtnInner} />
                        </TouchableOpacity>
                        <TouchableOpacity style={camStyles.flashBtn}>
                            <Ionicons name="flash" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const camStyles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0A0A0A' },
    overlayHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
    overlayBottom: {
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
        paddingBottom: Platform.OS === 'ios' ? 32 : 20, alignItems: 'center',
    },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
    },
    iconBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center', alignItems: 'center',
    },
    aiBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(20,20,20,0.85)',
        borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2ECC71' },
    aiText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
    cameraArea: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    scanFrame: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -110 - 85, // Half height + offset
        marginLeft: -(width * 0.72) / 2, // Half width
        width: width * 0.72,
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginBottom: 170,
    },
    corner: { position: 'absolute', width: 36, height: 36, borderColor: '#FFF', borderWidth: 3 },
    cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
    cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
    cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
    cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
    focusIcon: { opacity: 0.4 },
    analyzingBanner: {
        position: 'absolute', bottom: 20,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 16, paddingHorizontal: 20, paddingVertical: 14,
    },
    analyzingTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
    analyzingDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    modeTabs: { flexDirection: 'row', gap: 4, marginBottom: 24 },
    modeTab: { paddingHorizontal: 20, paddingVertical: 8, alignItems: 'center' },
    modeText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600' },
    modeTextActive: { color: '#FFF', fontWeight: '700' },
    modeUnderline: { position: 'absolute', bottom: 0, width: 24, height: 2, backgroundColor: '#FFF', borderRadius: 1 },
    controls: { flexDirection: 'row', alignItems: 'center', gap: 44, marginBottom: 16 },
    sideBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    flashBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
    captureBtn: {
        width: 76, height: 76, borderRadius: 38,
        borderWidth: 3.5, borderColor: '#FFF',
        justifyContent: 'center', alignItems: 'center',
    },
    captureBtnInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFF' },
});
