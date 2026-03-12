from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
from datetime import datetime
from app.core.security import get_password_hash, verify_password, create_access_token

router = APIRouter()

USERS_FILE = os.path.join(os.getcwd(), "data", "users.json")

# Ensure data directory and file exist
os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, "w") as f:
        json.dump({}, f)

def load_users():
    with open(USERS_FILE, "r") as f:
        return json.load(f)

def save_users(users_data):
    with open(USERS_FILE, "w") as f:
        json.dump(users_data, f, indent=4)

# Schemas
class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class SigninRequest(BaseModel):
    email: str
    password: str

def enforce_bcrypt_password_limit(password: str) -> None:
    # bcrypt only supports up to 72 bytes for the input password
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="Password too long (max 72 bytes)")

@router.post("/signup")
async def signup(request: SignupRequest):
    enforce_bcrypt_password_limit(request.password)
    users = load_users()
    email_key = request.email.lower()

    if email_key in users:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    users[email_key] = {
        "name": request.name,
        "email": email_key,
        "hashed_password": get_password_hash(request.password),
        "is_google": False,
        "created_at": datetime.utcnow().isoformat()
    }
    save_users(users)
    
    token = create_access_token(data={"sub": email_key, "name": request.name})
    return {"access_token": token, "token_type": "bearer", "user": {"email": email_key, "name": request.name}}

@router.post("/signin")
async def signin(request: SigninRequest):
    enforce_bcrypt_password_limit(request.password)
    users = load_users()
    email_key = request.email.lower()

    user = users.get(email_key)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if user.get("is_google"):
        raise HTTPException(status_code=400, detail="Use Google Sign-In for this account")

    if not verify_password(request.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(data={"sub": email_key, "name": user["name"]})
    return {"access_token": token, "token_type": "bearer", "user": {"email": email_key, "name": user["name"]}}
