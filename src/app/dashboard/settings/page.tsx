"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProfileForm } from '@/components/settings/ProfileForm';
import { PreferencesForm } from '@/components/settings/PreferencesForm';
import { BillingSection } from '@/components/settings/BillingSection';
import { PaymentSettingsSection } from '@/components/settings/PaymentSettingsSection';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Database, Bell, Settings as SettingsIcon, User, CreditCard } from 'lucide-react';
import { getSessionToken } from '@/lib/supabase/client-session';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUser(); }, []);

  async function fetchUser() {
    try {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch('/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setSettings({ id: data.id, email: data.email, displayName: data.displayName, avatarUrl: data.avatarUrl });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function saveProfile(updates: any) {
    setSaving(true);
    try {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(updates) });
      if (res.ok) setSettings((prev: any) => prev ? { ...prev, ...updates } : prev);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function deleteAccount() {
    if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
    try {
      const token = await getSessionToken();
      if (!token) return;
      const res = await fetch('/api/profile', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) router.push('/auth/login'); else alert('Failed to delete account');
    } catch (err) { console.error(err); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2"><User className="h-4 w-4"/>Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2"><Bell className="h-4 w-4"/>Notifications</TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2"><CreditCard className="h-4 w-4"/>Billing</TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2"><CreditCard className="h-4 w-4"/>Payments</TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2"><SettingsIcon className="h-4 w-4"/>Preferences</TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2"><Database className="h-4 w-4"/>Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account profile information and email address.</CardDescription>
            </CardHeader>
            <CardContent>
              {settings && <ProfileForm settings={settings} onSave={saveProfile} saving={saving} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <BillingSection />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentSettingsSection />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent>
              {settings && <PreferencesForm settings={settings} onSave={saveProfile} saving={saving} />}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export your data or manage your account data.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <h4 className="font-medium">Export Data</h4>
                    <p className="text-sm text-muted-foreground">Download all your data in JSON format</p>
                  </div>
                  <Button onClick={async () => {
                    try {
                      const token = await getSessionToken();
                      if (!token) return;
                      const response = await fetch('/api/export-data', { headers: { 'Authorization': `Bearer ${token}` } });
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
                    } catch (err) { console.error(err) }
                  }}>Export</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded border-destructive/20">
                  <div>
                    <h4 className="font-medium text-destructive">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                  </div>
                  <Button variant="destructive" className="gap-2" onClick={deleteAccount}>Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
