from fastapi import FastAPI, HTTPException, Depends, status, Body, Path
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from bson import ObjectId
from init_db import db
import os
from dotenv import load_dotenv
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
from fastapi import Path
from fastapi import Query
from bson.errors import InvalidId
from pymongo import ReturnDocument 

load_dotenv()
from fastapi.middleware.cors import CORSMiddleware


# Allow all origins


# -----------------------------
# Config
# -----------------------------
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="SynergySphere Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allow all origins
    allow_credentials=True,    # Allow cookies and auth headers
    allow_methods=["*"],       # Allow all HTTP methods
    allow_headers=["*"],       # Allow all headers
)
# -----------------------------
# User Authentication 
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
class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=3)
class JoinOrganization(BaseModel):
    organization_id: str  # will convert to ObjectId

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
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_login": datetime.now(timezone.utc)}})
    
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

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- CREATE ORG ----------------
@app.post("/organizations")
async def create_organization(org: OrganizationCreate, current_user: dict = Depends(get_current_user)):
    # Insert new org
    org_doc = {
        "name": org.name,
        "owner_id": current_user["_id"],
        "created_at": datetime.now(tz=timezone.utc)
    }
    result = await db.organizations.insert_one(org_doc)

    # Add org to user's organizations array
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"organizations": result.inserted_id}}
    )

    return {"message": "Organization created", "organization_id": str(result.inserted_id)}

# ---------------- JOIN ORG ----------------
@app.post("/organizations/join")
async def join_organization(req: JoinOrganization, current_user: dict = Depends(get_current_user)):
    try:
        org_id = ObjectId(req.organization_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid organization id")

    org = await db.organizations.find_one({"_id": org_id})
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Add org to user's organizations array
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"organizations": org_id}}  # prevents duplicates
    )

    return {"message": "User joined organization", "organization_id": req.organization_id}

# -----------------------------
# User Management 
# -----------------------------
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
async def get_current_user_endpoint(current_user: dict = Depends(get_current_user)):
    return user_doc_to_out(current_user)

