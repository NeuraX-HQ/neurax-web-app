"""
Meal CRUD routes.

Endpoints:
  POST   /api/meals          — Add a meal
  GET    /api/meals           — List meals (optional ?date=YYYY-MM-DD)
  GET    /api/meals/today     — Today's meals + nutrition stats
  GET    /api/meals/{meal_id} — Get single meal
  PUT    /api/meals/{meal_id} — Update a meal
  DELETE /api/meals/{meal_id} — Delete a meal
  DELETE /api/meals           — Clear all meals
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from auth import get_current_user
from db import meals_table

router = APIRouter(prefix="/api/meals", tags=["Meals"])


# ---------- Pydantic Models ----------

class MealCreate(BaseModel):
    name: str
    type: str = Field(..., pattern="^(BREAKFAST|LUNCH|DINNER|SNACK)$")
    calories: float
    protein: float
    carbs: float
    fat: float
    servingSize: str = ""
    ingredients: list[str] = []
    image: str | None = None


class MealUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    calories: float | None = None
    protein: float | None = None
    carbs: float | None = None
    fat: float | None = None
    servingSize: str | None = None
    ingredients: list[str] | None = None
    image: str | None = None


# ---------- Helpers ----------

def _now_time() -> str:
    """Current time as HH:MM AM/PM."""
    now = datetime.now(timezone.utc)
    return now.strftime("%I:%M %p").lstrip("0")


def _today_date() -> str:
    """Today's date as YYYY-MM-DD."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _to_dynamo(item: dict) -> dict:
    """Convert floats to Decimal for DynamoDB."""
    out = {}
    for k, v in item.items():
        if isinstance(v, float):
            out[k] = Decimal(str(v))
        else:
            out[k] = v
    return out


def _from_dynamo(item: dict) -> dict:
    """Convert Decimals back to float for JSON."""
    out = {}
    for k, v in item.items():
        if isinstance(v, Decimal):
            out[k] = float(v)
        else:
            out[k] = v
    return out


# ---------- Routes ----------

@router.post("")
async def add_meal(meal: MealCreate, user: dict = Depends(get_current_user)):
    meal_id = f"meal_{uuid.uuid4().hex[:12]}"
    item = {
        "userId": user["userId"],
        "mealId": meal_id,
        "date": _today_date(),
        "time": _now_time(),
        **meal.model_dump(),
    }
    meals_table().put_item(Item=_to_dynamo(item))
    return {"success": True, "meal": _from_dynamo(item)}


@router.get("")
async def list_meals(date: str | None = None, user: dict = Depends(get_current_user)):
    table = meals_table()
    if date:
        # Query by userId + date using GSI
        resp = table.query(
            IndexName="date-index",
            KeyConditionExpression="userId = :uid AND #d = :d",
            ExpressionAttributeNames={"#d": "date"},
            ExpressionAttributeValues={":uid": user["userId"], ":d": date},
        )
    else:
        # All meals for user
        resp = table.query(
            KeyConditionExpression="userId = :uid",
            ExpressionAttributeValues={":uid": user["userId"]},
        )
    meals = [_from_dynamo(m) for m in resp.get("Items", [])]
    return {"success": True, "meals": meals}


@router.get("/today")
async def today_meals(user: dict = Depends(get_current_user)):
    today = _today_date()
    resp = meals_table().query(
        IndexName="date-index",
        KeyConditionExpression="userId = :uid AND #d = :d",
        ExpressionAttributeNames={"#d": "date"},
        ExpressionAttributeValues={":uid": user["userId"], ":d": today},
    )
    meals = [_from_dynamo(m) for m in resp.get("Items", [])]

    stats = {
        "totalCalories": sum(m.get("calories", 0) for m in meals),
        "totalProtein": sum(m.get("protein", 0) for m in meals),
        "totalCarbs": sum(m.get("carbs", 0) for m in meals),
        "totalFat": sum(m.get("fat", 0) for m in meals),
    }
    return {"success": True, "meals": meals, "stats": stats}


@router.get("/{meal_id}")
async def get_meal(meal_id: str, user: dict = Depends(get_current_user)):
    resp = meals_table().get_item(Key={"userId": user["userId"], "mealId": meal_id})
    item = resp.get("Item")
    if not item:
        raise HTTPException(status_code=404, detail="Meal not found")
    return {"success": True, "meal": _from_dynamo(item)}


@router.put("/{meal_id}")
async def update_meal(
    meal_id: str, updates: MealUpdate, user: dict = Depends(get_current_user)
):
    # Build update expression dynamically
    update_parts = []
    expr_names = {}
    expr_values = {}
    for field, value in updates.model_dump(exclude_none=True).items():
        attr_name = f"#{field}"
        attr_value = f":{field}"
        update_parts.append(f"{attr_name} = {attr_value}")
        expr_names[attr_name] = field
        if isinstance(value, float):
            expr_values[attr_value] = Decimal(str(value))
        else:
            expr_values[attr_value] = value

    if not update_parts:
        raise HTTPException(status_code=400, detail="No fields to update")

    resp = meals_table().update_item(
        Key={"userId": user["userId"], "mealId": meal_id},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return {"success": True, "meal": _from_dynamo(resp["Attributes"])}


@router.delete("/{meal_id}")
async def delete_meal(meal_id: str, user: dict = Depends(get_current_user)):
    meals_table().delete_item(Key={"userId": user["userId"], "mealId": meal_id})
    return {"success": True, "message": "Meal deleted"}


@router.delete("")
async def clear_all_meals(user: dict = Depends(get_current_user)):
    """Delete all meals for the current user."""
    table = meals_table()
    resp = table.query(
        KeyConditionExpression="userId = :uid",
        ExpressionAttributeValues={":uid": user["userId"]},
        ProjectionExpression="userId, mealId",
    )
    with table.batch_writer() as batch:
        for item in resp.get("Items", []):
            batch.delete_item(Key={"userId": item["userId"], "mealId": item["mealId"]})
    return {"success": True, "message": "All meals cleared"}
