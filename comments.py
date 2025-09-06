# -----------------------------
# Pydantic Models for Comments
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


# -----------------------------
# Comment Endpoints
# -----------------------------

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