@app.put("/api/v1/users/me", response_model=UserOut)
async def update_current_user_endpoint(
    update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    update_data = {k: v for k, v in update.dict(exclude_unset=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.users.find_one_and_update(
        {"_id": ObjectId(current_user["_id"])},
        {"$set": update_data},
        return_document=True  # you may need ReturnDocument.AFTER
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

# -----------------------------
# Project Management 
# -----------------------------
class ProjectMember(BaseModel):
    user_id: str
    role: str  # manager, contributor, viewer

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    priority: Optional[str] = "medium"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    tags: Optional[List[str]] = []
    organization_id: str   # <-- required in your schema

class ProjectUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    priority: Optional[str]
    status: Optional[str]
    end_date: Optional[str]
    tags: Optional[List[str]] = []

def serialize_project(project: dict) -> dict:
    """Convert ObjectIds to strings for JSON response"""
    project["_id"] = str(project["_id"])
    project["organization_id"] = str(project["organization_id"])
    project["owner_id"] = str(project["owner_id"])
    for member in project.get("members", []):
        member["user_id"] = str(member["user_id"])
    return project


@app.get("/api/v1/projects")
async def list_projects(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]

    projects = await db.projects.find({"members.user_id": user_id}).to_list(100)

    # Convert ObjectIds → str for each project
    projects = [serialize_project(p) for p in projects]

    return projects

@app.post("/api/v1/projects")
async def create_project(project: ProjectCreate, current_user: dict = Depends(get_current_user)):
    try:
        # Convert org_id to ObjectId
        try:
            org_id = ObjectId(project.organization_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid organization_id format")

        # Ensure organization exists
        org = await db.organizations.find_one({"_id": org_id})
        if not org:
            raise HTTPException(status_code=404, detail="Organization not found")

        project_doc = {
            "name": project.name,
            "description": project.description,
            "organization_id": org_id,
            "owner_id": current_user["_id"],  # Must already be ObjectId
            "status": "active",
            "priority": project.priority,
            "members": [{
                "user_id": current_user["_id"],
                "role": "manager",
                "added_at": datetime.now(timezone.utc)
            }],
            "metadata": {
                "start_date": datetime.strptime(project.start_date, "%Y-%m-%d") if project.start_date else datetime.now(timezone.utc),
                "end_date": datetime.strptime(project.end_date, "%Y-%m-%d") if project.end_date else None,
                "tags": project.tags or []
            },
            "progress": {
                "completion_percentage": 0,
                "tasks_total": 0,
                "tasks_completed": 0
            },
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }

        result = await db.projects.insert_one(project_doc)
        project_doc["_id"] = result.inserted_id

        # Convert ObjectId → string for Swagger/JSON response
        project_doc["_id"] = str(project_doc["_id"])
        project_doc["organization_id"] = str(project_doc["organization_id"])
        project_doc["owner_id"] = str(project_doc["owner_id"])
        for member in project_doc["members"]:
            member["user_id"] = str(member["user_id"])

        return project_doc

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating project: {str(e)}")

@app.get("/api/v1/projects/{project_id}")
async def get_project(project_id: str = Path(...), current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check if user is a member
    if not any(str(member["user_id"]) == str(current_user["_id"]) for member in project["members"]):
        raise HTTPException(status_code=403, detail="Access denied")

    return serialize_project(project)


@app.put("/api/v1/projects/{project_id}")
async def update_project(project_id: str, project_update: ProjectUpdate, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only owner or manager can update
    is_manager = any(str(member["user_id"]) == str(current_user["_id"]) and member["role"] == "manager" for member in project["members"])
    if str(project["owner_id"]) != str(current_user["_id"]) and not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {k: v for k, v in project_update.dict().items() if v is not None}
    if "end_date" in update_data:
        update_data["metadata.end_date"] = datetime.strptime(update_data.pop("end_date"), "%Y-%m-%d")

    update_data["updated_at"] = datetime.now(timezone.utc)

    await db.projects.update_one({"_id": ObjectId(project_id)}, {"$set": update_data})
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    return serialize_project(updated_project)


@app.delete("/api/v1/projects/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only owner can delete
    if str(project["owner_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.projects.delete_one({"_id": ObjectId(project_id)})
    return {"message": "Project deleted successfully"}


@app.post("/api/v1/projects/{project_id}/members")
async def add_member(project_id: str, member: ProjectMember, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only owner or manager can add
    is_manager = any(str(m["user_id"]) == str(current_user["_id"]) and m["role"] == "manager" for m in project["members"])
    if str(project["owner_id"]) != str(current_user["_id"]) and not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Check if member already exists
    if any(str(m["user_id"]) == member.user_id for m in project["members"]):
        raise HTTPException(status_code=400, detail="User already a member")

    project_member = {
        "user_id": ObjectId(member.user_id),
        "role": member.role,
        "added_at": datetime.now(timezone.utc)
    }
    await db.projects.update_one({"_id": ObjectId(project_id)}, {"$push": {"members": project_member}})
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    return serialize_project(updated_project)


@app.delete("/api/v1/projects/{project_id}/members/{user_id}")
async def remove_member(project_id: str, user_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"_id": ObjectId(project_id)})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Only owner or manager can remove
    is_manager = any(str(m["user_id"]) == str(current_user["_id"]) and m["role"] == "manager" for m in project["members"])
    if str(project["owner_id"]) != str(current_user["_id"]) and not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized")

    await db.projects.update_one(
        {"_id": ObjectId(project_id)},
        {"$pull": {"members": {"user_id": ObjectId(user_id)}}}
    )
    updated_project = await db.projects.find_one({"_id": ObjectId(project_id)})
    return serialize_project(updated_project)

# -----------------------------
# Task Management
# -----------------------------
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: str = "pending"
    creator_id: str
class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
class TaskOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    status: str
    project_id: str
    creator_id: str
    assignee_id: Optional[str] = None
    created_at: datetime

def task_doc_to_out(doc: dict) -> TaskOut:
    return TaskOut(
        id=str(doc["_id"]),
        title=doc["title"],
        description=doc.get("description"),
        status=doc.get("status", "pending"),
        project_id=str(doc["project_id"]),
        creator_id=str(doc["creator_id"]),
        assignee_id=str(doc["assignee_id"]) if doc.get("assignee_id") else None,
        created_at=doc["created_at"],
    )

# GET /api/v1/projects/{project_id}/tasks
@app.get("/api/v1/projects/{project_id}/tasks", response_model=List[TaskOut])
async def list_project_tasks(project_id: str):
    cursor = db.tasks.find({"project_id": ObjectId(project_id)})
    tasks = [task_doc_to_out(doc) async for doc in cursor]
    return tasks

# POST /api/v1/projects/{project_id}/tasks
@app.post("/api/v1/projects/{project_id}/tasks", response_model=TaskOut)
async def create_task(project_id: str, task: TaskCreate):
    task_doc = {
        "title": task.title,
        "description": task.description,
        "status": task.status,
        "project_id": ObjectId(project_id),
        "creator_id": ObjectId(task.creator_id),
        "assignee_id": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.tasks.insert_one(task_doc)
    task_doc["_id"] = result.inserted_id
    return task_doc_to_out(task_doc)

# GET /api/v1/tasks/{task_id}
@app.get("/api/v1/tasks/{task_id}", response_model=TaskOut)
async def get_task(task_id: str):
    task = await db.tasks.find_one({"_id": ObjectId(task_id)})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_doc_to_out(task)

# PUT /api/v1/tasks/{task_id}
@app.put("/api/v1/tasks/{task_id}", response_model=TaskOut)
async def update_task(task_id: str, update: TaskUpdate):
    update_data = {k: v for k, v in update.dict(exclude_unset=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    from pymongo import ReturnDocument
    task = await db.tasks.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": update_data},
        return_document=ReturnDocument.AFTER,
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_doc_to_out(task)

# DELETE /api/v1/tasks/{task_id}
@app.delete("/api/v1/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"_id": ObjectId(task_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

@app.post("/api/v1/tasks/{task_id}/assign", response_model=TaskOut)
async def assign_task(
    task_id: str,
    assignee_id: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user)
):
    # Update task assignee
    task = await db.tasks.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": {"assignee_id": assignee_id}},  # store as string
        return_document=ReturnDocument.AFTER,
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    # Add mock notification
    message = f"You have been assigned to task: {task['title']}"
    await add_notification(message=message, user_id=assignee_id)

    return task_doc_to_out(task)
# -----------------------------
# Communication
# -----------------------------
class CommentCreate(BaseModel):
    author_id: str
    content: str
class CommentUpdate(BaseModel):
    content: str
class CommentOut(BaseModel):
    id: str
    task_id: str
    author_id: str
    content: str
    created_at: datetime

def comment_doc_to_out(doc: dict) -> CommentOut:
    return CommentOut(
        id=str(doc["_id"]),
        task_id=str(doc["task_id"]),
        author_id=str(doc["author_id"]),
        content=doc["content"],
        created_at=doc["created_at"],
    )

# GET /api/v1/tasks/{task_id}/comments - Get task comments
@app.get("/api/v1/tasks/{task_id}/comments", response_model=List[CommentOut])
async def get_task_comments(task_id: str):
    cursor = db.comments.find({"task_id": ObjectId(task_id)}).sort("created_at", 1)
    comments = [comment_doc_to_out(doc) async for doc in cursor]
    return comments

# POST /api/v1/tasks/{task_id}/comments - Add comment
@app.post("/api/v1/tasks/{task_id}/comments", response_model=CommentOut)
async def add_comment(task_id: str, comment: CommentCreate):
    comment_doc = {
        "task_id": ObjectId(task_id),
        "author_id": ObjectId(comment.author_id),
        "content": comment.content,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.comments.insert_one(comment_doc)
    comment_doc["_id"] = result.inserted_id
    return comment_doc_to_out(comment_doc)

# PUT /api/v1/comments/{comment_id} - Edit comment
@app.put("/api/v1/comments/{comment_id}", response_model=CommentOut)
async def edit_comment(comment_id: str, update: CommentUpdate):
    from pymongo import ReturnDocument
    comment = await db.comments.find_one_and_update(
        {"_id": ObjectId(comment_id)},
        {"$set": {"content": update.content}},
        return_document=ReturnDocument.AFTER,
    )
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment_doc_to_out(comment)

# DELETE /api/v1/comments/{comment_id} - Delete comment
@app.delete("/api/v1/comments/{comment_id}")
async def delete_comment(comment_id: str):
    result = await db.comments.delete_one({"_id": ObjectId(comment_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"message": "Comment deleted successfully"}
# -----------------------------
# Notifications
# -----------------------------

async def add_notification(message: str, user_id: str):
    """Add a basic notification to the notifications collection."""
    await db.notifications.insert_one({
        "user_id": user_id,  # just store the string, no ObjectId conversion
        "message": message,
        "read": False,
        "created_at": datetime.now(timezone.utc)
    })

def serialize_notification(notification: dict) -> dict:
    notification["_id"] = str(notification["_id"])
    notification["user_id"] = str(notification["user_id"])
    if "created_at" in notification and isinstance(notification["created_at"], datetime):
        notification["created_at"] = notification["created_at"].isoformat()
    if "read_at" in notification and isinstance(notification.get("read_at"), datetime):
        notification["read_at"] = notification["read_at"].isoformat()
    return notification

@app.get("/api/v1/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": ObjectId(current_user["_id"])}
    ).sort("created_at", -1).to_list(100)
    return [serialize_notification(n) for n in notifications]

@app.put("/api/v1/notifications/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    notif = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(notif["user_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")

    await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True, "read_at": datetime.now(timezone.utc)}}
    )
    updated = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    return serialize_notification(updated)

@app.delete("/api/v1/notifications/{notification_id}")
async def delete_notification(notification_id: str, current_user: dict = Depends(get_current_user)):
    notif = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(notif["user_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Access denied")

    await db.notifications.delete_one({"_id": ObjectId(notification_id)})
    return {"message": "Notification deleted successfully"}

# -----------------------------
# Run FastAPI
# -----------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
