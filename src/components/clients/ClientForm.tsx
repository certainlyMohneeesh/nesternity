'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { FolderOpen, Plus, X } from 'lucide-react'

const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  projectIds: z.array(z.string()).optional(),
})

type ClientFormData = z.infer<typeof clientSchema>

interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
}

interface ClientFormProps {
  client?: ClientFormData & { id: string; projects?: Project[] }
  teamId?: string  // Make teamId optional
  onSuccess?: () => void
  onCancel?: () => void
}

export function ClientForm({ client, teamId, onSuccess, onCancel }: ClientFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    client?.projects?.map(p => p.id) || []
  )
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client || {
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      notes: '',
      projectIds: [],
    },
  })

  // Fetch available projects for this team (only if teamId is provided)
  useEffect(() => {
    if (!teamId) return; // Skip if no teamId (general clients)
    
    const fetchProjects = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) return

        const response = await fetch(`/api/teams/${teamId}/projects`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          setProjects(data)
        }
      } catch (error) {
        console.error('Error fetching projects:', error)
      }
    }

    fetchProjects()
  }, [teamId])

  // Update form when selectedProjectIds changes
  useEffect(() => {
    setValue('projectIds', selectedProjectIds)
  }, [selectedProjectIds, setValue])

  const onSubmit = async (data: ClientFormData) => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !session.access_token) {
        throw new Error('No authentication session found')
      }

      // Include selected project IDs in the data (only if teamId is provided)
      const submitData = {
        ...data,
        ...(teamId && { projectIds: selectedProjectIds }),
      }

      // Use different API endpoints based on whether teamId is provided
      const url = teamId 
        ? client 
          ? `/api/teams/${teamId}/clients/${client.id}` 
          : `/api/teams/${teamId}/clients`
        : client
          ? `/api/clients/${client.id}`
          : '/api/clients'
      
      const method = client ? 'PUT' : 'POST'
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`, // Always send auth header
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save client')
      }

      toast.success(client ? 'Client updated successfully' : 'Client created successfully')
      reset()
      setSelectedProjectIds([])
      onSuccess?.()
    } catch (error) {
      console.error('Error saving client:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save client')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{client ? 'Edit Client' : 'Add New Client'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Client name"
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="client@example.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                {...register('company')}
                placeholder="Company name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              {...register('address')}
              placeholder="Client address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes about the client"
              rows={3}
            />
          </div>

          {/* Projects Section - Only show for team-specific clients */}
          {teamId && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <Label className="text-base font-medium">Link to Projects</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Select existing projects to associate with this client, or leave empty to create projects later.
              </p>
            
            {projects.length > 0 ? (
              <div className="space-y-3">
                <div className="grid gap-3 max-h-48 overflow-y-auto border rounded-md p-3">
                  {projects.map((project) => {
                    const isSelected = selectedProjectIds.includes(project.id)
                    const statusColors = {
                      PLANNING: 'bg-yellow-100 text-yellow-800',
                      ACTIVE: 'bg-green-100 text-green-800',
                      ON_HOLD: 'bg-orange-100 text-orange-800',
                      COMPLETED: 'bg-blue-100 text-blue-800',
                      CANCELLED: 'bg-red-100 text-red-800',
                    }
                    
                    return (
                      <div
                        key={project.id}
                        className={`flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                        }`}
                        onClick={() => {
                          setSelectedProjectIds(prev =>
                            isSelected
                              ? prev.filter(id => id !== project.id)
                              : [...prev, project.id]
                          )
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => {}} // Handled by parent div onClick
                          />
                          <div>
                            <div className="font-medium">{project.name}</div>
                            {project.description && (
                              <div className="text-sm text-muted-foreground">
                                {project.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={statusColors[project.status]}>
                          {project.status}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
                
                {selectedProjectIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium">Selected:</span>
                    {selectedProjectIds.map((projectId) => {
                      const project = projects.find(p => p.id === projectId)
                      return project ? (
                        <Badge key={projectId} variant="secondary" className="gap-1">
                          {project.name}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedProjectIds(prev => prev.filter(id => id !== projectId))
                            }}
                          />
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No projects available in this team</p>
                <p className="text-sm">Create projects first to link them to clients</p>
              </div>
            )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
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
