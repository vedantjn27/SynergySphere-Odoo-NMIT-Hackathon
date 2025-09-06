"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task } from "@/lib/api"
import { MoreHorizontal, MessageSquare, User, Calendar, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TaskCardProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onAssign: (taskId: string) => void
  onViewDetails: (task: Task) => void
  isDragging?: boolean
}

export function TaskCard({ task, onEdit, onDelete, onAssign, onViewDetails, isDragging }: TaskCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary text-primary-foreground"
      case "in-progress":
        return "bg-accent text-accent-foreground"
      case "pending":
        return "bg-secondary text-secondary-foreground"
      case "cancelled":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow border-border/50",
        isDragging && "opacity-50 rotate-2 shadow-lg",
      )}
      onClick={() => onViewDetails(task)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <h4 className="font-medium text-sm line-clamp-2 text-balance">{task.title}</h4>
            <Badge className={getStatusColor(task.status)} variant="secondary">
              {task.status.replace("-", " ")}
            </Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task)
                }}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onAssign(task.id)
                }}
              >
                <User className="mr-2 h-4 w-4" />
                Assign
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(task.id)
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {task.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{task.description}</p>}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(task.created_at).toLocaleDateString()}
          </div>

          <div className="flex items-center gap-2">
            {task.assignee_id && (
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {task.assignee_id.slice(-2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>0</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
