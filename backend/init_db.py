from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING
import os
import asyncio
from pymongo import ASCENDING, DESCENDING, TEXT
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv() 
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "synergysphere")

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

async def init_db():
    print("Connected to DB:", db.name)
    # USERS COLLECTION
    await db.create_collection("users", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["username", "email", "password_hash", "created_at"],
            "properties": {
                "username": {"bsonType": "string"},
                "email": {"bsonType": "string"},
                "password_hash": {"bsonType": "string"},
                "created_at": {"bsonType": "date"}
            }
        }
    })

    # Indexes
    await db.users.create_index("email", unique=True, name="idx_users_email_unique")
    await db.users.create_index("username", unique=True, name="idx_users_username_unique")
    await db.users.create_index([("created_at", DESCENDING)], name="idx_users_created_at")

    # ORGANIZATIONS COLLECTION
    await db.create_collection("organizations", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "owner_id", "created_at"],
            "properties": {
                "name": {"bsonType": "string"},
                "owner_id": {"bsonType": "objectId"},
                "created_at": {"bsonType": "date"}
            }
        }
    })

    await db.organizations.create_index("owner_id", name="idx_organizations_owner")

    await db.command("collMod", "projects", validator={
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["name", "organization_id", "owner_id", "created_at"],
        "properties": {
            "name": {"bsonType": "string"},
            "organization_id": {"bsonType": "objectId"},
            "owner_id": {"bsonType": "objectId"},
            "created_at": {"bsonType": "date"},
            "status": {"bsonType": "string", "enum": ["active", "archived", "completed"]},
            "members": {"bsonType": "array", "items": {"bsonType": "objectId"}}
        }
    }
})

    await db.projects.create_index([("organization_id", ASCENDING), ("status", ASCENDING)], name="idx_projects_org_status")
    await db.projects.create_index("owner_id", name="idx_projects_owner")

    # TASKS COLLECTION
    await db.create_collection("tasks", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["title", "project_id", "creator_id", "created_at"],
            "properties": {
                "title": {"bsonType": "string"},
                "project_id": {"bsonType": "objectId"},
                "creator_id": {"bsonType": "objectId"},
                "created_at": {"bsonType": "date"}
            }
        }
    })

    await db.tasks.create_index([("project_id", ASCENDING), ("status", ASCENDING)], name="idx_tasks_project_status")
    await db.tasks.create_index([("title", TEXT), ("description", TEXT)], name="idx_tasks_text_search")

    # COMMENTS COLLECTION
    await db.create_collection("comments", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["author_id", "content", "created_at"],
            "properties": {
                "author_id": {"bsonType": "objectId"},
                "content": {"bsonType": "string"},
                "created_at": {"bsonType": "date"}
            }
        }
    })

    await db.comments.create_index([("task_id", ASCENDING), ("created_at", DESCENDING)], name="idx_comments_task_created")

    # NOTIFICATIONS COLLECTION
    await db.create_collection("notifications", validator={
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["recipient_id", "type", "title", "message", "created_at"],
            "properties": {
                "recipient_id": {"bsonType": "objectId"},
                "type": {"bsonType": "string"},
                "title": {"bsonType": "string"},
                "message": {"bsonType": "string"},
                "created_at": {"bsonType": "date"}
            }
        }
    })

    await db.notifications.create_index([("recipient_id", ASCENDING), ("created_at", DESCENDING)], name="idx_notifications_recipient_created")

    # Insert Sample Data
    sample_user_id = ObjectId()
    await db.users.insert_one({
        "_id": sample_user_id,
        "username": "john_doe",
        "email": "john.doe@example.com",
        "password_hash": "hashed_password_here",
        "created_at": datetime.now(timezone.utc),
        "is_active": True
    })

    print(" Database initialized successfully with collections, indexes, and sample data.")

if __name__ == "__main__":
    asyncio.run(init_db())