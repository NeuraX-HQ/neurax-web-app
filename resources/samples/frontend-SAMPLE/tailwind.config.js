/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
        "./components/**/*.{js,jsx,ts,tsx}",
        "./contexts/**/*.{js,jsx,ts,tsx}",
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                // Primary palette (from Home_style_style_reference.html)
                primary: {
                    DEFAULT: '#005C45',
                    light: '#E8F3F0',
                    hover: '#004936',
                    dark: '#004d3a',
                },
                // Kitchen theme (from Kitchen_layout_refence.html)
                cream: '#F5F1E8',
                'border-cream': '#E5E0D6',
                'emerald-light': '#E8F0EE',
                // Surface & Background
                surface: '#FFFFFF',
                background: '#F2F6F9',
                'bg-app': '#F2F6F9',

                // Text colors
                'text-dark': '#0B231E',
                'text-medium': '#4A635D',
                'text-light': '#8FA6A0',

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
                'accent-glass': 'rgba(255, 255, 255, 0.65)',
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                playfair: ['Playfair Display', 'serif'],
            },
            borderRadius: {
                'sm': '12px',
                'md': '20px',
                'lg': '32px',
                'pill': '999px',
            },
            spacing: {
                'xs': '8px',
                'sm': '16px',
                'md': '24px',
                'lg': '32px',
            },
            boxShadow: {
                'soft': '0 4px 20px rgba(0, 92, 69, 0.06)',
                'float': '0 12px 32px rgba(0, 92, 69, 0.15)',
            },
        },
    },
    plugins: [],
};
