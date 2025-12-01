"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Plus, Trash2, Send } from "lucide-react";
import { toast } from "sonner";

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
}

interface RecurringInvoiceFormProps {
  clients: Array<{
    id: string;
    name: string;
    email: string;
    company: string | null;
  }>;
  userId: string;
  orgId: string;
  projectId: string;
}

export default function RecurringInvoiceForm({
  clients,
  userId,
  orgId,
  projectId,
}: RecurringInvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form state
  const [clientId, setClientId] = useState("");
  const [recurrence, setRecurrence] = useState<"WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY">("MONTHLY");
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, rate: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");

  // Automation settings
  const [autoGenerateEnabled, setAutoGenerateEnabled] = useState(true);
  const [autoSendEnabled, setAutoSendEnabled] = useState(false);
  const [sendDayOfPeriod, setSendDayOfPeriod] = useState<number | null>(null);
  const [recipientEmails, setRecipientEmails] = useState("");
  const [maxOccurrences, setMaxOccurrences] = useState<number | null>(null);

  // Add invoice item
  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0 }]);
  };

  // Remove invoice item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item field
  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const taxAmount = subtotal * (taxRate / 100);
  const discountAmount = subtotal * (discount / 100);
  const total = subtotal + taxAmount - discountAmount;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[RecurringInvoiceForm] Submitting form');

    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    if (items.some(item => !item.description || item.rate <= 0)) {
      toast.error("Please fill in all item details");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        clientId,
        projectId,
        organisationId: orgId,
        recurrence,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          rate: item.rate,
          total: item.quantity * item.rate,
        })),
        taxRate,
        discount,
        currency,
        notes: notes || undefined,
        autoGenerateEnabled,
        autoSendEnabled,
        sendDayOfPeriod,
        recipientEmails: recipientEmails
          ? recipientEmails.split(",").map(e => e.trim()).filter(Boolean)
          : [],
        maxOccurrences,
      };

      console.log('[RecurringInvoiceForm] Payload:', payload);

      const response = await fetch("/api/invoices/recurring/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log('[RecurringInvoiceForm] Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        console.error('[RecurringInvoiceForm] Error response:', error);
        throw new Error(error.error || "Failed to create recurring invoice");
      }

      const data = await response.json();
      console.log('[RecurringInvoiceForm] Created invoice:', data.invoice.invoiceNumber);

      toast.success("Recurring invoice template created!", {
        description: `Invoice ${data.invoice.invoiceNumber} will be generated ${recurrence.toLowerCase()}`,
      });

      router.push(`/dashboard/organisation/${orgId}/projects/${projectId}/invoices/recurring`);
      router.refresh();
    } catch (error) {
      console.error("[RecurringInvoiceForm] Failed to create recurring invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create recurring invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Client Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
          <CardDescription>Select the client for this recurring invoice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.company ? `(${client.company})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
          <CardDescription>Add items that will appear on each invoice</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="grid gap-4 md:grid-cols-[2fr,1fr,1fr,auto] items-end">
              <div className="space-y-2">
                <Label htmlFor={`description-${index}`}>Description *</Label>
                <Input
                  id={`description-${index}`}
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Service or product description"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`quantity-${index}`}>Quantity *</Label>
                <Input
                  id={`quantity-${index}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`rate-${index}`}>Rate *</Label>
                <Input
                  id={`rate-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addItem} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardContent>
      </Card>

      {/* Pricing Details */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Total Summary */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">{currency} {subtotal.toFixed(2)}</span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({taxRate}%):</span>
                <span className="font-medium">{currency} {taxAmount.toFixed(2)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount ({discount}%):</span>
                <span className="font-medium text-red-600">-{currency} {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span>{currency} {total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recurrence Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Recurrence Settings</CardTitle>
          <CardDescription>Configure how often this invoice should be generated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="recurrence">Frequency *</Label>
              <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly (Every 3 months)</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sendDay">
                {recurrence === "WEEKLY" ? "Day of Week" : "Day of Month"}
              </Label>
              <Input
                id="sendDay"
                type="number"
                min={recurrence === "WEEKLY" ? 1 : 1}
                max={recurrence === "WEEKLY" ? 7 : 31}
                value={sendDayOfPeriod || ""}
                onChange={(e) => setSendDayOfPeriod(e.target.value ? parseInt(e.target.value) : null)}
                placeholder={recurrence === "WEEKLY" ? "1-7 (Mon-Sun)" : "1-31"}
              />
              <p className="text-xs text-muted-foreground">
                {recurrence === "WEEKLY"
                  ? "1 = Monday, 7 = Sunday"
                  : "Leave empty to use current day"}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxOccurrences">Maximum Occurrences (Optional)</Label>
            <Input
              id="maxOccurrences"
              type="number"
              min="1"
              value={maxOccurrences || ""}
              onChange={(e) => setMaxOccurrences(e.target.value ? parseInt(e.target.value) : null)}
              placeholder="Leave empty for unlimited"
            />
            <p className="text-xs text-muted-foreground">
              Invoice will stop generating after this many occurrences
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Settings</CardTitle>
          <CardDescription>Configure automatic generation and sending</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoGenerate">Auto-Generate Invoices</Label>
              <p className="text-sm text-muted-foreground">
                Automatically create new invoices on schedule
              </p>
            </div>
            <Switch
              id="autoGenerate"
              checked={autoGenerateEnabled}
              onCheckedChange={setAutoGenerateEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoSend">Auto-Send to Client</Label>
              <p className="text-sm text-muted-foreground">
                Automatically email invoice to client with AI-generated message
              </p>
            </div>
            <Switch
              id="autoSend"
              checked={autoSendEnabled}
              onCheckedChange={setAutoSendEnabled}
            />
          </div>

          {autoSendEnabled && (
            <div className="space-y-2 pl-4 border-l-2">
              <Label htmlFor="recipients">Additional Recipients (Optional)</Label>
              <Input
                id="recipients"
                value={recipientEmails}
                onChange={(e) => setRecipientEmails(e.target.value)}
                placeholder="email1@example.com, email2@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated email addresses to CC (client is auto-included)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes or terms for the invoice..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Send className="h-4 w-4 mr-2" />
          Create Recurring Invoice
        </Button>
      </div>
    </form>
  );
}
