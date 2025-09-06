"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { KanbanBoard } from "@/components/kanban-board"
import { TaskDialog } from "@/components/task-dialog"
import { apiClient, type Project, type Task } from "@/lib/api"
import { ArrowLeft, Plus, Search, Filter, LayoutGrid, List } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function ProjectTasksPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban")

  // Task dialog state
  const [taskDialog, setTaskDialog] = useState<{
    isOpen: boolean
    task: Task | null
    mode: "view" | "edit" | "create"
    initialStatus?: string
  }>({
    isOpen: false,
    task: null,
    mode: "view",
  })

  useEffect(() => {
    if (params.id) {
      loadProjectData()
    }
  }, [params.id])

  const loadProjectData = async () => {
    try {
      const [projectData, tasksData] = await Promise.all([
        apiClient.getProject(params.id as string),
        apiClient.getProjectTasks(params.id as string),
      ])
      setProject(projectData)
      setTasks(tasksData)
    } catch (error) {
      toast({
        title: "Error loading project",
        description: error instanceof Error ? error.message : "Failed to load project data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const updatedTask = await apiClient.updateTask(taskId, updates)
      setTasks(tasks.map((task) => (task.id === taskId ? updatedTask : task)))
      toast({
        title: "Task updated",
        description: "Task has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error updating task",
        description: error instanceof Error ? error.message : "Failed to update task",
        variant: "destructive",
      })
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    try {
      await apiClient.deleteTask(taskId)
      setTasks(tasks.filter((task) => task.id !== taskId))
      toast({
        title: "Task deleted",
        description: "Task has been deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error deleting task",
        description: error instanceof Error ? error.message : "Failed to delete task",
        variant: "destructive",
      })
    }
  }

  const handleTaskSave = (savedTask: Task) => {
    const existingIndex = tasks.findIndex((task) => task.id === savedTask.id)
    if (existingIndex >= 0) {
      setTasks(tasks.map((task) => (task.id === savedTask.id ? savedTask : task)))
    } else {
      setTasks([...tasks, savedTask])
    }
  }

  const openTaskDialog = (mode: "view" | "edit" | "create", task?: Task, initialStatus?: string) => {
    setTaskDialog({
      isOpen: true,
      task: task || null,
      mode,
      initialStatus,
    })
  }

  const closeTaskDialog = () => {
    setTaskDialog({
      isOpen: false,
      task: null,
      mode: "view",
    })
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="text-center py-16">
            <h2 className="text-2xl font-bold text-foreground mb-2">Project not found</h2>
            <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist.</p>
            <Link href="/dashboard/projects">
              <Button>Back to Projects</Button>
            </Link>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-4">
                <Link href={`/dashboard/projects/${project._id}`}>
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Project
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                {project.name} - Tasks
              </h1>
              <p className="text-muted-foreground">Manage and track project tasks</p>
            </div>
            <Button
              onClick={() => openTaskDialog("create")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>

          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={viewMode === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("kanban")}
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Kanban
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          {/* Task Board */}
          <div className="flex-1 min-h-0">
            {viewMode === "kanban" ? (
              <KanbanBoard
                tasks={filteredTasks}
                onTaskUpdate={handleTaskUpdate}
                onTaskDelete={handleTaskDelete}
                onTaskEdit={(task) => openTaskDialog("edit", task)}
                onTaskAssign={(taskId) => {
                  // TODO: Implement assign dialog
                  toast({
                    title: "Feature coming soon",
                    description: "Task assignment will be available in the next update",
                  })
                }}
                onTaskView={(task) => openTaskDialog("view", task)}
                onCreateTask={(status) => openTaskDialog("create", undefined, status)}
              />
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">List view coming soon</h3>
                <p>The list view is currently under development</p>
              </div>
            )}
          </div>

          {/* Task Dialog */}
          <TaskDialog
            task={taskDialog.task}
            isOpen={taskDialog.isOpen}
            onClose={closeTaskDialog}
            onSave={handleTaskSave}
            mode={taskDialog.mode}
            projectId={project._id}
            initialStatus={taskDialog.initialStatus}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
