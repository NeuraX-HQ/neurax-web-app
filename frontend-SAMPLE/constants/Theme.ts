// Design tokens from Home_style_style_reference.html
export const Colors = {
    // Primary palette
    primary: '#005C45',
    primaryLight: '#E8F3F0',
    primaryHover: '#004936',
    primaryDark: '#004d3a',

    // Surface & Background
    surface: '#FFFFFF',
    background: '#F2F6F9',
    bgApp: '#F2F6F9',

    // Text colors
    textDark: '#0B231E',
    textMedium: '#4A635D',
    textLight: '#8FA6A0',
    textOnPrimary: '#FFFFFF',

    // Semantic colors
    success: '#10B981',
    warning: '#D97706',
    info: '#0284C7',
    error: '#EF4444',

    // Macro colors
    protein: '#10B981',
    carbs: '#F59E0B',
    fat: '#3B82F6',
    calories: '#005C45',

    // Glass effect
    accentGlass: 'rgba(255, 255, 255, 0.65)',

    // Overlay
    overlay: 'rgba(11, 35, 30, 0.4)',
};

export const Spacing = {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
};

export const BorderRadius = {
    sm: 12,
    md: 20,
    lg: 32,
    pill: 999,
};

export const Shadows = {
    soft: {
        shadowColor: '#005C45',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 20,
        elevation: 4,
    },
    card: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.04,
        shadowRadius: 24,
        elevation: 6,
    },
    float: {
        shadowColor: '#005C45',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
        elevation: 8,
    },
};

export const Typography = {
    h1: {
        fontFamily: 'Playfair Display',
        fontSize: 28,
        fontWeight: '600' as const,
        letterSpacing: -0.02,
    },
    h2: {
        fontFamily: 'Playfair Display',
        fontSize: 24,
        fontWeight: '600' as const,
        letterSpacing: -0.02,
    },
    h3: {
        fontFamily: 'Playfair Display',
        fontSize: 20,
        fontWeight: '600' as const,
        letterSpacing: -0.02,
    },
    body: {
        fontFamily: 'Inter',
        fontSize: 16,
        fontWeight: '400' as const,
    },
    bodyMedium: {
        fontFamily: 'Inter',
        fontSize: 14,
        fontWeight: '500' as const,
    },
    caption: {
        fontFamily: 'Inter',
        fontSize: 12,
        fontWeight: '400' as const,
    },
    label: {
        fontFamily: 'Inter',
        fontSize: 11,
        fontWeight: '700' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 0.05,
    },
};
