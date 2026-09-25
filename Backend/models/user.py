from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional

class GeoLocation(BaseModel):
    type: str = "Point"
    coordinates: List[float]

class UserAuth(BaseModel):
    email: EmailStr
    full_name: str
    password: str = Field(..., min_length=8, max_length=72)
    role: str 

class UserPublic(BaseModel):
    id: str 
    email: EmailStr
    full_name: str  # <--- ADD THIS: Otherwise the Profile page shows "User Name"
    role: str
    is_available: bool
    tokens: int
    views: int = 0
    rating: float = 5.0
    referral_code: str = "N/A"
    profession: Optional[str] = None
    skills: List[str] = []
    manual_address: Optional[str] = None # <--- ADD THIS: For the Laptop styling fix

class ProfileUpdate(BaseModel):
    # All fields made Optional so partial updates don't crash
    full_name: Optional[str] = Field(None, min_length=3, max_length=50)
    phone: Optional[str] = Field(None, min_length=10, max_length=15)
    profession: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)
    experience_years: Optional[int] = Field(0, ge=0)
    skills: List[str] = []
    # Location fields made optional so you don't need GPS to change a name
    lat: Optional[float] = None
    lon: Optional[float] = None
    manual_address: Optional[str] = None
    