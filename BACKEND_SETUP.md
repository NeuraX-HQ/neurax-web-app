# Backend Setup Guide - NutriTrack

## Overview
NutriTrack now uses Google Gemini AI for:
- **Voice-to-text**: Parse spoken food descriptions into nutrition data
- **Image Analysis**: Analyze food photos to identify dishes and calculate nutrition
- **Food Search**: Get nutrition information for any food item

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @google/generative-ai
```

### 2. Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 3. Configure Environment Variables

1. Open the `.env` file in the project root
2. Add your Gemini API key:

```env
EXPO_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
```

**Important**: Never commit your `.env` file to version control!

### 4. Test the Integration

Run the app:

```bash
npm start
```

Then test the features:

1. **Voice Scan**: 
   - Tap the FAB button → "Giọng nói"
   - Speak a food name (currently simulated with "Tôi vừa ăn một tô phở bò")
   - AI will analyze and show nutrition info

2. **Camera Scan**:
   - Tap the FAB button → "Chụp hình"
   - Take a photo of food
   - AI will identify the dish and calculate nutrition

3. **View Dashboard**:
   - Go to Home tab
   - See real-time calorie and macro tracking
   - View meals organized by type (Breakfast, Lunch, Dinner, Snack)

## Architecture

### Services
- `src/services/geminiService.ts`: Gemini AI integration
  - `analyzeFoodImage()`: Image → Nutrition data
  - `parseVoiceToFood()`: Text → Nutrition data
  - `searchFoodNutrition()`: Food name → Nutrition data

### State Management
- `src/store/mealStore.ts`: Zustand store for meals
  - Persists to AsyncStorage
  - Provides today's meals and stats
  - CRUD operations for meals

### Components
- `src/components/VoiceModal.tsx`: Voice input with Gemini parsing
- `src/components/CameraScanner.tsx`: Camera with Gemini Vision
- `app/food-detail.tsx`: Review and confirm meal before adding

### Data Flow

```
User Action (Voice/Camera/Search)
    ↓
Gemini AI Analysis
    ↓
Food Detail Screen (Review + Select Meal Type)
    ↓
Meal Store (Add to today's meals)
    ↓
Home Dashboard (Real-time update)
```

## Features Implemented

✅ Voice-to-text food recognition with Gemini
✅ AI image analysis for food photos
✅ Real-time nutrition calculation
✅ Meal type classification (Breakfast/Lunch/Dinner/Snack)
✅ Persistent meal storage with AsyncStorage
✅ Dashboard with real-time stats
✅ Calorie and macro tracking

## API Usage & Costs

### Gemini API Pricing (as of 2024)
- **Free tier**: 60 requests per minute
- **Paid tier**: $0.00025 per 1K characters (text)
- **Vision**: $0.0025 per image

### Optimization Tips
1. Compress images before sending to API
2. Cache common food items
3. Implement request debouncing
4. Use batch requests when possible

## Troubleshooting

### "API Key not found"
- Make sure `.env` file exists in project root
- Verify the key starts with `EXPO_PUBLIC_`
- Restart the Expo dev server after adding the key

### "Failed to analyze image"
- Check internet connection
- Verify API key is valid
- Check Gemini API quota limits

### "Meals not showing on dashboard"
- Check if meals are being saved (check AsyncStorage)
- Verify `loadMeals()` is called on mount
- Check console for errors

## Next Steps

### Recommended Enhancements
1. **Real Speech-to-Text**: Integrate Expo Speech or Web Speech API
2. **Barcode Scanner**: Add barcode lookup for packaged foods
3. **Food Database**: Cache common Vietnamese foods locally
4. **Meal History**: Add calendar view for past meals
5. **Export Data**: Allow users to export nutrition logs
6. **Offline Mode**: Cache AI responses for common foods

### Backend Options
If you need a full backend:
- **Supabase**: PostgreSQL + Auth + Storage
- **Firebase**: Firestore + Auth + Cloud Functions
- **AWS Amplify**: DynamoDB + Cognito + Lambda

## Support

For issues or questions:
1. Check the console logs for errors
2. Verify API key configuration
3. Test with simple food items first
4. Check Gemini API status page

---

**Note**: This implementation uses client-side API calls. For production, consider:
- Moving API calls to a backend server
- Implementing rate limiting
- Adding user authentication
- Securing API keys server-side
