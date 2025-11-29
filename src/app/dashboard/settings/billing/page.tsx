"use client";

import { useEffect, useState } from "react";
import { BillingSection } from '@/components/settings/BillingSection';
import { PaymentSettingsSection } from '@/components/settings/PaymentSettingsSection';
import { getSessionToken } from '@/lib/supabase/client-session';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function SettingsBillingPage() {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const token = await getSessionToken();
      if (!token) return;
      const response = await fetch('/api/razorpay/subscription', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">Manage subscriptions and payments</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <BillingSection />
        <PaymentSettingsSection />
      </div>
    </div>
  );
}
