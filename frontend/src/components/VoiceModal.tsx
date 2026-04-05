import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, Animated, Dimensions, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { voiceToFood, NutritionInfo } from '../services/aiService';
import { startRecording, stopRecording, cancelRecording } from '../services/audioService';
import { useRouter } from 'expo-router';
import { useAppLanguage } from '../i18n/LanguageProvider';

const { width } = Dimensions.get('window');

interface VoiceModalProps {
    visible: boolean;
    onClose: () => void;
    onFoodDetected?: (foodData: NutritionInfo) => void;
}

export function VoiceModal({ visible, onClose, onFoodDetected }: VoiceModalProps) {
    const router = useRouter();
    const { t } = useAppLanguage();
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const waveAnims = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [foodData, setFoodData] = useState<NutritionInfo | null>(null);

    useEffect(() => {
        if (visible) {
            setListening(false);
            setTranscript('');
            setFoodData(null);
            setAnalyzing(false);
        }
    }, [visible]);

    const startListening = async () => {
        setListening(true);
        setTranscript('');
        setFoodData(null);

        // Start audio recording
        console.log('VoiceModal: Starting audio recording...');
        const started = await startRecording();

        if (!started) {
            console.error('VoiceModal: Failed to start recording');
            Alert.alert(t('common.error'), t('voice.error.cantStartRecording'));
            setListening(false);
            return;
        }
        console.log('VoiceModal: Recording started successfully');

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        ).start();

        // Wave bars
        waveAnims.forEach((anim, i) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 120),
                    Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: false }),
                    Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: false }),
                ])
            ).start();
        });
    };

    const stopListening = async () => {
        setListening(false);
        pulseAnim.stopAnimation();
        waveAnims.forEach(a => a.stopAnimation());

        // Stop recording and get audio URI
        setAnalyzing(true);
        console.log('VoiceModal: Stopping recording...');
        const result = await stopRecording();

        if (!result.success || !result.uri) {
            Alert.alert(t('common.error'), result.error || t('voice.error.cantSaveRecording'));
            setAnalyzing(false);
            return;
        }

        // Transcribe requires minimum 0.5s audio
        if (result.duration && result.duration < 1000) {
            Alert.alert(t('common.error'), t('voice.error.tooShort'));
            setAnalyzing(false);
            return;
        }

        try {
            // Single call: S3 upload → Transcribe → Qwen parse
            const voiceResult = await voiceToFood(result.uri);

            if (voiceResult.success && voiceResult.data) {
                if (voiceResult.transcript) setTranscript(voiceResult.transcript);
                setFoodData(voiceResult.data);
            } else if (voiceResult.transcript) {
                // AI nhận diện được giọng nói nhưng cần hỏi thêm (clarify)
                Alert.alert(
                    `🎙️ "${voiceResult.transcript}"`,
                    voiceResult.error || t('voice.error.cantAnalyze'),
                );
            } else {
                Alert.alert(t('common.error'), voiceResult.error || t('voice.error.cantAnalyze'));
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('voice.error.analysisFailed'));
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAddMeal = () => {
        if (foodData) {
            // Navigate to add meal screen with food data
            router.push({
                pathname: '/food-detail',
                params: {
                    foodData: JSON.stringify(foodData),
                    source: 'voice'
                }
            });
            onClose();
        }
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={vStyles.overlay}>
                <View style={vStyles.sheet}>
                    {/* Handle */}
                    <View style={vStyles.handle} />

                    <Text style={vStyles.title}>{t('voice.title')}</Text>
                    <Text style={vStyles.subtitle}>
                        {analyzing
                            ? t('voice.analyzing')
                            : listening
                                ? t('voice.listening')
                                : t('voice.instruction')}
                    </Text>

                    {/* Mic button */}
                    <Animated.View style={[vStyles.micOuter, { transform: [{ scale: listening ? pulseAnim : 1 }] }]}>
                        <TouchableOpacity
                            style={[vStyles.micBtn, listening && vStyles.micBtnActive]}
                            onPress={listening ? stopListening : startListening}
                            activeOpacity={0.8}
                        >
                            <Ionicons name={listening ? 'stop' : 'mic'} size={40} color="#FFF" />
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Wave bars */}
                    {listening && (
                        <View style={vStyles.waveContainer}>
                            {waveAnims.map((anim, i) => (
                                <Animated.View
                                    key={i}
                                    style={[vStyles.waveBar, {
                                        height: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 40] }),
                                    }]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Analyzing */}
                    {analyzing && (
                        <View style={vStyles.transcriptBox}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={vStyles.analyzingText}>{t('voice.analyzing')}</Text>
                        </View>
                    )}

                    {foodData && !analyzing && (
                        <View style={vStyles.transcriptBox}>
                            <Text style={vStyles.transcriptLabel}>{t('voice.detected')}</Text>
                            <Text style={vStyles.transcriptText}>"{foodData.name}"</Text>
                            <View style={vStyles.nutritionRow}>
                                <Text style={vStyles.nutritionItem}>🔥 {foodData.calories} kcal</Text>
                                <Text style={vStyles.nutritionItem}>🥩 {foodData.protein}g</Text>
                                <Text style={vStyles.nutritionItem}>🍚 {foodData.carbs}g</Text>
                                <Text style={vStyles.nutritionItem}>🥑 {foodData.fat}g</Text>
                            </View>
                            <TouchableOpacity style={vStyles.searchBtn} onPress={handleAddMeal}>
                                <Text style={vStyles.searchBtnText}>{t('voice.addFood')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {!!transcript && !foodData && !analyzing && (
                        <View style={vStyles.transcriptBox}>
                            <Text style={vStyles.transcriptLabel}>{t('voice.youSaid')}</Text>
                            <Text style={vStyles.transcriptText}>"{transcript}"</Text>
                        </View>
                    )}

                    <TouchableOpacity style={vStyles.closeBtn} onPress={onClose}>
                        <Text style={vStyles.closeBtnText}>{t('voice.close')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const vStyles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 32, borderTopRightRadius: 32,
        padding: 28, paddingBottom: 40,
        alignItems: 'center',
    },
    handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', marginBottom: 24 },
    title: { fontSize: 20, fontWeight: '800', color: Colors.primary, marginBottom: 6 },
    subtitle: { fontSize: 14, color: '#7F8C9B', marginBottom: 36, textAlign: 'center' },
    micOuter: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: 'rgba(27,40,56,0.06)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 24,
    },
    micBtn: {
        width: 90, height: 90, borderRadius: 45,
        backgroundColor: Colors.primary,
        justifyContent: 'center', alignItems: 'center',
    },
    micBtnActive: { backgroundColor: '#E74C3C' },
    waveContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        height: 50, marginBottom: 20,
    },
    waveBar: {
        width: 6, borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    transcriptBox: {
        backgroundColor: '#F5F6F8',
        borderRadius: 16, padding: 16,
        width: '100%', alignItems: 'center', marginBottom: 20,
    },
    transcriptLabel: { fontSize: 12, color: '#7F8C9B', marginBottom: 6 },
    transcriptText: { fontSize: 18, fontWeight: '700', color: Colors.primary, textAlign: 'center', marginBottom: 16 },
    searchBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: 28, paddingVertical: 12,
        borderRadius: 12,
    },
    searchBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
    analyzingText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 12,
    },
    nutritionRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
        justifyContent: 'center',
    },
    nutritionItem: {
        fontSize: 13,
        color: Colors.text,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    closeBtn: { marginTop: 8 },
    closeBtnText: { color: '#7F8C9B', fontSize: 15, fontWeight: '500' },
});
