# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NutriTrack 2.0 is a nutrition-tracking mobile app targeting Vietnamese Gen Z/Millennials. It uses React Native (Expo) for the frontend and AWS Amplify Gen 2 for the backend. The app features food photo/voice logging with AI analysis (Qwen3-VL on AWS Bedrock), an AI coach persona ("Bảo"), gamification (streaks, pet evolution, challenges), and a bilingual UI (Vietnamese/English).

## Commands

```bash
# Frontend
npm start              # Start Expo dev server
npm run android        # Run on Android
npm run ios            # Run on iOS
npm run web            # Run on web
npm run build          # Export web build (dist/)

# Testing
npm test               # Run all tests (jest-expo)
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report (80% threshold on src/**)
npm run test:pbt       # Property-based tests only (fast-check)
npx jest path/to/file  # Run a single test file

# Amplify backend
npx ampx sandbox                    # Start local Amplify sandbox
npx ampx generate outputs           # Regenerate amplify_outputs.json
npx ampx sandbox secret list        # List sandbox secrets
npx ampx sandbox secret set KEY     # Set a sandbox secret (e.g. GOOGLE_CLIENT_ID)
npx ampx sandbox delete             # Delete sandbox resources
```

Install with `npm install --legacy-peer-deps` (required due to peer dep conflicts; enforced in `.npmrc`).

Each Lambda function (`amplify/ai-engine/`, `amplify/process-nutrition/`) has its own `package.json` and must be installed separately (see `amplify.yml` build phases).

## Architecture

### Frontend (Expo Router file-based routing)

- **`app/_layout.tsx`** — Root layout: wraps everything in `LanguageProvider` + `GestureHandlerRootView`, handles auth guard (redirects unauthenticated users to `/welcome`), biometric prompt, and Android navigation bar setup.
- **`app/(tabs)/`** — Main tab screens: `home`, `kitchen`, `battle`, `ai-coach`, `progress`, `add` (center "+" button).
- **`app/`** — Top-level stack screens: auth flow (`welcome`, `login`, `signup`, `verify-otp`), onboarding, profile editing, recipe flow, food detail, settings, etc.

### State Management (Zustand)

All stores in `src/store/`: `authStore`, `userStore`, `foodStore`, `mealStore`, `fridgeStore`, `settingsStore`. Accessed via hooks (`useAuthStore`, etc.). Currently all stores use AsyncStorage for local persistence — DynamoDB sync is being added (see data models below).

### Services (`src/services/`)

- `authService.ts` — AWS Amplify Auth (Cognito) with Google OAuth, session management via SecureStore
- `aiService.ts` — Unified AI service calling `aiEngine` Lambda via Amplify GraphQL. Supports 10 actions: analyzeFoodImage, generateCoachResponse, searchFoodNutrition, fixFood, voiceToFood, ollieCoachTip, generateRecipe, calculateMacros, challengeSummary, weeklyInsight. Parses responses via `extractAndParseJSON()` with code block fallback.
- `audioService.ts` — Voice recording for food logging
- `userService.ts` — User profile CRUD via Amplify Data, `syncOnboardingWithDB()` called on login
- `mealService.ts` — Meal/food log CRUD via Amplify Data
- `fridgeService.ts` — Fridge inventory CRUD via Amplify Data

### Backend (AWS Amplify Gen 2)

- **`amplify/backend.ts`** — Defines all backend resources: auth, data (GraphQL/DynamoDB), storage (S3), and Lambda functions. Configures IAM policies for Bedrock (Qwen3-VL in ap-southeast-2), S3 access, and Transcribe.
- **`amplify/data/resource.ts`** — GraphQL schema with models:
  - `Food` — Nutrition database (~200 Vietnamese food items)
  - `user` — Profile, biometrics, goals, gamification, ai_preferences, friend_code
  - `FoodLog` — Meal history with date GSI (owner-scoped)
  - `FridgeItem` — Fridge inventory (owner-scoped)
  - `Challenge` + `ChallengeParticipant` — Group challenges (hasMany/belongsTo)
  - `Friendship` — Bidirectional friend records (owner-scoped, friend_id GSI)
  - `UserPublicStats` — Leaderboard stats (owner write, authenticated read)
  - Queries: `aiEngine`, `processNutrition`
- **Lambda functions:**
  - `ai-engine/` — Qwen3-VL (qwen.qwen3-vl-235b-a22b) multi-action handler with 10 actions and integrated prompt templates
  - `process-nutrition/` — Hybrid nutrition lookup: DynamoDB fuzzy match first, AI fallback
  - `resize-image/` — S3 trigger for image processing on `incoming/` prefix
- **Storage:** S3 bucket with paths: `incoming/{entity_id}/*` (image upload), `voice/{entity_id}/*` (voice recordings), `media/{entity_id}/*` (processed assets)

### Key Patterns

- **AI model**: All AI calls use Qwen3-VL on AWS Bedrock (ap-southeast-2). No Gemini/Claude dependency. Response format: `choices[0].message.content` with fallback chain.
- **i18n**: `src/i18n/LanguageProvider.tsx` + `translations.ts` — Vietnamese/English with `useAppLanguage()` hook providing `t()` function.
- **Path aliases**: `@/*` maps to project root (configured in `tsconfig.json`). Note: `tsconfig.json` excludes `amplify/` directory.
- **Amplify config**: Initialized in `src/lib/amplify.ts`, imported as side-effect in root layout. `amplify_outputs.json` is auto-generated — do not edit manually.
- **Security layer**: `src/security/` includes biometric auth, screen protection, input validation, secure storage, session management, and error boundaries.
- **Design tokens**: Colors in `src/constants/colors.ts`, typography in `src/constants/typography.ts`. Primary: Dark Navy (#1B2838), Accent: Green (#2ECC71).
- **Auth flow**: Cognito email+password with OTP email verification on signup. Google OAuth via `signInWithRedirect`. Auth guard in `_layout.tsx` redirects unauthenticated users to `/welcome`. Login handles `UserNotFoundException` (→ signup), `UserNotConfirmedException` (→ resend OTP + verify-otp), and `NotAuthorizedException` (wrong password).
- **Amplify backend IAM**: `backend.ts` uses CDK escape hatch (`backend.aiEngine.resources.lambda.addToRolePolicy`) for Bedrock/S3/Transcribe IAM policies — `addEnvironment` does not work on `IFunction`.

### Testing

Tests live in `src/__tests__/` using jest-expo preset. Property-based tests use `fast-check` (matched by test name pattern `Property:`). `jest.setup.js` mocks TurboModuleRegistry, expo-secure-store, AsyncStorage, biometric APIs, and screen capture — check this file when adding new native module dependencies.
