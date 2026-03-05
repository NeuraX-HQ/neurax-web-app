"""
Food / AI proxy routes — keeps Gemini API key server-side.

Endpoints:
  POST /api/food/analyze-image  — Analyze food image via Gemini Vision
  POST /api/food/voice-to-food  — Parse voice transcript → nutrition data
  GET  /api/food/search         — Search nutrition info by food name
  GET  /api/food/upload-url     — Get S3 pre-signed upload URL
"""
import uuid
import boto3
import google.generativeai as genai

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from config import settings

router = APIRouter(prefix="/api/food", tags=["Food / AI"])

# Initialize Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-2.5-flash")

# S3 client
_s3 = boto3.client("s3", region_name=settings.AWS_REGION)


# ---------- Pydantic Models ----------

class ImageAnalysisRequest(BaseModel):
    imageBase64: str
    mimeType: str = "image/jpeg"


class VoiceParseRequest(BaseModel):
    transcript: str


# ---------- Prompt templates ----------

_IMAGE_PROMPT = """Analyze this food image and provide detailed nutritional information in JSON format.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
    "name": "Vietnamese name of the dish",
    "calories": estimated total calories (number),
    "protein": grams of protein (number),
    "carbs": grams of carbohydrates (number),
    "fat": grams of fat (number),
    "servingSize": "description of portion size",
    "ingredients": ["ingredient 1", "ingredient 2", ...]
}

Be as accurate as possible with nutritional estimates based on visible portion size."""

_VOICE_PROMPT_TEMPLATE = """User said: "{transcript}"

Extract the food information and provide nutritional data in JSON format.

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{{
    "name": "Vietnamese name of the food/dish mentioned",
    "calories": estimated calories (number),
    "protein": grams of protein (number),
    "carbs": grams of carbohydrates (number),
    "fat": grams of fat (number),
    "servingSize": "estimated serving size",
    "ingredients": ["main ingredients"]
}}

If multiple foods are mentioned, combine them into one meal entry.
Use typical Vietnamese portion sizes for estimates."""

_SEARCH_PROMPT_TEMPLATE = """Provide nutritional information for: "{food_name}"

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{{
    "name": "Vietnamese name",
    "calories": typical calories per serving (number),
    "protein": grams of protein (number),
    "carbs": grams of carbohydrates (number),
    "fat": grams of fat (number),
    "servingSize": "typical serving size",
    "ingredients": ["main ingredients"]
}}

Use standard Vietnamese portion sizes."""


# ---------- Helpers ----------

def _clean_gemini_response(text: str) -> str:
    """Remove markdown code blocks from Gemini response."""
    return text.replace("```json\n", "").replace("```json", "").replace("```\n", "").replace("```", "").strip()


# ---------- Routes ----------

@router.post("/analyze-image")
async def analyze_image(
    req: ImageAnalysisRequest, user: dict = Depends(get_current_user)
):
    """Proxy to Gemini Vision — analyze food image."""
    try:
        # Remove data URL prefix if present
        clean_base64 = req.imageBase64
        if "base64," in clean_base64:
            clean_base64 = clean_base64.split("base64,")[1]

        result = _model.generate_content([
            _IMAGE_PROMPT,
            {"inline_data": {"data": clean_base64, "mime_type": req.mimeType}},
        ])

        import json
        nutrition = json.loads(_clean_gemini_response(result.text))
        return {"success": True, "data": nutrition}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI analysis failed: {str(e)}")


@router.post("/voice-to-food")
async def voice_to_food(
    req: VoiceParseRequest, user: dict = Depends(get_current_user)
):
    """Parse a voice transcript into nutrition data via Gemini."""
    try:
        prompt = _VOICE_PROMPT_TEMPLATE.format(transcript=req.transcript)
        result = _model.generate_content(prompt)

        import json
        nutrition = json.loads(_clean_gemini_response(result.text))
        return {"success": True, "data": nutrition}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice parsing failed: {str(e)}")


@router.get("/search")
async def search_food(
    name: str, user: dict = Depends(get_current_user)
):
    """Search nutrition info by food name via Gemini."""
    try:
        prompt = _SEARCH_PROMPT_TEMPLATE.format(food_name=name)
        result = _model.generate_content(prompt)

        import json
        nutrition = json.loads(_clean_gemini_response(result.text))
        return {"success": True, "data": nutrition}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Food search failed: {str(e)}")


@router.get("/upload-url")
async def get_upload_url(
    filename: str = "photo.jpg",
    content_type: str = "image/jpeg",
    user: dict = Depends(get_current_user),
):
    """Generate a pre-signed S3 URL for direct upload from mobile app."""
    key = f"{user['userId']}/food-images/{uuid.uuid4().hex}_{filename}"

    url = _s3.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.S3_UPLOADS_BUCKET,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=300,  # 5 minutes
    )

    return {
        "success": True,
        "uploadUrl": url,
        "key": key,
        "expiresIn": 300,
    }
