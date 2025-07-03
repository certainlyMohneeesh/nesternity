"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useSession } from "@/components/auth/session-context";
import { supabase } from "@/lib/supabase";
import { 
  User, 
  Bell, 
  Shield, 
  CreditCard, 
  Database, 
  Settings as SettingsIcon,
  Mail,
  Moon,
  Sun,
  Monitor,
  Trash2,
  Download,
  Upload
} from "lucide-react";

interface UserSettings {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  timezone: string;
  language: string;
  weekStart: 'monday' | 'sunday';
}

interface Subscription {
  id: string;
  status: string;
  stripePriceId: string;
  currentPeriodEnd: string;
}

export default function SettingsPage() {
  const { session, loading: sessionLoading } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!sessionLoading && session?.user) {
      fetchUserSettings();
      fetchSubscription();
    }
  }, [sessionLoading, session]);

  async function fetchUserSettings() {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings({
          id: data.id,
          email: data.email,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
          emailNotifications: true, // Default values - these could come from a separate settings table
          pushNotifications: true,
          theme: 'system',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: 'en',
          weekStart: 'monday'
        });
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubscription() {
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch('/api/stripe/subscription', {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  }

  async function saveProfile(updates: Partial<UserSettings>) {
    setSaving(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        setSettings(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  }

  async function exportData() {
    setExportLoading(true);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession?.access_token) return;

      const response = await fetch('/api/export-data', {
        headers: {
          'Authorization': `Bearer ${authSession.access_token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nesternity-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setExportLoading(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your account profile information and email address.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={settings.displayName || ''}
                    onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatarUrl">Avatar URL</Label>
                <Input
                  id="avatarUrl"
                  type="url"
                  value={settings.avatarUrl || ''}
                  onChange={(e) => setSettings({ ...settings, avatarUrl: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
              <Button 
                onClick={() => saveProfile({
                  displayName: settings.displayName,
                  email: settings.email,
                  avatarUrl: settings.avatarUrl
                })}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to be notified about updates and activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important updates
                  </p>
                </div>
                <Checkbox
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked: boolean) => 
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications in your browser
                  </p>
                </div>
                <Checkbox
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked: boolean) => 
                    setSettings({ ...settings, pushNotifications: checked })
                  }
                />
              </div>
              <Button onClick={() => saveProfile({
                emailNotifications: settings.emailNotifications,
                pushNotifications: settings.pushNotifications
              })}>
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription & Billing
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Current Plan</h4>
                      <p className="text-sm text-muted-foreground">
                        Status: <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                          {subscription.status}
                        </Badge>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Next billing: {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline">Manage Subscription</Button>
                    <Button variant="outline">View Invoices</Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="font-medium mb-2">No Active Subscription</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Subscribe to unlock premium features
                  </p>
                  <Button>View Plans</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                Preferences
              </CardTitle>
              <CardDescription>
                Customize your experience with theme and regional settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={settings.theme}
                    onValueChange={(value: 'light' | 'dark' | 'system') => 
                      setSettings({ ...settings, theme: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">
                        <div className="flex items-center gap-2">
                          <Sun className="h-4 w-4" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center gap-2">
                          <Moon className="h-4 w-4" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center gap-2">
                          <Monitor className="h-4 w-4" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Week starts on</Label>
                  <Select
                    value={settings.weekStart}
                    onValueChange={(value: 'monday' | 'sunday') => 
                      setSettings({ ...settings, weekStart: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monday">Monday</SelectItem>
                      <SelectItem value="sunday">Sunday</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  placeholder="America/New_York"
                />
              </div>
              <Button onClick={() => saveProfile({
                theme: settings.theme,
                weekStart: settings.weekStart,
                timezone: settings.timezone
              })}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export your data or manage your account data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download all your data in JSON format
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={exportData}
                    disabled={exportLoading}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {exportLoading ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded border-destructive/20">
                  <div>
                    <h4 className="font-medium text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
