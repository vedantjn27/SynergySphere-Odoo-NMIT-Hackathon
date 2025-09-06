"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TaskCard } from "@/components/task-card"
import type { Task } from "@/lib/api"
import { Plus, CheckSquare, Clock, Play, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskDelete: (taskId: string) => void
  onTaskEdit: (task: Task) => void
  onTaskAssign: (taskId: string) => void
  onTaskView: (task: Task) => void
  onCreateTask: (status: string) => void
}

const columns = [
  {
    id: "pending",
    title: "To Do",
    icon: CheckSquare,
    color: "bg-secondary text-secondary-foreground",
  },
  {
    id: "in-progress",
    title: "In Progress",
    icon: Play,
    color: "bg-accent text-accent-foreground",
  },
  {
    id: "completed",
    title: "Completed",
    icon: Clock,
    color: "bg-primary text-primary-foreground",
  },
  {
    id: "cancelled",
    title: "Cancelled",
    icon: X,
    color: "bg-muted text-muted-foreground",
  },
]

export function KanbanBoard({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskEdit,
  onTaskAssign,
  onTaskView,
  onCreateTask,
}: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status)
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (draggedTask && draggedTask.status !== columnId) {
      onTaskUpdate(draggedTask.id, { status: columnId })
    }
    setDraggedTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
      {columns.map((column) => {
        const columnTasks = getTasksByStatus(column.id)
        const Icon = column.icon

        return (
          <div
            key={column.id}
            className="flex flex-col h-full"
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <Card
              className={cn(
                "flex-1 flex flex-col",
                dragOverColumn === column.id && "ring-2 ring-primary ring-offset-2",
              )}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {column.title}
                    <span className={cn("px-2 py-1 rounded-full text-xs", column.color)}>{columnTasks.length}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => onCreateTask(column.id)} className="h-6 w-6 p-0">
                    <Plus className="h-3 w-3" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 pt-0">
                {columnTasks.map((task) => (
                  <div key={task.id} draggable onDragStart={(e) => handleDragStart(e, task)} onDragEnd={handleDragEnd}>
                    <TaskCard
                      task={task}
                      onEdit={onTaskEdit}
                      onDelete={onTaskDelete}
                      onAssign={onTaskAssign}
                      onViewDetails={onTaskView}
                      isDragging={draggedTask?.id === task.id}
                    />
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tasks</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCreateTask(column.id)}
                      className="mt-2 bg-transparent"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })}
    </div>
  )
}
