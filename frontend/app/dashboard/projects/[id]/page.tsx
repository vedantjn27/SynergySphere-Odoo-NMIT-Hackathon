"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { apiClient, type Project, type Task } from "@/lib/api"
import {
  ArrowLeft,
  Users,
  CheckSquare,
  Calendar,
  Settings,
  Plus,
  Target,
  Clock,
  TrendingUp,
  MoreHorizontal,
} from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

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
        description: error instanceof Error ? error.message : "Failed to load project",
        variant: "destructive",
      })
      router.push("/dashboard/projects")
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-accent text-accent-foreground"
      case "completed":
        return "bg-primary text-primary-foreground"
      case "archived":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive text-destructive-foreground"
      case "medium":
        return "bg-accent text-accent-foreground"
      case "low":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary text-primary-foreground"
      case "in-progress":
        return "bg-accent text-accent-foreground"
      case "pending":
        return "bg-secondary text-secondary-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/projects">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Projects
                  </Button>
                </Link>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                    {project.name}
                  </h1>
                  <Badge className={getStatusColor(project.status)} variant="secondary">
                    {project.status}
                  </Badge>
                  {project.priority && (
                    <Badge className={getPriorityColor(project.priority)} variant="outline">
                      {project.priority} priority
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{project.description || "No description provided"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/projects/${project._id}/settings`}>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
              <Link href={`/dashboard/projects/${project._id}/tasks`}>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  View Tasks
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.progress.completion_percentage}%</div>
                <Progress value={project.progress.completion_percentage} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.progress.tasks_completed}/{project.progress.tasks_total}
                </div>
                <p className="text-xs text-muted-foreground">
                  {project.progress.tasks_total - project.progress.tasks_completed} remaining
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{project.members.length}</div>
                <p className="text-xs text-muted-foreground">Active collaborators</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Days Left</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {project.metadata.end_date
                    ? Math.max(
                        0,
                        Math.ceil(
                          (new Date(project.metadata.end_date).getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24),
                        ),
                      )
                    : "∞"}
                </div>
                <p className="text-xs text-muted-foreground">Until deadline</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5" />
                        Recent Tasks
                      </span>
                      <Link href={`/dashboard/projects/${project._id}/tasks`}>
                        <Button variant="ghost" size="sm">
                          View All
                        </Button>
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="space-y-1">
                            <h4 className="font-medium text-sm">{task.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {task.description || "No description"}
                            </p>
                          </div>
                          <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                            {task.status}
                          </Badge>
                        </div>
                      ))}
                      {tasks.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No tasks yet</p>
                          <Link href={`/dashboard/projects/${project._id}/tasks`}>
                            <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                              Create first task
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Project Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Project Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Created</span>
                        <p className="font-medium">{new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Updated</span>
                        <p className="font-medium">{new Date(project.updated_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Start Date</span>
                        <p className="font-medium">
                          {project.metadata.start_date
                            ? new Date(project.metadata.start_date).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">End Date</span>
                        <p className="font-medium">
                          {project.metadata.end_date
                            ? new Date(project.metadata.end_date).toLocaleDateString()
                            : "Not set"}
                        </p>
                      </div>
                    </div>

                    {project.metadata.tags.length > 0 && (
                      <div>
                        <span className="text-muted-foreground text-sm">Tags</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.metadata.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Project Tasks</span>
                    <Link href={`/dashboard/projects/${project._id}/tasks`}>
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Task
                      </Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="space-y-1">
                          <h4 className="font-medium">{task.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description || "No description"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Created {new Date(task.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTaskStatusColor(task.status)} variant="secondary">
                            {task.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center py-16 text-muted-foreground">
                        <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
                        <p className="mb-4">Create your first task to get started</p>
                        <Link href={`/dashboard/projects/${project._id}/tasks`}>
                          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Task
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="members">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Team Members</span>
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.members.map((member) => (
                      <div
                        key={member.user_id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {member.user_id.slice(-2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium">User {member.user_id.slice(-4)}</h4>
                            <p className="text-sm text-muted-foreground">
                              Joined {new Date(member.added_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{member.role}</Badge>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest updates and changes to this project</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-16 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                    <p>Activity will appear here as team members work on the project</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
