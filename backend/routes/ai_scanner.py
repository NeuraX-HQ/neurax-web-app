import traceback
import httpx
from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Optional

# deep-translator is synchronous but handles multiple requests
from deep_translator import GoogleTranslator

from config import settings
from auth import generate_ai_token

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
    # Default to 'tools' for highest precision (USDA lookup) unless otherwise specified
    target_method = method if method else "tools"
    ai_url = f"{settings.AI_SERVICE_URL}/analyze-food?method={target_method}"
        
    try:
        file_content = await file.read()
        files = {'file': (file.filename, file_content, file.content_type)}
        
        # Async call to AI Server (long timeout since AI analysis takes time)
        async with httpx.AsyncClient(timeout=120.0) as client:
            token = generate_ai_token()
            headers = {"Authorization": f"Bearer {token}"} if token else {}
            response = await client.post(ai_url, files=files, headers=headers)
            
        if response.status_code != 200:
            print(f"[ERROR] AI Server returned {response.status_code}: {response.text}")
            raise HTTPException(status_code=response.status_code, detail=f"AI Server error {response.status_code}: {response.text}")
            
        data = response.json()
        print(f"=== [DEBUG] FLY.DEV AI RESPONSE ===")
        import json
        print(json.dumps(data, indent=2, ensure_ascii=False))
        print(f"===================================")
        
        # Attempt to translate the JSON structure based on standard contract
        res_data = data.get("data", {})
        if res_data and "dishes" in res_data:
            for dish in res_data.get("dishes", []):
                dish["name_en"] = dish.get("name")
                dish["name_vi"] = safe_translate(dish.get("name"))
                
                dish["cooking_method_en"] = dish.get("cooking_method")
                dish["cooking_method_vi"] = safe_translate(dish.get("cooking_method"))
                
                ingredients = dish.get("ingredients", [])
                if isinstance(ingredients, list):
                    for i, ing in enumerate(ingredients):
                        if isinstance(ing, dict):
                            ing["name_en"] = ing.get("name")
                            ing["name_vi"] = safe_translate(ing.get("name"))
                            ing["note_en"] = ing.get("note")
                            ing["note_vi"] = safe_translate(ing.get("note"))
                        elif isinstance(ing, str):
                            ingredients[i] = {
                                "name": ing,
                                "name_en": ing,
                                "name_vi": safe_translate(ing)
                            }
                    
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
                    translated_allergens = []
                    for a in label["allergens"]:
                        if isinstance(a, str):
                            translated_allergens.append(safe_translate(a))
                        elif isinstance(a, dict):
                            translated_allergens.append(safe_translate(a.get("name", "")))
                        else:
                            translated_allergens.append(str(a))
                    label["allergens_vi"] = translated_allergens
                    
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
                food["allergens_vi"] = [safe_translate(a) if isinstance(a, str) else safe_translate(str(a)) for a in food["allergens"]]
                
            if "ingredients" in food and isinstance(food["ingredients"], list):
                food["ingredients_en"] = food["ingredients"]
                translated_ingredients = []
                for i in food["ingredients"]:
                    if isinstance(i, str):
                        translated_ingredients.append(safe_translate(i))
                    elif isinstance(i, dict):
                        translated_ingredients.append(safe_translate(i.get("name", "")))
                    else:
                        translated_ingredients.append(str(i))
                food["ingredients_vi"] = translated_ingredients
                
        return data
        
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"AI Server unreachable: {exc}")
    except HTTPException:
        raise
    except Exception as exc:
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Internal server error")
