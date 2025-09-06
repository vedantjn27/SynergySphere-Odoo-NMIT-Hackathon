"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { ArrowLeft, Plus, X, Target, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function NewProjectPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "medium",
    start_date: "",
    end_date: "",
    organization_id: "",
    tags: [] as string[],
  })
  const [newTag, setNewTag] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Project name is required",
        variant: "destructive",
      })
      return
    }

    if (!formData.organization_id) {
      toast({
        title: "Validation Error",
        description: "Please select an organization",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const project = await apiClient.createProject({
        name: formData.name,
        description: formData.description,
        organization_id: formData.organization_id,
        priority: formData.priority,
        start_date: formData.start_date,
        end_date: formData.end_date,
        tags: formData.tags,
      })

      toast({
        title: "Project created!",
        description: `${project.name} has been created successfully`,
      })

      router.push(`/dashboard/projects/${project._id}`)
    } catch (error) {
      toast({
        title: "Error creating project",
        description: error instanceof Error ? error.message : "Failed to create project",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
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

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/dashboard/projects">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)]">
                Create New Project
              </h1>
              <p className="text-muted-foreground mt-1">Set up a new project for your team to collaborate on</p>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Project Details
              </CardTitle>
              <CardDescription>Provide the basic information about your project</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Project Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Enter project name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this project is about..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* Organization ID - For now using a placeholder */}
                <div className="space-y-2">
                  <Label htmlFor="organization" className="text-sm font-medium">
                    Organization *
                  </Label>
                  <Input
                    id="organization"
                    placeholder="Enter organization ID (temporary)"
                    value={formData.organization_id}
                    onChange={(e) => setFormData({ ...formData, organization_id: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be replaced with an organization selector in the next update
                  </p>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium">
                    Priority
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date" className="text-sm font-medium">
                      Start Date
                    </Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    />
                  </div>
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

                {/* Submit */}
                <div className="flex gap-4 pt-4">
                  <Link href="/dashboard/projects" className="flex-1">
                    <Button type="button" variant="outline" className="w-full bg-transparent">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Target className="mr-2 h-4 w-4" />
                        Create Project
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
