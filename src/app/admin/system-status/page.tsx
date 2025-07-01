'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Database, 
  Shield, 
  Mail,
  Wifi,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface SystemStatus {
  database: {
    status: 'healthy' | 'error' | 'checking';
    message: string;
    details?: any;
  };
  auth: {
    status: 'healthy' | 'error' | 'checking';
    message: string;
    details?: any;
  };
  email: {
    status: 'healthy' | 'error' | 'checking';
    message: string;
    details?: any;
  };
  api: {
    status: 'healthy' | 'error' | 'checking';
    message: string;
    details?: any;
  };
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus>({
    database: { status: 'checking', message: 'Checking database connection...' },
    auth: { status: 'checking', message: 'Checking authentication service...' },
    email: { status: 'checking', message: 'Checking email service...' },
    api: { status: 'checking', message: 'Checking API endpoints...' }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSystemStatus();
  }, []);

  async function checkSystemStatus() {
    setLoading(true);
    
    try {
      const response = await fetch('/api/admin/system-status');
      const data = await response.json();
      
      if (response.ok) {
        setStatus(data.status);
      } else {
        // If the API fails, mark all as error
        setStatus({
          database: { status: 'error', message: 'Unable to check database status' },
          auth: { status: 'error', message: 'Unable to check auth status' },
          email: { status: 'error', message: 'Unable to check email status' },
          api: { status: 'error', message: 'API health check failed' }
        });
      }
    } catch (error) {
      setStatus({
        database: { status: 'error', message: 'Connection failed' },
        auth: { status: 'error', message: 'Connection failed' },
        email: { status: 'error', message: 'Connection failed' },
        api: { status: 'error', message: 'Connection failed' }
      });
    } finally {
      setLoading(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  }

  const services = [
    {
      name: 'PostgreSQL Database',
      icon: Database,
      status: status.database,
      description: 'Primary data storage and Prisma ORM'
    },
    {
      name: 'Supabase Auth',
      icon: Shield,
      status: status.auth,
      description: 'User authentication and session management'
    },
    {
      name: 'Email Service (Resend)',
      icon: Mail,
      status: status.email,
      description: 'Email delivery for invitations and notifications'
    },
    {
      name: 'API Endpoints',
      icon: Wifi,
      status: status.api,
      description: 'REST API routes and server health'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
            <p className="text-gray-600 mt-2">Monitor system health and connectivity</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={checkSystemStatus} disabled={loading} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/admin/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {Object.values(status).every(s => s.status === 'healthy') ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : Object.values(status).some(s => s.status === 'error') ? (
                <XCircle className="h-8 w-8 text-red-500" />
              ) : (
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              )}
              System Health
            </CardTitle>
            <CardDescription>
              {Object.values(status).every(s => s.status === 'healthy') 
                ? 'All systems operational'
                : Object.values(status).some(s => s.status === 'error')
                ? 'Some services experiencing issues'
                : 'Checking system status...'}
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <Card key={service.name} className={`border-2 ${getStatusColor(service.status.status)}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <service.icon className="h-6 w-6" />
                  {service.name}
                  {getStatusIcon(service.status.status)}
                </CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Status: <span className={
                      service.status.status === 'healthy' ? 'text-green-600' :
                      service.status.status === 'error' ? 'text-red-600' : 'text-blue-600'
                    }>
                      {service.status.status === 'healthy' ? 'Healthy' :
                       service.status.status === 'error' ? 'Error' : 'Checking...'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">{service.status.message}</p>
                  {service.status.details && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                        View Details
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(service.status.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Environment</p>
                <p className="text-gray-600">{process.env.NODE_ENV || 'development'}</p>
              </div>
              <div>
                <p className="font-medium">Last Check</p>
                <p className="text-gray-600">{new Date().toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Uptime</p>
                <p className="text-gray-600">Runtime: {process.uptime ? `${Math.floor(process.uptime() / 60)}m` : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
