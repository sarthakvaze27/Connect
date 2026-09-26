import os
from datetime import datetime,timedelta
from typing import  Optional
from dotenv import load_dotenv
from jose import JWSError,jwt
from passlib.context import CryptContext

load_dotenv()
SECRET_KEY = os.getenv("JWT_SECRET")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET must be set in the environment")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"],deprecated="auto")

def hash_password(password:str) -> str:
    return pwd_context.hash(password[:72])

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the typed password matches the one in the DB."""
    result = pwd_context.verify(plain_password[:72], hashed_password)
    return result

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates the JWT 'ID Card' for the user."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    # Add the expiration time to the token data
    to_encode.update({"exp": expire})

    # Sign the token with your secret key
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


