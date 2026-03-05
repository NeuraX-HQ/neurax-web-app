# NutriTrack Backend — Deployment Guide

## Local Development

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env   # edit với API keys thật
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

## Deploy to AWS (SAM)

### Prerequisites
- AWS CLI configured (`aws configure`)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

### Commands

```bash
# Build
sam build

# Deploy (first time — guided)
sam deploy --guided

# Deploy (subsequent)
sam deploy --parameter-overrides GeminiApiKey=YOUR_KEY

# View outputs (API URL, Cognito IDs)
sam list stack-outputs --stack-name nutritrack
```

### After Deploy
1. Note the `ApiUrl`, `UserPoolId`, `UserPoolClientId` from outputs
2. Update mobile app `.env` with the API URL
3. Use Cognito console to create first test user

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | ❌ | Health check |
| POST | `/api/meals` | ✅ | Add meal |
| GET | `/api/meals?date=YYYY-MM-DD` | ✅ | List meals |
| GET | `/api/meals/today` | ✅ | Today's meals + stats |
| PUT | `/api/meals/{id}` | ✅ | Update meal |
| DELETE | `/api/meals/{id}` | ✅ | Delete meal |
| GET | `/api/user/profile` | ✅ | Get profile |
| PUT | `/api/user/profile` | ✅ | Update profile |
| GET | `/api/user/onboarding` | ✅ | Get onboarding |
| PUT | `/api/user/onboarding` | ✅ | Save onboarding |
| POST | `/api/food/analyze-image` | ✅ | AI food analysis |
| POST | `/api/food/voice-to-food` | ✅ | Voice → nutrition |
| GET | `/api/food/search?name=pho` | ✅ | Search nutrition |
| GET | `/api/food/upload-url` | ✅ | S3 pre-signed URL |
| GET | `/api/hydration` | ✅ | Today's water |
| POST | `/api/hydration` | ✅ | Add water |
| GET | `/api/hydration/history` | ✅ | Water history |
