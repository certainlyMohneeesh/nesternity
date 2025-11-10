'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { CreditCard, Building2, User, MapPin, Shield, AlertCircle, CheckCircle2, Clock, XCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

type AccountStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'NEEDS_CLARIFICATION';
type SettlementSchedule = 'INSTANT' | 'DAILY' | 'WEEKLY' | 'MONTHLY';

interface PaymentSettingsData {
  id?: string;
  razorpayAccountId?: string | null;
  accountStatus?: AccountStatus;
  accountActive?: boolean;
  accountType?: 'SAVINGS' | 'CURRENT';
  settlementSchedule?: SettlementSchedule;
  enableCommission?: boolean;
  commissionPercent?: number;
  verificationNotes?: string | null;
  
  // Bank account details (required for linking)
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  
  // Business/KYC details
  businessName?: string;
  gstNumber?: string;
  panNumber?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  contactEmail?: string;  // Fixed: was email
  contactPhone?: string;  // Fixed: was phone
}

export function PaymentSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linking, setLinking] = useState(false);
  const [settings, setSettings] = useState<PaymentSettingsData>({
    enableCommission: true,
    commissionPercent: 5.0,
    settlementSchedule: 'INSTANT',
    accountType: 'SAVINGS',
    country: 'India',
  });

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  async function fetchPaymentSettings() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const response = await fetch('/api/payment-settings', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      toast.error('Failed to load payment settings');
    } finally {
      setLoading(false);
    }
  }

  async function createLinkedAccount() {
    // Validate required fields
    if (!settings.accountHolderName || !settings.accountNumber || !settings.ifscCode) {
      toast.error('Please fill in all bank account details');
      return;
    }
    
    if (!settings.panNumber) {
      toast.error('PAN number is required for account verification');
      return;
    }

    if (!settings.contactEmail || !settings.contactPhone) {
      toast.error('Email and phone are required');
      return;
    }

    setLinking(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ...settings,
          createLinkedAccountNow: true,
        }),
      });

      if (response.ok) {
        toast.success('Linked account created! Verification may take 24-48 hours.');
        fetchPaymentSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create linked account');
      }
    } catch (error) {
      console.error('Error creating linked account:', error);
      toast.error('Failed to create linked account');
    } finally {
      setLinking(false);
    }
  }

  async function savePaymentSettings() {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/payment-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast.success('Payment settings saved successfully');
        fetchPaymentSettings();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save payment settings');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      toast.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  }

  const handleChange = (field: string, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const getStatusBadge = (status?: AccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Active</Badge>;
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Verification</Badge>;
      case 'SUSPENDED':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Suspended</Badge>;
      case 'NEEDS_CLARIFICATION':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Needs Clarification</Badge>;
      default:
        return <Badge variant="outline">Not Linked</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>Configure Razorpay Route for invoice payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAccountLinked = !!settings.razorpayAccountId;
  const isAccountActive = settings.accountActive === true;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <CardDescription>
          Link your bank account to receive payments directly from clients
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Region Notice */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Regional Availability</AlertTitle>
          <AlertDescription>
            Razorpay Route is currently available only for users in <strong>India</strong> and <strong>Malaysia</strong>.
            You need a valid PAN number (India) or equivalent business registration to link your account.
          </AlertDescription>
        </Alert>

        {/* Account Status */}
        {isAccountLinked && (
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <Label className="text-base">Account Status</Label>
              <p className="text-sm text-muted-foreground">
                Account ID: <code className="text-xs bg-muted px-1 py-0.5 rounded">{settings.razorpayAccountId}</code>
              </p>
              {settings.verificationNotes && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {settings.verificationNotes}
                </p>
              )}
            </div>
            {getStatusBadge(settings.accountStatus)}
          </div>
        )}

        {!isAccountLinked && (
          <>
            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <h3 className="font-semibold">Contact Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={settings.contactEmail || ''}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number *</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+91XXXXXXXXXX"
                    value={settings.contactPhone || ''}
                    onChange={(e) => handleChange('contactPhone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Business/KYC Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <h3 className="font-semibold">Business Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business/Legal Name</Label>
                  <Input
                    id="businessName"
                    placeholder="Your Business Name"
                    value={settings.businessName || ''}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="panNumber">PAN Number * (India)</Label>
                  <Input
                    id="panNumber"
                    placeholder="AAAAA0000A"
                    value={settings.panNumber || ''}
                    onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required for KYC verification
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gstNumber">GST Number (Optional)</Label>
                  <Input
                    id="gstNumber"
                    placeholder="22AAAAA0000A1Z5"
                    value={settings.gstNumber || ''}
                    onChange={(e) => handleChange('gstNumber', e.target.value.toUpperCase())}
                  />
                </div>
              </div>
            </div>

            {/* Bank Account Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <h3 className="font-semibold">Bank Account Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    placeholder="Full name as per bank account"
                    value={settings.accountHolderName || ''}
                    onChange={(e) => handleChange('accountHolderName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter account number"
                    value={settings.accountNumber || ''}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code *</Label>
                  <Input
                    id="ifscCode"
                    placeholder="SBIN0001234"
                    value={settings.ifscCode || ''}
                    onChange={(e) => handleChange('ifscCode', e.target.value.toUpperCase())}
                    maxLength={11}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="State Bank of India"
                    value={settings.bankName || ''}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branchName">Branch Name</Label>
                  <Input
                    id="branchName"
                    placeholder="Main Branch"
                    value={settings.branchName || ''}
                    onChange={(e) => handleChange('branchName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountType">Account Type *</Label>
                  <Select
                    value={settings.accountType || 'SAVINGS'}
                    onValueChange={(value) => handleChange('accountType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAVINGS">Savings Account</SelectItem>
                      <SelectItem value="CURRENT">Current Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Business Address */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <h3 className="font-semibold">Business Address</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Address</Label>
                  <Input
                    id="businessAddress"
                    placeholder="Street address"
                    value={settings.businessAddress || ''}
                    onChange={(e) => handleChange('businessAddress', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={settings.city || ''}
                      onChange={(e) => handleChange('city', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      placeholder="Maharashtra"
                      value={settings.state || ''}
                      onChange={(e) => handleChange('state', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      placeholder="400001"
                      value={settings.pincode || ''}
                      onChange={(e) => handleChange('pincode', e.target.value)}
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Link Account Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={createLinkedAccount} disabled={linking} size="lg">
                {linking ? 'Creating Account...' : 'Link Bank Account'}
              </Button>
            </div>
          </>
        )}

        {/* Payment Preferences (only shown when account is linked) */}
        {isAccountLinked && (
          <>
            {/* Settlement Schedule */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Settlement Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  Choose how often you want to receive payments to your bank account
                </p>
              </div>
              
              <Select
                value={settings.settlementSchedule || 'INSTANT'}
                onValueChange={(value) => handleChange('settlementSchedule', value)}
                disabled={!isAccountActive}
              >
                <SelectTrigger className="w-full md:w-[300px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INSTANT">Instant (Real-time transfers)</SelectItem>
                  <SelectItem value="DAILY">Daily (End of day)</SelectItem>
                  <SelectItem value="WEEKLY">Weekly (Every Monday)</SelectItem>
                  <SelectItem value="MONTHLY">Monthly (1st of month)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Platform Commission */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base">Platform Commission</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.enableCommission 
                      ? `A ${settings.commissionPercent}% commission will be deducted from your payments`
                      : 'Commission is currently disabled'}
                  </p>
                </div>
                <Switch
                  checked={settings.enableCommission ?? true}
                  onCheckedChange={(checked) => handleChange('enableCommission', checked)}
                  disabled={!isAccountActive}
                />
              </div>

              {settings.enableCommission && (
                <div className="space-y-2">
                  <Label htmlFor="commissionPercent">Commission Percentage</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="commissionPercent"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={settings.commissionPercent || 5.0}
                      onChange={(e) => handleChange('commissionPercent', parseFloat(e.target.value))}
                      className="w-[120px]"
                      disabled={!isAccountActive}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={savePaymentSettings} disabled={saving || !isAccountActive}>
                {saving ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

