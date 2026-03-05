import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Platform,
    Modal, Pressable, Animated,
} from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HomeIcon, BattleIcon, ScanIcon, KitchenIcon, AICoachIcon } from '../../src/components/TabIcons';
import { VoiceModal } from '../../src/components/VoiceModal';
import { CameraScannerWithLoading } from '../../src/components/CameraScannerWithLoading';
import { SearchScanner } from '../../src/components/SearchScanner';

function TabItem({ icon, label, focused }: { icon: React.ReactNode; label: string; focused: boolean }) {
    return (
        <View style={styles.tabItem}>
            {icon}
            <Text
                style={[styles.tabLabel, focused && styles.tabLabelActive]}
                numberOfLines={1}
                allowFontScaling={false}
            >
                {label}
            </Text>
        </View>
    );
}

const SCAN_OPTIONS = [
    {
        id: 'voice',
        icon: 'mic-outline' as const,
        label: 'Giọng nói',
        desc: 'Nói tên món ăn',
        route: '#' as const,
    },
    {
        id: 'camera',
        icon: 'camera-outline' as const,
        label: 'Chụp hình',
        desc: 'AI Scan • Barcode',
        route: '#' as const,
    },
    {
        id: 'search',
        icon: 'search-outline' as const,
        label: 'Tìm kiếm',
        desc: 'Tìm món ăn',
        route: '#' as const,
    },
] as const;

export default function TabsLayout() {
    const router = useRouter();
    const activeColor = '#000000';
    const inactiveColor = '#A0AEC0';
    const [popupVisible, setPopupVisible] = useState(false);
    const [directVoiceVisible, setDirectVoiceVisible] = useState(false);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    const openPopup = () => {
        setPopupVisible(true);
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 280 }),
            Animated.timing(opacityAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        ]).start();
    };

    const closePopup = () => {
        Animated.parallel([
            Animated.spring(scaleAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 280 }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        ]).start(() => setPopupVisible(false));
    };

    const handleOption = (route: string, id?: string) => {
        closePopup();
        if (id === 'voice') {
            setTimeout(() => setDirectVoiceVisible(true), 300);
        } else if (id === 'camera') {
            setTimeout(() => setCameraVisible(true), 300);
        } else if (id === 'search') {
            setTimeout(() => setSearchVisible(true), 300);
        } else {
            setTimeout(() => router.push(route as any), 150);
        }
    };

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: styles.tabBar,
                    tabBarShowLabel: false,
                    tabBarHideOnKeyboard: true,
                }}
            >
                <Tabs.Screen
                    name="home"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <TabItem
                                icon={<HomeIcon size={22} color={focused ? activeColor : inactiveColor} />}
                                label="Home"
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="battle"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <TabItem
                                icon={<BattleIcon size={22} color={focused ? activeColor : inactiveColor} />}
                                label="Battle"
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="add"
                    options={{
                        tabBarButton: () => null, // Ẩn biểu tượng mặc định ở thanh tab
                    }}
                />
                <Tabs.Screen
                    name="kitchen"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <TabItem
                                icon={<KitchenIcon size={22} color={focused ? activeColor : inactiveColor} />}
                                label="Kitchen"
                                focused={focused}
                            />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="ai-coach"
                    options={{
                        tabBarIcon: ({ focused }) => (
                            <TabItem
                                icon={<AICoachIcon size={22} color={focused ? activeColor : inactiveColor} />}
                                label="AI Coach"
                                focused={focused}
                            />
                        ),
                    }}
                />
            </Tabs>

            {/* Floating Action Button (FAB) - Đặt bên ngoài Tabs để không bị icon mặc định đè lên */}
            <View style={styles.fabContainer} pointerEvents="box-none">
                <TouchableOpacity
                    style={styles.fab}
                    onPress={openPopup}
                    activeOpacity={0.8}
                >
                    <ScanIcon size={52} color="#FFF" strokeWidth={1.4} />
                </TouchableOpacity>
            </View>

            {/* Scan Popup */}
            <Modal visible={popupVisible} transparent animationType="none" onRequestClose={closePopup}>
                <Pressable style={styles.backdrop} onPress={closePopup}>
                    <Animated.View
                        style={[
                            styles.popup,
                            {
                                opacity: opacityAnim,
                                transform: [
                                    { scale: scaleAnim },
                                    {
                                        translateY: scaleAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [20, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.popupHeader}>
                            <Text style={styles.popupTitle}>Chọn cách thêm món ăn</Text>
                            <TouchableOpacity onPress={closePopup} style={styles.closeBtn}>
                                <Ionicons name="close" size={18} color="#666" />
                            </TouchableOpacity>
                        </View>

                        {/* Options */}
                        <View style={styles.optionsRow}>
                            {SCAN_OPTIONS.map((opt) => (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={styles.optionCard}
                                    onPress={() => handleOption(opt.route, opt.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.optionIcon}>
                                        <Ionicons name={opt.icon} size={24} color="#333" />
                                    </View>
                                    <Text style={styles.optionLabel}>{opt.label}</Text>
                                    <Text style={styles.optionDesc}>{opt.desc}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Arrow pointing down toward FAB */}
                        <View style={styles.arrow} />
                    </Animated.View>
                </Pressable>
            </Modal>

            {/* Scan Modals Shared */}
            <VoiceModal visible={directVoiceVisible} onClose={() => setDirectVoiceVisible(false)} />
            <CameraScannerWithLoading visible={cameraVisible} onClose={() => setCameraVisible(false)} />
            <SearchScanner visible={searchVisible} onClose={() => setSearchVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    tabBar: {
        height: Platform.OS === 'ios' ? 85 : 65,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 8,
        paddingTop: 8,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    tabLabel: {
        fontSize: 9,
        color: '#A0AEC0',
        fontWeight: '500',
    },
    tabLabelActive: {
        color: '#000000',
        fontWeight: '700',
    },
    fabWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 85 : 65,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fab: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#000000',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -32, // Nhô cao lên thanh tab
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },

    // Popup
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 110 : 90,
    },
    popup: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingTop: 16,
        paddingHorizontal: 16,
        paddingBottom: 20,
        width: 320,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 20,
    },
    popupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    popupTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111',
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    optionCard: {
        flex: 1,
        backgroundColor: '#F7F8FA',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        gap: 6,
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#EDEDEF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 2,
    },
    optionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#111',
    },
    optionDesc: {
        fontSize: 10,
        color: '#888',
        textAlign: 'center',
    },
    arrow: {
        width: 14,
        height: 14,
        backgroundColor: '#FFFFFF',
        transform: [{ rotate: '45deg' }],
        position: 'absolute',
        bottom: -7,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
});
