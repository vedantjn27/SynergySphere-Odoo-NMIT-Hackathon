"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { apiClient, type Project } from "@/lib/api"
import { ArrowLeft, Settings, Save, Trash2, Plus, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function ProjectSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium",
    status: "active",
    end_date: "",
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState("")

  useEffect(() => {
    if (params.id) {
      loadProject()
    }
  }, [params.id])

  const loadProject = async () => {
    try {
      const projectData = await apiClient.getProject(params.id as string)
      setProject(projectData)
      setFormData({
        name: projectData.name,
        description: projectData.description || "",
        priority: projectData.priority || "medium",
        status: projectData.status,
        end_date: projectData.metadata.end_date ? projectData.metadata.end_date.split("T")[0] : "",
        tags: projectData.metadata.tags || [],
      })
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

  const handleSave = async () => {
    if (!project) return

    setSaving(true)
    try {
      const updatedProject = await apiClient.updateProject(project._id, {
        name: formData.name,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        end_date: formData.end_date,
        tags: formData.tags,
      })

      setProject(updatedProject)
      toast({
        title: "Project updated",
        description: "Your changes have been saved successfully",
      })
    } catch (error) {
      toast({
        title: "Error updating project",
        description: error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!project) return

    setDeleting(true)
    try {
      await apiClient.deleteProject(project._id)
      toast({
        title: "Project deleted",
        description: "The project has been permanently deleted",
      })
      router.push("/dashboard/projects")
    } catch (error) {
      toast({
        title: "Error deleting project",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      })
      setDeleting(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()],
      })
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
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
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href={`/dashboard/projects/${project._id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Project
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                Project Settings
              </h1>
              <p className="text-muted-foreground mt-1">Manage your project configuration and preferences</p>
            </div>
          </div>

          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Update basic project information and settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Project Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Status and Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end_date" className="text-sm font-medium">
                  End Date
                </Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSave}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible and destructive actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Delete Project</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete this project and all its data. This action cannot be undone.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the project "{project.name}" and
                          remove all associated data including tasks, comments, and files.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            "Delete Project"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
