'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  Calendar,
  User,
  Folder,
  Trello,
  Edit,
  Trash2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Issue {
  id: string
  title: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  createdAt: string
  updatedAt: string
  assignee?: {
    id: string
    email: string
    displayName?: string
    avatarUrl?: string
  }
  creator: {
    id: string
    email: string
    displayName?: string
    avatarUrl?: string
  }
  project?: {
    id: string
    name: string
  }
  board?: {
    id: string
    name: string
  }
  _count?: {
    comments: number
  }
}

interface IssueCardProps {
  issue: Issue
  onStatusChange: (issueId: string, status: string) => void
  onEdit?: (issue: Issue) => void
  onDelete?: (issueId: string) => void
}

const STATUS_CONFIG = {
  OPEN: {
    icon: AlertCircle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    label: 'Open'
  },
  IN_PROGRESS: {
    icon: Clock,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    label: 'In Progress'
  },
  RESOLVED: {
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    label: 'Resolved'
  },
  CLOSED: {
    icon: XCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-950',
    borderColor: 'border-gray-200 dark:border-gray-800',
    label: 'Closed'
  }
}

const PRIORITY_CONFIG = {
  LOW: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', label: 'Low' },
  MEDIUM: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', label: 'Medium' },
  HIGH: { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300', label: 'High' },
  CRITICAL: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', label: 'Critical' }
}

export function IssueCard({ issue, onStatusChange, onEdit, onDelete }: IssueCardProps) {
  const statusConfig = STATUS_CONFIG[issue.status]
  const priorityConfig = PRIORITY_CONFIG[issue.priority]
  const StatusIcon = statusConfig.icon

  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase()
    return email?.split('@')[0].slice(0, 2).toUpperCase() || 'U'
  }

  return (
    <Card className={`group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${statusConfig.bgColor} ${statusConfig.borderColor} border-l-4`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <StatusIcon className={`w-4 h-4 ${statusConfig.color} flex-shrink-0`} />
            <h3 className="font-medium text-sm line-clamp-2 text-foreground">
              {issue.title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className={`${priorityConfig.color} text-xs font-medium`}>
              {priorityConfig.label}
            </Badge>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0" 
                  onClick={() => onEdit(issue)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700" 
                  onClick={() => onDelete(issue.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-4">
        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {issue.description}
        </p>

        {/* Status Selector */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={issue.status} onValueChange={(value) => onStatusChange(issue.id, value)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <SelectItem key={status} value={status} className="text-xs">
                  <div className="flex items-center gap-2">
                    <config.icon className={`w-3 h-3 ${config.color}`} />
                    {config.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Meta Information */}
        <div className="space-y-2">
          {issue.project && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Folder className="w-3 h-3" />
              <span>Project: {issue.project.name}</span>
            </div>
          )}
          
          {issue.board && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trello className="w-3 h-3" />
              <span>Board: {issue.board.name}</span>
            </div>
          )}
        </div>

        {/* Assignee & Creator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={issue.assignee?.avatarUrl} />
              <AvatarFallback className="text-xs">
                {getInitials(issue.assignee?.displayName, issue.assignee?.email)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {issue.assignee?.displayName || issue.assignee?.email || 'Unassigned'}
            </span>
          </div>
          
          {issue._count && issue._count.comments > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span>{issue._count.comments}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{issue.creator.displayName || issue.creator.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
