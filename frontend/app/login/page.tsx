"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, Zap, Target } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await login(credentials)
    } catch (error) {
      // Error handling is done in the useAuth hook
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-primary font-[family-name:var(--font-space-grotesk)]">
              SynergySphere
            </h1>
            <p className="text-xl text-muted-foreground font-[family-name:var(--font-dm-sans)]">
              Advanced Team Collaboration Platform
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Work together seamlessly with real-time updates and communication
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Project Management</h3>
                <p className="text-sm text-muted-foreground">
                  Organize tasks, track progress, and meet deadlines efficiently
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Stay informed with instant notifications and live collaboration
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-2 text-center">
              <CardTitle className="text-2xl font-bold text-foreground">Welcome back</CardTitle>
              <CardDescription className="text-muted-foreground">Sign in to your SynergySphere account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username or Email
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username or email"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    required
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    required
                    className="bg-input border-border"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-primary hover:text-primary/80 font-medium">
                    Sign up
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
