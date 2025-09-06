"use client"

import { useEffect, useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { apiClient, type Project } from "@/lib/api"
import { Plus, Search, Users, CheckSquare, MoreHorizontal } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const data = await apiClient.getProjects()
      setProjects(data)
    } catch (error) {
      toast({
        title: "Error loading projects",
        description: error instanceof Error ? error.message : "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                Projects
              </h1>
              <p className="text-muted-foreground mt-1">Manage and track all your team projects</p>
            </div>
            <Link href="/dashboard/projects/new">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </Button>
              <Button
                variant={statusFilter === "archived" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("archived")}
              >
                Archived
              </Button>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Card key={project._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg line-clamp-1">{project.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(project.status)} variant="secondary">
                          {project.status}
                        </Badge>
                        {project.priority && (
                          <Badge className={getPriorityColor(project.priority)} variant="outline">
                            {project.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress.completion_percentage}%</span>
                    </div>
                    <Progress value={project.progress.completion_percentage} className="h-2" />
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{project.members.length} members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckSquare className="h-4 w-4" />
                      <span>
                        {project.progress.tasks_completed}/{project.progress.tasks_total} tasks
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {project.metadata.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {project.metadata.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.metadata.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{project.metadata.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/dashboard/projects/${project._id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full bg-transparent">
                        View Project
                      </Button>
                    </Link>
                    <Link href={`/dashboard/projects/${project._id}/tasks`} className="flex-1">
                      <Button size="sm" className="w-full bg-primary hover:bg-primary/90">
                        Tasks
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {filteredProjects.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <CheckSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery || statusFilter !== "all" ? "No projects found" : "No projects yet"}
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Create your first project to start collaborating with your team"}
                </p>
                <Link href="/dashboard/projects/new">
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Project
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
