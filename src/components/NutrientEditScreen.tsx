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
    title: string;
    unit: 'kcal' | 'g';
    min: number;
    max: number;
    step: number;
    description: string;
    confirmText: string;
    icon: string;
};

const CONFIG: Record<NutrientType, NutrientConfig> = {
    calories: {
        type: 'calories',
        title: 'Chỉnh sửa Calories',
        unit: 'kcal',
        min: 0,
        max: 1500,
        step: 10,
        description: 'Calories là tổng năng lượng của món ăn. Điều chỉnh để phù hợp với khẩu phần bạn đang ăn.',
        confirmText: 'Xác nhận Calories',
        icon: 'flame-outline',
    },
    protein: {
        type: 'protein',
        title: 'Chỉnh sửa Protein',
        unit: 'g',
        min: 0,
        max: 200,
        step: 1,
        description: 'Protein hỗ trợ xây dựng cơ bắp và duy trì cảm giác no lâu. Mỗi gam protein cung cấp khoảng 4 calo.',
        confirmText: 'Xác nhận Protein',
        icon: 'fitness-outline',
    },
    carbs: {
        type: 'carbs',
        title: 'Chỉnh sửa Carb',
        unit: 'g',
        min: 0,
        max: 250,
        step: 1,
        description: 'Carb là nguồn năng lượng chính cho cơ thể. Mỗi gam carb cung cấp khoảng 4 calo.',
        confirmText: 'Xác nhận Carb',
        icon: 'leaf-outline',
    },
    fat: {
        type: 'fat',
        title: 'Chỉnh sửa Béo',
        unit: 'g',
        min: 0,
        max: 120,
        step: 1,
        description: 'Chất béo giúp hấp thu vitamin và hỗ trợ nội tiết. Mỗi gam béo cung cấp khoảng 9 calo.',
        confirmText: 'Xác nhận Béo',
        icon: 'water-outline',
    },
};

const clamp = (value: number, min: number, max: number): number => {
    return Math.min(max, Math.max(min, value));
};

