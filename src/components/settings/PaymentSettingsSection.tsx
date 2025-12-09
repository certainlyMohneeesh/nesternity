'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { CreditCard, Building2, User, MapPin, Globe, IndianRupee, Eye, EyeOff, Info, QrCode } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AccountType = 'SAVINGS' | 'CURRENT';
type DodoMode = 'TEST' | 'LIVE';

interface PaymentSettingsData {
  id?: string;
  
  // India Payments - UPI
  upiId?: string;
  upiMerchantName?: string;
  
  // India Payments - Bank Transfer
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  branchName?: string;
  accountType?: AccountType;
  bankTransferThreshold?: number;
  
  // Business Details
  businessName?: string;
  gstNumber?: string;
  panNumber?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // International Payments - Dodo BYOK
  enableInternational?: boolean;
  dodoApiKey?: string;
  dodoAccountId?: string;
  dodoMode?: DodoMode;
}

export function PaymentSettingsSection() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDodoKey, setShowDodoKey] = useState(false);
  const [settings, setSettings] = useState<PaymentSettingsData>({
    accountType: 'SAVINGS',
    country: 'India',
    dodoMode: 'TEST',
    enableInternational: false,
    bankTransferThreshold: 100000, // ₹1,00,000
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

  const handleChange = (field: keyof PaymentSettingsData, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>Configure your payment methods</CardDescription>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <CardDescription>
          Configure UPI, bank transfers, and international payment options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="india" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="india" className="gap-2">
              <IndianRupee className="h-4 w-4" />
              India (UPI/Bank)
            </TabsTrigger>
            <TabsTrigger value="international" className="gap-2">
              <Globe className="h-4 w-4" />
              International
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <Building2 className="h-4 w-4" />
              Business Info
            </TabsTrigger>
          </TabsList>

          {/* India Payments Tab */}
          <TabsContent value="india" className="space-y-6">
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertTitle>Smart Payment Routing</AlertTitle>
              <AlertDescription>
                UPI for amounts under ₹{(settings.bankTransferThreshold || 100000).toLocaleString('en-IN')}.
                Bank transfer details shown for larger amounts.
              </AlertDescription>
            </Alert>

            {/* UPI Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                <h3 className="font-semibold">UPI Payment Details</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upiId">UPI ID *</Label>
                  <Input
                    id="upiId"
                    placeholder="yourname@paytm"
                    value={settings.upiId || ''}
                    onChange={(e) => handleChange('upiId', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Your UPI ID will be used to generate QR codes for payments
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upiMerchantName">Merchant Name (shown in UPI apps)</Label>
                  <Input
                    id="upiMerchantName"
                    placeholder="Your Business Name"
                    value={settings.upiMerchantName || ''}
                    onChange={(e) => handleChange('upiMerchantName', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bank Transfer Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <h3 className="font-semibold">Bank Transfer Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name</Label>
                  <Input
                    id="accountHolderName"
                    placeholder="Full name as per bank"
                    value={settings.accountHolderName || ''}
                    onChange={(e) => handleChange('accountHolderName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Enter account number"
                    value={settings.accountNumber || ''}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ifscCode">IFSC Code</Label>
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
                  <Label htmlFor="accountType">Account Type</Label>
                  <Select
                    value={settings.accountType || 'SAVINGS'}
                    onValueChange={(value: AccountType) => handleChange('accountType', value)}
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

              <div className="space-y-2">
                <Label htmlFor="bankTransferThreshold">Bank Transfer Threshold (₹)</Label>
                <Input
                  id="bankTransferThreshold"
                  type="number"
                  placeholder="100000"
                  value={settings.bankTransferThreshold || 100000}
                  onChange={(e) => handleChange('bankTransferThreshold', parseFloat(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Show bank transfer details for amounts above this threshold
                </p>
              </div>
            </div>
          </TabsContent>

          {/* International Payments Tab */}
          <TabsContent value="international" className="space-y-6">
            <Alert>
              <Globe className="h-4 w-4" />
              <AlertTitle>Bring Your Own Key (BYOK)</AlertTitle>
              <AlertDescription>
                Use your own Dodo Payments account for international payments. Your API keys are encrypted and never shared.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="text-base">Enable International Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Accept payments from international clients via Dodo Payments
                </p>
              </div>
              <Switch
                checked={settings.enableInternational ?? false}
                onCheckedChange={(checked) => handleChange('enableInternational', checked)}
              />
            </div>

            {settings.enableInternational && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dodoAccountId">Dodo Account ID</Label>
                  <Input
                    id="dodoAccountId"
                    placeholder="acc_xxxxxxxxxxxxxxxx"
                    value={settings.dodoAccountId || ''}
                    onChange={(e) => handleChange('dodoAccountId', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dodoApiKey">Dodo API Key</Label>
                  <div className="relative">
                    <Input
                      id="dodoApiKey"
                      type={showDodoKey ? 'text' : 'password'}
                      placeholder="sk_test_xxxxxxxxxxxxxxxx"
                      value={settings.dodoApiKey || ''}
                      onChange={(e) => handleChange('dodoApiKey', e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowDodoKey(!showDodoKey)}
                    >
                      {showDodoKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from your Dodo Payments dashboard
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dodoMode">Mode</Label>
                  <Select
                    value={settings.dodoMode || 'TEST'}
                    onValueChange={(value: DodoMode) => handleChange('dodoMode', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEST">Test Mode</SelectItem>
                      <SelectItem value="LIVE">Live Mode</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Use test mode for testing before going live
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Business Info Tab */}
          <TabsContent value="business" className="space-y-6">
            {/* Contact Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <h3 className="font-semibold">Contact Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="your@email.com"
                    value={settings.contactEmail || ''}
                    onChange={(e) => handleChange('contactEmail', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number</Label>
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

            {/* Business Details */}
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
                  <Label htmlFor="panNumber">PAN Number (India)</Label>
                  <Input
                    id="panNumber"
                    placeholder="AAAAA0000A"
                    value={settings.panNumber || ''}
                    onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                    maxLength={10}
                  />
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

            {/* Business Address */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                <h3 className="font-semibold">Business Address</h3>
              </div>
              
              <div className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="India"
                    value={settings.country || 'India'}
                    onChange={(e) => handleChange('country', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="flex justify-end pt-6 border-t mt-6">
          <Button onClick={savePaymentSettings} disabled={saving} size="lg">
            {saving ? 'Saving...' : 'Save Payment Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

