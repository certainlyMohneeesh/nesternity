'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Eye, 
  Calendar,
  DollarSign,
  User,
  Building2,
  FileText,
  Send,
  Check,
  Clock,
  AlertTriangle,
  Plus
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  items: InvoiceItem[];
  notes?: string;
  projectName?: string;
}

interface DemoInvoiceCardProps {
  invoice: Invoice;
  onView?: (invoice: Invoice) => void;
  onDownload?: (invoice: Invoice) => void;
  onSend?: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
}

export function DemoInvoiceCard({ invoice, onView, onDownload, onSend, onEdit }: DemoInvoiceCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700 border-green-200';
      case 'SENT': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'OVERDUE': return 'bg-red-100 text-red-700 border-red-200';
      case 'DRAFT': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'CANCELLED': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <Check className="h-3 w-3" />;
      case 'SENT': return <Send className="h-3 w-3" />;
      case 'OVERDUE': return <AlertTriangle className="h-3 w-3" />;
      case 'DRAFT': return <FileText className="h-3 w-3" />;
      case 'CANCELLED': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleDemoDownload = () => {
    // Create a demo PDF download
    const demoInvoiceContent = `
INVOICE #${invoice.invoiceNumber}

From: Nesternity Inc.
123 Business Ave
Tech City, TC 12345
contact@nesternity.com

To: ${invoice.clientCompany}
${invoice.clientName}
${invoice.clientEmail}

Invoice Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
${invoice.projectName ? `Project: ${invoice.projectName}` : ''}

ITEMS:
${invoice.items.map(item => 
  `${item.description} - Qty: ${item.quantity} x ${formatCurrency(item.rate)} = ${formatCurrency(item.amount)}`
).join('\n')}

Subtotal: ${formatCurrency(invoice.subtotal)}
Tax: ${formatCurrency(invoice.tax)}
TOTAL: ${formatCurrency(invoice.total)}

${invoice.notes ? `Notes: ${invoice.notes}` : ''}

Thank you for your business!
    `.trim();

    const blob = new Blob([demoInvoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${invoice.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    onDownload?.(invoice);
  };

  const isOverdue = new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID';

  return (
    <Card className={`hover:shadow-lg transition-all duration-200 ${isOverdue ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">
              #{invoice.invoiceNumber}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span>{invoice.clientCompany}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-3 w-3" />
              <span>{invoice.clientName}</span>
            </div>
          </div>
          <Badge className={`${getStatusColor(invoice.status)} gap-1`}>
            {getStatusIcon(invoice.status)}
            {invoice.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Amount and Dates */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Total Amount</span>
            </div>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(invoice.total, invoice.currency)}
            </span>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <div>
              <div className="text-xs text-muted-foreground">Issue Date</div>
              <div>{new Date(invoice.issueDate).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <div>
              <div className="text-xs text-muted-foreground">Due Date</div>
              <div className={isOverdue ? 'text-red-600 font-medium' : ''}>
                {new Date(invoice.dueDate).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Project Information */}
        {invoice.projectName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-3 w-3" />
            <span>Project: {invoice.projectName}</span>
          </div>
        )}

        {/* Items Summary */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Items ({invoice.items.length})</div>
          <div className="space-y-1">
            {invoice.items.slice(0, 2).map((item) => (
              <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                <span>{item.description}</span>
                <span>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            {invoice.items.length > 2 && (
              <div className="text-xs text-muted-foreground text-center py-1">
                +{invoice.items.length - 2} more items
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onView?.(invoice)}
          >
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDemoDownload}
          >
            <Download className="h-3 w-3 mr-1" />
            PDF
          </Button>
          {invoice.status === 'DRAFT' && (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => onSend?.(invoice)}
            >
              <Send className="h-3 w-3 mr-1" />
              Send
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface InvoiceListProps {
  invoices: Invoice[];
  onAddInvoice?: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onDownloadInvoice?: (invoice: Invoice) => void;
  onSendInvoice?: (invoice: Invoice) => void;
  onEditInvoice?: (invoice: Invoice) => void;
}

export function InvoiceList({ 
  invoices, 
  onAddInvoice, 
  onViewInvoice, 
  onDownloadInvoice, 
  onSendInvoice, 
  onEditInvoice 
}: InvoiceListProps) {
  const totalRevenue = invoices
    .filter(inv => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.total, 0);
  
  const pendingAmount = invoices
    .filter(inv => inv.status === 'SENT')
    .reduce((sum, inv) => sum + inv.total, 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'OVERDUE')
    .reduce((sum, inv) => sum + inv.total, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Invoice Management</h3>
          <p className="text-sm text-muted-foreground">
            Create, send, and track your invoices
          </p>
        </div>
        <Button onClick={onAddInvoice} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
                <div className="text-lg font-semibold text-green-600">
                  ${totalRevenue.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-lg font-semibold text-blue-600">
                  ${pendingAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Overdue</div>
                <div className="text-lg font-semibold text-red-600">
                  ${overdueAmount.toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.map((invoice) => (
          <DemoInvoiceCard
            key={invoice.id}
            invoice={invoice}
            onView={onViewInvoice}
            onDownload={onDownloadInvoice}
            onSend={onSendInvoice}
            onEdit={onEditInvoice}
          />
        ))}
      </div>

      {/* Empty State */}
      {invoices.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Create your first invoice to start billing clients
          </p>
          <Button onClick={onAddInvoice} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Invoice
          </Button>
        </div>
      )}
    </div>
  );
}