export function NutrientEditScreen({ nutrient }: { nutrient: NutrientType }) {
    const config = CONFIG[nutrient];
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const currentFoodItem = useMealStore((state) => state.currentFoodItem);
    const setCurrentFoodItem = useMealStore((state) => state.setCurrentFoodItem);

    const initialValue = useMemo(() => {
        if (!currentFoodItem) return 0;
        const raw = currentFoodItem[nutrient];
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? Math.round(parsed) : 0;
    }, [currentFoodItem, nutrient]);

    const [value, setValue] = useState(initialValue);
    const [sliderWidth, setSliderWidth] = useState(0);

    const onChangeValue = (next: number) => {
        setValue(clamp(Math.round(next), config.min, config.max));
    };

    const onChangeText = (text: string) => {
        const parsed = Number(text.replace(/[^\d]/g, ''));
        if (!Number.isFinite(parsed)) {
            setValue(0);
            return;
        }
        onChangeValue(parsed);
    };

    const kcalFromNutrient = useMemo(() => {
        if (nutrient === 'calories') return value;
        if (nutrient === 'fat') return value * 9;
        return value * 4;
    }, [nutrient, value]);

    const sliderPercent = useMemo(() => {
        if (config.max === config.min) return 0;
        return ((value - config.min) / (config.max - config.min)) * 100;
    }, [config.max, config.min, value]);

    const updateValueFromTrack = (locationX: number) => {
        if (sliderWidth <= 0) return;
        const clampedX = clamp(locationX, 0, sliderWidth);
        const ratio = clampedX / sliderWidth;
        const nextValue = config.min + ratio * (config.max - config.min);
        onChangeValue(nextValue);
    };

    const handleTrackLayout = (event: LayoutChangeEvent) => {
        setSliderWidth(event.nativeEvent.layout.width);
    };

    const thumbSize = 24;
    const thumbLeft = Math.max(
        0,
        Math.min(
            Math.max(sliderWidth - thumbSize, 0),
            (sliderPercent / 100) * sliderWidth - thumbSize / 2
        )
    );

    const saveValue = () => {
        if (!currentFoodItem) {
            Alert.alert('Lỗi', 'Không tìm thấy dữ liệu món ăn hiện tại.');
            return;
        }

        setCurrentFoodItem({
            ...currentFoodItem,
            [nutrient]: value,
        });

        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
                        <Ionicons name="arrow-back" size={22} color="#475569" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{config.title}</Text>
                </View>
                <TouchableOpacity onPress={saveValue}>
                    <Text style={styles.saveText}>Lưu</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.valueSection}>
                    <Text style={styles.valueLabel}>{`Lượng ${config.unit === 'kcal' ? 'năng lượng' : config.title.replace('Chỉnh sửa ', '')} (${config.unit})`}</Text>
                    <View style={styles.valueRow}>
                        <TextInput
                            value={String(value)}
                            keyboardType="numeric"
                            onChangeText={onChangeText}
                            style={styles.valueInput}
                            maxLength={4}
                        />
                        <Text style={styles.valueUnit}>{config.unit}</Text>
                    </View>
                    <Text style={styles.kcalHint}>{`~ ${kcalFromNutrient} kcal từ ${config.title.replace('Chỉnh sửa ', '')}`}</Text>
                </View>

                <View style={styles.sliderSection}>
                    <View style={styles.sliderHeader}>
                        <Text style={styles.sliderLimit}>{`${config.min}${config.unit}`}</Text>
                        <Text style={styles.sliderLimit}>{`${Math.round(config.max / 2)}${config.unit}`}</Text>
                        <Text style={styles.sliderLimit}>{`${config.max}${config.unit}`}</Text>
                    </View>
                    <View
                        style={styles.sliderInteractiveArea}
                        onLayout={handleTrackLayout}
                        onStartShouldSetResponder={() => true}
                        onMoveShouldSetResponder={() => true}
                        onResponderGrant={(event) => updateValueFromTrack(event.nativeEvent.locationX)}
                        onResponderMove={(event) => updateValueFromTrack(event.nativeEvent.locationX)}
                    >
                        <View style={styles.sliderTrack}>
                            <View style={[styles.sliderProgress, { width: `${sliderPercent}%` }]} />
                        </View>
                        <View style={[styles.sliderThumb, { left: thumbLeft }]} />
                    </View>
                </View>

                <View style={styles.infoCard}>
                    <View style={styles.infoIconBox}>
                        <Ionicons name={config.icon as any} size={20} color="#059669" />
                    </View>
                    <View style={styles.infoContent}>
                        <Text style={styles.infoTitle}>{`Tác động của ${config.title.replace('Chỉnh sửa ', '')}`}</Text>
                        <Text style={styles.infoText}>{config.description}</Text>
                    </View>
                </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}>
                <TouchableOpacity style={styles.confirmButton} onPress={saveValue}>
                    <Text style={styles.confirmButtonText}>{config.confirmText}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

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
    content: {
        paddingHorizontal: 24,
        paddingVertical: 24,
        gap: 24,
    },
    valueSection: {
        alignItems: 'center',
    },
    valueLabel: {
        fontSize: 12,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 18,
        textAlign: 'center',
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'center',
    },
    valueInput: {
        minWidth: 140,
        textAlign: 'center',
        fontSize: 64,
        lineHeight: 70,
        fontWeight: '800',
        color: '#0F172A',
        paddingVertical: 0,
    },
    valueUnit: {
        fontSize: 28,
        fontWeight: '700',
        color: '#94A3B8',
    },
    kcalHint: {
        marginTop: 8,
        fontSize: 13,
        fontWeight: '600',
        color: '#10B981',
    },
    sliderSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
    },
    sliderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    sliderLimit: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '700',
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
        backgroundColor: '#10B981',
        borderRadius: 999,
    },
    sliderInteractiveArea: {
        height: 32,
        justifyContent: 'center',
    },
    sliderThumb: {
        position: 'absolute',
        top: 4,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#10B981',
        borderWidth: 3,
        borderColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 4,
        elevation: 3,
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        flexDirection: 'row',
        gap: 12,
    },
    infoIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#D1FAE5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoContent: {
        flex: 1,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 20,
    },
    footer: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
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
