import React, { useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Alert,
    LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMealStore } from '../store/mealStore';

type NutrientType = 'calories' | 'protein' | 'carbs' | 'fat';

type NutrientConfig = {
    type: NutrientType;
    label: string;
    unit: 'kcal' | 'g';
    min: number;
    max: number;
    color: string;
    icon: string;
};

const CONFIGS: NutrientConfig[] = [
    { type: 'calories', label: 'Calories', unit: 'kcal', min: 0, max: 1500, color: '#10B981', icon: 'flame-outline' },
    { type: 'protein',  label: 'Protein',  unit: 'g',    min: 0, max: 200,  color: '#3B82F6', icon: 'fitness-outline' },
    { type: 'carbs',    label: 'Carb',     unit: 'g',    min: 0, max: 250,  color: '#F59E0B', icon: 'leaf-outline' },
    { type: 'fat',      label: 'Chất béo', unit: 'g',    min: 0, max: 120,  color: '#EF4444', icon: 'water-outline' },
];

const clamp = (value: number, min: number, max: number): number =>
    Math.min(max, Math.max(min, value));

// ─── Single Nutrient Section ──────────────────────────────────────────────────
function NutrientSection({
    config,
    value,
    onChange,
}: {
    config: NutrientConfig;
    value: number;
    onChange: (next: number) => void;
}) {
    const [sliderWidth, setSliderWidth] = useState(0);

    const onChangeText = (text: string) => {
        const parsed = Number(text.replace(/[^\d]/g, ''));
        if (!Number.isFinite(parsed)) { onChange(0); return; }
        onChange(clamp(Math.round(parsed), config.min, config.max));
    };

    const sliderPercent = config.max === config.min
        ? 0
        : ((value - config.min) / (config.max - config.min)) * 100;

    const thumbSize = 24;
    const thumbLeft = Math.max(
        0,
        Math.min(
            Math.max(sliderWidth - thumbSize, 0),
            (sliderPercent / 100) * sliderWidth - thumbSize / 2
        )
    );

    const handleTrackLayout = (event: LayoutChangeEvent) =>
        setSliderWidth(event.nativeEvent.layout.width);

    const updateValueFromTrack = (locationX: number) => {
        if (sliderWidth <= 0) return;
        const ratio = clamp(locationX, 0, sliderWidth) / sliderWidth;
        onChange(clamp(Math.round(config.min + ratio * (config.max - config.min)), config.min, config.max));
    };

    return (
        <View style={styles.section}>
            {/* Section Header */}
            <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconBox, { backgroundColor: config.color + '20' }]}>
                    <Ionicons name={config.icon as any} size={18} color={config.color} />
                </View>
                <Text style={styles.sectionLabel}>{config.label}</Text>
                <Text style={[styles.sectionUnit, { color: config.color }]}>{config.unit}</Text>
            </View>

            {/* Value Input */}
            <View style={styles.valueRow}>
                <TextInput
                    value={String(value)}
                    keyboardType="numeric"
                    onChangeText={onChangeText}
                    style={[styles.valueInput, { color: config.color }]}
                    maxLength={4}
                />
                <Text style={styles.valueUnitText}>{config.unit}</Text>
            </View>

            {/* Slider */}
            <View style={styles.sliderSection}>
                <View style={styles.sliderLabels}>
                    <Text style={styles.sliderLimit}>{config.min}{config.unit}</Text>
                    <Text style={styles.sliderLimit}>{Math.round(config.max / 2)}{config.unit}</Text>
                    <Text style={styles.sliderLimit}>{config.max}{config.unit}</Text>
                </View>
                <View
                    style={styles.sliderInteractiveArea}
                    onLayout={handleTrackLayout}
                    onStartShouldSetResponder={() => true}
                    onMoveShouldSetResponder={() => true}
                    onResponderGrant={(e) => updateValueFromTrack(e.nativeEvent.locationX)}
                    onResponderMove={(e) => updateValueFromTrack(e.nativeEvent.locationX)}
                >
                    <View style={styles.sliderTrack}>
                        <View style={[styles.sliderProgress, { width: `${sliderPercent}%`, backgroundColor: config.color }]} />
                    </View>
                    <View style={[styles.sliderThumb, { left: thumbLeft, borderColor: config.color, backgroundColor: config.color }]} />
                </View>
            </View>
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AllNutrientsEditScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const currentFoodItem = useMealStore((state) => state.currentFoodItem);
    const setCurrentFoodItem = useMealStore((state) => state.setCurrentFoodItem);

    const initialValues = useMemo(() => {
        const get = (key: NutrientType) => {
            if (!currentFoodItem) return 0;
            const raw = currentFoodItem[key];
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? Math.round(parsed) : 0;
        };
        return {
            calories: get('calories'),
            protein:  get('protein'),
            carbs:    get('carbs'),
            fat:      get('fat'),
        };
    }, [currentFoodItem]);

    const [values, setValues] = useState(initialValues);

    const handleChange = (type: NutrientType, next: number) =>
        setValues((prev) => ({ ...prev, [type]: next }));

    const handleSave = () => {
        if (!currentFoodItem) {
            Alert.alert('Lỗi', 'Không tìm thấy dữ liệu món ăn hiện tại.');
            return;
        }
        setCurrentFoodItem({ ...currentFoodItem, ...values });
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={22} color="#475569" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Chỉnh sửa dinh dưỡng</Text>
                </View>
                <TouchableOpacity onPress={handleSave}>
                    <Text style={styles.saveText}>Lưu</Text>
                </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {CONFIGS.map((config) => (
                    <NutrientSection
                        key={config.type}
                        config={config}
                        value={values[config.type]}
                        onChange={(next) => handleChange(config.type, next)}
                    />
                ))}
                <View style={{ height: 20 }} />
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}>
                <TouchableOpacity style={styles.confirmButton} onPress={handleSave}>
                    <Text style={styles.confirmButtonText}>Xác nhận tất cả</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        height: 64,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    saveText: {
        color: '#10B981',
        fontSize: 16,
        fontWeight: '700',
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },

    // Section card
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        gap: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sectionIconBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: '#0F172A',
    },
    sectionUnit: {
        fontSize: 13,
        fontWeight: '600',
    },

    // Value input
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: 6,
    },
    valueInput: {
        minWidth: 100,
        textAlign: 'center',
        fontSize: 52,
        lineHeight: 58,
        fontWeight: '800',
        paddingVertical: 0,
    },
    valueUnitText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#94A3B8',
    },

    // Slider
    sliderSection: {
        gap: 4,
    },
    sliderLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    sliderLimit: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    sliderInteractiveArea: {
        height: 32,
        justifyContent: 'center',
    },
    sliderTrack: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 999,
        overflow: 'hidden',
        justifyContent: 'center',
    },
    sliderProgress: {
        height: '100%',
        borderRadius: 999,
    },
    sliderThumb: {
        position: 'absolute',
        top: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },

    // Footer
    footer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    confirmButton: {
        height: 56,
        borderRadius: 16,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
