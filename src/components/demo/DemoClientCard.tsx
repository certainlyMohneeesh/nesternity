'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  User,
  ExternalLink,
  Plus
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  address?: string;
  industry?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PROSPECT';
  totalProjects: number;
  totalRevenue: number;
  lastContact: string;
  createdAt: string;
}

interface DemoClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onViewProjects?: (client: Client) => void;
}

export function DemoClientCard({ client, onEdit, onViewProjects }: DemoClientCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-700 border-green-200';
      case 'INACTIVE': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'PROSPECT': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                {client.company.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg font-semibold">{client.company}</CardTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                {client.name}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(client.status)}>
            {client.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact Information */}
        <div className="grid grid-cols-1 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{client.email}</span>
          </div>
          {client.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{client.address}</span>
            </div>
          )}
          {client.industry && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4" />
              <span>{client.industry}</span>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{client.totalProjects}</div>
            <div className="text-xs text-muted-foreground">Projects</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(client.totalRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">Revenue</div>
          </div>
        </div>

        {/* Last Contact */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>Last contact: {new Date(client.lastContact).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewProjects?.(client)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Projects
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onEdit?.(client)}
          >
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface ClientListProps {
  clients: Client[];
  onAddClient?: () => void;
  onEditClient?: (client: Client) => void;
  onViewProjects?: (client: Client) => void;
}

export function ClientList({ clients, onAddClient, onEditClient, onViewProjects }: ClientListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Client Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage your client relationships and track project progress
          </p>
        </div>
        <Button onClick={onAddClient} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <DemoClientCard
            key={client.id}
            client={client}
            onEdit={onEditClient}
            onViewProjects={onViewProjects}
          />
        ))}
      </div>

      {/* Empty State */}
      {clients.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No clients yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by adding your first client to manage projects and track revenue
          </p>
          <Button onClick={onAddClient} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Your First Client
          </Button>
        </div>
      )}
    </div>
  );
}
