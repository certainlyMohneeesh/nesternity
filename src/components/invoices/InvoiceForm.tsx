'use client'

import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { generatePdf } from '@/lib/generatePdf'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Client {
  id: string
  name: string
  email: string
}

interface InvoiceFormProps {
  clients: Client[]
}

export default function InvoiceForm({ clients }: InvoiceFormProps) {
  const { register, handleSubmit } = useForm()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    clientId: '',
    dueDate: '',
    notes: '',
    taxRate: '0',
    discount: '0',
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    if (!data.invoiceNumber || !data.clientId || !data.dueDate) {
      toast.error('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const result = await generatePdf(data)
      toast.success(`Invoice ${result.invoice.invoiceNumber} created successfully!`)

      // Reset form
      setFormData({
        invoiceNumber: '',
        clientId: '',
        dueDate: '',
        notes: '',
        taxRate: '0',
        discount: '0',
      })
    } catch (error) {
      console.error('Error generating invoice:', error)
      toast.error('Failed to generate invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Invoice Number (e.g. INV-0001)"
                {...register('invoiceNumber')}
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                required
              />
            </div>
            <div>
              <Input
                placeholder="Due Date (YYYY-MM-DD)"
                type="date"
                {...register('dueDate')}
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Select value={formData.clientId} onValueChange={(value) => handleInputChange('clientId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} ({client.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                placeholder="Tax Rate (e.g. 18%)"
                type="number"
                {...register('taxRate')}
                value={formData.taxRate}
                onChange={(e) => handleInputChange('taxRate', e.target.value)}
              />
            </div>
            <div>
              <Input
                placeholder="Discount (%)"
                type="number"
                {...register('discount')}
                value={formData.discount}
                onChange={(e) => handleInputChange('discount', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Textarea
              placeholder="Notes (Optional)"
              {...register('notes')}
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Generating...' : 'Generate PDF Invoice'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
