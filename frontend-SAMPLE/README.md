# NutriTrack 2.0 Mobile App

🥗 **AI-Powered Vietnamese Nutrition Tracking**

## Tech Stack

- **Framework**: React Native (Expo SDK 54)
- **Styling**: NativeWind v4 (Tailwind CSS)
- **Navigation**: Expo Router v6
- **State**: React Context + SecureStore
- **UI Components**: @gorhom/bottom-sheet, expo-blur, react-native-reanimated

## Project Structure

```
nutritrack-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth flow (welcome, choice, onboarding)
│   ├── (tabs)/            # Main app tabs (home, challenges, log, kitchen, profile)
│   └── _layout.tsx        # Root layout with providers
├── components/            # Reusable UI components
│   ├── MacroRing.tsx      # Circular progress for macros
│   ├── CalendarStrip.tsx  # Weekly calendar with streak
│   ├── AICoachCard.tsx    # AI Bảo motivation card
│   ├── MealCard.tsx       # Logged meal item
│   ├── MealSection.tsx    # Collapsible meal group
│   ├── LogSheet.tsx       # Bottom sheet for logging
│   ├── ChallengeCard.tsx  # Challenge with progress
│   └── FridgeItemCard.tsx # Kitchen inventory item
├── contexts/              # State management
│   ├── AuthContext.tsx    # Auth + onboarding state
│   └── AppContext.tsx     # App data (meals, challenges, etc.)
├── constants/             # Design tokens
│   └── Theme.ts           # Colors, spacing, typography
├── data/                  # Mock data
│   └── mockData.ts        # Vietnamese foods, challenges, etc.
└── global.css             # NativeWind Tailwind imports
```

## Features

### ✅ Implemented

- [x] **Authentication Flow**: Welcome carousel, OAuth choice, 4-step onboarding
- [x] **Home Dashboard**: Calendar strip, macro rings, AI coach card, meal sections
- [x] **5-Tab Navigation**: Home, Challenges, Log (+), Kitchen, Profile
- [x] **Center "+" Button**: Opens bottom sheet for Voice/Photo/Manual logging
- [x] **Challenges Tab**: Active/Completed tabs, challenge cards with progress
- [x] **Kitchen Tab**: Fridge inventory with expiry alerts, AI recipe suggestions
- [x] **Profile Tab**: User stats, weekly summary, goals, settings menu
- [x] **Mock Data**: Vietnamese foods (Phở, Cơm tấm, Bánh mì, etc.)
- [x] **AI Coach Bảo**: Motivational messages with Vietnamese slang

### 🔜 To Be Implemented (Backend Integration)

- [ ] Voice logging with AWS Transcribe
- [ ] Photo logging with AWS Rekognition
- [ ] Real authentication with Cognito
- [ ] Data sync with DynamoDB
- [ ] Push notifications
- [ ] Challenge matchmaking

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run in web browser
npm run web
```

## Design System

### Colors (from Home_style_reference.html)

- **Primary**: `#005C45` (Emerald)
- **Surface**: `#FFFFFF`
- **Background**: `#F2F6F9`
- **Macro Colors**: Protein `#10B981`, Carbs `#F59E0B`, Fat `#3B82F6`

### Typography

- **Headings**: Playfair Display (Serif)
- **Body**: Inter (Sans-serif)

### Spacing & Radius

- Large border radius (`32px` for cards)
- Consistent `20px` padding

## Development Notes

### Performance Optimizations

- All list components use `FlatList` with `React.memo`
- `useCallback` for all event handlers in lists
- `useMemo` for computed values

### Touch Targets

- Minimum 48px touch targets
- Primary CTAs in thumb zone (bottom of screen)

## License

MIT © NeuraX Team
