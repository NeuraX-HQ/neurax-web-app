"""
User profile and onboarding routes.

Endpoints:
  GET  /api/user/profile     — Get user profile
  PUT  /api/user/profile     — Update user profile
  GET  /api/user/onboarding  — Get onboarding data
  PUT  /api/user/onboarding  — Save/update onboarding data
"""
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from auth import get_current_user
from db import users_table

router = APIRouter(prefix="/api/user", tags=["User"])


# ---------- Pydantic Models ----------

class UserProfile(BaseModel):
    name: str | None = None
    email: str | None = None
    weight: float | None = None
    goalWeight: float | None = None
    streak: int | None = None
    dailyCalories: int | None = None
    waterIntake: float | None = None
    waterGoal: float | None = None


class OnboardingData(BaseModel):
    name: str | None = None
    gender: str | None = None
    goal: str | None = None
    height: float | None = None
    currentWeight: float | None = None
    targetWeight: float | None = None
    weightChangeSpeed: float | None = None
    activityLevel: str | None = None
    dietaryRestrictions: list[str] | None = None
    completed: bool | None = None


# ---------- Helpers ----------

_DEFAULT_PROFILE = {
    "name": "",
    "email": "",
    "weight": 70,
    "goalWeight": 65,
    "streak": 0,
    "dailyCalories": 2000,
    "waterIntake": 0,
    "waterGoal": 2500,
}

_DEFAULT_ONBOARDING = {
    "name": "",
    "gender": "",
    "goal": "",
    "height": 170,
    "currentWeight": 65,
    "targetWeight": 55,
    "weightChangeSpeed": 0.5,
    "activityLevel": "",
    "dietaryRestrictions": [],
    "completed": False,
}


def _decimal_to_float(d: dict) -> dict:
    out = {}
    for k, v in d.items():
        if isinstance(v, Decimal):
            out[k] = int(v) if v == int(v) else float(v)
        else:
            out[k] = v
    return out


def _float_to_decimal(d: dict) -> dict:
    out = {}
    for k, v in d.items():
        if isinstance(v, float):
            out[k] = Decimal(str(v))
        else:
            out[k] = v
    return out


# ---------- Routes ----------

@router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    resp = users_table().get_item(Key={"userId": user["userId"]})
    item = resp.get("Item")
    if not item:
        # Create default profile
        profile = {
            "userId": user["userId"],
            **_DEFAULT_PROFILE,
            "name": user.get("name", ""),
            "email": user.get("email", ""),
        }
        users_table().put_item(Item=_float_to_decimal(profile))
        return {"success": True, "profile": profile}

    return {"success": True, "profile": _decimal_to_float(item)}


@router.put("/profile")
async def update_profile(data: UserProfile, user: dict = Depends(get_current_user)):
    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_parts = []
    expr_names = {}
    expr_values = {}
    for field, value in updates.items():
        attr_name = f"#{field}"
        attr_value = f":{field}"
        update_parts.append(f"{attr_name} = {attr_value}")
        expr_names[attr_name] = field
        if isinstance(value, float):
            expr_values[attr_value] = Decimal(str(value))
        else:
            expr_values[attr_value] = value

    resp = users_table().update_item(
        Key={"userId": user["userId"]},
        UpdateExpression="SET " + ", ".join(update_parts),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return {"success": True, "profile": _decimal_to_float(resp["Attributes"])}


@router.get("/onboarding")
async def get_onboarding(user: dict = Depends(get_current_user)):
    resp = users_table().get_item(Key={"userId": user["userId"]})
    item = resp.get("Item", {})
    onboarding = item.get("onboarding", _DEFAULT_ONBOARDING)
    if isinstance(onboarding, dict):
        onboarding = _decimal_to_float(onboarding)
    return {"success": True, "onboarding": onboarding}


@router.put("/onboarding")
async def update_onboarding(
    data: OnboardingData, user: dict = Depends(get_current_user)
):
    updates = data.model_dump(exclude_none=True)

    # Store onboarding as a nested map on the user item
    resp = users_table().get_item(Key={"userId": user["userId"]})
    item = resp.get("Item")

    if not item:
        # Create user with onboarding
        new_item = {
            "userId": user["userId"],
            **_float_to_decimal(_DEFAULT_PROFILE),
            "name": user.get("name", ""),
            "email": user.get("email", ""),
            "onboarding": _float_to_decimal({**_DEFAULT_ONBOARDING, **updates}),
        }
        users_table().put_item(Item=new_item)
    else:
        existing_onboarding = item.get("onboarding", _DEFAULT_ONBOARDING)
        if isinstance(existing_onboarding, dict):
            existing_onboarding = _decimal_to_float(existing_onboarding)
        merged = {**existing_onboarding, **updates}
        users_table().update_item(
            Key={"userId": user["userId"]},
            UpdateExpression="SET onboarding = :ob",
            ExpressionAttributeValues={":ob": _float_to_decimal(merged)},
        )

    return {"success": True, "message": "Onboarding updated"}
