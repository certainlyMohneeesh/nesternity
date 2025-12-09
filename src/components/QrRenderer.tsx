'use client';

import { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QrRendererProps {
  upiId: string;
  merchantName?: string;
  amount?: number;
  note?: string;
  size?: number;
  showDownload?: boolean;
}

export default function QrRenderer({
  upiId,
  merchantName,
  amount,
  note,
  size = 300,
  showDownload = true,
}: QrRendererProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrCode, setQrCode] = useState<QRCodeStyling | null>(null);

  useEffect(() => {
    // Build UPI payment URL
    const upiUrl = new URL(`upi://pay`);
    upiUrl.searchParams.set('pa', upiId);
    if (merchantName) upiUrl.searchParams.set('pn', merchantName);
    if (amount) upiUrl.searchParams.set('am', amount.toString());
    if (note) upiUrl.searchParams.set('tn', note);
    upiUrl.searchParams.set('cu', 'INR');

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'canvas',
      data: upiUrl.toString(),
      image: '/logo.png', // Optional: Add your logo
      dotsOptions: {
        color: '#000000',
        type: 'rounded',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 10,
        imageSize: 0.4,
      },
      cornersSquareOptions: {
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        type: 'dot',
      },
    });

    setQrCode(qr);

    if (ref.current) {
      ref.current.innerHTML = '';
      qr.append(ref.current);
    }
  }, [upiId, merchantName, amount, note, size]);

  const handleDownload = () => {
    if (qrCode) {
      qrCode.download({
        name: `payment-qr-${crypto.randomUUID()}`,
        extension: 'png',
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={ref}
        className="rounded-lg border-2 border-gray-200 p-4 bg-white shadow-sm"
      />
      {showDownload && (
        <Button onClick={handleDownload} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
      )}
    </div>
  );
}
