"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OrganisationModal } from "./organisation-modal";
import { Building2, Plus, Loader2, Mail, Phone, Globe, MapPin, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient as createBrowserClient, getSessionToken } from '@/lib/supabase/client-session';

interface Organisation {
  id: string;
  name: string;
  email: string;
  phone?: string;
  budget?: number;
  currency?: string;
  status: 'PROSPECT' | 'ACTIVE' | 'INACTIVE';
  type: 'OWNER' | 'CLIENT';
  website?: string;
  city?: string;
  state?: string;
  _count: {
    projects: number;
  };
}

export function OrganisationList() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'OWNER' | 'CLIENT'>('OWNER');
  const [canCreateMore, setCanCreateMore] = useState(true);
  const [limits, setLimits] = useState({ current: 0, limit: 0 });

  const fetchOrganisations = async () => {
    console.log('[OrganisationList] ========== FETCH START ==========');
    console.log('[OrganisationList] Timestamp:', new Date().toISOString());
    
    try {
      setLoading(true);
      
      // Get session token for authorization using proper browser client
      console.log('[OrganisationList] Step 1: Getting session token...');
      const token = await getSessionToken();
      
      console.log('[OrganisationList] Token check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? token.substring(0, 30) + '...' : 'null'
      });
      
      if (!token) {
        console.log('[OrganisationList] ❌ No session token, redirecting to login...');
        router.push('/auth/login');
        return;
      }

      console.log('[OrganisationList] Step 2: Fetching organisations from API...');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('[OrganisationList] Headers prepared, making request...');
      
      const response = await fetch('/api/organisations', {
        method: 'GET',
        headers: headers,
        credentials: 'include'
      });
      
      console.log('[OrganisationList] Response status:', response.status);
      console.log('[OrganisationList] Response ok:', response.ok);
      
      if (!response.ok) {
        const error = await response.json();
        console.log('[OrganisationList] ❌ API Error:', error);
        
        if (response.status === 401) {
          console.log('[OrganisationList] 401 Unauthorized - redirecting to login');
          router.push('/auth/login');
          return;
        }
        
        throw new Error(error.error || 'Failed to fetch organisations');
      }

      const data = await response.json();
      console.log('[OrganisationList] ✅ Fetched organisations:', {
        count: data.organisations?.length || 0,
        hasOrganisations: !!data.organisations
      });
      
      setOrganisations(data.organisations || []);
      setCanCreateMore(data.meta?.canCreateMore ?? true);
      setLimits({
        current: data.meta?.currentCount ?? 0,
        limit: data.meta?.limit ?? 0
      });
      
      console.log('[OrganisationList] ========== FETCH COMPLETE ==========');
    } catch (error) {
      console.error('[OrganisationList] ❌ Error fetching organisations:', error);
      console.error('[OrganisationList] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log('[OrganisationList] ========== FETCH FAILED ==========');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisations();
  }, []);

  const ownOrganisations = organisations.filter(org => org.type === 'OWNER');
  const clientOrganisations = organisations.filter(org => org.type === 'CLIENT');

  const handleCreateClick = (type: 'OWNER' | 'CLIENT') => {
    if (!canCreateMore) {
      alert(`You have reached the maximum number of organisations (${limits.limit}). Please upgrade your plan.`);
      return;
    }
    setModalType(type);
    setShowModal(true);
  };

  const handleSuccess = () => {
    fetchOrganisations();
  };

  const handleOrganisationClick = (org: Organisation) => {
    router.push(`/dashboard/organisation/${org.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'PROSPECT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount?: number, currency?: string) => {
    if (!amount) return null;
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₹';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const OrganisationCard = ({ org }: { org: Organisation }) => (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-indigo-200"
      onClick={() => handleOrganisationClick(org)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">{org.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" />
                {org.email}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={getStatusColor(org.status)}>
            {org.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          {org.phone && (
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{org.phone}</span>
            </div>
          )}
          
          {org.website && (
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <a 
                href={org.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {org.website}
              </a>
            </div>
          )}
          
          {(org.city || org.state) && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{[org.city, org.state].filter(Boolean).join(', ')}</span>
            </div>
          )}
          
          {org.budget && (
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium text-gray-900">
                Budget: {formatCurrency(org.budget, org.currency)}
              </span>
            </div>
          )}

          <div className="pt-3 mt-3 border-t flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {org._count.projects} {org._count.projects === 1 ? 'Project' : 'Projects'}
            </span>
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleOrganisationClick(org);
              }}
            >
              View Details →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ type }: { type: 'own' | 'client' }) => (
    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 rounded-lg">
      <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {type === 'own' ? 'No Organisation Yet' : 'No Client Organisations'}
      </h3>
      <p className="text-gray-600 mb-4 max-w-md mx-auto">
        {type === 'own' 
          ? 'Create your organisation to start managing projects and teams.'
          : 'Add client organisations to manage client projects separately.'}
      </p>
      <Button onClick={() => handleCreateClick(type === 'own' ? 'OWNER' : 'CLIENT')}>
        <Plus className="w-4 h-4 mr-2" />
        Create {type === 'own' ? 'Your Organisation' : 'Client Organisation'}
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Organisations</h1>
          <p className="text-gray-600 mt-1">
            Manage your organisations and client projects
          </p>
          {!canCreateMore && (
            <p className="text-sm text-amber-600 mt-2">
              ⚠️ You've reached your organisation limit ({limits.current}/{limits.limit}). Upgrade to create more.
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="own" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="grid w-auto grid-cols-2">
            <TabsTrigger value="own">
              Your Organisation ({ownOrganisations.length})
            </TabsTrigger>
            <TabsTrigger value="clients">
              Client Organisations ({clientOrganisations.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="own" className="space-y-4">
          {ownOrganisations.length === 0 ? (
            <EmptyState type="own" />
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={() => handleCreateClick('OWNER')} disabled={!canCreateMore}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Organisation
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ownOrganisations.map((org) => (
                  <OrganisationCard key={org.id} org={org} />
                ))}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          {clientOrganisations.length === 0 ? (
            <EmptyState type="client" />
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={() => handleCreateClick('CLIENT')} disabled={!canCreateMore}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client Organisation
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clientOrganisations.map((org) => (
                  <OrganisationCard key={org.id} org={org} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <OrganisationModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={handleSuccess}
        type={modalType}
      />
    </div>
  );
}
