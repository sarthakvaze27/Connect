from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from database import db
from auth_utils import SECRET_KEY, ALGORITHM
from bson import ObjectId

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    token = credentials.credentials  # Extract token from "Bearer <token>"
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    print(f"Auth attempt with token: {token}")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"JWT payload: {payload}")
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid Token")
    except JWTError as e:
        print(f"JWT error: {e}")
        raise HTTPException(status_code=401, detail="Invalid Token")

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    print(f"Found user: {user}")
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user