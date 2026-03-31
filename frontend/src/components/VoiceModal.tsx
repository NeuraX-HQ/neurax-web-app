import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Modal, Animated, Dimensions, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { parseVoiceToFood, transcribeAudio, VoiceAnalysisData } from '../services/geminiService';
import { startRecording, stopRecording, cancelRecording } from '../services/audioService';
import { useRouter } from 'expo-router';
import { useAppLanguage } from '../i18n/LanguageProvider';

const { width } = Dimensions.get('window');

interface VoiceModalProps {
    visible: boolean;
    onClose: () => void;
}

export function VoiceModal({ visible, onClose }: VoiceModalProps) {
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
    const [transcribing, setTranscribing] = useState(false);
    const [voiceResult, setVoiceResult] = useState<VoiceAnalysisData | null>(null);

    useEffect(() => {
        if (visible) {
            setListening(false);
            setTranscript('');
            setVoiceResult(null);
            setAnalyzing(false);
            setTranscribing(false);
        }
    }, [visible]);

    const startListening = async () => {
        setListening(true);
        setTranscript('');
        setVoiceResult(null);

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

        // Stop recording and get audio
        setTranscribing(true);
        console.log('VoiceModal: Stopping recording...');
        const result = await stopRecording();
        console.log('VoiceModal: Stop result:', { success: result.success, hasBase64: !!result.base64, base64Length: result.base64?.length, error: result.error });

        if (!result.success || !result.base64) {
            Alert.alert(t('common.error'), result.error || t('voice.error.cantSaveRecording'));
            setTranscribing(false);
            return;
        }

        // Transcribe audio with Gemini
        console.log('VoiceModal: Sending audio to Gemini for transcription...');
        const transcription = await transcribeAudio(result.base64);
        console.log('VoiceModal: Transcription result:', { success: transcription.success, text: transcription.text, error: transcription.error });

        if (!transcription.success || !transcription.text) {
            Alert.alert(t('common.error'), transcription.error || t('voice.error.cantTranscribe'));
            setTranscribing(false);
            return;
        }

        setTranscript(transcription.text);
        setTranscribing(false);

        // Analyze the transcribed text
        console.log('VoiceModal: Analyzing transcribed text:', transcription.text);
        analyzeVoiceInput(transcription.text);
    };

    const analyzeVoiceInput = async (text: string) => {
        setAnalyzing(true);

        try {
            const result = await parseVoiceToFood(text);

            if (result.success && result.data) {
                setVoiceResult(result.data);
            } else {
                Alert.alert(t('common.error'), result.error || t('voice.error.cantAnalyze'));
            }
        } catch (error) {
            Alert.alert(t('common.error'), t('voice.error.analysisFailed'));
        } finally {
            setAnalyzing(false);
        }
    };

    const handleAction = () => {
        if (!voiceResult) return;

        if (voiceResult.intent === 'log_food' && voiceResult.food_data) {
            router.push({
                pathname: '/food-detail',
                params: {
                    foodData: JSON.stringify(voiceResult.food_data),
                    source: 'voice'
                }
            });
        } else if (voiceResult.intent === 'log_water' && voiceResult.water_ml) {
            // For now, since we don't know the exact water handling route, just go to home or hydration
            router.push('/(tabs)/home'); // Could be /hydration later
        } else {
            // ask_coach or unknown
            router.push({
                pathname: '/(tabs)/ai-coach',
                params: {
                    initialQuery: voiceResult.coach_query || transcript
                }
            });
        }
        onClose();
    };

    return (
        <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
            <View style={vStyles.overlay}>
                <View style={vStyles.sheet}>
                    {/* Handle */}
                    <View style={vStyles.handle} />

                    <Text style={vStyles.title}>{t('voice.title')}</Text>
                    <Text style={vStyles.subtitle}>
                        {transcribing
                            ? t('voice.converting')
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

                    {/* Transcript */}
                    {transcribing && (
                        <View style={vStyles.transcriptBox}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={vStyles.analyzingText}>{t('voice.converting')}</Text>
                        </View>
                    )}

                    {analyzing && !transcribing && (
                        <View style={vStyles.transcriptBox}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={vStyles.analyzingText}>{t('voice.analyzing')}</Text>
                        </View>
                    )}

                    {voiceResult && !analyzing && !transcribing && (
                        <View style={vStyles.transcriptBox}>
                            <Text style={vStyles.transcriptLabel}>{t('voice.detected')}</Text>
                            <Text style={vStyles.transcriptText}>"{voiceResult.message || transcript}"</Text>
                            
                            {voiceResult.intent === 'log_food' && voiceResult.food_data && (
                                <View style={vStyles.nutritionRow}>
                                    <Text style={vStyles.nutritionItem}>🔥 {voiceResult.food_data.calories} kcal</Text>
                                    <Text style={vStyles.nutritionItem}>🥩 {voiceResult.food_data.protein}g</Text>
                                    <Text style={vStyles.nutritionItem}>🍚 {voiceResult.food_data.carbs}g</Text>
                                    <Text style={vStyles.nutritionItem}>🥑 {voiceResult.food_data.fat}g</Text>
                                </View>
                            )}

                            {voiceResult.intent === 'log_water' && voiceResult.water_ml && (
                                <View style={vStyles.nutritionRow}>
                                    <Text style={vStyles.nutritionItem}>💧 {voiceResult.water_ml} ml</Text>
                                </View>
                            )}

                            <TouchableOpacity style={vStyles.searchBtn} onPress={handleAction}>
                                <Text style={vStyles.searchBtnText}>
                                    {voiceResult.intent === 'log_food' ? t('voice.addFood') : 
                                     (voiceResult.intent === 'log_water' ? 'Lưu Nước (N/A)' : 
                                     'Hỏi Trợ lý AI')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {transcript && !voiceResult && !analyzing && !transcribing && (
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
