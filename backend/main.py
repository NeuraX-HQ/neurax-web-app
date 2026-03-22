"""
NutriTrack Serverless Backend — FastAPI application.

Local:  uvicorn main:app --reload --port 8000
Lambda: handler = Mangum(app)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from config import settings
from routes.meals import router as meals_router
from routes.user import router as user_router
from routes.food import router as food_router
from routes.hydration import router as hydration_router
from routes.ai_scanner import router as ai_scanner_router

app = FastAPI(
    title="NutriTrack API",
    version="1.0.0",
    description="Serverless backend for NutriTrack nutrition tracking app",
)

# CORS — allow mobile app and web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route modules
app.include_router(meals_router)
app.include_router(user_router)
app.include_router(food_router)
app.include_router(hydration_router)
app.include_router(ai_scanner_router)


# Health check (no auth required)
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "nutritrack-api"}


# Lambda handler (used by AWS Lambda via Mangum)
handler = Mangum(app)
