"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { getSessionToken } from "@/lib/supabase/client-session";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Trash2 } from "lucide-react";

export default function SettingsProfilePage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch('/api/user/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({ id: data.id, email: data.email, displayName: data.displayName, avatarUrl: data.avatarUrl });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(updates: any) {
    setSaving(true);
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
          setSettings((prev: any) => prev ? { ...prev, ...updates } : prev);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!confirm('Are you sure you want to permanently delete your account? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const token = await getSessionToken();
      if (!token) return;

      const response = await fetch('/api/profile', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Sign out and redirect to login
        router.push('/auth/login');
      } else {
        const data = await response.json();
        console.error('Failed to delete account', data);
        alert('Failed to delete account');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile Settings</h2>
        <p className="text-muted-foreground">Manage display name and profile information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm settings={settings} onSave={saveProfile} saving={saving} />
          <div className="flex justify-end pt-4">
            <Button variant="destructive" className="gap-2" onClick={deleteAccount} disabled={deleting}>
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
