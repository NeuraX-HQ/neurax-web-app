# Implementation Plan: 100% Internationalization (i18n) Support

This plan details the implementation of a global language switcher and a full audit of all app screens to ensure 100% support for both English (EN) and Vietnamese (VI).

## User Review Required

> [!IMPORTANT]
> - **Language Selector Design**: I will implement a modern pill-shaped flag selector in the Welcome screen's header, as requested.
> - **Data Persistence**: Language choice will be saved in `AsyncStorage` and persisted across sessions.
> - **i18n Audit**: I will move all remaining hardcoded strings to `src/i18n/translations.ts`.

## Proposed Changes

### [Component Name] UI: Language Selector

#### [NEW] [LanguageSelector.tsx](file:///c:/Users/quanc/Desktop/AWS/NeuraX/neurax-web-app/src/components/LanguageSelector.tsx)
- Create a reusable component that displays the current language (with flag) and allows toggling or opening a selection menu.
- Support for US (🇺🇸) and VN (🇻🇳) flags.

### [Component Name] Welcome Screen

#### [MODIFY] [welcome.tsx](file:///c:/Users/quanc/Desktop/AWS/NeuraX/neurax-web-app/app/welcome.tsx)
- Add a persistent header at the top of the screen (absolute positioned) to house the `LanguageSelector`.
- Ensure it sits above the animated content.

### [Component Name] i18n & Audit

#### [MODIFY] [translations.ts](file:///c:/Users/quanc/Desktop/AWS/NeuraX/neurax-web-app/src/i18n/translations.ts)
- Add missing keys for onboarding, walkthroughs, and home screen content.
- Ensure all Vietnamese strings have accurate English counterparts.

#### [MODIFY] Onboarding & Walkthroughs (Audit)
- Pass through `walkthrough[1-4].tsx` and `step[1-9].tsx` to replace hardcoded strings with `t()` calls.

#### [MODIFY] Home Screen (Audit)
- Audit `app/(tabs)/home.tsx` for any remaining hardcoded Vietnamese.

## Open Questions

- **Flag Style**: The image shows a realistic US flag. Should I use emojis (🇺🇸/🇻🇳) for simplicity and performance, or high-quality remote image assets (e.g., from flagcdn.com)?
- **Reloading Experience**: Currently, `LanguageProvider` has a brief transition delay (450ms) when switching languages. Is this "intentional global reload" experience acceptable?

## Verification Plan

### Automated Tests
- I'll run the app and switch between EN and VI on the Welcome screen.
- Verify that the title, features, and buttons update immediately.
- Navigate to onboarding and home to ensure language choice is respected globally.

### Manual Verification
- Checking all audited screens for visual alignment and correct translation.
- Verifying persistence by reloading the app after a language switch.
