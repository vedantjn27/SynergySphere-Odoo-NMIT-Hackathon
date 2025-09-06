"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Zap, Target, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push("/dashboard")
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-primary font-[family-name:var(--font-space-grotesk)]">
              SynergySphere
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="text-foreground">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground font-[family-name:var(--font-space-grotesk)] text-balance">
            Advanced Team
            <span className="text-primary"> Collaboration</span>
            <br />
            Platform
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty font-[family-name:var(--font-dm-sans)]">
            Streamline your team's workflow with powerful project management, real-time collaboration, and intelligent
            task tracking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-border bg-transparent">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4 font-[family-name:var(--font-space-grotesk)]">
            Everything your team needs
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help teams collaborate more effectively
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Team Collaboration</CardTitle>
              <CardDescription>
                Work together seamlessly with real-time updates, comments, and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Real-time messaging
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  File sharing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Team notifications
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-accent" />
              </div>
              <CardTitle className="text-xl">Project Management</CardTitle>
              <CardDescription>
                Organize tasks, set deadlines, and track progress with powerful project tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Kanban boards
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Task assignments
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Progress tracking
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/50 hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-xl">Real-time Updates</CardTitle>
              <CardDescription>
                Stay informed with instant notifications and live collaboration features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Live updates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Push notifications
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  Activity feeds
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-border/50">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4 font-[family-name:var(--font-space-grotesk)]">
              Ready to transform your team's collaboration?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of teams already using SynergySphere to work more efficiently
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
