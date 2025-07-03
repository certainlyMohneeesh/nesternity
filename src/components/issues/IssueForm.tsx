'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const issueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  projectId: z.string().optional(),
  boardId: z.string().optional(),
  taskId: z.string().optional(),
  assignedTo: z.string().optional(),
})

type IssueFormData = z.infer<typeof issueSchema>

interface Project {
  id: string
  name: string
  client?: {
    id: string
    name: string
  }
}

interface Board {
  id: string
  name: string
}

interface User {
  id: string
  displayName: string
  email: string
}

interface IssueFormProps {
  projects?: Project[]
  boards?: Board[]
  users?: User[]
  issue?: IssueFormData & { id: string }
  onSuccess?: () => void
  onCancel?: () => void
}

const PRIORITY_COLORS = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
}

const ISSUE_TAGS = [
  { value: 'bug', label: 'Bug', color: 'bg-red-100 text-red-800' },
  { value: 'feature', label: 'Feature', color: 'bg-blue-100 text-blue-800' },
  { value: 'enhancement', label: 'Enhancement', color: 'bg-purple-100 text-purple-800' },
  { value: 'question', label: 'Question', color: 'bg-gray-100 text-gray-800' },
]

export function IssueForm({ projects, boards, users, issue, onSuccess, onCancel }: IssueFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<IssueFormData>({
    resolver: zodResolver(issueSchema),
    defaultValues: issue || {
      title: '',
      description: '',
      priority: 'MEDIUM',
      projectId: '',
      boardId: '',
      taskId: '',
      assignedTo: '',
    },
  })

  const selectedPriority = watch('priority')

  const onSubmit = async (data: IssueFormData) => {
    setIsLoading(true)
    try {
      const url = issue ? `/api/issues/${issue.id}` : '/api/issues'
      const method = issue ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          tags: selectedTags,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save issue')
      }

      toast.success(issue ? 'Issue updated successfully' : 'Issue created successfully')
      reset()
      setSelectedTags([])
      onSuccess?.()
    } catch (error) {
      console.error('Error saving issue:', error)
      toast.error('Failed to save issue')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{issue ? 'Edit Issue' : 'Create New Issue'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Brief description of the issue"
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Detailed description of the issue"
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select onValueChange={(value) => setValue('priority', value as any)} defaultValue={selectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
              {selectedPriority && (
                <Badge className={PRIORITY_COLORS[selectedPriority]}>
                  {selectedPriority}
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assign to</Label>
              <Select onValueChange={(value) => setValue('assignedTo', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.displayName || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select onValueChange={(value) => setValue('projectId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No project</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                      {project.client && ` (${project.client.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boardId">Board</Label>
              <Select onValueChange={(value) => setValue('boardId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No board</SelectItem>
                  {boards?.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {ISSUE_TAGS.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                  className={`cursor-pointer ${selectedTags.includes(tag.value) ? tag.color : ''}`}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : issue ? 'Update Issue' : 'Create Issue'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
