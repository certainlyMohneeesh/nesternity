'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Sparkles, Save, Send, FileText, CheckCircle2, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { BudgetEstimation } from '@/components/proposals/BudgetEstimation';
import { AnimatedGradientBorder } from '@/components/ui/animated-gradient-border';

interface Client {
  id: string;
  name: string;
  email: string;
  company?: string | null;
}

interface ProposalEditorProps {
  clients: Client[];
  orgId: string;
  projectId: string;
}

export function ProposalEditor({ clients, orgId, projectId }: ProposalEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [clientId, setClientId] = useState('');
  const [brief, setBrief] = useState('');
  const [deliverables, setDeliverables] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');

  // Generated proposal state
  const [proposal, setProposal] = useState<any>(null);

  const handleGenerate = async () => {
    if (!clientId || !brief) {
      toast.error('Missing fields', {
        description: 'Please select a client and enter a project brief',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai/proposal/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          brief,
          deliverables: deliverables ? deliverables.split('\n').filter(d => d.trim()) : undefined,
          budget: budget ? parseFloat(budget) : undefined,
          timeline,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate proposal');
      }

      const data = await response.json();
      setProposal(data.proposal);

      // Auto-fill budget from AI-generated proposal pricing
      if (data.proposal.pricing?.amount) {
        setBudget(data.proposal.pricing.amount.toString());
      }

      toast.success('Proposal generated! ✨', {
        description: 'Your AI-powered proposal is ready to review',
      });
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast.error('Generation failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!proposal) return;

    setSaving(true);
    try {
      const response = await fetch('/api/ai/proposal/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          title: proposal.title,
          brief,
          deliverables: proposal.deliverables,
          timeline: proposal.timeline,
          pricing: proposal.pricing,
          paymentTerms: proposal.paymentTerms,
          aiPrompt: brief,
          aiModel: 'gemini-2.5-flash',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save proposal');
      }

      const data = await response.json();

      toast.success('Proposal saved! 💾', {
        description: `Saved as ${data.proposal.status} for ${data.proposal.client.name}`,
      });
    } catch (error) {
      console.error('Error saving proposal:', error);
      toast.error('Save failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Proposal Generator
          </CardTitle>
          <CardDescription>
            Enter project details and let AI draft a professional proposal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} {client.company ? `(${client.company})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief">Project Brief *</Label>
            <Textarea
              id="brief"
              placeholder="Describe the project requirements, goals, and client expectations..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliverables">Deliverables (one per line)</Label>
            <Textarea
              id="deliverables"
              placeholder="E-commerce website&#10;Mobile app&#10;Admin dashboard"
              value={deliverables}
              onChange={(e) => setDeliverables(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (INR)</Label>

              {/* AI Budget Estimation */}
              {brief && deliverables && (
                <>
                  <BudgetEstimation
                    title={`AI Proposal for ${selectedClient?.name || 'Client'}`}
                    brief={brief}
                    deliverables={deliverables.split('\n').filter(d => d.trim()).map(d => ({
                      item: d,
                      description: d,
                      timeline: timeline || 'TBD'
                    }))}
                    timeline={timeline ? [{
                      name: 'Project Timeline',
                      duration: timeline,
                      deliverables: []
                    }] : []}
                    currency="INR"
                    onEstimationComplete={(estimatedBudget) => setBudget(estimatedBudget.toString())}
                  />
                  <Separator className="my-2" />
                </>
              )}

              <Input
                id="budget"
                type="number"
                placeholder="500000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline</Label>
              <Input
                id="timeline"
                placeholder="8-10 weeks"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !clientId || !brief}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Proposal
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Proposal Preview */}
      <AnimatedGradientBorder isAnimating={loading} className="rounded-lg">
        <Card className={proposal ? "border-primary/20 border-0" : "border-0"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Proposal Preview
                </CardTitle>
                <CardDescription>
                  {proposal ? 'Review and save your AI-generated proposal' : 'Generated proposal will appear here'}
                </CardDescription>
              </div>
              {proposal && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Generated
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!proposal ? (
              <div className="flex flex-col h-96 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">
                  Generate a proposal to see the preview
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fill in the details and click Generate Proposal
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {/* Header */}
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-lg border border-primary/20">
                  <h3 className="text-2xl font-bold mb-2">{proposal.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Prepared for <span className="font-semibold">{selectedClient?.name}</span>
                    {selectedClient?.company && (
                      <> at <span className="font-semibold">{selectedClient.company}</span></>
                    )}
                  </p>
                </div>

                {/* Executive Summary */}
                {proposal.executiveSummary && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h4 className="font-semibold text-sm uppercase tracking-wide">Executive Summary</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{proposal.executiveSummary}</p>
                  </div>
                )}

                {/* Pricing Highlight */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total Investment</p>
                          <p className="text-2xl font-bold">
                            {proposal.pricing?.currency ?? 'INR'} {proposal.pricing?.amount ? Number(proposal.pricing.amount).toLocaleString() : 'TBD'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Timeline</p>
                          <p className="text-lg font-semibold">{proposal.timeline?.total ?? 'TBD'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Scope of Work */}
                {proposal.scopeOfWork && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h4 className="font-semibold text-sm uppercase tracking-wide">Scope of Work</h4>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{proposal.scopeOfWork}</p>
                  </div>
                )}

                {/* Deliverables */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h4 className="font-semibold text-sm uppercase tracking-wide">Deliverables</h4>
                  </div>
                  <div className="space-y-3">
                    {(proposal.deliverables || []).map((d: any, i: number) => (
                      <div key={i} className="flex gap-3 p-3 rounded-lg bg-muted/50 border">
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm mb-1">{d.item}</p>
                          <p className="text-xs text-muted-foreground">{d.description}</p>
                          {d.timeline && (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {d.timeline}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline & Milestones */}
                {proposal.timeline?.milestones?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h4 className="font-semibold text-sm uppercase tracking-wide">Project Timeline</h4>
                    </div>
                    <div className="space-y-2">
                      {proposal.timeline.milestones.map((m: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
                          <div>
                            <span className="font-medium">{m.name}</span>
                            <span className="text-muted-foreground"> - {m.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Terms */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    <h4 className="font-semibold text-sm uppercase tracking-wide">Payment Terms</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{proposal.paymentTerms}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-6 border-t">
                  <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Proposal
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </AnimatedGradientBorder>
    </div>
  );
}
