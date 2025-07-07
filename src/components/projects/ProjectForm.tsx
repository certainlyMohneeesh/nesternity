'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Client {
  id: string;
  name: string;
  company?: string;
}

interface Team {
  id: string;
  name: string;
}

interface Project {
  id?: string;
  name: string;
  description?: string;
  clientId?: string;
  teamId: string;
  startDate?: string;
  endDate?: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  goal?: number;
}

interface ProjectFormProps {
  project?: {
    name: string;
    description?: string;
    clientId?: string;
    teamId: string;
    startDate?: string;
    endDate?: string;
    status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    goal?: number;
  };
  onSubmit: (project: {
    name: string;
    description?: string;
    clientId?: string;
    teamId: string;
    startDate?: string;
    endDate?: string;
    status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    goal?: number;
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const [formData, setFormData] = useState<{
    name: string;
    description?: string;
    clientId?: string;
    teamId: string;
    startDate?: string;
    endDate?: string;
    status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
    goal?: number;
  }>({
    name: project?.name || '',
    description: project?.description || '',
    clientId: project?.clientId || '',
    teamId: project?.teamId || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    status: project?.status || 'PLANNING',
    goal: project?.goal || undefined,
  });

  const [clients, setClients] = useState<Client[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    fetchClients();
    fetchTeams();
  }, []);

  const fetchClients = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/clients', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const clientsData = await response.json();
        setClients(clientsData);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const teamsData = await response.json();
        console.log('Teams data received:', teamsData); // Debug log
        setTeams(Array.isArray(teamsData) ? teamsData : teamsData.teams || []);
      } else {
        console.error('Failed to fetch teams:', response.status);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: keyof typeof formData, value: string | number | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Enter project name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Enter project description"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="team">Team</Label>
        <Select
          value={formData.teamId}
          onValueChange={(value) => handleChange('teamId', value)}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingTeams ? "Loading teams..." : "Select a team"} />
          </SelectTrigger>
          <SelectContent>
            {Array.isArray(teams) && teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="client">Client (Optional)</Label>
        <Select
          value={formData.clientId || 'none'}
          onValueChange={(value) => handleChange('clientId', value === 'none' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingClients ? "Loading clients..." : "Select a client (optional)"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No client</SelectItem>
            {Array.isArray(clients) && clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.company && `(${client.company})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => handleChange('status', value as Project['status'])}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PLANNING">Planning</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="goal">Goal (Number of Tasks)</Label>
        <Input
          id="goal"
          type="number"
          min={1}
          value={formData.goal ?? ''}
          onChange={e => handleChange('goal', e.target.value ? Number(e.target.value) : undefined)}
          placeholder="Enter the number of tasks for this project"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
