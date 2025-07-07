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
import { IssueCard } from '@/components/issues/IssueCard'

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
    name: string
  }
}

interface Project {
  id: string
  name: string
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

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
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
    boardId: '',
    assignedTo: ''
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

  // Fetch team members for assignment
  const fetchTeamMembers = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/teams', { headers });
      if (response.ok) {
        const data = await response.json();
        // Flatten all members from all teams, deduplicate by user id
        const members = (data.teams || []).flatMap((team: any) => team.members.map((m: any) => m.user));
        const uniqueMembers = Array.from(new Map(members.map((m: any) => [m.id, m])).values());
        setTeamMembers(uniqueMembers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  // Optimistic update for status change
  const handleStatusChange = async (issueId: string, newStatus: string) => {
    setIssues((prev) => prev.map(issue => issue.id === issueId ? { ...issue, status: newStatus as Issue['status'] } : issue));
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/issues/${issueId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) {
        // Rollback if failed
        fetchIssues();
        const error = await response.json().catch(() => ({}));
        toast.error(error.error || 'Failed to update issue status');
      }
    } catch (error) {
      fetchIssues();
      console.error('Error updating issue:', error);
      toast.error('Failed to update issue status');
    }
  };

  // Optimistic update for issue creation
  const handleCreateIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempId = `temp-${Date.now()}`;
    const optimisticIssue: Issue = {
      id: tempId,
      title: formData.title,
      description: formData.description,
      status: 'OPEN',
      priority: formData.priority as Issue['priority'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignee: teamMembers.find(m => m.id === formData.assignedTo) || undefined,
      creator: { id: '', email: '' },
      project: projects.find(p => p.id === formData.projectId) || undefined,
      board: boards.find(b => b.id === formData.boardId) || undefined,
    };
    setIssues(prev => [optimisticIssue, ...prev]);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...formData,
          projectId: formData.projectId === 'none' ? null : formData.projectId || null,
          boardId: formData.boardId === 'none' ? null : formData.boardId || null,
          assignedTo: formData.assignedTo || null
        })
      });
      if (response.ok) {
        toast.success('Issue created successfully');
        setShowForm(false);
        setFormData({ title: '', description: '', priority: 'MEDIUM', projectId: '', boardId: '', assignedTo: '' });
        fetchIssues();
      } else {
        setIssues(prev => prev.filter(issue => issue.id !== tempId));
        const error = await response.json();
        toast.error(error.error || 'Failed to create issue');
      }
    } catch (error) {
      setIssues(prev => prev.filter(issue => issue.id !== tempId));
      console.error('Error creating issue:', error);
      toast.error('Failed to create issue');
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
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading issues...</p>
        </div>
      </div>
    )
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
            <form onSubmit={handleCreateIssue} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="assignee">Assignee (Optional)</Label>
                  <Select value={formData.assignedTo || 'none'} onValueChange={(value) => setFormData({ ...formData, assignedTo: value === 'none' ? '' : value })}>
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.displayName || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project">Project (Optional)</Label>
                  <Select value={formData.projectId || 'none'} onValueChange={(value) => setFormData({ ...formData, projectId: value === 'none' ? '' : value })}>
                    <SelectTrigger className="mt-1 w-full">
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
                    <SelectTrigger className="mt-1 w-full">
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No board</SelectItem>
                      {boards.map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.name}
                          {board.project && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({board.project.name}{board.project.client && ` - ${board.project.client.name}`})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
