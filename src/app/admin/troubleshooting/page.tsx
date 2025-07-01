'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertTriangle, 
  Bug, 
  RefreshCw, 
  Download, 
  Search,
  ArrowLeft,
  Database,
  Shield,
  Mail,
  Wifi
} from 'lucide-react';
import Link from 'next/link';

interface TroubleshootingData {
  dbStats: any;
  recentErrors: any[];
  systemInfo: any;
  apiStatus: any;
}

export default function TroubleshootingPage() {
  const [data, setData] = useState<TroubleshootingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sqlQuery, setSqlQuery] = useState('SELECT COUNT(*) as user_count FROM users;');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  useEffect(() => {
    loadTroubleshootingData();
  }, []);

  async function loadTroubleshootingData() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/troubleshooting');
      const result = await response.json();
      
      if (response.ok) {
        setData(result);
      } else {
        console.error('Failed to load troubleshooting data:', result);
      }
    } catch (error) {
      console.error('Error loading troubleshooting data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function executeSqlQuery() {
    setSqlLoading(true);
    setSqlResult(null);
    
    try {
      const response = await fetch('/api/admin/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      
      const result = await response.json();
      setSqlResult(result);
    } catch (error: any) {
      setSqlResult({
        success: false,
        error: error.message
      });
    } finally {
      setSqlLoading(false);
    }
  }

  async function downloadLogs() {
    try {
      const response = await fetch('/api/admin/download-logs');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nesternity-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download logs:', error);
    }
  }

  const filteredErrors = data?.recentErrors?.filter(error => 
    error.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    error.stack?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading troubleshooting data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Troubleshooting</h1>
            <p className="text-gray-600 mt-2">Debug tools and system diagnostics</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={loadTroubleshootingData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={downloadLogs} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Logs
            </Button>
            <Link href="/admin/dashboard">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* System Overview */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Database Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.dbStats ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-mono">{data.dbStats.users || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Teams:</span>
                      <span className="font-mono">{data.dbStats.teams || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Invites:</span>
                      <span className="font-mono">{data.dbStats.activeInvites || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Activities:</span>
                      <span className="font-mono">{data.dbStats.activities || 0}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No database statistics available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.systemInfo ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>Environment:</span>
                      <span className="font-mono">{data.systemInfo.environment}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Node Version:</span>
                      <span className="font-mono">{data.systemInfo.nodeVersion}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Memory Usage:</span>
                      <span className="font-mono">{data.systemInfo.memoryUsage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono">{data.systemInfo.uptime}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No system information available</p>
                )}
              </CardContent>
            </Card>

            {/* SQL Query Tool */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  SQL Query Tool
                </CardTitle>
                <CardDescription>
                  Execute read-only queries for debugging
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sql">SQL Query</Label>
                  <Textarea
                    id="sql"
                    value={sqlQuery}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setSqlQuery(e.target.value)}
                    rows={3}
                    className="font-mono text-sm"
                  />
                </div>
                <Button 
                  onClick={executeSqlQuery} 
                  disabled={sqlLoading || !sqlQuery.trim()}
                  className="w-full"
                >
                  {sqlLoading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    'Execute Query'
                  )}
                </Button>
                {sqlResult && (
                  <div className={`p-4 rounded-lg border ${
                    sqlResult.success 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(sqlResult, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Error Logs */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Recent Errors
                </CardTitle>
                <CardDescription>
                  Latest application errors and exceptions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <Input
                      placeholder="Search errors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredErrors.length > 0 ? (
                      filteredErrors.map((error, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-red-800 text-sm">
                                {error.message || 'Unknown error'}
                              </p>
                              <p className="text-xs text-red-600 mt-1">
                                {error.timestamp ? new Date(error.timestamp).toLocaleString() : 'No timestamp'}
                              </p>
                            </div>
                            <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 ml-2" />
                          </div>
                          {error.stack && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-red-700">
                                Stack Trace
                              </summary>
                              <pre className="text-xs mt-1 bg-red-100 p-2 rounded overflow-auto">
                                {error.stack}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Bug className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No recent errors found</p>
                        {searchTerm && (
                          <p className="text-sm">Try a different search term</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
