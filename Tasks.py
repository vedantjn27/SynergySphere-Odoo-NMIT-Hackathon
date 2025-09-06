from fastapi import Body

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
 
