/**
 * useAsyncProposalGeneration Hook
 * 
 * Manages async proposal generation with SSE progress updates
 * and Zustand store integration for global state.
 */

"use client";

import { useCallback, useRef } from "react";
import { useProposalGenerationStore, type GeneratedProposal } from "@/lib/stores/proposal-generation-store";
import { toast } from "sonner";

interface GenerateProposalParams {
  clientId: string;
  clientName: string;
  brief: string;
  deliverables?: string[];
  budget?: number;
  timeline?: string;
  organisationId?: string;
  projectId?: string;
  enableReasoning?: boolean;
  enableHistoryLearning?: boolean;
}

interface UseAsyncProposalGenerationOptions {
  onComplete?: (proposal: GeneratedProposal, taskId: string) => void;
  onError?: (error: string, taskId: string) => void;
}

export function useAsyncProposalGeneration(options?: UseAsyncProposalGenerationOptions) {
  const {
    startGeneration,
    updateProgress,
    completeGeneration,
    failGeneration,
    getActiveTask,
    hasActiveTasks,
  } = useProposalGenerationStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const generate = useCallback(
    async (params: GenerateProposalParams) => {
      // Check if there's already an active task
      if (hasActiveTasks()) {
        toast.warning("A proposal is already being generated. Please wait for it to complete.");
        return null;
      }

      // Create a new task in the store
      const taskId = startGeneration({
        clientId: params.clientId,
        clientName: params.clientName,
        orgId: params.organisationId || "",
        projectId: params.projectId,
        brief: params.brief,
        deliverables: params.deliverables,
        budget: params.budget,
        timeline: params.timeline,
      });

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/ai/proposal/generate-async", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
            clientId: params.clientId,
            brief: params.brief,
            deliverables: params.deliverables,
            budget: params.budget,
            timeline: params.timeline,
            organisationId: params.organisationId,
            projectId: params.projectId,
            enableReasoning: params.enableReasoning ?? true,
            enableHistoryLearning: params.enableHistoryLearning ?? true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Process SSE events
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);
              
              if (eventType && eventData) {
                try {
                  const data = JSON.parse(eventData);
                  
                  switch (eventType) {
                    case "progress":
                      updateProgress(taskId, {
                        status: data.status,
                        percentage: data.percentage,
                        currentStep: data.currentStep,
                      });
                      break;
                    
                    case "complete":
                      if (data.proposal) {
                        const proposal: GeneratedProposal = {
                          id: taskId,
                          title: data.proposal.title,
                          deliverables: data.proposal.deliverables,
                          timeline: data.proposal.timeline,
                          pricing: data.proposal.pricing,
                          paymentTerms: data.proposal.paymentTerms,
                          summary: data.proposal.summary,
                          executiveSummary: data.proposal.executiveSummary,
                          scopeOfWork: data.proposal.scopeOfWork,
                          reasoning: data.proposal.reasoning,
                        };
                        
                        completeGeneration(taskId, proposal);
                        toast.success("Proposal generated successfully!");
                        options?.onComplete?.(proposal, taskId);
                      }
                      break;
                    
                    case "error":
                      failGeneration(taskId, data.error || "Unknown error");
                      toast.error(data.error || "Failed to generate proposal");
                      options?.onError?.(data.error || "Unknown error", taskId);
                      break;
                  }
                } catch (parseError) {
                  console.error("Failed to parse SSE data:", parseError);
                }
                
                eventType = "";
                eventData = "";
              }
            }
          }
        }

        return taskId;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Generation aborted");
          return null;
        }

        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        failGeneration(taskId, errorMessage);
        toast.error("Failed to generate proposal: " + errorMessage);
        options?.onError?.(errorMessage, taskId);
        return null;
      }
    },
    [
      startGeneration,
      updateProgress,
      completeGeneration,
      failGeneration,
      hasActiveTasks,
      options,
    ]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    const activeTask = getActiveTask();
    if (activeTask) {
      failGeneration(activeTask.id, "Generation cancelled by user");
      toast.info("Proposal generation cancelled");
    }
  }, [getActiveTask, failGeneration]);

  return {
    generate,
    cancel,
    isGenerating: hasActiveTasks(),
    activeTask: getActiveTask(),
  };
}
