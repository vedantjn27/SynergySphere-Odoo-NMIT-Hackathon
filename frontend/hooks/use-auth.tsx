"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { apiClient, type User, type LoginCredentials, type RegisterData } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("access_token")
      if (!token) {
        setLoading(false)
        return
      }

      const userData = await apiClient.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Auth check failed:", error)
      localStorage.removeItem("access_token")
      localStorage.removeItem("refresh_token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true)
      const response = await apiClient.login(credentials)

      localStorage.setItem("access_token", response.access_token)
      localStorage.setItem("refresh_token", response.refresh_token)

      const userData = await apiClient.getCurrentUser()
      setUser(userData)

      toast({
        title: "Welcome back!",
        description: `Logged in as ${userData.username}`,
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Invalid credentials",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setLoading(true)
      const response = await apiClient.register(data)

      localStorage.setItem("access_token", response.access_token)
      localStorage.setItem("refresh_token", response.refresh_token)

      const userData = await apiClient.getCurrentUser()
      setUser(userData)

      toast({
        title: "Account created!",
        description: `Welcome to SynergySphere, ${userData.username}!`,
      })

      router.push("/dashboard")
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    setUser(null)
    router.push("/login")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
