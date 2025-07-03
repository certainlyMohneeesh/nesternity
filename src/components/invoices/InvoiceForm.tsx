'use client'

import { useForm } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { generatePdf } from '@/lib/pdf/generatePdf'

export default function InvoiceForm({ clientId }: { clientId: string }) {
  const { register, handleSubmit } = useForm()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (data: any) => {
    setLoading(true)
    await generatePdf({ ...data, clientId })
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input placeholder="Invoice Number (e.g. INV-0001)" {...register('invoiceNumber')} />
      <Input placeholder="Due Date (YYYY-MM-DD)" type="date" {...register('dueDate')} />
      <Textarea placeholder="Notes (Optional)" {...register('notes')} />
      <Input placeholder="Tax Rate (e.g. 18%)" type="number" {...register('taxRate')} />
      <Input placeholder="Discount (%)" type="number" {...register('discount')} />
      {/* Add dynamic InvoiceItem array inputs here if needed */}
      <Button type="submit" disabled={loading}>
        {loading ? 'Generating...' : 'Generate PDF Invoice'}
      </Button>
    </form>
  )
}
