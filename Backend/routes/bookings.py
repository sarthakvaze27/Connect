from fastapi import APIRouter, Depends, HTTPException, status, Request, Security
from fastapi.security import HTTPBearer
from database import db
from bson import ObjectId
from datetime import datetime
from auth_utils import SECRET_KEY, ALGORITHM
from jose import jwt

router = APIRouter()

@router.post("/unlock/{professional_id}")
async def unlock_professional_contact(
    professional_id: str,
    request: Request
):
    # Extract token from Authorization header
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]  # Extract token from "Bearer <token>"
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = str(payload.get("sub"))
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid Token")
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid Token")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user.get("role") != "client":
        raise HTTPException(status_code=403, detail="Only clients can unlock professionals")

    # 1. Validate Professional ID
    try:
        prof_oid = ObjectId(professional_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid Professional ID format")

    # 2. Check if Professional actually exists
    professional = await db.users.find_one({"_id": prof_oid, "role": "professional"})
    if not professional:
        raise HTTPException(status_code=404, detail="Professional not found")

    # 3. Double-Charging Protection (Check if already unlocked)
    existing_booking = await db.bookings.find_one({
        "client_id": user_id,
        "professional_id": professional_id
    })

    if existing_booking:
        # If already paid, return details for free
        return {
            "message": "Already unlocked",
            "phone": professional.get("phone"),
            "email": professional.get("email"),
            "full_name": professional.get("full_name")
        }

    # 4. Token Check (Wallet Guard)
    user_tokens = user.get("tokens", 0)
    if user_tokens < 10:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Insufficient tokens. Invite friends to earn more!"
        )

    # 5. THE SECURE TRANSACTION
    # We deduct tokens and record the "sale" in one flow
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$inc": {"tokens": -10}}
    )

    await db.bookings.insert_one({
        "client_id": user_id,
        "professional_id": professional_id,
        "unlocked_at": datetime.utcnow(),
        "tokens_spent": 10
    })

    return {
        "message": "Contact unlocked successfully!",
        "phone": professional.get("phone"),
        "email": professional.get("email"),
        "full_name": professional.get("full_name")
    }

@router.get("/my-unlocks")
async def get_my_unlocks(request: Request):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.split(" ")[1]  # Extract token from "Bearer <token>"
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = str(payload.get("sub"))
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid Token")
    except jwt.JWTError as e:
        raise HTTPException(status_code=401, detail="Invalid Token")

    # 1. Fetch all bookings for this client
    cursor = db.bookings.find({"client_id": user_id})
    bookings = await cursor.to_list(length=100)

    # 2. Extract IDs using as a safety check
    prof_ids = [ObjectId(b.get("professional_id")) for b in bookings if b.get("professional_id")]

    # 3. Find all those professionals in users collection
    professionals = await db.users.find(
        {"_id": {"$in": prof_ids}},
        {"password": 0, "tokens": 0, "referral_code": 0}
        ).to_list(length=100)

    # 4. Convert ObjectIds to strings for React
    for p in professionals:
        p["_id"] = str(p["_id"])

    return professionals