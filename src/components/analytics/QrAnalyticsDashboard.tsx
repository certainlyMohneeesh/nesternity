'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Smartphone, 
  Monitor, 
  Tablet,
  Globe,
  Clock,
  Eye,
  MapPin,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface AnalyticsData {
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalVisits: number;
    uniqueIps: number;
    uniqueQrs: number;
    avgVisitsPerQr: number;
  };
  deviceBreakdown: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  locationBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  visitsByDay: Record<string, number>;
  topQrs: Array<{
    qrId: string;
    visits: number;
    amount: number | null;
    note: string | null;
    invoiceId: string | null;
  }>;
  recentVisits: Array<{
    id: string;
    qrId: string;
    ipAddress: string | null;
    country: string | null;
    city: string | null;
    visitedAt: string;
    device: string;
  }>;
}

export function QrAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/qr-visits?days=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }

  function exportData() {
    if (!data) return;

    const csv = [
      ['Date', 'QR ID', 'Device', 'Country', 'City', 'IP Address'],
      ...data.recentVisits.map((v) => [
        new Date(v.visitedAt).toLocaleString(),
        v.qrId,
        v.device,
        v.country || 'Unknown',
        v.city || 'Unknown',
        v.ipAddress || 'N/A',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-analytics-${period}days.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Analytics exported');
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Visit Analytics</CardTitle>
          <CardDescription>Loading analytics data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>QR Visit Analytics</CardTitle>
          <CardDescription>No analytics data available</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const deviceTotal = data.deviceBreakdown.mobile + data.deviceBreakdown.tablet + data.deviceBreakdown.desktop;
  const devicePercentages = {
    mobile: deviceTotal > 0 ? (data.deviceBreakdown.mobile / deviceTotal) * 100 : 0,
    tablet: deviceTotal > 0 ? (data.deviceBreakdown.tablet / deviceTotal) * 100 : 0,
    desktop: deviceTotal > 0 ? (data.deviceBreakdown.desktop / deviceTotal) * 100 : 0,
  };

  const topLocations = Object.entries(data.locationBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topBrowsers = Object.entries(data.browserBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">QR Visit Analytics</h2>
          <p className="text-muted-foreground">
            Track and analyze payment QR code visits
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={exportData}
            className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {period} days period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.uniqueIps.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Based on IP addresses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.uniqueQrs}</div>
            <p className="text-xs text-muted-foreground">
              Active payment QRs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visits/QR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.avgVisitsPerQr}</div>
            <p className="text-xs text-muted-foreground">
              Per QR code average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="browsers">Browsers</TabsTrigger>
          <TabsTrigger value="top-qrs">Top QRs</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Breakdown</CardTitle>
              <CardDescription>Visits by device type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Mobile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {data.deviceBreakdown.mobile} visits
                    </span>
                    <Badge>{devicePercentages.mobile.toFixed(1)}%</Badge>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${devicePercentages.mobile}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Desktop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {data.deviceBreakdown.desktop} visits
                    </span>
                    <Badge>{devicePercentages.desktop.toFixed(1)}%</Badge>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${devicePercentages.desktop}%` }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tablet className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">Tablet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {data.deviceBreakdown.tablet} visits
                    </span>
                    <Badge>{devicePercentages.tablet.toFixed(1)}%</Badge>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${devicePercentages.tablet}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
              <CardDescription>Top 5 countries by visits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topLocations.map(([country, visits], index) => (
                  <div key={country} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{visits} visits</span>
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        {((visits / data.summary.totalVisits) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Browsers Tab */}
        <TabsContent value="browsers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Browser Distribution</CardTitle>
              <CardDescription>Top 5 browsers by visits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topBrowsers.map(([browser, visits]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{browser}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{visits} visits</span>
                      <Badge variant="secondary">
                        {((visits / data.summary.totalVisits) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top QRs Tab */}
        <TabsContent value="top-qrs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing QR Codes</CardTitle>
              <CardDescription>Most visited payment QRs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.topQrs.map((qr, index) => (
                  <div key={qr.qrId} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? 'default' : 'secondary'}>
                          #{index + 1}
                        </Badge>
                        <span className="font-mono text-sm text-muted-foreground">
                          {qr.qrId.substring(0, 8)}...
                        </span>
                      </div>
                      {qr.note && (
                        <p className="text-sm">{qr.note}</p>
                      )}
                      {qr.amount && (
                        <p className="text-sm font-semibold text-green-600">
                          ₹{qr.amount.toLocaleString('en-IN')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{qr.visits}</div>
                      <div className="text-xs text-muted-foreground">visits</div>
                    </div>
                  </div>
                ))}
                {data.topQrs.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No QR codes with visits in this period
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Visit Timeline</CardTitle>
              <CardDescription>Daily visit distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.visitsByDay)
                  .sort(([a], [b]) => b.localeCompare(a))
                  .slice(0, 14)
                  .map(([date, visits]) => {
                    const maxVisits = Math.max(...Object.values(data.visitsByDay));
                    const percentage = (visits / maxVisits) * 100;
                    return (
                      <div key={date} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {new Date(date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="font-medium">{visits} visits</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent Visits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Visits</CardTitle>
          <CardDescription>Latest 50 QR code scans</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Time</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">QR ID</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Device</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Location</th>
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.recentVisits.map((visit) => (
                  <tr key={visit.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {new Date(visit.visitedAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="p-2">
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {visit.qrId.substring(0, 8)}...
                      </code>
                    </td>
                    <td className="p-2">
                      <Badge variant="outline" className="text-xs">
                        {visit.device}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">
                      {visit.city && visit.country
                        ? `${visit.city}, ${visit.country}`
                        : visit.country || 'Unknown'}
                    </td>
                    <td className="p-2 text-sm font-mono text-muted-foreground">
                      {visit.ipAddress || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
