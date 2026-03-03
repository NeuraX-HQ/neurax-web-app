import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../src/constants/colors';
import { mockChatMessages } from '../../src/data/mockData';

export default function AiCoachScreen() {
    const [message, setMessage] = useState('');

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.aiAvatar}>
                    <Image source={require('../../assets/images/coachAI.jpeg')} style={styles.aiAvatarImage} />
                </View>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerName}>AI Bảo</Text>
                    <View style={styles.onlineRow}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Online</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.moreBtn}>
                    <Text style={styles.moreIcon}>⋯</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.chatArea} showsVerticalScrollIndicator={false}>
                {mockChatMessages.map((msg) => (
                    <View key={msg.id}>
                        {msg.sender === 'ai' ? (
                            <View style={styles.aiRow}>
                                <View style={styles.aiBubbleAvatar}>
                                    <Image source={require('../../assets/images/coachAI.jpeg')} style={styles.aiBubbleAvatarImage} />
                                </View>
                                <View style={styles.aiBubble}>
                                    <Text style={styles.aiText}>{msg.text}</Text>
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

                        {/* Food suggestion card */}
                        {msg.foodCard && (
                            <View style={[styles.foodCard, Shadows.small]}>
                                <Text style={styles.foodEmoji}>{msg.foodCard.emoji}</Text>
                                <View style={styles.foodInfo}>
                                    <Text style={styles.foodName}>{msg.foodCard.name}</Text>
                                    <Text style={styles.foodDesc} numberOfLines={2}>{msg.foodCard.description}</Text>
                                    <View style={styles.foodMeta}>
                                        <Text style={styles.foodCalories}>🔥 {msg.foodCard.calories} kcal</Text>
                                        <TouchableOpacity style={styles.addLogBtn}>
                                            <Text style={styles.addLogText}>+ Add to Log</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                ))}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <View style={styles.inputArea}>
                    <TouchableOpacity style={styles.attachBtn}>
                        <Text style={styles.attachIcon}>📎</Text>
                    </TouchableOpacity>
                    <TextInput
                        style={styles.input}
                        placeholder="Hỏi AI Bảo..."
                        placeholderTextColor={Colors.textLight}
                        value={message}
                        onChangeText={setMessage}
                    />
                    <TouchableOpacity style={styles.micBtn}>
                        <Text>🎤</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.sendBtn}>
                        <Text style={styles.sendIcon}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

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
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    attachBtn: { padding: 4 },
    attachIcon: { fontSize: 22 },
    input: {
        flex: 1,
        backgroundColor: '#F5F6F8',
        borderRadius: 24,
        paddingHorizontal: 18,
        paddingVertical: 12,
        fontSize: 16,
        color: Colors.text,
    },
    micBtn: { padding: 4 },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendIcon: { fontSize: 18, color: '#FFFFFF', transform: [{ rotate: '0deg' }] },
});
