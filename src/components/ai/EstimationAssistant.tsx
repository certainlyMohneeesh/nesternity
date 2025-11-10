"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Loader2, 
  Plus, 
  X, 
  TrendingUp, 
  Clock, 
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sparkles 
} from "lucide-react";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  budget: number | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

interface EstimationAssistantProps {
  clients: Client[];
  projects: Project[];
}

export function EstimationAssistant({ clients, projects }: EstimationAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([""]);
  const [estimation, setEstimation] = useState<any>(null);

  const addDeliverable = () => {
    setDeliverables([...deliverables, ""]);
  };

  const removeDeliverable = (index: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== index));
  };

  const updateDeliverable = (index: number, value: string) => {
    const updated = [...deliverables];
    updated[index] = value;
    setDeliverables(updated);
  };

  const handleEstimate = async () => {
    if (!title || !description || deliverables.every(d => !d.trim())) {
      toast.error("Missing fields", {
        description: "Please fill in all required fields",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: clientId || undefined,
          projectId: projectId || undefined,
          title,
          description,
          deliverables: deliverables.filter(d => d.trim()),
          includeHistoricalData: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate estimation");
      }

      const data = await response.json();
      setEstimation(data.estimation);

      toast.success("Estimation complete! 📊", {
        description: "Your project estimate has been generated",
      });
    } catch (error) {
      console.error("Error generating estimation:", error);
      toast.error("Estimation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Form */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Project Details
            </CardTitle>
            <CardDescription>
              Provide project information for accurate estimation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client (Optional)</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name} {client.company ? `(${client.company})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient?.budget && (
                <p className="text-xs text-muted-foreground">
                  Client Budget: ${selectedClient.budget.toLocaleString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project (Optional)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., E-commerce Platform Development"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the project scope, requirements, and any specific considerations..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Deliverables</CardTitle>
                <CardDescription>List all expected project outputs</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={addDeliverable}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {deliverables.map((deliverable, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder={`Deliverable ${index + 1}`}
                  value={deliverable}
                  onChange={(e) => updateDeliverable(index, e.target.value)}
                />
                {deliverables.length > 1 && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeDeliverable(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Button
          onClick={handleEstimate}
          disabled={loading || !title || !description}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Estimate...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Estimate
            </>
          )}
        </Button>
      </div>

      {/* Results */}
      <div>
        <Card className={estimation ? "border-primary/20" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Estimation Results
                </CardTitle>
                <CardDescription>
                  {estimation ? "AI-generated project estimate" : "Results will appear here"}
                </CardDescription>
              </div>
              {estimation && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!estimation ? (
              <div className="flex flex-col h-96 items-center justify-center rounded-lg border-2 border-dashed bg-muted/30">
                <Calculator className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground font-medium">
                  Generate an estimate to see results
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fill in project details and click Generate AI Estimate
                </p>
              </div>
            ) : (
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Estimated Hours</p>
                          <p className="text-2xl font-bold">{estimation.estimatedHours}h</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 bg-green-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-100">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Estimated Cost</p>
                          <p className="text-2xl font-bold">${estimation.estimatedCost.toLocaleString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cost Breakdown */}
                {estimation.breakdown && estimation.breakdown.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-1 rounded-full bg-primary" />
                      <h4 className="font-semibold text-sm uppercase tracking-wide">Cost Breakdown</h4>
                    </div>
                    <div className="space-y-2">
                      {estimation.breakdown.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-muted/50 border">
                          <div>
                            <p className="font-medium text-sm">{item.phase}</p>
                            <p className="text-xs text-muted-foreground">{item.hours} hours</p>
                          </div>
                          <p className="font-semibold">${item.cost.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assumptions */}
                {estimation.assumptions && estimation.assumptions.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-1 rounded-full bg-blue-500" />
                      <h4 className="font-semibold text-sm uppercase tracking-wide">Assumptions</h4>
                    </div>
                    <ul className="space-y-2">
                      {estimation.assumptions.map((assumption: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{assumption}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {estimation.risks && estimation.risks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-1 rounded-full bg-orange-500" />
                      <h4 className="font-semibold text-sm uppercase tracking-wide">Potential Risks</h4>
                    </div>
                    <ul className="space-y-2">
                      {estimation.risks.map((risk: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Packages */}
                {estimation.suggestedPackages && estimation.suggestedPackages.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-1 w-1 rounded-full bg-purple-500" />
                      <h4 className="font-semibold text-sm uppercase tracking-wide">Package Options</h4>
                    </div>
                    <div className="grid gap-3">
                      {estimation.suggestedPackages.map((pkg: any, i: number) => (
                        <Card key={i} className="border-purple-200 bg-purple-50/50">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-semibold">{pkg.name}</h5>
                              <Badge variant="outline">
                                ${(pkg.cost || pkg.price || 0).toLocaleString()}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{pkg.description}</p>
                            {pkg.hours && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {pkg.hours} hours
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
