import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import QrRenderer from '@/components/QrRenderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, IndianRupee, Building2, CreditCard } from 'lucide-react';
import { headers } from 'next/headers';

interface PaymentPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function trackVisit(qrId: string) {
  'use server';
  try {
    const headersList = await headers();
    const ipAddress =
      headersList.get('x-forwarded-for')?.split(',')[0] ||
      headersList.get('x-real-ip') ||
      'unknown';
    const userAgent = headersList.get('user-agent') || 'unknown';

    await prisma.qrVisit.create({
      data: {
        qrId,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to track visit:', error);
  }
}

export default async function PaymentPage({ params }: PaymentPageProps) {
  const { id } = await params;

  // Fetch QR details
  const upiQr = await prisma.upiQr.findUnique({
    where: { id },
    include: {
      paymentSettings: {
        select: {
          upiId: true,
          upiMerchantName: true,
          businessName: true,
          contactEmail: true,
          contactPhone: true,
          accountNumber: true,
          ifscCode: true,
          bankName: true,
          branchName: true,
          accountHolderName: true,
          bankTransferThreshold: true,
        },
      },
    },
  });

  if (!upiQr || !upiQr.isActive) {
    notFound();
  }

  // Check if expired
  if (upiQr.expiresAt && new Date() > upiQr.expiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Payment Link Expired
            </h1>
            <p className="text-gray-600">
              This payment link has expired. Please contact the merchant for a new
              payment link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Track visit (async, non-blocking)
  trackVisit(id).catch(console.error);

  const { paymentSettings } = upiQr;
  const merchantName =
    paymentSettings.upiMerchantName || paymentSettings.businessName || 'Merchant';
  const amount = upiQr.amount;
  const showBankTransfer =
    amount && paymentSettings.bankTransferThreshold
      ? amount >= paymentSettings.bankTransferThreshold
      : false;

  // Generate UPI deep link
  const upiDeepLink = new URL('upi://pay');
  upiDeepLink.searchParams.set('pa', paymentSettings.upiId!);
  upiDeepLink.searchParams.set('pn', merchantName);
  if (amount) upiDeepLink.searchParams.set('am', amount.toString());
  if (upiQr.note) upiDeepLink.searchParams.set('tn', upiQr.note);
  upiDeepLink.searchParams.set('cu', 'INR');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Payment Card */}
        <Card className="shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="text-center border-b bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 text-white py-6">
            <CardTitle className="text-2xl font-bold">Payment Request</CardTitle>
            <p className="text-blue-100 dark:text-blue-200 mt-2">from {merchantName}</p>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Amount Display */}
            {amount && (
              <div className="text-center">
                <div className="flex items-center justify-center text-4xl font-bold text-gray-900 dark:text-gray-100">
                  <IndianRupee className="h-8 w-8" />
                  {amount.toLocaleString('en-IN', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
                {upiQr.note && (
                  <p className="text-gray-600 dark:text-gray-400 mt-2">{upiQr.note}</p>
                )}
              </div>
            )}

            <Separator className="dark:bg-gray-700" />

            {/* QR Code Section */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold dark:text-gray-100 mb-2">
                  Scan to Pay via UPI
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Use any UPI app to scan this QR code
                </p>
              </div>

              <div className="flex justify-center">
                <QrRenderer
                  upiId={paymentSettings.upiId!}
                  merchantName={merchantName}
                  amount={amount || undefined}
                  note={upiQr.note || undefined}
                  size={280}
                  showDownload={true}
                />
              </div>

              {/* Mobile UPI Button */}
              <div className="text-center">
                <a
                  href={upiDeepLink.toString()}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  <CreditCard className="h-5 w-5" />
                  Pay with UPI App
                </a>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Opens your default UPI app
                </p>
              </div>
            </div>

            {/* UPI ID Display */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">UPI ID</p>
              <p className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
                {paymentSettings.upiId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Transfer Card (for large amounts) */}
        {showBankTransfer && paymentSettings.accountNumber && (
          <Card className="shadow-lg border-orange-200 dark:border-orange-800 dark:bg-gray-800">
            <CardHeader className="bg-orange-50 dark:bg-orange-900/20 border-b dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <CardTitle className="text-lg text-orange-900 dark:text-orange-300">
                  Alternative: Bank Transfer
                </CardTitle>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                For amounts above ₹
                {paymentSettings.bankTransferThreshold?.toLocaleString('en-IN')}
              </p>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Account Holder</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {paymentSettings.accountHolderName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Account Number</p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {paymentSettings.accountNumber}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">IFSC Code</p>
                  <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                    {paymentSettings.ifscCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Bank Name</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {paymentSettings.bankName}
                  </p>
                </div>
              </div>
              {paymentSettings.branchName && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Branch</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {paymentSettings.branchName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Contact Info */}
        {(paymentSettings.contactEmail || paymentSettings.contactPhone) && (
          <Card className="shadow-md dark:bg-gray-800 dark:border-gray-700">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                Need help? Contact us
              </p>
              <div className="flex justify-center gap-4 text-sm">
                {paymentSettings.contactEmail && (
                  <a
                    href={`mailto:${paymentSettings.contactEmail}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {paymentSettings.contactEmail}
                  </a>
                )}
                {paymentSettings.contactPhone && (
                  <a
                    href={`tel:${paymentSettings.contactPhone}`}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {paymentSettings.contactPhone}
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          Powered by Nesternity • Secure Payment Gateway
        </p>
      </div>
    </div>
  );
}
