import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { useAppLanguage } from '../i18n/LanguageProvider';

export default function LanguageSelector({ darkText = false }: { darkText?: boolean }) {
    const { language, setLanguage } = useAppLanguage();

    const handleToggle = () => {
        setLanguage(language === 'vi' ? 'en' : 'vi');
    };

    const flagSource = language === 'vi' 
        ? require('../../assets/images/flag_vi.png') 
        : require('../../assets/images/flag_en.png');
    
    const label = language === 'vi' ? 'VI' : 'EN';

    return (
        <TouchableOpacity 
            style={[styles.container, darkText && styles.containerDark]} 
            onPress={handleToggle} 
            activeOpacity={0.8}
        >
            <Image 
                source={flagSource} 
                style={styles.flag} 
                contentFit="cover" 
            />
            <Text style={[styles.text, darkText && styles.textDark]}>{label}</Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    containerDark: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    flag: {
        width: 24,
        height: 16,
        marginRight: 8,
        borderRadius: 3,
    },
    text: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    textDark: {
        color: '#111827',
    }
});
