import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Theme';

// This is a placeholder screen - the actual log is handled via bottom sheet
export default function LogScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.emoji}>📝</Text>
                <Text style={styles.text}>Use the + button to log meals</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 48,
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        color: Colors.textMedium,
    },
});
