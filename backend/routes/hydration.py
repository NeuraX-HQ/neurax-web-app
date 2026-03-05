"""
Hydration tracking routes.

Endpoints:
  GET  /api/hydration        — Get today's water intake
  POST /api/hydration        — Add water intake
  PUT  /api/hydration        — Set total water intake for today
  GET  /api/hydration/history — Water intake history (last N days)
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from auth import get_current_user
from db import hydration_table

router = APIRouter(prefix="/api/hydration", tags=["Hydration"])


class HydrationAdd(BaseModel):
    amount: float  # ml


class HydrationSet(BaseModel):
    waterIntake: float  # ml
    waterGoal: float | None = None


def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


@router.get("")
async def get_today_hydration(user: dict = Depends(get_current_user)):
    resp = hydration_table().get_item(
        Key={"userId": user["userId"], "date": _today()}
    )
    item = resp.get("Item")
    if not item:
        return {"success": True, "waterIntake": 0, "waterGoal": 2500, "date": _today()}
    return {
        "success": True,
        "waterIntake": float(item.get("waterIntake", 0)),
        "waterGoal": float(item.get("waterGoal", 2500)),
        "date": item["date"],
    }


@router.post("")
async def add_water(data: HydrationAdd, user: dict = Depends(get_current_user)):
    """Add water intake (increments today's total)."""
    resp = hydration_table().update_item(
        Key={"userId": user["userId"], "date": _today()},
        UpdateExpression="ADD waterIntake :amt",
        ExpressionAttributeValues={":amt": Decimal(str(data.amount))},
        ReturnValues="ALL_NEW",
    )
    attr = resp["Attributes"]
    return {
        "success": True,
        "waterIntake": float(attr.get("waterIntake", 0)),
        "date": _today(),
    }


@router.put("")
async def set_hydration(data: HydrationSet, user: dict = Depends(get_current_user)):
    """Set absolute water intake for today."""
    expr = "SET waterIntake = :wi"
    vals = {":wi": Decimal(str(data.waterIntake))}
    if data.waterGoal is not None:
        expr += ", waterGoal = :wg"
        vals[":wg"] = Decimal(str(data.waterGoal))

    resp = hydration_table().update_item(
        Key={"userId": user["userId"], "date": _today()},
        UpdateExpression=expr,
        ExpressionAttributeValues=vals,
        ReturnValues="ALL_NEW",
    )
    attr = resp["Attributes"]
    return {
        "success": True,
        "waterIntake": float(attr.get("waterIntake", 0)),
        "waterGoal": float(attr.get("waterGoal", 2500)),
    }


@router.get("/history")
async def hydration_history(
    days: int = 7, user: dict = Depends(get_current_user)
):
    """Get water intake for the last N days."""
    today = datetime.now(timezone.utc)
    dates = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]

    history = []
    for d in dates:
        resp = hydration_table().get_item(
            Key={"userId": user["userId"], "date": d}
        )
        item = resp.get("Item")
        history.append({
            "date": d,
            "waterIntake": float(item["waterIntake"]) if item else 0,
            "waterGoal": float(item.get("waterGoal", 2500)) if item else 2500,
        })

    return {"success": True, "history": history}
