from typing import Optional, List
from fastapi import Query

class UserOut(BaseModel):
    id: str
    username: str
    email: EmailStr
    is_active: bool = True
    created_at: datetime

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None

def user_doc_to_out(doc: dict) -> UserOut:
    return UserOut(
        id=str(doc["_id"]),
        username=doc["username"],
        email=doc["email"],
        is_active=doc.get("is_active", True),
        created_at=doc["created_at"]
    )

@app.get("/api/v1/users/me", response_model=UserOut)
async def get_current_user(user_id: str = Query(..., description="User ID from token")):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc_to_out(user)

# PUT /api/v1/users/me
@app.put("/api/v1/users/me", response_model=UserOut)
async def update_current_user(update: UserUpdate, user_id: str = Query(..., description="User ID from token")):
    update_data = {k: v for k, v in update.dict(exclude_unset=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.users.find_one_and_update(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
        return_document=True  # in Motor, you may need ReturnDocument.AFTER from pymongo
    )
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    return user_doc_to_out(result)

# GET /api/v1/users/search
@app.get("/api/v1/users/search", response_model=List[UserOut])
async def search_users(q: str = Query(..., min_length=2)):
    cursor = db.users.find({"username": {"$regex": q, "$options": "i"}}).limit(10)
    users = [user_doc_to_out(doc) async for doc in cursor]
    return users
