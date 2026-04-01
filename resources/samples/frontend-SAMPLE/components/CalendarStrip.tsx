import React, { memo, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Colors, Shadows } from '../constants/Theme';

interface CalendarStripProps {
    weekData: { date: string; logged: boolean }[];
    selectedDate: string;
    onSelectDate: (date: string) => void;
    streak: number;
}

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const SCREEN_WIDTH = Dimensions.get('window').width;

const CalendarStrip = memo(function CalendarStrip({
    weekData,
    selectedDate,
    onSelectDate,
    streak,
}: CalendarStripProps) {
    const today = new Date().toISOString().split('T')[0];
    const flatListRef = useRef<FlatList>(null);

    // Generate multiple weeks for swipe
    const generateWeeks = () => {
        const weeks: { date: string; logged: boolean }[][] = [];
        // Previous week
        const prevWeek = weekData.map(day => {
            const date = new Date(day.date);
            date.setDate(date.getDate() - 7);
            return { date: date.toISOString().split('T')[0], logged: false };
        });
        // Next week
        const nextWeek = weekData.map(day => {
            const date = new Date(day.date);
            date.setDate(date.getDate() + 7);
            return { date: date.toISOString().split('T')[0], logged: false };
        });
        weeks.push(prevWeek, weekData, nextWeek);
        return weeks;
    };

    const weeks = generateWeeks();

    const renderWeek = ({ item: week, index }: { item: { date: string; logged: boolean }[]; index: number }) => (
        <View style={styles.weekContainer}>
            {week.map((day, dayIndex) => {
                const date = new Date(day.date);
                const dayNum = date.getDate();
                const isToday = day.date === today;
                const isSelected = day.date === selectedDate;
                const isFuture = day.date > today;

                return (
                    <Pressable
                        key={day.date}
                        onPress={() => !isFuture && onSelectDate(day.date)}
                        style={[
                            styles.dayItem,
                            isFuture && styles.dayItemFuture,
                        ]}
                    >
                        <Text style={[styles.dayLabel, isFuture && styles.dayLabelFuture]}>
                            {DAYS[dayIndex]}
                        </Text>
                        <View
                            style={[
                                styles.dayCircle,
                                isToday && styles.dayCircleToday,
                                isSelected && styles.dayCircleSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    styles.dayNum,
                                    (isToday || isSelected) && styles.dayNumSelected,
                                ]}
                            >
                                {dayNum}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.dot,
                                day.logged && styles.dotLogged,
                            ]}
                        />
                    </Pressable>
                );
            })}
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Swipeable Calendar */}
            <FlatList
                ref={flatListRef}
                data={weeks}
                renderItem={renderWeek}
                keyExtractor={(_, index) => `week-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={1}
                getItemLayout={(_, index) => ({
                    length: SCREEN_WIDTH - 48,
                    offset: (SCREEN_WIDTH - 48) * index,
                    index,
                })}
                contentContainerStyle={styles.flatListContent}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 12,
    },
    spacer: {
        flex: 1,
    },
    streakPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 999,
        gap: 6,
        ...Shadows.soft,
    },
    streakEmoji: {
        fontSize: 14,
    },
    streakText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textDark,
    },
    flatListContent: {
        paddingHorizontal: 0,
    },
    weekContainer: {
        width: SCREEN_WIDTH - 48,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dayItem: {
        alignItems: 'center',
        gap: 6,
    },
    dayItemFuture: {
        opacity: 0.5,
    },
    dayLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textMedium,
    },
    dayLabelFuture: {
        color: Colors.textLight,
    },
    dayCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleToday: {
        backgroundColor: Colors.primary,
        ...Shadows.soft,
        shadowColor: Colors.primary,
    },
    dayCircleSelected: {
        backgroundColor: Colors.primary,
        ...Shadows.soft,
        shadowColor: Colors.primary,
    },
    dayNum: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textDark,
    },
    dayNumSelected: {
        color: Colors.surface,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'transparent',
    },
    dotLogged: {
        backgroundColor: Colors.success,
    },
});

export default CalendarStrip;

