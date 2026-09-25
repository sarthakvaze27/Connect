from fastapi import APIRouter, Depends
from database import db
from dependencies import get_current_user
from typing import Optional

router = APIRouter()

@router.get("/find-nearby")
async def find_nearby(lat: float, lon: float, profession: str = None, max_km: int = 10, current_user: dict = Depends(get_current_user)):
    query = {
        "location": {
            "$nearSphere": {
                "$geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                },
                "$maxDistance": max_km * 1000
            }
        },
        "is_available": True,
        "role": "professional"
    }

    if profession:
        query["profession"] = {"$regex": profession, "$options": "i"}

    pros = await db.users.find(query).to_list(length=50)

    # CHECK UNLOCKS FOR PERSISTENCE
    unlocked_docs = await db.unlocks.find({"client_id": str(current_user["_id"])}).to_list(None)
    unlocked_ids = {u["professional_id"] for u in unlocked_docs}

    for p in pros:
        p["id"] = str(p["_id"])
        p["is_unlocked"] = p["id"] in unlocked_ids
        # Security: Remove phone if NOT unlocked
        if not p["is_unlocked"]:
            p.pop("phone", None)
        
        p.pop("_id", None)
        p.pop("password", None)

    return sorted(pros, key=lambda x: x.get("views", 0), reverse=True)