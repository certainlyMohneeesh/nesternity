'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { toast } from 'sonner'

interface Plan {
  name: string
  price: number
  priceId: string
  features: string[]
}

interface PricingCardProps {
  plan: Plan
  isPopular?: boolean
  ctaText: string
  ctaAction: 'free' | 'subscription'
}

export function PricingCard({ plan, isPopular, ctaText, ctaAction }: PricingCardProps) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    if (ctaAction === 'free') {
      // Handle free plan signup
      window.location.href = '/auth'
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/stripe/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.priceId,
        }),
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`relative ${isPopular ? 'border-primary scale-105' : ''}`}>
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <div className="mt-4">
          <span className="text-4xl font-bold">₹{plan.price}</span>
          {plan.price > 0 && <span className="text-gray-600">/month</span>}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-center gap-3">
              <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
        
        <Button
          className="w-full"
          variant={isPopular ? 'default' : 'outline'}
          onClick={handleSubscribe}
          disabled={loading}
        >
          {loading ? 'Loading...' : ctaText}
        </Button>
      </CardContent>
    </Card>
  )
}
