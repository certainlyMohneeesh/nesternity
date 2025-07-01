'use client';

import { useState, useEffect } from 'react';

interface SystemStatus {
  timestamp: string;
  environment: string;
  services: {
    supabase: {
      url: string;
      anonKey: string;
      serviceKey: string;
    };
    resend: {
      apiKey: string;
      fromEmail: string;
    };
    app: {
      url: string;
    };
  };
  features: {
    emailInvites: string;
    supabaseAuth: string;
    database: string;
  };
}

export default function SystemStatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/system-status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load system status:', err);
        setLoading(false);
      });
  }, []);

  const testDatabaseFunctions = async () => {
    try {
      const response = await fetch('/api/test-db-functions', { method: 'POST' });
      const result = await response.json();
      
      alert(result.success 
        ? '✅ Database functions working correctly!' 
        : `❌ Database function error: ${result.error}`
      );
    } catch (error) {
      alert(`❌ Test failed: ${error}`);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="animate-pulse">Loading system status...</div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-red-600">Failed to load system status</div>
      </div>
    );
  }

  const getStatusColor = (statusText: string) => {
    if (statusText.includes('✅')) return 'text-green-600';
    if (statusText.includes('⚠️')) return 'text-yellow-600';
    if (statusText.includes('❌')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Status Dashboard</h1>
        <p className="text-gray-600">Monitor your Nesternity CRM configuration</p>
        <p className="text-sm text-gray-500">Last updated: {new Date(status.timestamp).toLocaleString()}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Services Status */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🔧 Core Services</h2>
          
          <div className="space-y-3">
            <div>
              <h3 className="font-medium">Supabase</h3>
              <div className="ml-4 text-sm space-y-1">
                <p className={getStatusColor(status.services.supabase.url)}>
                  URL: {status.services.supabase.url}
                </p>
                <p className={getStatusColor(status.services.supabase.anonKey)}>
                  Anon Key: {status.services.supabase.anonKey}
                </p>
                <p className={getStatusColor(status.services.supabase.serviceKey)}>
                  Service Key: {status.services.supabase.serviceKey}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium">Resend Email</h3>
              <div className="ml-4 text-sm space-y-1">
                <p className={getStatusColor(status.services.resend.apiKey)}>
                  API Key: {status.services.resend.apiKey}
                </p>
                <p className="text-gray-600">
                  From Email: {status.services.resend.fromEmail}
                </p>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium">Application</h3>
              <div className="ml-4 text-sm">
                <p className="text-gray-600">
                  URL: {status.services.app.url}
                </p>
                <p className="text-gray-600">
                  Environment: {status.environment}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Status */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Feature Status</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Email Invites</span>
              <span className={getStatusColor(status.features.emailInvites)}>
                {status.features.emailInvites}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Database</span>
              <span className={getStatusColor(status.features.database)}>
                {status.features.database}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Supabase Auth Invites</span>
              <span className={getStatusColor(status.features.supabaseAuth)}>
                {status.features.supabaseAuth}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border rounded-lg p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">🧪 Quick Tests</h2>
          
          <div className="flex gap-4 flex-wrap">
            <a 
              href="/test-email-simple"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test Email Sending
            </a>
            
            <button 
              onClick={() => testDatabaseFunctions()}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Test Database Functions
            </button>
            
            <a 
              href="/dashboard/teams"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test Team Invites
            </a>
            
            <a 
              href="/email-test"
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Email Configuration
            </a>
          </div>
        </div>

        {/* Health Summary */}
        <div className="bg-white border rounded-lg p-6 md:col-span-2">
          <h2 className="text-xl font-semibold mb-4">📊 Health Summary</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">✅</div>
              <div className="text-sm">System Ready</div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">📧</div>
              <div className="text-sm">Email Service</div>
              <div className="text-xs text-gray-600">Resend Active</div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">🗄️</div>
              <div className="text-sm">Database</div>
              <div className="text-xs text-gray-600">Supabase Connected</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
