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
 
# -----------------------------
# Task Endpoints
# -----------------------------

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

# POST /api/v1/tasks/{task_id}/assign
@app.post("/api/v1/tasks/{task_id}/assign", response_model=TaskOut)
async def assign_task(task_id: str, assignee_id: str = Body(..., embed=True)):
    from pymongo import ReturnDocument
    task = await db.tasks.find_one_and_update(
        {"_id": ObjectId(task_id)},
        {"$set": {"assignee_id": ObjectId(assignee_id)}},
        return_document=ReturnDocument.AFTER,
    )
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_doc_to_out(task)


