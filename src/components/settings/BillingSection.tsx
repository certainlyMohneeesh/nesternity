import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export function BillingSection() {
  return (
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
        <div className="text-center py-6">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h4 className="font-medium mb-2">You are on the Free plan</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Enjoy unlimited access to all free features. Upgrade options coming soon.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
