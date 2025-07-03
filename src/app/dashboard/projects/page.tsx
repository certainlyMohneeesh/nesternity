'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderOpen, Calendar, Users, Plus, ArrowRight } from 'lucide-react'
import { getSafeUser } from '@/lib/safe-auth'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  description?: string
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  teamId: string
  team?: {
    id: string
    name: string
  }
  client?: {
    id: string
    name: string
    company?: string
  }
  _count: {
    boards: number
  }
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      // This would need to be implemented as a general projects endpoint
      // For now, we'll show a message directing users to teams
      setProjects([])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'bg-yellow-100 text-yellow-800'
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'ON_HOLD': return 'bg-orange-100 text-orange-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <div>Loading projects...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Projects</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderOpen className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Projects are managed by teams</h3>
          <p className="text-gray-600 mb-4 text-center max-w-md">
            Projects in Nesternity are organized within teams. Create or join a team to start managing projects, clients, and boards.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard/teams">
                <Users className="w-4 h-4 mr-2" />
                View Teams
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/teams">
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick access to team projects */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
        <p className="text-gray-600 mb-4">
          Access projects directly through your teams:
        </p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Team Projects</h3>
                  <p className="text-sm text-gray-600">Manage projects within your teams</p>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/teams">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
