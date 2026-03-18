import React, { useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Platform,
    Pressable, Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HomeIcon, BattleIcon, KitchenIcon } from '../../src/components/TabIcons';
import { VoiceModal } from '../../src/components/VoiceModal';
import { CameraScannerWithLoading } from '../../src/components/CameraScannerWithLoading';
import { SearchScanner } from '../../src/components/SearchScanner';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';

const BOTTOM_INSET = Platform.OS === 'ios' ? 30 : 14;
const NAV_HEIGHT = 62;
const ACTIVE_COLOR = '#1B2838';
const INACTIVE_COLOR = '#A0AEC0';

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const { t } = useAppLanguage();

    const tabs = [
        { name: 'home', label: t('tabs.home'), icon: (f: boolean) => <HomeIcon size={22} color={f ? ACTIVE_COLOR : INACTIVE_COLOR} /> },
        { name: 'battle', label: t('tabs.battle'), icon: (f: boolean) => <BattleIcon size={22} color={f ? ACTIVE_COLOR : INACTIVE_COLOR} /> },
        { name: 'kitchen', label: t('tabs.kitchen'), icon: (f: boolean) => <KitchenIcon size={22} color={f ? ACTIVE_COLOR : INACTIVE_COLOR} /> },
        {
            name: 'progress',
            label: 'Tiến Trình',
            icon: (f: boolean) => (
                <Ionicons name={f ? 'bar-chart' : 'bar-chart-outline'} size={22} color={f ? ACTIVE_COLOR : INACTIVE_COLOR} />
            ),
        },
    ];

    return (
        <View style={tabBarStyles.wrapper} pointerEvents="box-none">
            <View style={tabBarStyles.pill} pointerEvents="auto">
                <BlurView intensity={85} tint="light" style={StyleSheet.absoluteFill} />
                {tabs.map((tab) => {
                    const routeIndex = state.routes.findIndex(r => r.name === tab.name);
                    const focused = state.index === routeIndex;
                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={tabBarStyles.tabBtn}
                            onPress={() => {
                                if (routeIndex !== -1 && !focused) {
                                    navigation.navigate(tab.name);
                                }
                            }}
                            activeOpacity={0.7}
                        >
                            {tab.icon(focused)}
                            <Text style={[tabBarStyles.label, focused && tabBarStyles.labelActive]} allowFontScaling={false}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const tabBarStyles = StyleSheet.create({
    wrapper: {
        position: 'absolute',
        bottom: BOTTOM_INSET,
        left: 16,
        right: 84, // leave space for FAB column
        height: NAV_HEIGHT,
    },
    pill: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.55)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.10,
        shadowRadius: 24,
        elevation: 12,
    },
    tabBtn: {
        flex: 1,
        height: NAV_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    label: {
        fontSize: 9,
        fontWeight: '500',
        color: INACTIVE_COLOR,
    },
    labelActive: {
        color: ACTIVE_COLOR,
        fontWeight: '700',
    },
});

// ─── Main Layout ─────────────────────────────────────────────────────────────
export default function TabsLayout() {
    const router = useRouter();
    const { t } = useAppLanguage();
    const [menuOpen, setMenuOpen] = useState(false);
    const [directVoiceVisible, setDirectVoiceVisible] = useState(false);
    const [cameraVisible, setCameraVisible] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);

    const fabRotate = useRef(new Animated.Value(0)).current;
    const itemAnims = useRef([
        new Animated.Value(0), // voice
        new Animated.Value(0), // camera
        new Animated.Value(0), // search
        new Animated.Value(0), // AI bubble
    ]).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    const scanOptions = [
        { id: 'voice', icon: 'mic-outline' as const, label: t('tabs.voice') },
        { id: 'camera', icon: 'camera-outline' as const, label: t('tabs.camera') },
        { id: 'search', icon: 'search-outline' as const, label: t('tabs.search') },
    ] as const;

    const openMenu = () => {
        setMenuOpen(true);
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
            Animated.timing(fabRotate, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.spring(itemAnims[3], { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 220 }),
            ...itemAnims.slice(0, 3).map((anim, i) =>
                Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 240, delay: (i + 1) * 45 })
            ),
        ]).start();
    };

    const closeMenu = () => {
        Animated.parallel([
            Animated.timing(overlayOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            Animated.timing(fabRotate, { toValue: 0, duration: 220, useNativeDriver: true }),
            ...itemAnims.map(anim =>
                Animated.timing(anim, { toValue: 0, duration: 160, useNativeDriver: true })
            ),
        ]).start(() => setMenuOpen(false));
    };

    const handleOption = (id: string) => {
        closeMenu();
        if (id === 'voice') setTimeout(() => setDirectVoiceVisible(true), 300);
        else if (id === 'camera') setTimeout(() => setCameraVisible(true), 300);
        else if (id === 'search') setTimeout(() => setSearchVisible(true), 300);
    };

    const fabRotateDeg = fabRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

    const getItemStyle = (anim: Animated.Value) => ({
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
    });

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
                tabBar={(props) => <CustomTabBar {...props} />}
            >
                <Tabs.Screen name="home" />
                <Tabs.Screen name="battle" />
                <Tabs.Screen name="add" options={{ tabBarButton: () => null }} />
                <Tabs.Screen name="kitchen" />
                <Tabs.Screen name="progress" />
                <Tabs.Screen name="ai-coach" options={{ tabBarButton: () => null }} />
            </Tabs>

            {/* Overlay backdrop */}
            {menuOpen && (
                <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]} pointerEvents="auto">
                    <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
                </Animated.View>
            )}

            {/* Floating right column: AI + Menu + FAB */}
            <View style={styles.fabColumn} pointerEvents="box-none">

                {menuOpen && (
                    <>
                        {/* AI Bubble pushed up */}
                        <Animated.View style={[styles.aiBubbleRow, getItemStyle(itemAnims[3])]}>
                            <View style={styles.aiBubbleContainer}>
                                <BlurView intensity={70} tint="light" style={StyleSheet.absoluteFill} />
                                <Ionicons name="chatbubble-ellipses-outline" size={22} color="#6366F1" />
                            </View>
                        </Animated.View>

                        {/* Scan options: reversed so voice is highest */}
                        {[...scanOptions].reverse().map((opt, i) => (
                            <Animated.View key={opt.id} style={[styles.menuItemRow, getItemStyle(itemAnims[scanOptions.length - 1 - i])]}>
                                <View style={styles.menuLabelPill}>
                                    <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
                                    <Text style={styles.menuLabelText}>{opt.label}</Text>
                                </View>
                                <TouchableOpacity style={styles.menuIconBtn} onPress={() => handleOption(opt.id)} activeOpacity={0.8}>
                                    <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
                                    <Ionicons name={opt.icon} size={24} color="#1B2838" />
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </>
                )}

                {/* AI Bubble resting (menu closed) */}
                {!menuOpen && (
                    <TouchableOpacity style={styles.aiBubbleResting} activeOpacity={0.85} onPress={() => router.push('/(tabs)/ai-coach')}>
                        <BlurView intensity={70} tint="light" style={styles.aiBubbleBlur}>
                            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6366F1" />
                        </BlurView>
                    </TouchableOpacity>
                )}

                {/* FAB */}
                <TouchableOpacity style={styles.fab} onPress={menuOpen ? closeMenu : openMenu} activeOpacity={0.85}>
                    <Animated.View style={{ transform: [{ rotate: fabRotateDeg }] }}>
                        <Ionicons name="add" size={30} color="#FFFFFF" />
                    </Animated.View>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            <VoiceModal visible={directVoiceVisible} onClose={() => setDirectVoiceVisible(false)} />
            <CameraScannerWithLoading visible={cameraVisible} onClose={() => setCameraVisible(false)} />
            <SearchScanner visible={searchVisible} onClose={() => setSearchVisible(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: {
        backgroundColor: 'rgba(0,0,0,0.28)',
        zIndex: 10,
    },
    fabColumn: {
        position: 'absolute',
        right: 16,
        bottom: BOTTOM_INSET,
        alignItems: 'flex-end',
        zIndex: 20,
        gap: 10,
    },
    // AI bubble resting
    aiBubbleResting: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        marginBottom: 4,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 12,
        elevation: 6,
    },
    aiBubbleBlur: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99,102,241,0.25)',
    },
    aiBubbleRow: {
        alignSelf: 'flex-end',
    },
    aiBubbleContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(99,102,241,0.2)',
    },
    // Menu items
    menuItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        alignSelf: 'flex-end',
    },
    menuLabelPill: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuLabelText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1B2838',
    },
    menuIconBtn: {
        width: 58,
        height: 58,
        borderRadius: 18,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.7)',
    },
    // FAB
    fab: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#1B2838',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.30,
        shadowRadius: 16,
        elevation: 14,
    },
});
