"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiClient, type Task, type Comment } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"
import { Save, MessageSquare, Send, Calendar, User, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TaskDialogProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onSave: (task: Task) => void
  mode: "view" | "edit" | "create"
  projectId?: string
  initialStatus?: string
}

export function TaskDialog({ task, isOpen, onClose, onSave, mode, projectId, initialStatus }: TaskDialogProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "pending",
  })

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
      })
      if (mode === "view") {
        loadComments()
      }
    } else if (mode === "create") {
      setFormData({
        title: "",
        description: "",
        status: initialStatus || "pending",
      })
    }
  }, [task, mode, initialStatus])

  const loadComments = async () => {
    if (!task) return
    try {
      const commentsData = await apiClient.getTaskComments(task.id)
      setComments(commentsData)
    } catch (error) {
      console.error("Failed to load comments:", error)
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Task title is required",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let savedTask: Task

      if (mode === "create" && projectId && user) {
        savedTask = await apiClient.createTask(projectId, {
          title: formData.title,
          description: formData.description,
          creator_id: user.id,
        })
        toast({
          title: "Task created",
          description: "New task has been created successfully",
        })
      } else if (task) {
        savedTask = await apiClient.updateTask(task.id, {
          title: formData.title,
          description: formData.description,
          status: formData.status,
        })
        toast({
          title: "Task updated",
          description: "Task has been updated successfully",
        })
      } else {
        return
      }

      onSave(savedTask)
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save task",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !task || !user) return

    try {
      const comment = await apiClient.addComment(task.id, {
        author_id: user.id,
        content: newComment.trim(),
      })
      setComments([...comments, comment])
      setNewComment("")
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary text-primary-foreground"
      case "in-progress":
        return "bg-accent text-accent-foreground"
      case "pending":
        return "bg-secondary text-secondary-foreground"
      case "cancelled":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Task" : mode === "edit" ? "Edit Task" : "Task Details"}
          </DialogTitle>
          {mode === "view" && task && (
            <DialogDescription>Created on {new Date(task.created_at).toLocaleDateString()}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 h-full">
            {/* Task Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title..."
                  disabled={mode === "view"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter task description..."
                  rows={3}
                  disabled={mode === "view"}
                />
              </div>

              {(mode === "edit" || mode === "view") && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  {mode === "view" ? (
                    <Badge className={getStatusColor(formData.status)} variant="secondary">
                      {formData.status.replace("-", " ")}
                    </Badge>
                  ) : (
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {task && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created {new Date(task.created_at).toLocaleDateString()}
                  </div>
                  {task.assignee_id && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                          {task.assignee_id.slice(-2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Comments Section - Only in view mode */}
            {mode === "view" && task && (
              <>
                <Separator />
                <div className="space-y-4 flex-1 min-h-0">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <h4 className="font-medium">Comments ({comments.length})</h4>
                  </div>

                  <ScrollArea className="h-48">
                    <div className="space-y-3 pr-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-3 border border-border rounded-lg">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {comment.author_id.slice(-2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>User {comment.author_id.slice(-4)}</span>
                              <span>•</span>
                              <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                      {comments.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No comments yet</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
                    />
                    <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="bg-transparent">
            {mode === "view" ? "Close" : "Cancel"}
          </Button>
          {mode !== "view" && (
            <Button
              onClick={handleSave}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {mode === "create" ? "Create Task" : "Save Changes"}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
