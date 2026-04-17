import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/constants/colors';
import { useMealStore } from '../../src/store/mealStore';
import { useFridgeStore } from '../../src/store/fridgeStore';
import { getUserData, getOnboardingData, UserData } from '../../src/store/userStore';
import { generateCoachResponse } from '../../src/services/aiService';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

import { useChatStore, ChatMessage } from '../../src/store/chatStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { Alert } from 'react-native';
import { toLocalIsoDate } from '../../src/utils/streak';

export default function AiCoachScreen() {
    const { t, language } = useAppLanguage();
    const [input, setInput] = useState('');
    const getWelcomeMessage = () => ({
        id: 'welcome',
        sender: 'ai' as const,
        text: t('aiCoach.welcome'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    const { messages, setMessages, isLoading, setIsLoading } = useChatStore();

    const [userData, setUserData] = useState<UserData | null>(null);
    const [displayName, setDisplayName] = useState<string>('');
    const scrollViewRef = useRef<ScrollView>(null);

    const { getStatsByDate, getTodayMeals } = useMealStore();
    const { items: fridgeItems } = useFridgeStore();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const fetchUser = async () => {
            const [data, onboarding] = await Promise.all([getUserData(), getOnboardingData()]);
            setUserData(data);
            // onboarding.name là tên thật user nhập — ưu tiên hơn defaultUser.name ('Admin')
            setDisplayName(onboarding?.name || data?.name || '');
        };
        fetchUser();
    }, []);

    // Initialize or update welcome language if first message is welcome
    useEffect(() => {
        setMessages(prev => {
            const withoutWelcome = prev.filter(msg => msg.id !== 'welcome');
            return [getWelcomeMessage(), ...withoutWelcome];
        });
    }, [language]);

    const constructContext = () => {
        const stats = getStatsByDate(toLocalIsoDate(new Date()));
        const meals = getTodayMeals();
        const fridge = fridgeItems.map(i => `${i.name} (${i.amount})`).join(', ');

        return `${t('aiCoach.context.profile')}:
    - ${t('aiCoach.context.name')}: ${displayName || t('aiCoach.context.user')}
    - ${t('aiCoach.context.weight')}: ${userData?.weight}kg
    - ${t('aiCoach.context.goalWeight')}: ${userData?.goalWeight}kg
    - ${t('aiCoach.context.calorieGoal')}: ${userData?.dailyCalories}kcal

    ${t('aiCoach.context.todayProgress')}:
    - ${t('aiCoach.context.calories')}: ${stats.totalCalories} / ${userData?.dailyCalories}
    - ${t('aiCoach.context.protein')}: ${stats.totalProtein}g
    - ${t('aiCoach.context.carbs')}: ${stats.totalCarbs}g
    - ${t('aiCoach.context.fat')}: ${stats.totalFat}g

    ${t('aiCoach.context.loggedMeals')}:
    ${meals.map(m => `- ${m.name} (${m.calories} kcal)`).join('\n')}

    ${t('aiCoach.context.fridge')}:
    ${fridge || t('aiCoach.context.empty')}`;
    };

    const handleSend = async (overrideInput?: string) => {
        const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
        if (!textToSend.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: textToSend,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, userMsg]);
        if (typeof overrideInput !== 'string') setInput('');
        setIsLoading(true);

        const chatHistory = messages
            .filter(msg => msg.id !== 'welcome')
            .map(msg => ({
                role: msg.sender === 'user' ? 'user' as const : 'model' as const,
                parts: [{ text: msg.text }]
            }));

        const context = constructContext();
        const result = await generateCoachResponse(textToSend, chatHistory, context);

        if (result.success) {
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: result.text || '',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                foodCards: result.foodSuggestions,
            };
            setMessages(prev => [...prev, aiMsg]);
        } else {
            const errMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'ai',
                text: t('aiCoach.errorReply'),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, errMsg]);
        }

        setIsLoading(false);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.aiAvatar}>
                    <Image source={require('../../assets/images/coachAI.jpeg')} style={styles.aiAvatarImage} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>{t('aiCoach.headerName')}</Text>
                    <View style={styles.onlineRow}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>{t('aiCoach.online')}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreBtn}>
                    <Text style={styles.moreIcon}>⋯</Text>
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.chatArea}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                    {messages.map((msg) => (
                        <View key={msg.id}>
                            {msg.sender === 'ai' ? (
                                <View style={styles.aiRow}>
                                    <View style={styles.aiBubbleAvatar}>
                                        <Image source={require('../../assets/images/coachAI.jpeg')} style={styles.aiBubbleAvatarImage} />
                                    </View>
                                    <View style={styles.aiBubble}>
                                        <Markdown style={mdStyles}>{msg.text}</Markdown>
                                        <Text style={styles.msgTime}>{msg.time}</Text>
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.userRow}>
                                    <View style={styles.userBubble}>
                                        <Text style={styles.userText}>{msg.text}</Text>
                                        <Text style={styles.msgTimeUser}>{msg.time}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Food suggestion array */}
                            {msg.foodCards && msg.foodCards.map((foodCard: any, index: number) => (
                                <View key={'fc_' + index} style={[styles.foodCard, Shadows.small, { marginTop: 10 }]}>
                                    <Text style={styles.foodEmoji}>{foodCard.emoji || '🍲'}</Text>
                                    <View style={styles.foodInfo}>
                                        <Text style={styles.foodName}>{foodCard.name}</Text>
                                        <Text style={styles.foodDesc} numberOfLines={2}>{foodCard.description}</Text>
                                        <View style={styles.foodMeta}>
                                            <Text style={styles.foodCalories}>🔥 {foodCard.calories} kcal</Text>
                                            <TouchableOpacity 
                                                style={styles.addLogBtn}
                                                onPress={() => {
                                                    const newRecipe: any = {
                                                        id: 'AI_' + Date.now() + '_' + index,
                                                        name: foodCard.name,
                                                        description: foodCard.description,
                                                        calories: foodCard.calories,
                                                        protein: foodCard.protein_g ? `${foodCard.protein_g}g` : '0g',
                                                        time: foodCard.time || '15 min',
                                                        match: 100,
                                                        emoji: foodCard.emoji || '🍲',
                                                        image: '',
                                                        shortMeta: foodCard.time || '15 phút',
                                                        ingredients: foodCard.ingredients?.map((ing: any) => ({ id: 'ing_' + Math.random(), name: ing.name, amount: ing.amount })) || [],
                                                        steps: foodCard.steps?.map((step: any, idx: number) => ({ id: 'step_' + idx, title: step.title, instruction: step.instruction, durationSec: 300, image: '' })) || [],
                                                    };
                                                    useRecipeStore.getState().addRecipe(newRecipe);
                                                    Alert.alert('Thành công', 'Công thức đã được lưu vào Của tôi (Recipe)');
                                                }}
                                            >
                                                <Text style={styles.addLogText}>{t('aiCoach.addFood')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ))}
                    
                    {messages.length <= 1 && (
                        <View style={styles.quickReplyContainer}>
                            <TouchableOpacity style={styles.quickReplyChip} onPress={() => handleSend(t('aiCoach.quickReply.logFood') || 'Log food')}>
                                <Text style={styles.quickReplyText}>{t('aiCoach.quickReply.logFood') || 'Log food'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.quickReplyChip} onPress={() => handleSend(t('aiCoach.quickReply.suggestRecipe') || 'Suggest recipe')}>
                                <Text style={styles.quickReplyText}>{t('aiCoach.quickReply.suggestRecipe') || 'Suggest recipe'}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={{ height: 20 }} />
                </ScrollView>

                {/* Input */}
                <View style={styles.inputArea}>
                    <TextInput
                        style={[styles.input, isLoading && { opacity: 0.7 }]}
                        placeholder={t('aiCoach.placeholder')}
                        placeholderTextColor={Colors.textLight}
                        value={input}
                        onChangeText={setInput}
                        editable={!isLoading}
                        onSubmitEditing={() => handleSend()}
                    />
                    {isLoading ? (
                        <ActivityIndicator color={Colors.primary} style={{ marginHorizontal: 10, alignSelf: 'center' }} />
                    ) : (
                        <TouchableOpacity
                            style={[
                                styles.sendBtn,
                                (!input.trim() || isLoading) && { backgroundColor: Colors.border }
                            ]}
                            onPress={() => handleSend()}
                            disabled={!input.trim() || isLoading}
                        >
                            <Text style={[styles.sendIcon, (!input.trim() || isLoading) && { color: Colors.textSecondary }]}>➤</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {/* Spacer to clear the bottom tab bar */}
                <View style={{ height: Math.max(insets.bottom + 65, 80), backgroundColor: '#FFFFFF' }} />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const mdStyles = StyleSheet.create({
    body: { fontSize: 15, color: Colors.text, lineHeight: 22 },
    heading1: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginBottom: 6 },
    heading2: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 4 },
    heading3: { fontSize: 16, fontWeight: '600' as const, color: Colors.text, marginBottom: 4 },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
    bullet_list: { marginVertical: 4 },
    ordered_list: { marginVertical: 4 },
    list_item: { marginVertical: 2 },
    paragraph: { marginVertical: 4 },
    code_inline: { backgroundColor: '#F0F0F0', borderRadius: 4, paddingHorizontal: 4, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    fence: { backgroundColor: '#F0F0F0', borderRadius: 8, padding: 10, marginVertical: 6, fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    blockquote: { backgroundColor: '#F5F6F8', borderLeftWidth: 3, borderLeftColor: Colors.primary, paddingLeft: 10, marginVertical: 6 },
    link: { color: Colors.blue, textDecorationLine: 'underline' as const },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        gap: 12,
    },
    aiAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.accentLight,
        overflow: 'hidden',
    },
    aiAvatarImage: { width: '100%', height: '100%' },
    aiEmoji: { fontSize: 22 },
    headerInfo: { flex: 1 },
    headerName: { fontSize: 18, fontWeight: '700', color: Colors.primary },
    onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
    onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.accent },
    onlineText: { fontSize: 13, color: Colors.accent },
    moreBtn: { padding: 4 },
    moreIcon: { fontSize: 24, color: Colors.textSecondary },
    chatArea: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
    aiRow: { flexDirection: 'row', marginBottom: 16, gap: 10, alignItems: 'flex-start' },
    aiBubbleAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.accentLight,
        overflow: 'hidden',
    },
    aiBubbleAvatarImage: { width: '100%', height: '100%' },
    aiBubble: {
        backgroundColor: '#F5F6F8',
        borderRadius: 18,
        borderTopLeftRadius: 4,
        padding: 14,
        maxWidth: '80%',
    },
    aiText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
    msgTime: { fontSize: 11, color: Colors.textLight, marginTop: 6, textAlign: 'left' },
    userRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
    userBubble: {
        backgroundColor: Colors.primary,
        borderRadius: 18,
        borderTopRightRadius: 4,
        padding: 14,
        maxWidth: '80%',
    },
    userText: { fontSize: 15, color: '#FFFFFF', lineHeight: 22 },
    msgTimeUser: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6, textAlign: 'right' },
    foodCard: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 14,
        marginLeft: 42,
        marginBottom: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    foodEmoji: { fontSize: 40 },
    foodInfo: { flex: 1 },
    foodName: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 4 },
    foodDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 8 },
    foodMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    foodCalories: { fontSize: 13, color: Colors.text, fontWeight: '600' },
    addLogBtn: {
        backgroundColor: Colors.accentLight,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    addLogText: { fontSize: 13, color: Colors.accent, fontWeight: '600' },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F6F8',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.text,
    },
    sendBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-end',
    },
    sendIcon: { fontSize: 20, color: '#FFFFFF', transform: [{ rotate: '0deg' }] },
    quickReplyContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
        justifyContent: 'flex-start',
    },
    quickReplyChip: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: Colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    quickReplyText: {
        color: Colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
