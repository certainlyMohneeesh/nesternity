"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsage, setSelectedUsage] = useState<any>(null)
  const [usageOpen, setUsageOpen] = useState(false)

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/subscriptions')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setSubscriptions(data.subscriptions)
      setPlans(data.plans)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load subscriptions')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  async function assignPlan(userId: string, planId: string, planTier: string) {
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ userId, razorpayPlanId: planId, planTier }),
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) throw new Error('Failed to assign plan')
      toast.success('Plan assigned')
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Failed to assign plan')
    }
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold">Subscriptions</h1>
          <Button onClick={() => fetchData()}>Refresh</Button>
        </div>
        <div className="grid gap-6">
          <Card className="border-0 shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium">Create Plan</h2>
                <p className="text-sm text-muted-foreground">Create a new subscription plan</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input placeholder="Plan Name" id="plan-name" className="border px-2 py-1 rounded" />
              <input placeholder="Razorpay Plan ID" id="plan-rpid" className="border px-2 py-1 rounded" />
              <input placeholder="Tier (FREE/STARTER/.. )" id="plan-tier" className="border px-2 py-1 rounded" />
              <input placeholder="Amount (paise)" id="plan-amount" type="number" className="border px-2 py-1 rounded" />
            </div>
            <div className="mt-4">
              <Button onClick={async () => {
                const name = (document.getElementById('plan-name') as HTMLInputElement).value
                const rpid = (document.getElementById('plan-rpid') as HTMLInputElement).value
                const tier = (document.getElementById('plan-tier') as HTMLInputElement).value
                const amount = Number((document.getElementById('plan-amount') as HTMLInputElement).value)
                try {
                  const res = await fetch('/api/admin/plans', { method: 'POST', body: JSON.stringify({ razorpayPlanId: rpid, name, tier, amount }), headers: { 'Content-Type': 'application/json' } })
                  if (!res.ok) throw new Error('Failed')
                  toast.success('Plan created')
                  fetchData()
                } catch (err) { console.error(err); toast.error('Failed to create plan') }
              }}>Create Plan</Button>
            </div>
          </Card>
          {loading && <div className="text-muted-foreground">Loading...</div>}

          {subscriptions.map((s) => (
            <Card key={s.id} className="border-0 shadow">
              <CardHeader>
                <CardTitle>{s?.user?.displayName || s?.user?.email || 'User'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <div className="text-sm text-muted-foreground">Plan</div>
                    <div className="text-base font-medium">{s.planTier || 'FREE'}</div>
                    <div className="text-sm text-muted-foreground">Razorpay ID: {s.razorpayPlanId}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={(val) => {
                      const p = plans.find(pl => pl.razorpayPlanId === val)
                      assignPlan(s.userId, val, p?.tier || 'STARTER')
                    }}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {plans.map((p: any) => (
                          <SelectItem key={p.id} value={p.razorpayPlanId}>{p.name} ({p.tier})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const res = await fetch(`/api/usage/${s.userId}`)
                        const data = await res.json()
                        setSelectedUsage({ user: s.user, usage: data.usage })
                        setUsageOpen(true)
                      } catch (err) { console.error(err); toast.error('Failed to fetch usage') }
                    }}>View Usage</Button>
                    {!s.razorpaySubscriptionId && (
                      <Button variant="secondary" size="sm" onClick={async () => {
                        try {
                          const payload = { userId: s.userId, name: s.user?.displayName || s.user?.email, email: s.user?.email, contact: s.user?.phone || '', razorpayPlanId: plans[0]?.razorpayPlanId }
                          const res = await fetch('/api/razorpay/subscription/create', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
                          if (!res.ok) throw new Error('Failed to create subscription')
                          toast.success('Razorpay subscription created')
                          fetchData()
                        } catch (err) { console.error(err); toast.error('Failed to create Razorpay subscription') }
                      }}>Create Razorpay Subscription</Button>
                    )}
                    <Dialog open={usageOpen} onOpenChange={(o) => setUsageOpen(o)}>
                      <DialogTrigger asChild>
                        <span />
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Usage for {selectedUsage?.user?.email || 'user'}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-2 max-h-60 overflow-auto">
                          <pre className="text-sm">{JSON.stringify(selectedUsage?.usage || [], null, 2)}</pre>
                        </div>
                        <DialogFooter>
                          <Button onClick={() => setUsageOpen(false)}>Close</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
