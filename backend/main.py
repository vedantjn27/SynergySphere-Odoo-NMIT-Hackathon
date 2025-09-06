from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId
from init_db import db
import os
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# Config
# -----------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="SynergySphere Backend")

# -----------------------------
# Pydantic Models
# -----------------------------
class UserRegister(BaseModel):
    username: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: str

# -----------------------------
# Utility Functions
# -----------------------------
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_user_by_email(email: str):
    return await db.users.find_one({"email": email})

async def authenticate_user(username_or_email: str, password: str):
    user = await db.users.find_one({"username": username_or_email})
    if not user:
        user = await db.users.find_one({"email": username_or_email})
    if not user or not verify_password(password, user["password_hash"]):
        return None
    return user


# -----------------------------
# Authentication Endpoints
# -----------------------------

@app.post("/api/v1/auth/register", response_model=Token)
async def register(user: UserRegister):
    # Check if user exists
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if await db.users.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already taken")
    
    hashed_password = hash_password(user.password)
    user_doc = {
        "username": user.username,
        "email": user.email,
        "password_hash": hashed_password,
        "created_at": datetime.now(timezone.utc),
        "is_active": True,
        "last_login": None,
        "organizations": []
    }
    result = await db.users.insert_one(user_doc)
    
    access_token = create_access_token({"user_id": str(result.inserted_id)})
    refresh_token = create_refresh_token({"user_id": str(result.inserted_id)})
    
    return {"access_token": access_token, "refresh_token": refresh_token}

@app.post("/api/v1/auth/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": datetime.utcnow()}})
    
    access_token = create_access_token({"user_id": str(user["_id"])})
    refresh_token = create_refresh_token({"user_id": str(user["_id"])})
    
    return {"access_token": access_token, "refresh_token": refresh_token}

@app.post("/api/v1/auth/refresh", response_model=Token)
async def refresh_token(refresh_token: str):
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    access_token = create_access_token({"user_id": user_id})
    refresh_token = create_refresh_token({"user_id": user_id})
    
    return {"access_token": access_token, "refresh_token": refresh_token}

@app.post("/api/v1/auth/logout")
async def logout():
    # With JWT, logout is handled client-side or with token blacklist (optional)
    return {"message": "Logged out successfully"}

# -----------------------------
# Run FastAPI
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
