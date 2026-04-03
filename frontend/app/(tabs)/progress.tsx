import React, { useMemo, useState, useCallback } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMealStore } from '../../src/store/mealStore';
import { Colors, Shadows } from '../../src/constants/colors';
import { useAppLanguage } from '../../src/i18n/LanguageProvider';
import { getWeeklyInsight } from '../../src/services/aiService';
import {
    getCurrentStreak,
    getFlameLevel,
    toLocalIsoDate,
    getNextStreakTarget,
} from '../../src/utils/streak';
import { StreakFlameCard } from '../../src/components/StreakFlameCard';

const { width: SCREEN_W } = Dimensions.get('window');
const CHART_HEIGHT = 100;
const CALORIE_GOAL = 2000;
const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function getWeekDates(todayIso: string, offsetWeeks = 0): string[] {
    const today = new Date(todayIso);
    const dayOfWeek = (today.getDay() + 6) % 7;
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - dayOfWeek + i - offsetWeeks * 7);
        return toLocalIsoDate(d);
    });
}

function getMonthDates(todayIso: string): string[] {
    const today = new Date(todayIso);
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month, i + 1);
        return toLocalIsoDate(d);
    });
}

// ── Component: Stacked Macro Bar ──────────────────────────────────────────
function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
    const total = protein + carbs + fat || 1;
    const pPct = Math.round((protein / total) * 100);
    const cPct = Math.round((carbs / total) * 100);
    const fPct = 100 - pPct - cPct;
    return (
        <View>
            <View style={macroStyles.labelRow}>
                <Text style={macroStyles.label}>🥩 Protein {pPct}%</Text>
                <Text style={macroStyles.label}>🌾 Carb {cPct}%</Text>
                <Text style={macroStyles.label}>🧈 Fat {fPct}%</Text>
            </View>
            <View style={macroStyles.bar}>
                <View style={[macroStyles.seg, { flex: pPct, backgroundColor: Colors.protein }]} />
                <View style={[macroStyles.seg, { flex: cPct, backgroundColor: Colors.carbs }]} />
                <View style={[macroStyles.seg, { flex: Math.max(fPct, 1), backgroundColor: Colors.fat }]} />
            </View>
            <View style={macroStyles.targetRow}>
                <View style={macroStyles.targetDot} />
                <Text style={macroStyles.targetLabel}>Mục tiêu</Text>
                <View style={macroStyles.targetLine} />
                <Text style={macroStyles.targetValue}>{CALORIE_GOAL} kcal</Text>
            </View>
        </View>
    );
}

const macroStyles = StyleSheet.create({
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    label: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
    bar: { flexDirection: 'row', height: 14, borderRadius: 99, overflow: 'hidden', marginBottom: 12 },
    seg: { height: '100%' },
    targetRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    targetDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB' },
    targetLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
    targetLine: { flex: 1, height: 4, backgroundColor: '#F3F4F6', borderRadius: 99 },
    targetValue: { fontSize: 13, fontWeight: '800', color: Colors.text },
});

