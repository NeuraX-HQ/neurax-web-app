import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { useAppLanguage } from '../src/i18n/LanguageProvider';

export default function PrivacyPolicyScreen() {
    const router = useRouter();
    const { t } = useAppLanguage();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t('privacy.title')}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
                <Text style={styles.sectionTitle}>{t('privacy.s1t')}</Text>
                <Text style={styles.paragraph}>{t('privacy.s1d')}</Text>

                <Text style={styles.sectionTitle}>{t('privacy.s2t')}</Text>
                <Text style={styles.paragraph}>{t('privacy.s2d')}</Text>

                <Text style={styles.sectionTitle}>{t('privacy.s3t')}</Text>
                <Text style={styles.paragraph}>{t('privacy.s3d')}</Text>

                <Text style={styles.sectionTitle}>{t('privacy.s4t')}</Text>
                <Text style={styles.paragraph}>{t('privacy.s4d')}</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
        backgroundColor: '#FFFFFF',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: { fontSize: 24, color: Colors.primary },
    title: { fontSize: 18, fontWeight: '700', color: Colors.text },
    scroll: { flex: 1 },
    content: { padding: 18, gap: 8 },
    sectionTitle: { marginTop: 10, fontSize: 16, fontWeight: '700', color: Colors.text },
    paragraph: { fontSize: 14, lineHeight: 22, color: Colors.textSecondary },
});
