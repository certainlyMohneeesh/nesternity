"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Loader2,
  Brain,
  Lightbulb,
  FileText,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  useProposalGenerationStore,
  type GenerationStatus,
  type ProposalGenerationTask,
} from "@/lib/stores/proposal-generation-store";
import { AnimatedGradientBorder } from "@/components/ui/animated-gradient-border";

const statusIcons: Record<GenerationStatus, React.ReactNode> = {
  idle: <Clock className="h-4 w-4" />,
  analyzing: <Loader2 className="h-4 w-4 animate-spin" />,
  learning: <Brain className="h-4 w-4 animate-pulse" />,
  reasoning: <Lightbulb className="h-4 w-4 animate-pulse" />,
  generating: <FileText className="h-4 w-4 animate-pulse" />,
  finalizing: <Zap className="h-4 w-4 animate-pulse" />,
  completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  error: <AlertCircle className="h-4 w-4 text-red-500" />,
};

const statusColors: Record<GenerationStatus, string> = {
  idle: "text-gray-500",
  analyzing: "text-blue-500",
  learning: "text-purple-500",
  reasoning: "text-amber-500",
  generating: "text-emerald-500",
  finalizing: "text-cyan-500",
  completed: "text-green-500",
  error: "text-red-500",
};

const statusLabels: Record<GenerationStatus, string> = {
  idle: "Waiting",
  analyzing: "Analyzing",
  learning: "Learning",
  reasoning: "Reasoning",
  generating: "Generating",
  finalizing: "Finalizing",
  completed: "Complete",
  error: "Failed",
};

/**
 * Format time duration between start and end times
 * @param startTime - Start timestamp in milliseconds
 * @param endTime - End timestamp in milliseconds (defaults to now for in-progress tasks)
 */
function formatDuration(startTime: number, endTime?: number): string {
  const end = endTime ?? Date.now();
  const elapsed = Math.floor((end - startTime) / 1000);
  
  if (elapsed < 0) return "0s";
  if (elapsed < 60) return `${elapsed}s`;
  
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}m ${seconds}s`;
}

interface TaskItemProps {
  task: ProposalGenerationTask;
  onViewProposal: (task: ProposalGenerationTask) => void;
  onRemove: (taskId: string) => void;
}

function TaskItem({ task, onViewProposal, onRemove }: TaskItemProps) {
  const isComplete = task.progress.status === "completed";
  const isError = task.progress.status === "error";
  const isFinished = isComplete || isError;

  // Calculate initial elapsed time - use completedAt for finished tasks
  const getElapsedTime = () => {
    if (isFinished && task.completedAt) {
      return formatDuration(task.progress.startedAt, task.completedAt);
    }
    return formatDuration(task.progress.startedAt);
  };

  const [elapsed, setElapsed] = useState(getElapsedTime);

  useEffect(() => {
    // Don't update timer for finished tasks
    if (isFinished) {
      // Set final time once when task completes
      setElapsed(getElapsedTime());
      return;
    }

    // Update every second for in-progress tasks
    const interval = setInterval(() => {
      setElapsed(formatDuration(task.progress.startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [task.progress.startedAt, task.progress.status, task.completedAt, isFinished]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="bg-card/50 rounded-lg p-3 border border-border/50"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("flex-shrink-0", statusColors[task.progress.status])}>
              {statusIcons[task.progress.status]}
            </span>
            <span className="font-medium text-sm truncate">{task.clientName}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {task.brief.slice(0, 60)}...
          </p>
        </div>
        {(isComplete || isError) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => onRemove(task.id)}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className={cn("font-medium", statusColors[task.progress.status])}>
            {statusLabels[task.progress.status]}
          </span>
          <span className="text-muted-foreground">{elapsed}</span>
        </div>
        <Progress
          value={task.progress.percentage}
          className={cn(
            "h-1.5",
            isError && "bg-red-500/20"
          )}
        />
        <p className="text-xs text-muted-foreground line-clamp-1">
          {task.progress.currentStep}
        </p>
      </div>

      {/* Actions */}
      {isComplete && task.proposal && (
        <Button
          size="sm"
          variant="default"
          className="w-full mt-2 h-7 text-xs"
          onClick={() => onViewProposal(task)}
        >
          View Proposal
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      )}

      {isError && (
        <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-500 line-clamp-2">{task.error}</p>
        </div>
      )}
    </motion.div>
  );
}

export function ProposalGenerationWidget() {
  const router = useRouter();
  const {
    tasks,
    isWidgetVisible,
    isWidgetMinimized,
    hideWidget,
    toggleMinimize,
    removeTask,
    hasActiveTasks,
    getActiveTask,
    getCompletedTasks,
    clearCompletedTasks,
  } = useProposalGenerationStore();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const taskList = Object.values(tasks);
  const activeTask = getActiveTask();
  const completedTasks = getCompletedTasks();

  // Don't render during SSR or if not visible
  if (!mounted || !isWidgetVisible || taskList.length === 0) {
    return null;
  }

  const handleViewProposal = (task: ProposalGenerationTask) => {
    // Navigate to the proposal view/edit page with correct org and project structure
    if (task.proposal && task.orgId && task.projectId) {
      router.push(`/dashboard/organisation/${task.orgId}/projects/${task.projectId}/proposals/new?generated=${task.id}`);
    } else if (task.proposal && task.orgId) {
      // Fallback if no projectId - go to org proposals
      router.push(`/dashboard/organisation/${task.orgId}/proposals/new?generated=${task.id}`);
    }
  };

  // Check if any task is actively generating (for border animation)
  const isActivelyGenerating = taskList.some(
    (task) => 
      task.progress.status !== "completed" && 
      task.progress.status !== "error" &&
      task.progress.status !== "idle"
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <AnimatedGradientBorder 
          isAnimating={isActivelyGenerating} 
          className="w-80"
          borderRadius="0.75rem"
        >
          <div
            className={cn(
              "bg-background/95 backdrop-blur-lg",
              "rounded-xl border border-border shadow-2xl",
              "dark:bg-background/90"
            )}
          >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-blue-500/10">
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Proposals</h3>
              <p className="text-xs text-muted-foreground">
                {activeTask
                  ? `Generating ${taskList.length} proposal${taskList.length > 1 ? "s" : ""}`
                  : `${completedTasks.length} completed`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={toggleMinimize}
            >
              {isWidgetMinimized ? (
                <Maximize2 className="h-3.5 w-3.5" />
              ) : (
                <Minimize2 className="h-3.5 w-3.5" />
              )}
            </Button>
            {!hasActiveTasks() && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={hideWidget}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isWidgetMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {taskList.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onViewProposal={handleViewProposal}
                    onRemove={removeTask}
                  />
                ))}
              </div>

              {/* Footer */}
              {completedTasks.length > 0 && !hasActiveTasks() && (
                <div className="p-2 border-t border-border/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs text-muted-foreground"
                    onClick={clearCompletedTasks}
                  >
                    Clear all completed
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Minimized indicator */}
        {isWidgetMinimized && activeTask && (
          <div className="p-2">
            <div className="flex items-center gap-2">
              <span className={cn("flex-shrink-0", statusColors[activeTask.progress.status])}>
                {statusIcons[activeTask.progress.status]}
              </span>
              <Progress value={activeTask.progress.percentage} className="flex-1 h-1.5" />
              <span className="text-xs text-muted-foreground">
                {activeTask.progress.percentage}%
              </span>
            </div>
          </div>
        )}
          </div>
        </AnimatedGradientBorder>
      </motion.div>
    </AnimatePresence>
  );
}
