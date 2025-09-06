const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface User {
  id: string
  username: string
  email: string
  is_active: boolean
  created_at: string
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Project {
  _id: string
  name: string
  description?: string
  organization_id: string
  owner_id: string
  status: "active" | "archived" | "completed"
  priority?: "low" | "medium" | "high"
  members: ProjectMember[]
  metadata: {
    start_date: string
    end_date?: string
    tags: string[]
  }
  progress: {
    completion_percentage: number
    tasks_total: number
    tasks_completed: number
  }
  created_at: string
  updated_at: string
}

export interface ProjectMember {
  user_id: string
  role: "manager" | "contributor" | "viewer"
  added_at: string
}

export interface Organization {
  _id: string
  name: string
  owner_id: string
  created_at: string
}

export interface Notification {
  _id: string
  user_id: string
  message: string
  read: boolean
  created_at: string
  read_at?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "in-progress" | "completed" | "cancelled"
  project_id: string
  creator_id: string
  assignee_id?: string
  created_at: string
}

export interface Comment {
  id: string
  task_id: string
  author_id: string
  content: string
  created_at: string
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const token = localStorage.getItem("access_token")

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "An error occurred" }))
      throw new Error(error.detail || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData()
    formData.append("username", credentials.username)
    formData.append("password", credentials.password)

    return this.request<AuthResponse>("/api/v1/auth/login", {
      method: "POST",
      headers: {},
      body: formData,
    })
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.request<AuthResponse>("/api/v1/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  }

  async logout(): Promise<{ message: string }> {
    return this.request<{ message: string }>("/api/v1/auth/logout", {
      method: "POST",
    })
  }

  // User endpoints
  async getCurrentUser(): Promise<User> {
    return this.request<User>("/api/v1/users/me")
  }

  async updateUser(data: Partial<User>): Promise<User> {
    return this.request<User>("/api/v1/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.request<User[]>(`/api/v1/users/search?q=${encodeURIComponent(query)}`)
  }

  // Project endpoints
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>("/api/v1/projects")
  }

  async createProject(data: {
    name: string
    description?: string
    organization_id: string
    priority?: string
    start_date?: string
    end_date?: string
    tags?: string[]
  }): Promise<Project> {
    return this.request<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getProject(projectId: string): Promise<Project> {
    return this.request<Project>(`/api/v1/projects/${projectId}`)
  }

  async updateProject(projectId: string, data: Partial<Project>): Promise<Project> {
    return this.request<Project>(`/api/v1/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteProject(projectId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/projects/${projectId}`, {
      method: "DELETE",
    })
  }

  // Organization endpoints
  async createOrganization(data: { name: string }): Promise<{ message: string; organization_id: string }> {
    return this.request<{ message: string; organization_id: string }>("/organizations", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async joinOrganization(organizationId: string): Promise<{ message: string; organization_id: string }> {
    return this.request<{ message: string; organization_id: string }>("/organizations/join", {
      method: "POST",
      body: JSON.stringify({ organization_id: organizationId }),
    })
  }

  // Task endpoints
  async getProjectTasks(projectId: string): Promise<Task[]> {
    return this.request<Task[]>(`/api/v1/projects/${projectId}/tasks`)
  }

  async createTask(
    projectId: string,
    data: { title: string; description?: string; creator_id: string },
  ): Promise<Task> {
    return this.request<Task>(`/api/v1/projects/${projectId}/tasks`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getTask(taskId: string): Promise<Task> {
    return this.request<Task>(`/api/v1/tasks/${taskId}`)
  }

  async updateTask(taskId: string, data: { title?: string; description?: string; status?: string }): Promise<Task> {
    return this.request<Task>(`/api/v1/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteTask(taskId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/tasks/${taskId}`, {
      method: "DELETE",
    })
  }

  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    return this.request<Task>(`/api/v1/tasks/${taskId}/assign`, {
      method: "POST",
      body: JSON.stringify({ assignee_id: assigneeId }),
    })
  }

  // Comment endpoints
  async getTaskComments(taskId: string): Promise<Comment[]> {
    return this.request<Comment[]>(`/api/v1/tasks/${taskId}/comments`)
  }

  async addComment(taskId: string, data: { author_id: string; content: string }): Promise<Comment> {
    return this.request<Comment>(`/api/v1/tasks/${taskId}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateComment(commentId: string, data: { content: string }): Promise<Comment> {
    return this.request<Comment>(`/api/v1/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteComment(commentId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/v1/comments/${commentId}`, {
      method: "DELETE",
    })
  }
}

export const apiClient = new ApiClient()
