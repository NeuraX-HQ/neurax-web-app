import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Platform,
    Pressable, Animated, PanResponder,
    type GestureResponderEvent, type PanResponderGestureState,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { HomeIcon, BattleIcon, KitchenIcon } from '../../src/components/TabIcons';
import { VoiceModal } from '../../src/components/VoiceModal';
import { CameraScannerWithLoading } from '../../src/components/CameraScannerWithLoading';
import { SearchScanner } from '../../src/components/SearchScanner';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';
import { useMealStore } from '../../src/store/mealStore';

const BOTTOM_INSET = Platform.OS === 'ios' ? 30 : 14;
const NAV_HEIGHT = 62;
const ACTIVE_COLOR = '#1B2838';
const INACTIVE_COLOR = '#A0AEC0';

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────
function CustomTabBar({ state, navigation }: BottomTabBarProps) {
    const { t } = useAppLanguage();
    const [barWidth, setBarWidth] = useState(0);

    const tabs = [
        { name: 'home',    label: t('tabs.home'),    icon: (f: boolean) => <HomeIcon    size={22} color={f ? ACTIVE_COLOR : INACTIVE_COLOR} /> },
        { name: 'battle',  label: t('tabs.battle'),  icon: (f: boolean) => <BattleIcon  size={22} color={f ? ACTIVE_COLOR : INACTIVE_COLOR} /> },
        { name: 'kitchen', label: t('tabs.kitchen'), icon: (f: boolean) => <KitchenIcon size={22} color={f ? ACTIVE_COLOR : INACTIVE_COLOR} /> },
        {
            name: 'progress',
            label: 'Progress',
            icon: (f: boolean) => <Ionicons name={f ? 'bar-chart' : 'bar-chart-outline'} size={22} color={f ? ACTIVE_COLOR : INACTIVE_COLOR} />,
        },
    ];

    // Map route index → visual index (skips hidden routes like 'add')
    const visualIndex = Math.max(0, tabs.findIndex(t => t.name === (state.routes[state.index]?.name ?? '')));

    // ─── Animated values (stable across renders) ───────────────────────
    // Refs to avoid stale closures in PanResponder
    const stateRef = useRef(state);
    stateRef.current = state;
    const navRef = useRef(navigation);
    navRef.current = navigation;

    const PILL_PAD = 5;
    const tabWidthRef   = useRef(0);     // mutable, always up-to-date
    const pillCurrentX  = useRef(0);     // current pixel X of pill left edge
    const dragStartX    = useRef(0);     // pillCurrentX at the moment of grant
    const isDragging    = useRef(false);
    const prevVisual    = useRef(visualIndex);

    const pillPixelX  = useRef(new Animated.Value(0)).current;
    const pillStretch = useRef(new Animated.Value(1)).current;
    const pillScale   = useRef(new Animated.Value(1)).current;  // "ball pops" on touch

    const tabWidth = barWidth > 0 ? barWidth / tabs.length : 0;
    tabWidthRef.current = tabWidth;

    // Pixel position for a given visual index
    const indexToPx = (i: number) => i * tabWidthRef.current + PILL_PAD;

    // ─── Spring snap to tab ────────────────────────────────────────────
    const snapToTab = React.useCallback((toIdx: number) => {
        const tw     = tabWidthRef.current;
        if (tw === 0) return;
        const target = toIdx * tw + PILL_PAD;
        const dist   = Math.abs(pillCurrentX.current - target) / tw;
        const peak   = 1 + 0.2 * Math.min(dist, 2);

        Animated.timing(pillStretch, { toValue: peak, duration: 100, useNativeDriver: true }).start(() => {
            Animated.parallel([
                Animated.spring(pillPixelX, {
                    toValue: target,
                    useNativeDriver: true,
                    damping: 26, stiffness: 220, mass: 0.8,
                }),
                Animated.spring(pillStretch, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 18, stiffness: 240,
                }),
                Animated.spring(pillScale, {
                    toValue: 1,
                    useNativeDriver: true,
                    damping: 18, stiffness: 260,
                }),
            ]).start(() => { pillCurrentX.current = target; });
        });
    }, []);

    // Sync pill when tab changes via tap
    React.useEffect(() => {
        if (tabWidth === 0) return;
        const prev = prevVisual.current;
        prevVisual.current = visualIndex;
        if (!isDragging.current) {
            pillCurrentX.current = indexToPx(prev);
            snapToTab(visualIndex);
        }
    }, [visualIndex, tabWidth]);

    // Init pill position when bar width first becomes known
    React.useEffect(() => {
        if (tabWidth > 0) {
            const px = indexToPx(visualIndex);
            pillPixelX.setValue(px);
            pillCurrentX.current = px;
        }
    }, [tabWidth]);

    // ─── PanResponder ─────────────────────────────────────────────────
    // Recreate whenever tabWidth changes (fixes stale closure bug)
    const pan = React.useMemo(() => PanResponder.create({
        // Capture phase: parent steals touch when finger slides horizontally,
        // even if a child TouchableOpacity already received onStart.
        onStartShouldSetPanResponder:        () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_: GestureResponderEvent, gs: PanResponderGestureState) =>
            Math.abs(gs.dx) > 5 && Math.abs(gs.dx) > Math.abs(gs.dy),
        onMoveShouldSetPanResponderCapture: (_: GestureResponderEvent, gs: PanResponderGestureState) =>
            Math.abs(gs.dx) > 5 && Math.abs(gs.dx) > Math.abs(gs.dy),
        onPanResponderGrant: () => {
            isDragging.current = true;
            dragStartX.current = pillCurrentX.current;  // snapshot current position
            // Ball pops up uniformly when grabbed (magnifying bubble effect)
            Animated.parallel([
                Animated.spring(pillScale,   { toValue: 1.35, useNativeDriver: true, damping: 14, stiffness: 280 }),
                Animated.spring(pillStretch, { toValue: 1, useNativeDriver: true, damping: 14, stiffness: 280 }),
            ]).start();
        },
        onPanResponderMove: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
            const tw = tabWidthRef.current;
            if (tw === 0) return;
            const rawX    = dragStartX.current + gs.dx;
            const minX    = PILL_PAD;
            const maxX    = tw * (tabs.length - 1) + PILL_PAD;
            const clamped = Math.max(minX, Math.min(maxX, rawX));
            pillPixelX.setValue(clamped);
            pillCurrentX.current = clamped;
            // Gooey stretch in direction of movement
            const frac = Math.abs(gs.dx) / tw;
            pillStretch.setValue(1 + 0.15 * Math.min(frac, 2));
        },
        onPanResponderRelease: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
            isDragging.current = false;
            const tw = tabWidthRef.current;
            if (tw === 0) return;

            const releasedX = dragStartX.current + gs.dx;
            const targetIdx = Math.max(0, Math.min(tabs.length - 1,
                Math.round((releasedX - PILL_PAD) / tw)
            ));

            prevVisual.current = targetIdx;
            snapToTab(targetIdx);

            const targetName = tabs[targetIdx]?.name;
            if (targetName) {
                const routeIdx = stateRef.current.routes.findIndex(r => r.name === targetName);
                if (routeIdx !== -1 && stateRef.current.index !== routeIdx) {
                    navRef.current.navigate(targetName);
                }
            }
        },
        onPanResponderTerminate: (_: GestureResponderEvent, gs: PanResponderGestureState) => {
            // iOS system gestures (like swiping from the left edge) quickly cancel the current touch.
            // On terminate, we should behave exactly like a release so the pill doesn't stay stuck without navigating!
            isDragging.current = false;
            const tw = tabWidthRef.current;
            if (tw === 0) return;

            const releasedX = dragStartX.current + gs.dx;
            const targetIdx = Math.max(0, Math.min(tabs.length - 1,
                Math.round((releasedX - PILL_PAD) / tw)
            ));

            prevVisual.current = targetIdx;
            snapToTab(targetIdx);

            const targetName = tabs[targetIdx]?.name;
            if (targetName) {
                const routeIdx = stateRef.current.routes.findIndex(r => r.name === targetName);
                if (routeIdx !== -1 && stateRef.current.index !== routeIdx) {
                    navRef.current.navigate(targetName);
                }
            }
        },
    }), [tabWidth]);  // ← recreated when tabWidth changes, no stale closures

    return (
        <View style={tabBarStyles.wrapper} pointerEvents="box-none">
            <View
                style={tabBarStyles.pill}
                pointerEvents="auto"
                onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
                {...pan.panHandlers}
            >
                {/* Glassmorphism backdrop */}
                <BlurView intensity={Platform.OS === 'ios' ? 55 : 90} tint="light" style={StyleSheet.absoluteFill} />

                {/* Liquid Glass indicator — grab & drag me */}
                {tabWidth > 0 && (
                    <Animated.View
                        style={[
                            tabBarStyles.indicator,
                            {
                                width: tabWidth - PILL_PAD * 2,
                                transform: [
                                    { translateX: pillPixelX },
                                    { scale: pillScale },      // uniform pop when grabbed
                                    { scaleX: pillStretch },   // additional morph stretch when moving
                                ],
                            },
                        ]}
                        pointerEvents="none"
                    >
                        <View style={tabBarStyles.chromaticCyan} />
                        <View style={tabBarStyles.chromaticPurple} />
                        <View style={tabBarStyles.shine} />
                    </Animated.View>
                )}

                {/* Tab Buttons — magnify under the glass */}
                {tabs.map((tab, idx) => {
                    const routeIndex = state.routes.findIndex(r => r.name === tab.name);
                    const focused    = state.index === routeIndex;

                    // Guard: only interpolate once we have real dimensions
                    const scale = tabWidth > 0
                        ? pillPixelX.interpolate({
                            inputRange: [
                                idx * tabWidth - tabWidth + PILL_PAD,
                                idx * tabWidth + PILL_PAD,
                                idx * tabWidth + tabWidth + PILL_PAD,
                                idx * tabWidth + tabWidth * 2 + PILL_PAD,
                            ],
                            outputRange: [1, 1.18, 1.18, 1],
                            extrapolate: 'clamp',
                        })
                        : new Animated.Value(1);

                    return (
                        <TouchableOpacity
                            key={tab.name}
                            style={tabBarStyles.tabBtn}
                            onPress={() => { if (routeIndex !== -1 && !focused) navigation.navigate(tab.name); }}
                            activeOpacity={0.75}
                        >
                            <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
                                {tab.icon(focused)}
                                <Text style={[tabBarStyles.label, focused && tabBarStyles.labelActive]} allowFontScaling={false}>
                                    {tab.label}
                                </Text>
                            </Animated.View>
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
        right: 84,
        height: NAV_HEIGHT,
        zIndex: 1000,
    },
    pill: {
        flex: 1,
        flexDirection: 'row',
        borderRadius: 32,
        overflow: 'hidden',
        // Ultra-thin glass: on iOS the BlurView behind does the heavy lifting
        backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.15)' : 'rgba(245,245,247,0.80)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.55)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 12,
    },
    // The moving indicator pill — pure water-droplet glass, no inner BlurView overflow
    indicator: {
        position: 'absolute',
        top: 7,
        bottom: 7,
        borderRadius: 22,
        overflow: 'visible',  // Let the glow spill out slightly, it's clipped by the pill
        backgroundColor: 'rgba(255,255,255,0.55)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.90)',
        // Multi-color glow (chromatic aberration look)
        shadowColor: '#A5B4FC',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
    },
    // Top-left cyan highlight (light refraction)
    chromaticCyan: {
        position: 'absolute',
        top: 2, left: 4,
        width: 18, height: 8,
        borderRadius: 99,
        backgroundColor: 'rgba(103,232,249,0.22)',
    },
    // Bottom-right purple highlight
    chromaticPurple: {
        position: 'absolute',
        bottom: 2, right: 4,
        width: 14, height: 6,
        borderRadius: 99,
        backgroundColor: 'rgba(167,139,250,0.20)',
    },
    // White gloss specular
    shine: {
        position: 'absolute',
        top: 1, left: 10,
        right: 10, height: 12,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.45)',
    },
    tabBtn: {
        flex: 1,
        height: NAV_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        zIndex: 1,
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
    const pathname = usePathname();
    const isAiCoachScreen = pathname.includes('ai-coach');
    const { t } = useAppLanguage();
    const { isAddMenuOpen, setAddMenuOpen, selectedMealType, setSelectedMealType } = useMealStore();
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

    // Sync global isAddMenuOpen → open the FAB menu
    useEffect(() => {
        if (isAddMenuOpen && !menuOpen) {
            openMenu();
        } else if (!isAddMenuOpen && menuOpen) {
            // External close (e.g. backdrop) already handled by closeMenu
        }
    }, [isAddMenuOpen]);

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
        ]).start(() => {
            setMenuOpen(false);
            setAddMenuOpen(false);
        });
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
                <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]}>
                    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, { opacity: overlayOpacity }]} pointerEvents="auto">
                        <Pressable style={StyleSheet.absoluteFill} onPress={closeMenu} />
                    </Animated.View>
                </View>
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
                                <TouchableOpacity
                                    style={styles.menuIconBtn}
                                    onPress={() => handleOption(opt.id)}
                                    activeOpacity={0.7}
                                >
                                    <View style={StyleSheet.absoluteFill}>
                                        <BlurView intensity={75} tint="light" style={StyleSheet.absoluteFill} />
                                    </View>
                                    <Ionicons name={opt.icon} size={24} color="#1B2838" style={{ zIndex: 1 }} />
                                </TouchableOpacity>
                            </Animated.View>
                        ))}
                    </>
                )}

                {/* AI Bubble resting (menu closed) */}
                {!menuOpen && !isAiCoachScreen && (
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
        zIndex: 9999, // Ensure it's above everything on iOS
        gap: 10,
        width: 200, // Give it a fixed width to ensure touch area is stable
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
