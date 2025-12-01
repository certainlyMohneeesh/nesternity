'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'

const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  rate: z.number().min(0, 'Rate must be positive'),
})

const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  clientId: z.string().min(1, 'Client is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(100),
  discount: z.number().min(0).max(100),
  currency: z.string(),
  isRecurring: z.boolean(),
  recurrence: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  nextIssueDate: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  enablePaymentLink: z.boolean(),
  watermarkText: z.string().optional(),
  eSignatureUrl: z.string().url().optional().or(z.literal('')),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

interface Client {
  id: string
  name: string
  email: string
  company?: string
}

interface Organisation {
  id: string
  name: string
  email: string
}

interface InvoiceFormProps {
  teamId?: string // Optional team context
  organisationId?: string // Organisation ID for data scoping
  projectId?: string // Project ID for project-level isolation
  organisation?: Organisation | null // Organisation details for auto-client creation
  clients?: Client[] // Optional pre-fetched clients (for backward compatibility)
  onSuccess?: () => void
}

export default function InvoiceForm({ teamId, organisationId, projectId, organisation, clients: propClients, onSuccess }: InvoiceFormProps) {
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>(propClients || [])
  const [fetchingClients, setFetchingClients] = useState(false)
  const [creatingClient, setCreatingClient] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: '',
      clientId: '',
      dueDate: '',
      notes: '',
      taxRate: 0,
      discount: 0,
      currency: 'INR',
      isRecurring: false,
      enablePaymentLink: false,
      watermarkText: '',
      eSignatureUrl: '',
      items: [{ description: '', quantity: 1, rate: 0 }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const watchedItems = watch('items')
  const taxRate = watch('taxRate')
  const discount = watch('discount')

  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0)
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = subtotal * (discount / 100)
  const total = subtotal + taxAmount - discountAmount

  // Fetch clients if not provided as props
  const fetchClients = async () => {
    if (propClients && propClients.length > 0) {
      return // Use provided clients
    }

    setFetchingClients(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Authentication required')
        return
      }

      // Build endpoint with organisationId filter
      const params = new URLSearchParams()
      if (organisationId) {
        params.append('organisationId', organisationId)
      }

      const endpoint = teamId
        ? `/api/teams/${teamId}/clients${params.toString() ? `?${params}` : ''}`
        : `/api/clients${params.toString() ? `?${params}` : ''}`

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()

        // Auto-create default client if none exist and we have organisation details
        if (data.length === 0 && organisationId && organisation) {
          console.log('[InvoiceForm] No clients found, auto-creating default client for organisation')
          await createDefaultClient(session.access_token)
        } else {
          setClients(data)
        }
      } else {
        throw new Error('Failed to fetch clients')
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
      toast.error('Failed to fetch clients')
    } finally {
      setFetchingClients(false)
    }
  }

  // Create default client using organisation details
  const createDefaultClient = async (token: string) => {
    if (!organisation || !organisationId) return

    setCreatingClient(true)
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: organisation.name,
          email: organisation.email,
          company: organisation.name,
          organisationId: organisationId,
          status: 'ACTIVE'
        })
      })

      if (response.ok) {
        const newClient = await response.json()
        console.log('[InvoiceForm] Auto-created default client:', newClient.id)
        setClients([newClient])
        toast.success('Default client created for your organisation')
      } else {
        throw new Error('Failed to create default client')
      }
    } catch (error) {
      console.error('Error creating default client:', error)
      toast.error('Failed to create default client')
    } finally {
      setCreatingClient(false)
    }
  }

  // Load clients on component mount ok implement this on all mounts yaad rakh bhai
  useEffect(() => {
    fetchClients()
  }, [teamId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onSubmit = async (data: InvoiceFormData) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error('Authentication required')
        return
      }

      // Include organisationId and projectId in the payload
      const payload = {
        ...data,
        organisationId,
        projectId
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Invoice creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        throw new Error(errorData.details || errorData.error || `HTTP ${response.status}: Failed to create invoice`)
      }

      const invoice = await response.json()
      toast.success(`Invoice ${invoice.invoiceNumber} created successfully!`)
      reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating invoice:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number *</Label>
              <Input
                id="invoiceNumber"
                {...register('invoiceNumber')}
                placeholder="e.g. INV-0001"
              />
              {errors.invoiceNumber && (
                <p className="text-sm text-red-500">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-500">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <Select
              onValueChange={(value) => setValue('clientId', value === 'none' ? '' : value)}
              disabled={fetchingClients || creatingClient}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  creatingClient
                    ? "Creating default client..."
                    : fetchingClients
                      ? "Loading clients..."
                      : "Select a client"
                } />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 && !fetchingClients && !creatingClient ? (
                  <SelectItem value="none" disabled>
                    No clients available
                  </SelectItem>
                ) : (
                  clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company && `(${client.company})`} - {client.email}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-red-500">{errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Invoice Items</Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => append({ description: '', quantity: 1, rate: 0 })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                <div className="md:col-span-2 space-y-2">
                  <Label htmlFor={`items.${index}.description`}>Description</Label>
                  <Input
                    {...register(`items.${index}.description`)}
                    placeholder="Item description"
                  />
                  {errors.items?.[index]?.description && (
                    <p className="text-sm text-red-500">{errors.items[index]?.description?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.quantity`}>Quantity</Label>
                  <Input
                    type="number"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    placeholder="1"
                  />
                  {errors.items?.[index]?.quantity && (
                    <p className="text-sm text-red-500">{errors.items[index]?.quantity?.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`items.${index}.rate`}>Rate</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.rate`, { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {errors.items?.[index]?.rate && (
                    <p className="text-sm text-red-500">{errors.items[index]?.rate?.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                step="0.01"
                {...register('taxRate', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                {...register('discount', { valueAsNumber: true })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select onValueChange={(value) => setValue('currency', value)} defaultValue="INR">
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-4">
            <Checkbox
              id="enablePaymentLink"
              {...register('enablePaymentLink')}
            />
            <Label htmlFor="enablePaymentLink" className="font-normal">
              Enable "Pay Now" button for online payments
            </Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="watermarkText">Watermark Text (Optional)</Label>
              <Input
                id="watermarkText"
                {...register('watermarkText')}
                placeholder="e.g., CONFIDENTIAL, DRAFT, COPY"
              />
              <p className="text-xs text-gray-500">
                Add a watermark text that will appear across the PDF background
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="eSignatureUrl">E-Signature URL (Optional)</Label>
              <Input
                id="eSignatureUrl"
                {...register('eSignatureUrl')}
                placeholder="https://example.com/signature.png"
                type="url"
              />
              <p className="text-xs text-gray-500">
                URL to your digital signature image (PNG or JPG)
              </p>
              {errors.eSignatureUrl && (
                <p className="text-sm text-red-500">{errors.eSignatureUrl.message}</p>
              )}
            </div>
          </div>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({taxRate}%):</span>
                <span>₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount ({discount}%):</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating Invoice...' : 'Create Invoice'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
