'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Plus, AlertCircle, Clock, CheckCircle, XCircle, Filter, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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
  }
  creator: {
    id: string
    email: string
  }
  project?: {
    id: string
    name: string
  }
  board?: {
    id: string
    title: string
  }
}

interface Project {
  id: string
  name: string
}

interface Board {
  id: string
  title: string
}

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    projectId: '',
    boardId: ''
  })

  // Helper function to get auth headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('Not authenticated')
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }

  useEffect(() => {
    fetchIssues()
    fetchProjects()
    fetchBoards()
  }, [])

  const fetchIssues = async () => {
    try {
      const headers = await getAuthHeaders()
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`/api/issues?${params}`, { headers })
      if (response.ok) {
        const data = await response.json()
        setIssues(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.error || 'Failed to fetch issues')
      }
    } catch (error) {
      console.error('Error fetching issues:', error)
      toast.error('Failed to fetch issues')
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/projects', { headers })
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      } else {
        console.error('Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchBoards = async () => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/boards/with-clients', { headers })
      if (response.ok) {
        const data = await response.json()
        setBoards(data)
      } else {
        console.error('Failed to fetch boards')
      }
    } catch (error) {
      console.error('Error fetching boards:', error)
    }
  }

  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          projectId: formData.projectId === 'none' ? null : formData.projectId || null,
          boardId: formData.boardId === 'none' ? null : formData.boardId || null
        })
      })

      if (response.ok) {
        toast.success('Issue created successfully')
        setShowForm(false)
        setFormData({ title: '', description: '', priority: 'MEDIUM', projectId: '', boardId: '' })
        fetchIssues()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create issue')
      }
    } catch (error) {
      console.error('Error creating issue:', error)
      toast.error('Failed to create issue')
    }
  }

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success('Issue status updated')
        fetchIssues()
      } else {
        toast.error('Failed to update issue status')
      }
    } catch (error) {
      console.error('Error updating issue:', error)
      toast.error('Failed to update issue status')
    }
  }

  const getStatusIcon = (status: Issue['status']) => {
    switch (status) {
      case 'OPEN':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'RESOLVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'CLOSED':
        return <XCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusVariant = (status: Issue['status']) => {
    switch (status) {
      case 'OPEN':
        return 'default'
      case 'IN_PROGRESS':
        return 'secondary'
      case 'RESOLVED':
        return 'outline'
      case 'CLOSED':
        return 'secondary'
    }
  }

  const getPriorityColor = (priority: Issue['priority']) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
    }
  }

  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || issue.priority === priorityFilter
    const matchesSearch = searchQuery === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesStatus && matchesPriority && matchesSearch
  })

  // Apply filters when they change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchIssues()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [statusFilter, priorityFilter, searchQuery])

  if (loading) {
    return <div className="p-6">Loading issues...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Issues</h1>
          <p className="text-gray-600">Track and manage project issues</p>
        </div>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Issue</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateIssue} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select value={formData.projectId || 'none'} onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No project</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="board">Board (Optional)</Label>
                  <Select value={formData.boardId || 'none'} onValueChange={(value) => setFormData({ ...formData, boardId: value === 'none' ? '' : value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No board</SelectItem>
                      {boards.map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Issue</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No issues found</h3>
            <p className="text-gray-600 mb-4">Start by creating your first issue</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Issue
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredIssues.map((issue) => (
            <Card key={issue.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(issue.status)}
                        <h3 className="text-lg font-semibold">{issue.title}</h3>
                      </div>
                      <Badge className={getPriorityColor(issue.priority)} variant="secondary">
                        {issue.priority}
                      </Badge>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{issue.description}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      <span>Created by {issue.creator.email}</span>
                      {issue.project && (
                        <span>• Project: {issue.project.name}</span>
                      )}
                      {issue.board && (
                        <span>• Board: {issue.board.title}</span>
                      )}
                      <span>• {new Date(issue.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Select
                      value={issue.status}
                      onValueChange={(value) => handleStatusChange(issue.id, value)}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPEN">Open</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                        <SelectItem value="CLOSED">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Badge variant={getStatusVariant(issue.status)}>
                      {issue.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
