"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { apiClient, type Project, type Notification } from "@/lib/api"
import { FolderOpen, CheckSquare, Users, TrendingUp, Plus, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function DashboardPage() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [projectsData, notificationsData] = await Promise.all([
        apiClient.getProjects(),
        apiClient.getNotifications(),
      ])
      setProjects(projectsData)
      setNotifications(notificationsData)
    } catch (error) {
      toast({
        title: "Error loading dashboard",
        description: error instanceof Error ? error.message : "Failed to load data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const activeProjects = projects.filter((p) => p.status === "active")
  const completedProjects = projects.filter((p) => p.status === "completed")
  const unreadNotifications = notifications.filter((n) => !n.read)

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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                Welcome back, {user?.username}!
              </h1>
              <p className="text-muted-foreground mt-1">Here's what's happening with your projects today.</p>
            </div>
            <Link href="/dashboard/projects/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-xs text-muted-foreground">{activeProjects.length} active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedProjects.length}</div>
                <p className="text-xs text-muted-foreground">Projects finished</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.reduce((acc, p) => acc + p.members.length, 0)}</div>
                <p className="text-xs text-muted-foreground">Across all projects</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unreadNotifications.length}</div>
                <p className="text-xs text-muted-foreground">Unread messages</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Projects
                </CardTitle>
                <CardDescription>Your most recently updated projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeProjects.slice(0, 3).map((project) => (
                    <div
                      key={project._id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{project.name}</h4>
                          <Badge className={getStatusColor(project.status)} variant="secondary">
                            {project.status}
                          </Badge>
                          {project.priority && (
                            <Badge className={getPriorityColor(project.priority)} variant="outline">
                              {project.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {project.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.members.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckSquare className="h-3 w-3" />
                            {project.progress.tasks_completed}/{project.progress.tasks_total}
                          </span>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <Progress value={project.progress.completion_percentage} className="w-20 h-2" />
                        <span className="text-xs text-muted-foreground">{project.progress.completion_percentage}%</span>
                      </div>
                    </div>
                  ))}
                  {activeProjects.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active projects</p>
                      <Link href="/dashboard/projects/new">
                        <Button variant="outline" size="sm" className="mt-2 bg-transparent">
                          Create your first project
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest notifications and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.slice(0, 5).map((notification) => (
                    <div key={notification._id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notification.read ? "bg-muted" : "bg-primary"}`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm">{notification.message}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(notification.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
