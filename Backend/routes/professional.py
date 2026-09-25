from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, status, HTTPException, Request
from database import db
from typing import List, Optional
from pydantic import BaseModel, Field
from models.user import UserPublic
from auth_utils import SECRET_KEY, ALGORITHM
from jose import jwt
from dependencies import get_current_user

router = APIRouter()

# --- MODELS ---

class ProfileUpdate(BaseModel):
    """
    Model for partial profile updates. 
    All fields are Optional to allow updating just one field at a time.
    """
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profession: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    lat: Optional[float] = None  # Captured from the map picker
    lon: Optional[float] = None  # Captured from the map picker

class AvailabilityUpdate(BaseModel):
    is_available: bool

# --- ROUTES ---
@router.patch("/update")
async def update_profile(data: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    try:
        update_data = data.model_dump(exclude_unset=True)
    except AttributeError:
        update_data = data.dict(exclude_unset=True)

    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided to update")

    if "lat" in update_data and "lon" in update_data:
        update_data["location"] = {
            "type": "Point", 
            "coordinates": [update_data.pop("lon"), update_data.pop("lat")]
        }

    update_data["updated_at"] = datetime.now()

    await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    updated_user["id"] = str(updated_user["_id"])
    updated_user.pop("_id", None)
    return updated_user

@router.get("/my-stats")
async def get_my_stats(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "professional":
        raise HTTPException(status_code=403, detail="Not a professional account")
    
    pro_id = str(current_user["_id"])
    # Fixed: Match leads where THIS pro was unlocked
    recent_unlocks = await db.unlocks.find({"professional_id": pro_id}).sort("timestamp", -1).limit(10).to_list(10)

    leads_list = []
    for unlock in recent_unlocks:
        client = await db.users.find_one({"_id": ObjectId(unlock["client_id"])})
        if client:
            leads_list.append({
                "user_name": client.get("full_name", "User"),
                "timestamp": unlock.get("timestamp"),
                "phone": client.get("phone", "No phone shared")
            })

    return {
        "summary": {
            "views": current_user.get("views", 0),
            "unlocks": await db.unlocks.count_documents({"professional_id": pro_id}),
            "rating": current_user.get("rating", 5.0)
        },
        "recent_leads": leads_list,
        "is_available": current_user.get("is_available", True)
    }

@router.get("/{user_id}")
async def get_profile(user_id: str):
    """
    Public profile view for clients.
    """
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=404, detail="User does not exist")

    user = await db.users.find_one({"_id": obj_id})
    if not user or user.get("role") != "professional":
        raise HTTPException(status_code=404, detail="Professional user does not exist")

    # Clean sensitive data before returning
    user["id"] = str(user["_id"])
    fields_to_remove = ["password", "phone", "email", "tokens", "_id"]
    for field in fields_to_remove:
        user.pop(field, None)
    return user

@router.patch("/toggle-availability")
async def toggle_availability(data: AvailabilityUpdate, current_user: dict = Depends(get_current_user)):
    """
    Toggles professional 'Live' status.
    """
    await db.users.update_one(
        {"_id": current_user["_id"]}, 
        {"$set": {"is_available": data.is_available}}
    )
@router.post("/unlock/{pro_id}")
async def unlock_professional(pro_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Only clients can unlock")
    
    user_db = await db.users.find_one({"_id": current_user["_id"]})
    if user_db.get("tokens", 0) < 10:
        raise HTTPException(status_code=402, detail="Insufficient tokens")
        
    professional = await db.users.find_one({"_id": ObjectId(pro_id), "role": "professional"})
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")
    
    existing = await db.unlocks.find_one({"client_id": str(current_user["_id"]), "professional_id": pro_id})
    if existing:
        return {"message": "Already unlocked", "phone": professional.get("phone"), "is_unlocked": True}
        
    await db.users.update_one({"_id": current_user["_id"]}, {"$inc": {"tokens": -10}})
    await db.unlocks.insert_one({
        "client_id": str(current_user["_id"]),
        "professional_id": pro_id,
        "timestamp": datetime.now()
    })

    return {"message": "Unlock successful", "phone": professional.get("phone"), "is_unlocked": True}

@router.post("/increment-view/{user_id}")
async def increment_view(user_id: str):
    """
    Increments profile views.
    """
    try:
        await db.users.update_one({"_id": ObjectId(user_id)}, {"$inc": {"views": 1}})
        return {"status": "success"}
    except:
        raise HTTPException(status_code=400, detail="Invalid Professional ID")

@router.delete("/delete-account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    Deletes the current user's account.
    """
    result = await db.users.delete_one({"_id": current_user["_id"]})
    if result.deleted_count == 1:
        return {"message": "Account deleted successfully"}
    raise HTTPException(status_code=404, detail="User not found")