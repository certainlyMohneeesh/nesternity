"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

type Client = {
  id: string;
  name: string;
  email: string;
  company: string | null;
};

type Project = {
  id: string;
  name: string;
  description: string | null;
  clientId: string | null;
};

type Proposal = {
  id: string;
  title: string;
  brief: string;
  deliverables: any;
  timeline: any;
  pricing: number;
  currency: string;
  paymentTerms: string | null;
  client: {
    id: string;
    name: string;
    email: string;
    company: string | null;
  };
  project: {
    id: string;
    name: string;
  } | null;
};

type Deliverable = {
  item: string;
  description: string;
  timeline: string;
};

type TimelineMilestone = {
  name: string;
  duration: string;
  deliverables: string[];
};

type Props = {
  proposal: Proposal;
  clients: Client[];
  projects: Project[];
};

export function ProposalEditForm({ proposal, clients, projects }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [clientId, setClientId] = useState(proposal.client.id);
  const [projectId, setProjectId] = useState(proposal.project?.id || "");
  const [title, setTitle] = useState(proposal.title);
  const [brief, setBrief] = useState(proposal.brief);
  const [pricing, setPricing] = useState(proposal.pricing.toString());
  const [currency, setCurrency] = useState(proposal.currency);
  const [paymentTerms, setPaymentTerms] = useState(proposal.paymentTerms || "");

  // Parse deliverables and timeline
  const initialDeliverables: Deliverable[] = Array.isArray(proposal.deliverables)
    ? proposal.deliverables
    : [];
  const initialTimeline: TimelineMilestone[] = Array.isArray(proposal.timeline)
    ? proposal.timeline
    : [];

  const [deliverables, setDeliverables] = useState<Deliverable[]>(
    initialDeliverables.length > 0
      ? initialDeliverables
      : [{ item: "", description: "", timeline: "" }]
  );

  const [timeline, setTimeline] = useState<TimelineMilestone[]>(
    initialTimeline.length > 0
      ? initialTimeline
      : [{ name: "", duration: "", deliverables: [] }]
  );

  // Store raw text for deliverables input to preserve commas while typing
  const [milestoneDelsText, setMilestoneDelsText] = useState<Record<number, string>>(
    initialTimeline.reduce((acc, milestone, index) => {
      acc[index] = Array.isArray(milestone.deliverables) 
        ? milestone.deliverables.join(", ") 
        : "";
      return acc;
    }, {} as Record<number, string>)
  );

  // Clear project selection if it doesn't belong to the selected client
  useEffect(() => {
    if (projectId) {
      const selectedProject = projects.find(p => p.id === projectId);
      // If project doesn't belong to the current client, clear it
      if (selectedProject && selectedProject.clientId !== clientId) {
        setProjectId("");
      }
    }
  }, [clientId, projectId, projects]);

  // Add deliverable
  const addDeliverable = () => {
    setDeliverables([...deliverables, { item: "", description: "", timeline: "" }]);
  };

  // Remove deliverable
  const removeDeliverable = (index: number) => {
    if (deliverables.length > 1) {
      setDeliverables(deliverables.filter((_, i) => i !== index));
    }
  };

  // Update deliverable
  const updateDeliverable = (
    index: number,
    field: keyof Deliverable,
    value: string
  ) => {
    const updated = [...deliverables];
    updated[index] = { ...updated[index], [field]: value };
    setDeliverables(updated);
  };

  // Add milestone
  const addMilestone = () => {
    const newIndex = timeline.length;
    setTimeline([...timeline, { name: "", duration: "", deliverables: [] }]);
    setMilestoneDelsText({ ...milestoneDelsText, [newIndex]: "" });
  };

  // Remove milestone
  const removeMilestone = (index: number) => {
    if (timeline.length > 1) {
      setTimeline(timeline.filter((_, i) => i !== index));
      // Clean up the text state
      const newTextState = { ...milestoneDelsText };
      delete newTextState[index];
      // Re-index the remaining items
      const reindexed: Record<number, string> = {};
      Object.keys(newTextState)
        .map(Number)
        .filter(i => i > index)
        .forEach(i => {
          reindexed[i - 1] = newTextState[i];
        });
      Object.keys(newTextState)
        .map(Number)
        .filter(i => i < index)
        .forEach(i => {
          reindexed[i] = newTextState[i];
        });
      setMilestoneDelsText(reindexed);
    }
  };

  // Update milestone
  const updateMilestone = (
    index: number,
    field: keyof TimelineMilestone,
    value: string | string[]
  ) => {
    const updated = [...timeline];
    updated[index] = { ...updated[index], [field]: value };
    setTimeline(updated);
  };

  const handleSave = async () => {
    // Validation
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a proposal title");
      return;
    }

    if (!brief.trim()) {
      toast.error("Please enter a project brief");
      return;
    }

    if (!pricing || parseFloat(pricing) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    // Check if all deliverables are filled
    const validDeliverables = deliverables.filter(
      (d) => d.item.trim() && d.description.trim()
    );

    if (validDeliverables.length === 0) {
      toast.error("Please add at least one deliverable");
      return;
    }

    // Check if all milestones are filled
    const validMilestones = timeline.filter(
      (m) => m.name.trim() && m.duration.trim()
    );

    if (validMilestones.length === 0) {
      toast.error("Please add at least one timeline milestone");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          projectId: projectId || null,
          title,
          brief,
          deliverables: validDeliverables,
          timeline: validMilestones,
          pricing: parseFloat(pricing),
          currency,
          paymentTerms: paymentTerms.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update proposal");
      }

      toast.success("Proposal updated successfully! 🎉");
      router.push(`/dashboard/proposals/${proposal.id}`);
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update proposal"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.push(`/dashboard/proposals/${proposal.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Edit Proposal</CardTitle>
              <CardDescription>
                Update proposal details, deliverables, and timeline
              </CardDescription>
            </div>
            <Badge variant="outline">DRAFT</Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="client">Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company || client.name} ({client.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project (Optional)</Label>
              <Select value={projectId || "none"} onValueChange={(val) => setProjectId(val === "none" ? "" : val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects
                    .filter(project => !project.clientId || project.clientId === clientId)
                    .map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Proposal Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Website Redesign & Development"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brief">Project Brief *</Label>
            <Textarea
              id="brief"
              placeholder="Describe the project requirements, goals, and scope..."
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={6}
            />
          </div>
        </CardContent>
      </Card>

      {/* Deliverables */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Deliverables</CardTitle>
              <CardDescription>
                What you'll deliver for this project
              </CardDescription>
            </div>
            <Button onClick={addDeliverable} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Deliverable
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {deliverables.map((deliverable, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Deliverable {index + 1}</Badge>
                {deliverables.length > 1 && (
                  <Button
                    onClick={() => removeDeliverable(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input
                  placeholder="e.g., UI/UX Design"
                  value={deliverable.item}
                  onChange={(e) =>
                    updateDeliverable(index, "item", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea
                  placeholder="Detailed description of this deliverable..."
                  value={deliverable.description}
                  onChange={(e) =>
                    updateDeliverable(index, "description", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Timeline</Label>
                <Input
                  placeholder="e.g., 2-3 weeks"
                  value={deliverable.timeline}
                  onChange={(e) =>
                    updateDeliverable(index, "timeline", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Timeline & Milestones</CardTitle>
              <CardDescription>
                Project phases and their durations
              </CardDescription>
            </div>
            <Button onClick={addMilestone} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {timeline.map((milestone, index) => (
            <div key={index} className="space-y-3 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Milestone {index + 1}</Badge>
                {timeline.length > 1 && (
                  <Button
                    onClick={() => removeMilestone(index)}
                    variant="ghost"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Milestone Name *</Label>
                  <Input
                    placeholder="e.g., Design Phase"
                    value={milestone.name}
                    onChange={(e) =>
                      updateMilestone(index, "name", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duration *</Label>
                  <Input
                    placeholder="e.g., 2 weeks"
                    value={milestone.duration}
                    onChange={(e) =>
                      updateMilestone(index, "duration", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Deliverables (comma-separated)</Label>
                <Input
                  placeholder="e.g., Wireframes, Mockups, Style Guide"
                  value={milestoneDelsText[index] || ""}
                  onChange={(e) => {
                    // Update the text state to preserve commas
                    setMilestoneDelsText({
                      ...milestoneDelsText,
                      [index]: e.target.value
                    });
                    // Update the milestone with parsed array
                    updateMilestone(
                      index,
                      "deliverables",
                      e.target.value
                        .split(",")
                        .map((d) => d.trim())
                        .filter((d) => d)
                    );
                  }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Payment Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pricing">Total Price *</Label>
              <Input
                id="pricing"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g., 50000"
                value={pricing}
                onChange={(e) => setPricing(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentTerms">Payment Terms (Optional)</Label>
            <Textarea
              id="paymentTerms"
              placeholder="e.g., 50% upfront, 25% at milestone 2, 25% on completion"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3 justify-end">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSaving}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
