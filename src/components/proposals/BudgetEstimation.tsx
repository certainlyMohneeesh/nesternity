"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { getCurrencySymbol, formatCurrency } from "@/lib/utils";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";

interface Deliverable {
  item: string;
  description: string;
  timeline: string;
}

interface TimelineMilestone {
  name: string;
  duration: string;
  deliverables: string[];
}

interface BudgetEstimationProps {
  title: string;
  brief: string;
  deliverables: Deliverable[];
  timeline: TimelineMilestone[];
  currency: string;
  onEstimationComplete: (budget: number) => void;
}

interface EstimationResult {
  estimatedBudget: number;
  confidence: 'low' | 'medium' | 'high';
  breakdown: Array<{
    category: string;
    amount: number;
    reasoning: string;
  }>;
  rationale: string;
}

const confidenceColors = {
  low: 'bg-yellow-500',
  medium: 'bg-blue-500',
  high: 'bg-green-500',
};

const confidenceLabels = {
  low: 'Low Confidence',
  medium: 'Medium Confidence',
  high: 'High Confidence',
};

export function BudgetEstimation({
  title,
  brief,
  deliverables,
  timeline,
  currency,
  onEstimationComplete,
}: BudgetEstimationProps) {
  const [loading, setLoading] = useState(false);
  const [estimation, setEstimation] = useState<EstimationResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleEstimate = async () => {
    // Validation
    const validDeliverables = deliverables.filter(d => d.item.trim());
    if (!title.trim() || !brief.trim() || validDeliverables.length === 0) {
      toast.error("Missing information", {
        description: "Please fill in title, brief, and at least one deliverable",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/ai/estimate-budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          brief,
          deliverables: validDeliverables,
          timeline,
          currency,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to estimate budget");
      }

      const data = await response.json();
      setEstimation(data.estimation);
      setShowDetails(true);

      toast.success("Budget estimated! 💰", {
        description: `AI suggests ${formatCurrency(data.estimation.estimatedBudget, currency)}`,
      });
    } catch (error) {
      console.error("Estimation error:", error);
      toast.error("Estimation failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyEstimation = () => {
    if (estimation) {
      onEstimationComplete(estimation.estimatedBudget);
      toast.success("Budget applied", {
        description: "The estimated budget has been set",
      });
    }
  };

  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="space-y-4">
      <AnimatedGradientBorder isAnimating={loading} className="rounded-md" borderRadius="0.375rem">
        <Button
          type="button"
          onClick={handleEstimate}
          disabled={loading}
          variant="outline"
          className="w-full border-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Estimating Budget...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Estimate Budget with AI
            </>
          )}
        </Button>
      </AnimatedGradientBorder>

      {estimation && (
        <Card className="border-primary/50">
          <CardContent className="pt-6 max-h-[500px] overflow-y-auto space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-semibold text-sm sm:text-base">AI Budget Estimation</h4>
                <Badge className={confidenceColors[estimation.confidence]}>
                  {confidenceLabels[estimation.confidence]}
                </Badge>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-base sm:text-lg md:text-xl font-bold text-primary break-words min-w-0 flex-1">
                  {currencySymbol}{estimation.estimatedBudget?.toLocaleString() ?? '0'}
                </p>
                <Button
                  type="button"
                  onClick={applyEstimation}
                  size="sm"
                  variant="default"
                  className="shrink-0"
                >
                  <DollarSign className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </div>
            </div>

            {
              showDetails && (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground font-medium">
                      Rationale
                    </p>
                    <p className="text-xs sm:text-sm leading-relaxed break-words">{estimation.rationale}</p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-xs sm:text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      View Cost Breakdown
                    </button>

                    <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                      {estimation.breakdown.map((item, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 text-sm">
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <p className="font-medium text-sm break-words">{item.category}</p>
                            <p className="text-xs text-muted-foreground break-words leading-relaxed">{item.reasoning}</p>
                          </div>
                          <p className="font-semibold text-sm sm:text-base shrink-0 self-start sm:ml-4">
                            {currencySymbol}{item.amount.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )
            }
          </CardContent >
        </Card >
      )
      }
    </div >
  );
}