// ── Component: Activity Calendar ──────────────────────────────────────────
function ActivityCalendar({ dailyCaloriesMap, todayIso }: { dailyCaloriesMap: Record<string, number>; todayIso: string }) {
    const [monthOffset, setMonthOffset] = useState(0);

    const monthDates = useMemo(() => {
        const d = new Date(todayIso);
        d.setMonth(d.getMonth() + monthOffset);
        return getMonthDates(toLocalIsoDate(d));
    }, [todayIso, monthOffset]);

    // arrange month days into columns of 3
    const CELL = 14;
    const GAP = 4;
    const cols: string[][] = [];
    for (let i = 0; i < monthDates.length; i += 2) {
        cols.push(monthDates.slice(i, i + 2));
    }
    const getCellColor = (iso: string) => {
        const cals = dailyCaloriesMap[iso] || 0;
        if (cals === 0) return '#E5E7EB';
        const pct = cals / CALORIE_GOAL;
        if (pct <= 0.33) return '#D1FAE5';
        if (pct <= 0.66) return '#6EE7B7';
        return Colors.accent;
    };

    const currentDate = new Date(todayIso);
    currentDate.setMonth(currentDate.getMonth() + monthOffset);
    const monthLabel = `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;

    return (
        <View style={calStyles.container}>
            <View style={calStyles.monthHeader}>
                <TouchableOpacity onPress={() => setMonthOffset(m => m - 1)} style={calStyles.navBtn}>
                    <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
                <Text style={calStyles.monthTitle}>{monthLabel}</Text>
                <TouchableOpacity onPress={() => setMonthOffset(m => m + 1)} style={calStyles.navBtn}>
                    <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={calStyles.grid}>
                    {cols.map((col, ci) => (
                        <View key={ci} style={calStyles.col}>
                            {col.map((iso, ri) => (
                                <View
                                    key={ri}
                                    style={[
                                        calStyles.cell,
                                        { width: CELL, height: CELL, marginBottom: GAP, backgroundColor: getCellColor(iso) },
                                    ]}
                                />
                            ))}
                        </View>
                    ))}
                </View>
            </ScrollView>
            <View style={calStyles.legend}>
                <View style={calStyles.legendRight}>
                    <Text style={calStyles.legendText}>Ít</Text>
                    {['#D1FAE5', '#6EE7B7', Colors.accent].map((c, i) => (
                        <View key={i} style={[calStyles.legendDot, { backgroundColor: c }]} />
                    ))}
                    <Text style={calStyles.legendText}>Nhiều</Text>
                </View>
            </View>
        </View>
    );
}

const calStyles = StyleSheet.create({
    container: { gap: 10 },
    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
    navBtn: { padding: 4 },
    monthTitle: { fontSize: 13, fontWeight: '700', color: Colors.text },
    grid: { flexDirection: 'row', gap: 4 },
    col: { flexDirection: 'column' },
    cell: { borderRadius: 3 },
    legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    legendRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 2 },
    legendText: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
});

// ── Main Screen ────────────────────────────────────────────────────────────
export default function ProgressScreen() {
    const router = useRouter();
    const { t, language } = useAppLanguage();
    const { meals } = useMealStore();

    const todayIso = toLocalIsoDate(new Date());
    const activeDateSet = useMemo(() => new Set(meals.map((m) => m.date)), [meals]);
    const streak = useMemo(() => getCurrentStreak(activeDateSet, todayIso), [activeDateSet, todayIso]);
    const flameLevel = useMemo(() => getFlameLevel(activeDateSet, todayIso), [activeDateSet, todayIso]);
    const nextTarget = useMemo(() => getNextStreakTarget(streak), [streak]);

    // ── Weekly calories (this week vs last week) ────────────────────────
    const weekDates = useMemo(() => getWeekDates(todayIso), [todayIso]);
    const prevWeekDates = useMemo(() => getWeekDates(todayIso, 1), [todayIso]);

    const weekCalories = useMemo(
        () => weekDates.map((d) => meals.filter((m) => m.date === d).reduce((s, m) => s + m.calories, 0)),
        [meals, weekDates]
    );
    const prevWeekCalories = useMemo(
        () => prevWeekDates.map((d) => meals.filter((m) => m.date === d).reduce((s, m) => s + m.calories, 0)),
        [meals, prevWeekDates]
    );

    const dailyAvg = useMemo(() => {
        const nonZero = weekCalories.filter((c) => c > 0);
        return nonZero.length ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : 0;
    }, [weekCalories]);

    const thisWeekTotal = weekCalories.reduce((a, b) => a + b, 0);
    const prevWeekTotal = prevWeekCalories.reduce((a, b) => a + b, 0);
    const weekVsWeek = prevWeekTotal > 0 ? Math.round(((thisWeekTotal - prevWeekTotal) / prevWeekTotal) * 100) : 0;
    const maxCal = Math.max(...weekCalories, ...prevWeekCalories, 1);

    // ── Macro breakdown (this week) ─────────────────────────────────────
    const weekMeals = useMemo(() => meals.filter((m) => weekDates.includes(m.date)), [meals, weekDates]);
    const weekProtein = Math.round(weekMeals.reduce((s, m) => s + m.protein, 0) / 7);
    const weekCarbs = Math.round(weekMeals.reduce((s, m) => s + m.carbs, 0) / 7);
    const weekFat = Math.round(weekMeals.reduce((s, m) => s + m.fat, 0) / 7);

    // ── Goal hit rate ───────────────────────────────────────────────────
    const goalHitDays = weekCalories.filter((c) => c > 0 && Math.abs(c - CALORIE_GOAL) / CALORIE_GOAL <= 0.15);
    const daysLogged = weekCalories.filter((c) => c > 0).length;
    const consistency = Math.round((daysLogged / 7) * 100);

    // ── Meal type breakdown ─────────────────────────────────────────────
    const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
    const mealLabels: Record<string, string> = { BREAKFAST: 'Sáng', LUNCH: 'Trưa', DINNER: 'Tối', SNACK: 'Phụ' };
    const totalWeekCal = weekMeals.reduce((s, m) => s + m.calories, 1);
    const mealBreakdown = mealTypes.map((type) => {
        const typeMeals = weekMeals.filter((m) => m.type === type);
        const calories = typeMeals.reduce((s, m) => s + m.calories, 0);
        const count = typeMeals.length;
        const pct = Math.round((calories / totalWeekCal) * 100);
        return { type, label: mealLabels[type], count, pct };
    });

    // ── Monthly activity calendar ────────────────────────────────────────
    const dailyCaloriesMap = useMemo(() => {
        const map: Record<string, number> = {};
        meals.forEach(m => {
            if (!map[m.date]) map[m.date] = 0;
            map[m.date] += m.calories;
        });
        return map;
    }, [meals]);

    // ── Monthly trend ───────────────────────────────────────────────────
    const svgWidth = SCREEN_W - 64;
    const svgHeight = 96;
    const monthlyPoints = useMemo(() => {
        const today = new Date(todayIso);
        return Array.from({ length: 4 }, (_, w) => {
            let total = 0, count = 0;
            for (let d = 0; d < 7; d++) {
                const dt = new Date(today);
                dt.setDate(today.getDate() - (3 - w) * 7 - (6 - d));
                const iso = toLocalIsoDate(dt);
                const dayMeals = meals.filter((m) => m.date === iso);
                if (dayMeals.length) { total += dayMeals.reduce((s, m) => s + m.calories, 0); count++; }
            }
            return count ? Math.round(total / count) : 0;
        });
    }, [meals, todayIso]);

    const monthlyAvg = Math.round(
        monthlyPoints.filter((v) => v > 0).reduce((a, b) => a + b, 0) / (monthlyPoints.filter((v) => v > 0).length || 1)
    );

    // ── Weekly AI Insight ─────────────────────────────────────────────
    const [insightText, setInsightText] = useState<string | null>(null);
    const [insightLoading, setInsightLoading] = useState(false);
    const [insightError, setInsightError] = useState(false);

    const fetchWeeklyInsight = useCallback(async () => {
        if (insightLoading || insightText) return;
        if (daysLogged < 3) return; // need at least 3 days of data
        setInsightLoading(true);
        setInsightError(false);
        try {
            const weeklySummary = {
                avg_calories: dailyAvg,
                total_calories: thisWeekTotal,
                protein_avg_g: weekProtein,
                carbs_avg_g: weekCarbs,
                fat_avg_g: weekFat,
                days_logged: daysLogged,
                consistency_pct: consistency,
            };
            const patterns = mealBreakdown
                .filter(m => m.pct > 0)
                .map(m => `${m.label}: ${m.pct}% (${m.count} bữa)`)
                .join(', ');
            const res = await getWeeklyInsight({}, weeklySummary, patterns);
            if (res.success && res.data) {
                const d = res.data;
                const text = typeof d === 'string'
                    ? d
                    : (language === 'vi' ? d.insight_vi : d.insight_en)
                        || d.insight_vi || d.insight_en
                        || d.summary || d.insight
                        || (typeof d === 'object' ? '' : String(d));
                setInsightText(text);
            } else {
                setInsightError(true);
            }
        } catch {
            setInsightError(true);
        } finally {
            setInsightLoading(false);
        }
    }, [insightLoading, insightText, daysLogged, dailyAvg, thisWeekTotal, weekProtein, weekCarbs, weekFat, consistency, mealBreakdown]);

    const trendPath = useMemo(() => {
        const filled = monthlyPoints.map((v) => v || 100);
        const maxV = Math.max(...filled, 1);
        const pts = filled.map((v, i) => ({
            x: (i / (filled.length - 1)) * svgWidth,
            y: svgHeight - (v / maxV) * (svgHeight - 12) - 6,
        }));
        let d = `M ${pts[0].x},${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) {
            const cpX = pts[i - 1].x + (pts[i].x - pts[i - 1].x) / 2;
            d += ` C ${cpX},${pts[i - 1].y} ${cpX},${pts[i].y} ${pts[i].x},${pts[i].y}`;
        }
        return { line: d, fill: d + ` L ${pts[pts.length - 1].x},${svgHeight} L ${pts[0].x},${svgHeight} Z` };
    }, [monthlyPoints, svgWidth, svgHeight]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tiến Trình</Text>
                <TouchableOpacity onPress={() => router.push('/achievements')} style={styles.headerBtn}>
                    <Ionicons name="trophy-outline" size={22} color={Colors.accent} />
                </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

                {/* ── 1. Streak Hero ────────────────────────────────── */}
                <View style={[styles.streakCard, Shadows.medium]}>
                    <View style={styles.streakLeft}>
                        <Text style={styles.streakSubLabel}>CHUỖI HIỆN TẠI</Text>
                        <Text style={styles.streakDays}>{streak} Ngày Streak</Text>
                        <Text style={styles.streakMotivation}>
                            {streak === 0 ? 'Bắt đầu hành trình hôm nay!' : streak < 7 ? 'Tiếp tục nhé! 💪' : 'Bạn đang bứt phá! 🔥'}
                        </Text>
                        {nextTarget ? (
                            <View style={styles.nextPill}>
                                <Text style={styles.nextPillText}>🎯 Còn {nextTarget - streak} ngày → mốc {nextTarget}</Text>
                            </View>
                        ) : (
                            <View style={styles.nextPill}>
                                <Text style={styles.nextPillText}>🏆 Đỉnh cao!</Text>
                            </View>
                        )}
                    </View>
                    <StreakFlameCard streak={streak} flameLevel={flameLevel} compact />
                </View>

                {/* ── AI Weekly Insight ────────────────────────────── */}
                {daysLogged >= 3 && (
                    <View style={[styles.card, Shadows.small, { borderLeftWidth: 3, borderLeftColor: Colors.accent }]}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.cardTitle}>🤖 Nhận Xét Từ AI</Text>
                        </View>
                        {insightText ? (
                            <Text style={{ fontSize: 14, color: Colors.text, lineHeight: 22, marginTop: 8 }}>{insightText}</Text>
                        ) : insightLoading ? (
                            <ActivityIndicator size="small" color={Colors.accent} style={{ marginTop: 12 }} />
                        ) : insightError ? (
                            <TouchableOpacity onPress={fetchWeeklyInsight} style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 14, color: Colors.red }}>Lỗi tải. Nhấn thử lại.</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={fetchWeeklyInsight}
                                style={{ backgroundColor: Colors.accent, borderRadius: 10, paddingVertical: 10, marginTop: 10, alignItems: 'center' }}
                            >
                                <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 14 }}>Xem nhận xét tuần này</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* ── 2. Weekly Calories Bar Chart ──────────────────── */}
                <View style={[styles.card, Shadows.small]}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>Calo Theo Tuần</Text>
                        <View style={[styles.badge, weekVsWeek >= 0 ? styles.badgeRed : styles.badgeGreen]}>
                            <Ionicons
                                name={weekVsWeek >= 0 ? 'trending-up' : 'trending-down'}
                                size={11}
                                color={weekVsWeek >= 0 ? '#EF4444' : '#10B981'}
                            />
                            <Text style={[styles.badgeText, { color: weekVsWeek >= 0 ? '#EF4444' : '#10B981' }]}>
                                {weekVsWeek >= 0 ? '+' : ''}{weekVsWeek}% vs tuần trước
                            </Text>
                        </View>
                    </View>

                    <View style={styles.avgRow}>
                        <View>
                            <Text style={styles.avgLabel}>Trung Bình Ngày</Text>
                            <Text style={styles.avgValue}>{dailyAvg.toLocaleString()} <Text style={styles.avgUnit}>kcal</Text></Text>
                        </View>
                    </View>

                    <View style={styles.barChart}>
                        {weekCalories.map((cal, i) => {
                            const heightPct = cal / maxCal;
                            const isToday = weekDates[i] === todayIso;
                            const barH = Math.max(heightPct * CHART_HEIGHT, cal > 0 ? 6 : 3);
                            const overGoal = cal > CALORIE_GOAL * 1.15;
                            return (
                                <View key={i} style={styles.barColumn}>
                                    <View style={styles.barTrack}>
                                        <View
                                            style={[
                                                styles.barFill,
                                                {
                                                    height: barH,
                                                    backgroundColor: overGoal ? '#F87171' : isToday ? Colors.accent : cal > 0 ? '#4A90D9' : '#E5E7EB',
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text style={[styles.barLabel, isToday && styles.barLabelToday]}>{DAY_LABELS[i]}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* ── 3. Monthly Trend ──────────────────────────────── */}
                <View style={[styles.card, Shadows.small]}>
                    <Text style={styles.cardTitle}>Xu Hướng Tháng</Text>
                    <View style={styles.trendWrap}>
                        <Svg width={svgWidth} height={svgHeight}>
                            <Defs>
                                <LinearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                                    <Stop offset="0%" stopColor={Colors.accent} stopOpacity="0.28" />
                                    <Stop offset="100%" stopColor={Colors.accent} stopOpacity="0" />
                                </LinearGradient>
                            </Defs>
                            <Path d={trendPath.fill} fill="url(#tg)" />
                            <Path d={trendPath.line} fill="none" stroke={Colors.accent} strokeWidth="2.5" strokeLinecap="round" />
                        </Svg>
                        <View style={styles.trendBadge}>
                            <Text style={styles.trendBadgeText}>TB: {monthlyAvg.toLocaleString()} kcal</Text>
                        </View>
                    </View>
                    <View style={styles.trendLabels}>
                        {['Tuần 4', 'Tuần 3', 'Tuần 2', 'Tuần 1'].map((l) => (
                            <Text key={l} style={styles.trendLabelText}>{l}</Text>
                        ))}
                    </View>
                </View>

                {/* ── 4. Macro Breakdown ─────────────────────────────── */}
                <View style={[styles.card, Shadows.small]}>
                    <Text style={styles.cardTitle}>Tỉ Lệ Dinh Dưỡng</Text>
                    <MacroBar protein={weekProtein} carbs={weekCarbs} fat={weekFat} />
                    <View style={styles.macroLegendRow}>
                        {[
                            { label: `Protein ${weekProtein}g`, color: Colors.protein },
                            { label: `Carb ${weekCarbs}g`, color: Colors.carbs },
                            { label: `Fat ${weekFat}g`, color: Colors.fat },
                        ].map((item) => (
                            <View key={item.label} style={styles.macroLegendItem}>
                                <View style={[styles.macroLegendDot, { backgroundColor: item.color }]} />
                                <Text style={styles.macroLegendText}>{item.label}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── 5. Goal Hit Rate + Hydration ─────────────────── */}
                <View style={styles.twoColRow}>
                    {/* Goal Hit Rate */}
                    <View style={[styles.halfCard, Shadows.small]}>
                        <Text style={styles.halfLabel}>ĐẠT MỤC TIÊU</Text>
                        <View style={styles.halfValueRow}>
                            <Text style={styles.halfValue}>{goalHitDays.length}/7</Text>
                            <Text style={styles.halfUnit}>ngày</Text>
                        </View>
                        <View style={styles.dotsRow}>
                            {weekCalories.map((cal, i) => {
                                const hit = cal > 0 && Math.abs(cal - CALORIE_GOAL) / CALORIE_GOAL <= 0.15;
                                return (
                                    <View
                                        key={i}
                                        style={[styles.dot, { backgroundColor: cal === 0 ? '#E5E7EB' : hit ? '#10B981' : '#F87171' }]}
                                    />
                                );
                            })}
                        </View>
                    </View>

                    {/* Consistency */}
                    <View style={[styles.halfCard, Shadows.small]}>
                        <Text style={styles.halfLabel}>ĐỀU ĐẶN</Text>
                        <View style={styles.halfValueRow}>
                            <Text style={[styles.halfValue, { color: consistency >= 70 ? Colors.accent : Colors.orange }]}>
                                {consistency}%
                            </Text>
                        </View>
                        <View style={styles.consistencyRow}>
                            <Ionicons name="calendar-outline" size={13} color={Colors.accent} />
                            <Text style={styles.consistencyText}>{daysLogged}/7 ngày đã log</Text>
                        </View>
                    </View>
                </View>

                {/* ── 6. Meal Insights Grid ─────────────────────────── */}
                <View style={[styles.card, Shadows.small]}>
                    <Text style={styles.cardTitle}>Phân Bổ Bữa Ăn</Text>
                    <View style={styles.mealGrid}>
                        {mealBreakdown.map((item) => {
                            const iconMap: Record<string, string> = {
                                BREAKFAST: '🌅', LUNCH: '☀️', DINNER: '🌙', SNACK: '🍎',
                            };
                            return (
                                <View key={item.type} style={styles.mealCard}>
                                    <View style={styles.mealCardHeader}>
                                        <Text style={styles.mealTypeLabel}>{iconMap[item.type]} {item.label}</Text>
                                        <Text style={styles.mealPct}>{item.pct}%</Text>
                                    </View>
                                    <Text style={styles.mealCount}>{item.count} lần/tuần</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* ── 7. Activity Calendar (GitHub-style) ──────────── */}
                <View style={[styles.card, Shadows.small]}>
                    <Text style={styles.cardTitle}>Hoạt Động</Text>
                    <ActivityCalendar dailyCaloriesMap={dailyCaloriesMap} todayIso={todayIso} />
                </View>

                {/* ── 8. Quick Stats ────────────────────────────────── */}
                <View style={styles.twoColRow}>
                    <View style={[styles.halfCard, Shadows.small]}>
                        <Text style={styles.halfLabel}>TỔNG TUẦN</Text>
                        <Text style={styles.halfValue}>{thisWeekTotal.toLocaleString()}</Text>
                        <Text style={styles.halfUnit}>kcal đã theo dõi</Text>
                    </View>
                    <View style={[styles.halfCard, Shadows.small]}>
                        <Text style={styles.halfLabel}>ĐIỂM NHẤT QUÁN</Text>
                        <Text style={[styles.halfValue, { color: consistency >= 70 ? Colors.accent : Colors.orange }]}>
                            {consistency}%
                        </Text>
                        <Text style={styles.halfUnit}>so với mục tiêu</Text>
                    </View>
                </View>

                {/* ── 9. Achievements Button ───────────────────────── */}
                <TouchableOpacity
                    style={[styles.achieveBtn, Shadows.small]}
                    onPress={() => router.push('/achievements')}
                    activeOpacity={0.82}
                >
                    <Ionicons name="trophy-outline" size={20} color="#FFF" />
                    <Text style={styles.achieveBtnText}>Xem Thành Tựu & Huy Hiệu</Text>
                    <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F6F8' },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 12,
    },
    headerTitle: { fontSize: 26, fontWeight: '900', color: Colors.text },
    headerBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(46,204,113,0.12)',
        alignItems: 'center', justifyContent: 'center',
    },
    content: { paddingHorizontal: 16, paddingBottom: 120, gap: 14 },

    // ── Streak ────────────────────────────────────────────────
    streakCard: {
        backgroundColor: '#1B2838', borderRadius: 22,
        paddingVertical: 20, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    streakLeft: { flex: 1, gap: 4 },
    streakSubLabel: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, textTransform: 'uppercase' },
    streakDays: { fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
    streakMotivation: { fontSize: 12, color: Colors.accent, fontWeight: '600' },
    nextPill: {
        marginTop: 6, alignSelf: 'flex-start',
        backgroundColor: 'rgba(46,204,113,0.15)', borderRadius: 99,
        paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: 'rgba(46,204,113,0.3)',
    },
    nextPillText: { fontSize: 10, fontWeight: '700', color: Colors.accent },

    // ── Cards ─────────────────────────────────────────────────
    card: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, gap: 10 },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 16, fontWeight: '800', color: Colors.text },
    badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99 },
    badgeRed: { backgroundColor: '#FEF2F2' },
    badgeGreen: { backgroundColor: '#F0FFF4' },
    badgeText: { fontSize: 10, fontWeight: '700' },

    // ── Bar chart ────────────────────────────────────────────
    avgRow: { marginBottom: 4 },
    avgLabel: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 },
    avgValue: { fontSize: 22, fontWeight: '900', color: Colors.text },
    avgUnit: { fontSize: 12, fontWeight: '400', color: Colors.textSecondary },
    barChart: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 5,
        height: CHART_HEIGHT + 20,
    },
    barColumn: { flex: 1, alignItems: 'center', gap: 4 },
    barTrack: {
        flex: 1, width: '100%', backgroundColor: '#F3F4F6',
        borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden',
    },
    barFill: { width: '100%', borderRadius: 6 },
    barLabel: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary },
    barLabelToday: { color: Colors.accent },

    // ── Trend ─────────────────────────────────────────────────
    trendWrap: { alignItems: 'center', position: 'relative' },
    trendBadge: {
        position: 'absolute', top: '30%',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 99, borderWidth: 1, borderColor: '#E5E7EB',
    },
    trendBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.text },
    trendLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    trendLabelText: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary },

    // ── Macro legend ──────────────────────────────────────────
    macroLegendRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    macroLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    macroLegendDot: { width: 8, height: 8, borderRadius: 4 },
    macroLegendText: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },

    // ── Two-col ───────────────────────────────────────────────
    twoColRow: { flexDirection: 'row', gap: 14 },
    halfCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, gap: 4 },
    halfLabel: { fontSize: 9, fontWeight: '800', color: Colors.textSecondary, letterSpacing: 1.2, textTransform: 'uppercase' },
    halfValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    halfValue: { fontSize: 26, fontWeight: '900', color: Colors.text },
    halfUnit: { fontSize: 10, color: Colors.textSecondary },
    dotsRow: { flexDirection: 'row', gap: 5, marginTop: 4 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    consistencyRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    consistencyText: { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },

    // ── Meal grid ─────────────────────────────────────────────
    mealGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    mealCard: {
        width: '47%', backgroundColor: '#F9FAFB',
        borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: '#F0F0F0',
        gap: 4,
    },
    mealCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    mealTypeLabel: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary },
    mealPct: { fontSize: 11, fontWeight: '900', color: Colors.accent },
    mealCount: { fontSize: 13, fontWeight: '800', color: Colors.text },

    // ── Achieve btn ───────────────────────────────────────────
    achieveBtn: {
        backgroundColor: Colors.text, borderRadius: 16,
        paddingVertical: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center', gap: 10,
    },
    achieveBtnText: { flex: 1, fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
});
