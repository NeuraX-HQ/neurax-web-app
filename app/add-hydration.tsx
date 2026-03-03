import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { drinkTypes } from '../src/data/mockData';

export default function AddHydrationScreen() {
    const router = useRouter();
    const [selectedDrink, setSelectedDrink] = useState('water');
    const [amount, setAmount] = useState(200);

    // 5 levels: 50, 100, 150, 200, 250ml — evenly distributed
    const STEPS = [50, 100, 150, 200, 250];
    const GLASS_INNER_H = 220; // usable inner height in px

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Add Hydration</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Drink Type Selector */}
            <View style={styles.drinkTypes}>
                {drinkTypes.map((drink) => (
                    <TouchableOpacity
                        key={drink.id}
                        style={[styles.drinkItem, selectedDrink === drink.id && styles.drinkItemSelected]}
                        onPress={() => setSelectedDrink(drink.id)}
                    >
                        <Text style={styles.drinkEmoji}>{drink.emoji}</Text>
                        <Text style={[styles.drinkLabel, selectedDrink === drink.id && styles.drinkLabelSelected]}>
                            {drink.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Water Glass Visualization */}
            <View style={styles.glassArea}>
                <View style={styles.glass}>
                    {/* Ruler: full-width horizontal lines, no labels */}
                    <View style={styles.rulerInner}>
                        {[200, 150, 100, 50].map((threshold, idx) => (
                            <View key={idx} style={[
                                styles.rulerLine,
                                amount >= threshold ? styles.rulerLineActive : null
                            ]} />
                        ))}
                    </View>
                    {/* Water fill */}
                    <View style={[styles.water, { height: `${(amount / 250) * 100}%` }]}>
                        <Text style={styles.waterLabel}>{amount} ml</Text>
                    </View>
                </View>
            </View>

            {/* Amount Controls */}
            <View style={styles.amountRow}>
                <TouchableOpacity
                    style={styles.amountBtn}
                    onPress={() => setAmount(Math.max(50, amount - 50))}
                >
                    <Text style={styles.amountBtnText}>−</Text>
                </TouchableOpacity>
                <View style={styles.amountDisplay}>
                    <Text style={styles.amountValue}>{amount}</Text>
                    <Text style={styles.amountUnit}> ml</Text>
                </View>
                <TouchableOpacity
                    style={styles.amountBtn}
                    onPress={() => setAmount(Math.min(250, amount + 50))}
                >
                    <Text style={styles.amountBtnText}>+</Text>
                </TouchableOpacity>
            </View>

            {/* Quick Select */}
            <View style={styles.quickRow}>
                {[50, 100, 150, 200, 250].map((val) => (
                    <TouchableOpacity
                        key={val}
                        style={[styles.quickBtn, amount === val && styles.quickBtnSelected]}
                        onPress={() => setAmount(val)}
                    >
                        <Text style={[styles.quickText, amount === val && styles.quickTextSelected]}>{val}ml</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Add Button */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.addBtn} onPress={() => router.back()}>
                    <Text style={styles.addBtnText}>Add Drink  💧</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
    },
    backArrow: { fontSize: 24, color: Colors.primary },
    title: { fontSize: 20, fontWeight: '700', color: Colors.primary },
    drinkTypes: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 20,
        marginBottom: 32,
    },
    drinkItem: {
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    drinkItemSelected: { borderColor: Colors.water, borderWidth: 2, backgroundColor: Colors.blueLight },
    drinkEmoji: { fontSize: 28, marginBottom: 4 },
    drinkLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
    drinkLabelSelected: { color: Colors.water, fontWeight: '600' },
    glassArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    glass: {
        width: 130,
        height: 220,
        borderRadius: 20,
        borderWidth: 2.5,
        borderColor: '#D0DCEA',
        overflow: 'hidden',
        justifyContent: 'flex-end',
        backgroundColor: '#F0F5FA',
    },
    water: {
        backgroundColor: Colors.water,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ruler: full-width horizontal lines
    rulerInner: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        zIndex: 2,
    },
    rulerLine: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.08)',
    },
    rulerLineActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
    waterLabel: { color: '#FFF', fontSize: 20, fontWeight: '800' },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 32,
        marginVertical: 24,
    },
    amountBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    amountBtnText: { fontSize: 28, color: Colors.primary, fontWeight: '300' },
    amountDisplay: { flexDirection: 'row', alignItems: 'baseline' },
    amountValue: { fontSize: 48, fontWeight: '800', color: Colors.primary },
    amountUnit: { fontSize: 20, color: Colors.textSecondary },
    quickRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    quickBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F6F8',
    },
    quickBtnSelected: { backgroundColor: Colors.water },
    quickText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
    quickTextSelected: { color: '#FFF' },
    footer: { paddingHorizontal: 24, paddingBottom: 24 },
    addBtn: {
        backgroundColor: Colors.primary,
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
    },
    addBtnText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
