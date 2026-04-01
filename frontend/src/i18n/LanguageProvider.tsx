import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage, translateText } from './translations';

export const APP_LANGUAGE_KEY = '@nutritrack_app_language';

type TranslateParams = Record<string, string | number>;

type LanguageContextValue = {
    language: AppLanguage;
    setLanguage: (next: AppLanguage) => Promise<void>;
    t: (key: string, params?: TranslateParams) => string;
    isLanguageReady: boolean;
    isSwitchingLanguage: boolean;
    targetLanguage: AppLanguage | null;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<AppLanguage>('vi');
    const [isLanguageReady, setIsLanguageReady] = useState(false);
    const [isSwitchingLanguage, setIsSwitchingLanguage] = useState(false);
    const [targetLanguage, setTargetLanguage] = useState<AppLanguage | null>(null);

    useEffect(() => {
        const bootstrap = async () => {
            try {
                const stored = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
                if (stored === 'vi' || stored === 'en') {
                    setLanguageState(stored);
                }
            } finally {
                setIsLanguageReady(true);
            }
        };
        bootstrap();
    }, []);

    const setLanguage = useCallback(async (next: AppLanguage) => {
        if (next === language) return;

        setTargetLanguage(next);
        setIsSwitchingLanguage(true);

        // Keep a short transition to let the UI show an intentional global language reload.
        await new Promise((resolve) => setTimeout(resolve, 800));
        setLanguageState(next);
        await AsyncStorage.setItem(APP_LANGUAGE_KEY, next);
        await new Promise((resolve) => setTimeout(resolve, 800));

        setIsSwitchingLanguage(false);
        setTargetLanguage(null);
    }, [language]);

    const t = useCallback((key: string, params?: TranslateParams) => {
        return translateText(language, key, params);
    }, [language]);

    const value = useMemo(() => ({
        language,
        setLanguage,
        t,
        isLanguageReady,
        isSwitchingLanguage,
        targetLanguage,
    }), [language, setLanguage, t, isLanguageReady, isSwitchingLanguage, targetLanguage]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useAppLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useAppLanguage must be used inside LanguageProvider');
    }
    return context;
}
