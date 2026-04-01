import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../i18n/translations';

const SETTINGS_PREFS_KEY = '@nutritrack_settings_preferences';

export type SettingsUnits = 'Metric (kg, cm)' | 'Imperial (lb, ft)';

export interface SettingsPreferences {
    language: AppLanguage;
    units: SettingsUnits;
    darkMode: boolean;
    pushNotif: boolean;
    emailUpdates: boolean;
}

interface SettingsState extends SettingsPreferences {
    isHydrated: boolean;
    
    // Actions
    setLanguage: (lang: AppLanguage) => Promise<void>;
    setUnits: (units: SettingsUnits) => Promise<void>;
    setDarkMode: (enabled: boolean) => Promise<void>;
    setPushNotif: (enabled: boolean) => Promise<void>;
    setEmailUpdates: (enabled: boolean) => Promise<void>;
    loadPreferences: () => Promise<void>;
}

const defaultPrefs: SettingsPreferences = {
    language: 'vi',
    units: 'Metric (kg, cm)',
    darkMode: false,
    pushNotif: true,
    emailUpdates: false,
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
    ...defaultPrefs,
    isHydrated: false,

    loadPreferences: async () => {
        try {
            const stored = await AsyncStorage.getItem(SETTINGS_PREFS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<SettingsPreferences>;
                
                // Keep backward compatibility for 'language'
                let validLang: AppLanguage | undefined;
                if (parsed.language === 'vi' || parsed.language === 'en') {
                    validLang = parsed.language;
                } else if (parsed.language === 'Vietnamese' as any) {
                    validLang = 'vi';
                } else if (parsed.language === 'English' as any) {
                    validLang = 'en';
                }

                set({
                    ...defaultPrefs,
                    ...parsed,
                    ...(validLang && { language: validLang })
                });
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        } finally {
            set({ isHydrated: true });
        }
    },

    setLanguage: async (lang) => {
        set({ language: lang });
        await _persistPreferences(get());
    },

    setUnits: async (units) => {
        set({ units });
        await _persistPreferences(get());
    },

    setDarkMode: async (enabled) => {
        set({ darkMode: enabled });
        await _persistPreferences(get());
    },

    setPushNotif: async (enabled) => {
        set({ pushNotif: enabled });
        await _persistPreferences(get());
    },

    setEmailUpdates: async (enabled) => {
        set({ emailUpdates: enabled });
        await _persistPreferences(get());
    },
}));

async function _persistPreferences(state: SettingsState) {
    try {
        const prefsToSave: SettingsPreferences = {
            language: state.language,
            units: state.units,
            darkMode: state.darkMode,
            pushNotif: state.pushNotif,
            emailUpdates: state.emailUpdates,
        };
        await AsyncStorage.setItem(SETTINGS_PREFS_KEY, JSON.stringify(prefsToSave));
    } catch (error) {
        console.warn('Failed to save settings:', error);
    }
}
