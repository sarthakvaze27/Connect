from pydantic import BaseModel, EmailStr
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status,Depends
from models.user import UserPublic, UserAuth
from auth_utils import hash_password, verify_password, create_access_token
from database import db
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId
import uuid
from datetime import datetime
from dependencies import get_current_user # Add this near your other imports
router = APIRouter()


# --- 1. LOGIN REQUEST MODEL ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    lat: Optional[float] = None
    lon: Optional[float] = None
    manual_location: Optional[str] = None


# --- 2. SIGNUP ROUTE ---
@router.post("/signup", response_model=UserPublic)
async def signup(user_in: UserAuth, referral_code: str = None):
    # 1. Check if user already exists
    existing = await db.users.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Logic for Tokens and Referral
    initial_tokens = 0
    referrer_id = None
    if referral_code:
        referrer = await db.users.find_one({"referral_code": referral_code.upper()})
        if referrer:
            initial_tokens = 5
            referrer_id = referrer["_id"]
        else:
            raise HTTPException(status_code=400, detail="Invalid referral code")

    # 3. PERMANENT Referral Code Generation (Done once at birth)
    my_new_referral_code = f"KSN-{str(uuid.uuid4())[:6].upper()}"
    
    user_dict = {
        "email": user_in.email.lower(),
        "full_name": user_in.full_name,
        "password": hash_password(user_in.password),
        "role": user_in.role.lower(),
        "tokens": initial_tokens,
        "referral_code": my_new_referral_code, # This never changes
        "is_available": True if user_in.role.lower() == "professional" else False,
        "views": 0,
        "rating": 5.0,
        "skills": [],
        "profession": "",
        "created_at": datetime.now()
    }

    result = await db.users.insert_one(user_dict)

    if referrer_id:
        await db.users.update_one({"_id": referrer_id}, {"$inc": {"tokens": 5}})

    user_dict["id"] = str(result.inserted_id)
    return user_dict

@router.post("/login")
# Change 'request: LoginRequest' to 'form_data: OAuth2PasswordRequestForm = Depends()'
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Swagger sends the email into the 'username' field
    email = form_data.username
    password = form_data.password

    # Now find the user in DB as usual
    user = await db.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})

    if not user or not verify_password(password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Generate Token
    token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})
    
    # Return user data along with token
    user_data = {
        "id": str(user["_id"]),
        "email": user["email"],
        "role": user["role"],
        "tokens": user.get("tokens", 0),
        "is_available": user.get("is_available", False)
    }
    
    return {"access_token": token, "token_type": "bearer", "user": user_data}


@router.get("/me", response_model=UserPublic)
async def get_me(current_user: dict = Depends(get_current_user)):
    # Simple Read-Only conversion
    current_user["id"] = str(current_user["_id"])
    
    # We removed the 'if not referral_code' block to prevent 
    # the code from flickering/changing on every refresh.
    return current_user