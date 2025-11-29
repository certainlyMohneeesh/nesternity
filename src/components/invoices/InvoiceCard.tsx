import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Eye, Download, Calendar, DollarSign, User, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { DownloadInvoiceButton } from './DownloadButton';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoiceDocument } from '../pdf/InvoiceDocument';
import { useRouter } from 'next/navigation';

const statusColors: Record<string, string> = {
  PENDING: 'border-yellow-400',
  PAID: 'border-green-500',
  OVERDUE: 'border-red-500',
  CANCELLED: 'border-gray-400',
};

const statusBadge: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

import { formatCurrencyWithDisplay } from '@/lib/utils';

export interface InvoiceCardProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    dueDate: string;
    issuedDate: string;
    pdfUrl?: string | null;
    taxRate: number;
    discount: number;
    currency: string;
    notes?: string;
    client: {
      id: string;
      name: string;
      email: string;
    };
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      rate: number;
      total: number;
    }>;
  };
  organisationId?: string;
  projectId?: string;
  onStatusChange?: (status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED') => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, organisationId, projectId, onStatusChange }) => {
  const router = useRouter();
  const [status, setStatus] = useState<"PENDING" | "PAID" | "OVERDUE" | "CANCELLED">(invoice.status);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const total = invoice.items.reduce((sum, item) => sum + item.total, 0);
  // Format total to show currency code (e.g. 'INR 35,000.00')
  const formattedTotal = formatCurrencyWithDisplay(total, invoice.currency, 'en-US', 'code');

  const handleStatusChange = async (newStatus: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED") => {
    if (newStatus === status) return;
    setStatus(newStatus);
    setUpdating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        throw new Error((await res.json()).error || 'Failed to update status');
      }
      toast.success('Invoice status updated');
      if (onStatusChange) onStatusChange(newStatus);
    } catch (err: any) {
      setStatus(invoice.status); // rollback
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || 'Failed to delete invoice');
      }

      toast.success('Invoice deleted successfully');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className={`hover:shadow-lg transition-all border-l-4 ${statusColors[status]} relative`}>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold">Invoice #{invoice.invoiceNumber}</CardTitle>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{invoice.client.name}</span>
            <span className="text-gray-400">({invoice.client.email})</span>
          </div>
        </div>
        <Badge className={statusBadge[status]}>{status}</Badge>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Total Amount</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {formattedTotal}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>Status:</span>
          <Select value={status} onValueChange={handleStatusChange} disabled={updating}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          {updating && <span className="ml-2 animate-spin h-4 w-4 border-b-2 border-primary rounded-full"></span>}
        </div>
        <div className="flex gap-2 mt-4">
          <PDFDownloadLink
            document={
              <InvoiceDocument
                invoice={{
                  ...invoice,
                  createdAt: (invoice as any).createdAt ?? invoice.issuedDate
                }}
              />
            }
            fileName={`invoice-${invoice.invoiceNumber}.pdf`}
          >
            {({ loading }) => (
              <Button
                variant="secondary"
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {loading ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            )}
          </PDFDownloadLink>
          <Button asChild variant="outline" size="sm">
            <a href={
              organisationId && projectId
                ? `/dashboard/organisation/${organisationId}/projects/${projectId}/invoices/${invoice.id}`
                : `/dashboard/invoices/${invoice.id}`
            }>
              <Eye className="h-4 w-4 mr-1" /> View
            </a>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete invoice <strong>{invoice.invoiceNumber}</strong>?
                  This action cannot be undone and will permanently remove the invoice and all its items.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete Invoice
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
