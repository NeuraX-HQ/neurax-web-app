# Suggested Features for NutriTrack

## 1. Fast Auto-suggestions (Hybrid Cache)
**Description**: Show instant search suggestions as the user types (e.g., typing "phở" immediately suggests "Phở Bò", "Phở Gà").

**Proposed Implementation**:
- **Client Cache**: Load a minimal list of food names and IDs (approx. 200 items, ~20KB) from the database once during app startup or when the search screen opens.
- **Instant Filtering**: Filter this local list on every keystroke (0ms delay).
- **Hybrid Flow**:
    - If user selects a suggestion: Call `processNutrition` (Fast Path) to get full macros.
    - If user types a new/unknown name: Call `askGemini` (AI Fallback) for estimation.

**Benefit**: Extremely responsive UX, specifically for 179+ items already in the database.

## 2. Connect Friends (Social Motivation)
**Description**: Allow users to connect with friends or fitness buddies to stay motivated together.

**Proposed Implementation**:
- **Friend System**: Users can search by Email/Username to send friend requests.
- **Shared Feed**: See a timeline of what friends ate today and their current macros (with opt-in privacy controls).
- **Group Challenges**: E.g., "Hit 100g protein for 7 days" or "Stay under 2000 calories this week".
- **Leaderboard**: Rank friends based on consistency streaks.

**Benefit**: Increases daily active use and user retention through social accountability.
