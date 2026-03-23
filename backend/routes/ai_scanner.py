import traceback
import httpx
from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Optional

# deep-translator is synchronous but handles multiple requests
from deep_translator import GoogleTranslator

from config import settings

router = APIRouter(prefix="/api/ai", tags=["AI Scanner Integration"])

def safe_translate(text: Optional[str]) -> Optional[str]:
    """Helper function to cleanly translate text and catch possible network issues."""
    if not text or not isinstance(text, str):
        return text
        
    try:
        translator = GoogleTranslator(source='auto', target='vi')
        translated = translator.translate(text)
        return translated if translated else text
    except Exception as e:
        print(f"Translation error: {e}")
        return text

@router.post("/analyze-food")
async def analyze_food(method: Optional[str] = None, file: UploadFile = File(...)):
    """
    Forward image to AI Server, translate the response to dual-language, and return to frontend.
    """
    ai_url = f"{settings.AI_SERVICE_URL}/analyze-food"
    if method:
        ai_url += f"?method={method}"
        
    try:
        file_content = await file.read()
        files = {'file': (file.filename, file_content, file.content_type)}
        
        # Async call to AI Server (long timeout since AI analysis takes time)
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(ai_url, files=files)
            
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error from AI Server")
            
        data = response.json()
        
        # Attempt to translate the JSON structure based on standard contract
        res_data = data.get("data", {})
        if res_data and "dishes" in res_data:
            for dish in res_data.get("dishes", []):
                dish["name_en"] = dish.get("name")
                dish["name_vi"] = safe_translate(dish.get("name"))
                
                dish["cooking_method_en"] = dish.get("cooking_method")
                dish["cooking_method_vi"] = safe_translate(dish.get("cooking_method"))
                
                for ing in dish.get("ingredients", []):
                    ing["name_en"] = ing.get("name")
                    ing["name_vi"] = safe_translate(ing.get("name"))
                    
                    ing["note_en"] = ing.get("note")
                    ing["note_vi"] = safe_translate(ing.get("note"))
                    
        return data
        
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"AI Server unreachable: {exc}")
    except HTTPException:
        raise
    except Exception as exc:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/analyze-label")
async def analyze_label(file: UploadFile = File(...)):
    """
    Forward nutrition label image to AI Server, translate allergens and notes to dual-language.
    """
    ai_url = f"{settings.AI_SERVICE_URL}/analyze-label"
    
    try:
        file_content = await file.read()
        files = {'file': (file.filename, file_content, file.content_type)}
        
        async with httpx.AsyncClient(timeout=90.0) as client:
            response = await client.post(ai_url, files=files)
            
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error from AI Server")
            
        data = response.json()
        res_data = data.get("data", {})
        if res_data and "labels" in res_data:
            for label in res_data.get("labels", []):
                label["note_en"] = label.get("note")
                label["note_vi"] = safe_translate(label.get("note"))
                
                if "allergens" in label and isinstance(label["allergens"], list):
                    label["allergens_en"] = label["allergens"]
                    label["allergens_vi"] = [safe_translate(a) for a in label["allergens"]]
                    
        return data
        
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"AI Server unreachable: {exc}")
    except HTTPException:
        raise
    except Exception as exc:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")
        
@router.post("/scan-barcode")
async def scan_barcode(file: UploadFile = File(...)):
    """
    Forward barcode image to AI Server, translate categories and ingredients to dual-language.
    """
    ai_url = f"{settings.AI_SERVICE_URL}/scan-barcode"
    
    try:
        file_content = await file.read()
        files = {'file': (file.filename, file_content, file.content_type)}
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(ai_url, files=files)
            
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Error from AI Server")
            
        data = response.json()
        res_data = data.get("data", {})
        if res_data and "food" in res_data and res_data["food"]:
            food = res_data["food"]
            food["category_en"] = food.get("category")
            food["category_vi"] = safe_translate(food.get("category"))
            
            if "allergens" in food and isinstance(food["allergens"], list):
                food["allergens_en"] = food["allergens"]
                food["allergens_vi"] = [safe_translate(a) for a in food["allergens"]]
                
            if "ingredients" in food and isinstance(food["ingredients"], list):
                food["ingredients_en"] = food["ingredients"]
                food["ingredients_vi"] = [safe_translate(i) for i in food["ingredients"]]
                
        return data
        
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"AI Server unreachable: {exc}")
    except HTTPException:
        raise
    except Exception as exc:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")
