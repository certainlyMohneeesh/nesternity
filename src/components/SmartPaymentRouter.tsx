'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Globe, IndianRupee, QrCode, Building2, CreditCard, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSettings {
  upiId?: string;
  upiMerchantName?: string;
  accountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  enableInternational?: boolean;
  dodoApiKey?: string;
  bankTransferThreshold?: number;
}

interface SmartPaymentRouterProps {
  amount: number;
  currency?: string;
  invoiceId: string;
  clientCountry?: string;
  onPaymentMethodSelected?: (method: 'UPI' | 'BANK_TRANSFER' | 'DODO') => void;
}

export function SmartPaymentRouter({
  amount,
  currency = 'INR',
  invoiceId,
  clientCountry = 'India',
  onPaymentMethodSelected,
}: SmartPaymentRouterProps) {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [creatingCheckout, setCreatingCheckout] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'india' | 'international'>('india');

  useEffect(() => {
    fetchPaymentSettings();
  }, []);

  useEffect(() => {
    // Auto-select based on currency (INR = India, others = International)
    if (currency !== 'INR') {
      setSelectedMethod('international');
    } else {
      setSelectedMethod('india');
    }
  }, [currency]);

  async function fetchPaymentSettings() {
    try {
      const response = await fetch('/api/payment-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUPIPayment() {
    if (!settings?.upiId) {
      toast.error('UPI ID not configured. Please update payment settings.');
      return;
    }

    setGeneratingQR(true);
    try {
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          invoiceId,
          note: `Payment for Invoice ${invoiceId}`,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Payment link generated successfully!');
        onPaymentMethodSelected?.('UPI');
        
        // Don't redirect, just show success message
        // The payment link is now attached to the invoice
        return data.paymentPageUrl;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to generate payment link');
      }
    } catch (error) {
      console.error('Error generating payment link:', error);
      toast.error('Failed to generate payment QR');
    } finally {
      setGeneratingQR(false);
    }
  }

  async function handleDodoCheckout() {
    if (!settings?.enableInternational || !settings?.dodoApiKey) {
      toast.error('International payments not enabled. Please configure Dodo Payments.');
      return;
    }

    setCreatingCheckout(true);
    try {
      const response = await fetch('/api/dodo/checkout/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currency === 'INR' ? amount / 100 : amount, // Convert if needed
          currency: currency === 'INR' ? 'USD' : currency,
          invoiceId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Redirecting to checkout...');
        onPaymentMethodSelected?.('DODO');
        // Redirect to Dodo checkout
        window.location.href = data.checkoutUrl;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create checkout');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to create checkout session');
    } finally {
      setCreatingCheckout(false);
    }
  }

  function handleBankTransfer() {
    onPaymentMethodSelected?.('BANK_TRANSFER');
    toast.info('Bank transfer details will be shown on the payment page');
    handleUPIPayment(); // Redirect to same page which shows bank details for large amounts
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isIndianPayment = currency === 'INR' || clientCountry === 'India' || !clientCountry;
  const requiresBankTransfer = isIndianPayment && settings?.bankTransferThreshold && amount >= settings.bankTransferThreshold;
  const showUPI = isIndianPayment && !requiresBankTransfer;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Choose Payment Method
        </CardTitle>
        <CardDescription>
          Amount: {currency === 'INR' ? '₹' : currency} {amount.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="india">
              <IndianRupee className="h-4 w-4 mr-2" />
              India
            </TabsTrigger>
            <TabsTrigger value="international">
              <Globe className="h-4 w-4 mr-2" />
              International
            </TabsTrigger>
          </TabsList>

          {/* India Payment Methods */}
          <TabsContent value="india" className="space-y-4 mt-4">
            {!isIndianPayment ? (
              <Alert>
                <AlertDescription>
                  This invoice is not in INR or client is not from India. Please use international payment methods.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                {/* UPI Payment */}
                {showUPI && (
                  <div className="border rounded-lg p-4 space-y-4 hover:border-primary transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold">UPI Payment</h3>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Recommended
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Scan QR code or pay via UPI app. Instant confirmation.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">
                            <Check className="h-3 w-3 mr-1" />
                            Instant
                          </Badge>
                          <Badge variant="outline">
                            <Check className="h-3 w-3 mr-1" />
                            0% fee
                          </Badge>
                          <Badge variant="outline">
                            <Check className="h-3 w-3 mr-1" />
                            Mobile friendly
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={handleUPIPayment}
                      disabled={!settings?.upiId || generatingQR}
                    >
                      {generatingQR ? (
                        'Generating QR...'
                      ) : (
                        <>
                          Generate Payment QR
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    {!settings?.upiId && (
                      <p className="text-xs text-destructive">
                        UPI ID not configured in payment settings
                      </p>
                    )}
                  </div>
                )}

                {/* Bank Transfer */}
                {requiresBankTransfer && (
                  <div className="border rounded-lg p-4 space-y-4 border-orange-200 bg-orange-50">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-orange-600" />
                          <h3 className="font-semibold text-orange-900">Bank Transfer</h3>
                          <Badge className="bg-orange-200 text-orange-900">
                            For large amounts
                          </Badge>
                        </div>
                        <p className="text-sm text-orange-800">
                          For amounts above ₹{(settings?.bankTransferThreshold || 100000).toLocaleString('en-IN')}, 
                          bank transfer is recommended for security.
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline" className="border-orange-300">
                            <Check className="h-3 w-3 mr-1" />
                            Secure
                          </Badge>
                          <Badge variant="outline" className="border-orange-300">
                            <Check className="h-3 w-3 mr-1" />
                            0% fee
                          </Badge>
                          <Badge variant="outline" className="border-orange-300">
                            1-2 hours verification
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button 
                      className="w-full bg-orange-600 hover:bg-orange-700" 
                      onClick={handleBankTransfer}
                      disabled={!settings?.accountNumber || generatingQR}
                    >
                      {generatingQR ? (
                        'Loading...'
                      ) : (
                        <>
                          View Bank Transfer Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                    {!settings?.accountNumber && (
                      <p className="text-xs text-destructive">
                        Bank details not configured in payment settings
                      </p>
                    )}
                  </div>
                )}

                {!settings?.upiId && !settings?.accountNumber && (
                  <Alert>
                    <AlertTitle>Payment methods not configured</AlertTitle>
                    <AlertDescription>
                      Please configure your UPI ID or bank account details in payment settings to accept payments.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}
          </TabsContent>

          {/* International Payment Methods */}
          <TabsContent value="international" className="space-y-4 mt-4">
            <div className="border rounded-lg p-4 space-y-4 hover:border-primary transition-colors">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Dodo Payments</h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      International
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Accept payments globally with credit/debit cards, digital wallets, and local payment methods.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">
                      <Check className="h-3 w-3 mr-1" />
                      150+ countries
                    </Badge>
                    <Badge variant="outline">
                      <Check className="h-3 w-3 mr-1" />
                      Multiple currencies
                    </Badge>
                    <Badge variant="outline">
                      <Check className="h-3 w-3 mr-1" />
                      Secure checkout
                    </Badge>
                  </div>
                </div>
              </div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleDodoCheckout}
                disabled={!settings?.enableInternational || !settings?.dodoApiKey || creatingCheckout}
              >
                {creatingCheckout ? (
                  'Creating checkout...'
                ) : (
                  <>
                    Pay with Dodo Payments
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              {(!settings?.enableInternational || !settings?.dodoApiKey) && (
                <Alert>
                  <AlertTitle>International payments not configured</AlertTitle>
                  <AlertDescription>
                    Enable international payments and configure your Dodo Payments API key in payment settings.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Smart Routing Info */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Smart Routing:</strong> Payment method automatically selected based on amount, currency, and client location for optimal experience.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
