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
  project?: {
    id: string
    name: string
    client?: {
      id: string
      name: string
    }
  }
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
      
      // Convert special values to null/undefined
      const processedData = {
        ...data,
        assignedTo: data.assignedTo === 'unassigned' ? undefined : data.assignedTo,
        projectId: data.projectId === 'none' ? undefined : data.projectId,
        boardId: data.boardId === 'none' ? undefined : data.boardId,
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...processedData,
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
    <Card className="w-full max-w-4xl mx-auto shadow-lg border-0">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {issue ? 'Edit Issue' : 'Create New Issue'}
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {issue ? 'Update the issue details below' : 'Fill in the details to create a new issue'}
        </p>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Title and Description */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Issue Title *
              </Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Brief, descriptive title for the issue"
                className="text-base p-4 border-2 focus:border-blue-500 transition-colors"
              />
              {errors.title && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-xs">!</span>
                  {errors.title.message}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Description *
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Provide detailed information about the issue, including steps to reproduce, expected behavior, and any relevant context"
                rows={6}
                className="text-base p-4 border-2 focus:border-blue-500 transition-colors resize-none"
              />
              {errors.description && (
                <p className="text-sm text-red-500 flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center text-xs">!</span>
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Priority and Assignment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="priority" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Priority Level
              </Label>
              <Select onValueChange={(value) => setValue('priority', value as any)} defaultValue={selectedPriority}>
                <SelectTrigger className="p-4 border-2 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Select priority level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span>Low Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="MEDIUM">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Medium Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="HIGH">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span>High Priority</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="CRITICAL">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span>Critical Priority</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {selectedPriority && (
                <div className="mt-2">
                  <Badge className={`${PRIORITY_COLORS[selectedPriority]} px-3 py-1`}>
                    {selectedPriority} PRIORITY
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label htmlFor="assignedTo" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Assign to Team Member
              </Label>
              <Select onValueChange={(value) => setValue('assignedTo', value === 'unassigned' ? '' : value)}>
                <SelectTrigger className="p-4 border-2 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-xs">?</span>
                      </div>
                      <span>Unassigned</span>
                    </div>
                  </SelectItem>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {user.displayName?.[0] || user.email[0]}
                          </span>
                        </div>
                        <span>{user.displayName || user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project and Board */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="projectId" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Associated Project
              </Label>
              <Select onValueChange={(value) => setValue('projectId', value === 'none' ? '' : value)}>
                <SelectTrigger className="p-4 border-2 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                      <span>No project</span>
                    </div>
                  </SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-blue-500"></div>
                        <div className="flex flex-col">
                          <span>{project.name}</span>
                          {project.client && (
                            <span className="text-xs text-gray-500">Client: {project.client.name}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label htmlFor="boardId" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Associated Board
              </Label>
              <Select onValueChange={(value) => setValue('boardId', value === 'none' ? '' : value)}>
                <SelectTrigger className="p-4 border-2 focus:border-blue-500 transition-colors">
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700"></div>
                      <span>No board</span>
                    </div>
                  </SelectItem>
                  {boards?.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-purple-500"></div>
                        <div className="flex flex-col">
                          <span>{board.name}</span>
                          {board.project && (
                            <span className="text-xs text-gray-500">
                              Project: {board.project.name}
                              {board.project.client && ` - ${board.project.client.name}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Issue Tags</Label>
            <p className="text-sm text-gray-500">Select relevant tags to categorize this issue</p>
            <div className="flex flex-wrap gap-3">
              {ISSUE_TAGS.map((tag) => (
                <Badge
                  key={tag.value}
                  variant={selectedTags.includes(tag.value) ? 'default' : 'outline'}
                  className={`cursor-pointer px-4 py-2 text-sm font-medium transition-all hover:scale-105 ${
                    selectedTags.includes(tag.value) ? tag.color : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => toggleTag(tag.value)}
                >
                  {tag.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                issue ? 'Update Issue' : 'Create Issue'
              )}
            </Button>
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                className="px-8 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
