"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { getSessionToken } from '@/lib/supabase/client-session';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  organisationId: string;
  initialData?: any;
  mode?: 'create' | 'edit';
}

export function ProjectModal({
  open,
  onClose,
  onSuccess,
  organisationId,
  initialData,
  mode = 'create'
}: ProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    status: initialData?.status || 'PLANNING',
    startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
    endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : ''
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[ProjectModal] Getting session token...');
      const token = await getSessionToken();
      
      if (!token) {
        console.error('[ProjectModal] No session token available');
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      console.log('[ProjectModal] Token obtained, making request...');
      
      const url = mode === 'edit' && initialData?.id 
        ? `/api/organisations/${organisationId}/projects/${initialData.id}` 
        : `/api/organisations/${organisationId}/projects`;
      
      const method = mode === 'edit' ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null
        }),
      });

      console.log('[ProjectModal] Response status:', response.status);

      const data = await response.json();

      if (!response.ok) {
        console.error('[ProjectModal] Error response:', data);
        if (data.code === 'LIMIT_REACHED') {
          setError(`${data.error} (${data.current}/${data.limit})`);
        } else {
          setError(data.error || 'Failed to save project');
        }
        setLoading(false);
        return;
      }

      console.log('[ProjectModal] ✅ Project saved successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('[ProjectModal] Project save error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? 'Update the details of your project.'
              : 'Create a new project to organize your work and team.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <Label htmlFor="name">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Website Redesign"
              required
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the project goals and objectives..."
              rows={4}
              disabled={loading}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => handleChange('status', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue />
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

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Deadline (End Date)</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                disabled={loading}
                min={formData.startDate || undefined}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'edit' ? 'Update' : 'Create'} Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
