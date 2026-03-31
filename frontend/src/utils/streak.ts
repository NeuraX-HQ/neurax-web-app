export type FlameLevel = 'low' | 'medium' | 'high';

const LEVEL_ORDER: FlameLevel[] = ['low', 'medium', 'high'];

const shiftLevel = (level: FlameLevel, delta: number): FlameLevel => {
    const index = LEVEL_ORDER.indexOf(level);
    const nextIndex = Math.min(Math.max(index + delta, 0), LEVEL_ORDER.length - 1);
    return LEVEL_ORDER[nextIndex];
};

const isoToDate = (iso: string): Date => {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
};

export const toLocalIsoDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export const getCurrentStreak = (activeDateSet: Set<string>, todayIso: string): number => {
    let streak = 0;
    const cursor = isoToDate(todayIso);

    while (activeDateSet.has(toLocalIsoDate(cursor))) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
};

export const getDaysSinceLastActive = (activeDateSet: Set<string>, todayIso: string): number | null => {
    if (activeDateSet.size === 0) return null;

    const todayDate = isoToDate(todayIso);
    let latestTimestamp = Number.NEGATIVE_INFINITY;

    activeDateSet.forEach((iso) => {
        const timestamp = isoToDate(iso).getTime();
        if (timestamp > latestTimestamp) latestTimestamp = timestamp;
    });

    if (!Number.isFinite(latestTimestamp)) return null;

    const msPerDay = 24 * 60 * 60 * 1000;
    const dayDiff = Math.floor((todayDate.getTime() - latestTimestamp) / msPerDay);
    return Math.max(0, dayDiff);
};

export const getFlameLevel = (activeDateSet: Set<string>, todayIso: string): FlameLevel => {
    const streak = getCurrentStreak(activeDateSet, todayIso);

    let baseLevel: FlameLevel = 'low';
    if (streak >= 21) baseLevel = 'high';
    else if (streak >= 7) baseLevel = 'medium';

    const daysSinceLastActive = getDaysSinceLastActive(activeDateSet, todayIso);
    if (daysSinceLastActive === null) return 'low';

    if (daysSinceLastActive === 0) return baseLevel;
    if (daysSinceLastActive === 1) return shiftLevel(baseLevel, -1);
    return 'low';
};

export const getNextStreakTarget = (streak: number): number | null => {
    const milestones = [3, 7, 14, 30, 60, 100];
    for (const milestone of milestones) {
        if (streak < milestone) return milestone;
    }
    return null;
};
