# Installation Instructions

## Install Required Package

Run this command to install the Google Generative AI SDK:

```bash
npm install @google/generative-ai
```

## Setup Gemini API Key

1. Get your API key from: https://makersuite.google.com/app/apikey
2. Open the `.env` file in the project root
3. Replace `your_gemini_api_key_here` with your actual API key:

```env
EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...your_actual_key
```

4. Restart the Expo dev server:

```bash
npm start
```

## Test the Features

1. **Voice Scan**: Tap FAB → "Giọng nói" → Speak food name
2. **Camera Scan**: Tap FAB → "Chụp hình" → Take photo of food
3. **View Dashboard**: Go to Home tab to see meals and stats

That's it! The app is now ready to use with real AI-powered food tracking.
