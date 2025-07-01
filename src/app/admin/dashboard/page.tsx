'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Mail, 
  Activity, 
  Database, 
  Users, 
  Shield,
  LogOut,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();

  function handleLogout() {
    document.cookie = 'admin-auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/admin/login');
  }

  const adminTools = [
    {
      title: 'System Status',
      description: 'Check database, auth, and API health',
      icon: Activity,
      href: '/admin/system-status',
      color: 'bg-green-500'
    },
    {
      title: 'Email Testing',
      description: 'Test email delivery and templates',
      icon: Mail,
      href: '/admin/test-email',
      color: 'bg-blue-500'
    },
    {
      title: 'Troubleshooting',
      description: 'Debug tools and error logs',
      icon: Settings,
      href: '/admin/troubleshooting',
      color: 'bg-yellow-500'
    },
    {
      title: 'Database Stats',
      description: 'View database metrics and performance',
      icon: Database,
      href: '/admin/database-stats',
      color: 'bg-purple-500'
    },
    {
      title: 'User Analytics',
      description: 'User registration and activity metrics',
      icon: BarChart3,
      href: '/admin/user-analytics',
      color: 'bg-indigo-500'
    },
    {
      title: 'Security Logs',
      description: 'View authentication and security events',
      icon: Shield,
      href: '/admin/security-logs',
      color: 'bg-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">System administration and monitoring tools</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Admin Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminTools.map((tool) => (
            <Link key={tool.href} href={tool.href}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${tool.color}`}>
                      <tool.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{tool.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{tool.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Quick Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Database className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-sm text-gray-600">Teams</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Mail className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-sm text-gray-600">Invites Sent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Activity className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">--</p>
                    <p className="text-sm text-gray-600">Activities</p>
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
