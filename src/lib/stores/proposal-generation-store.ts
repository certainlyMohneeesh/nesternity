/**
 * Proposal Generation Store
 * 
 * Global state management for async proposal generation with persistence.
 * Uses Zustand for React state management with localStorage persistence.
 */

import { create } from 'zustand';
import { persist, createJSONStorage, PersistOptions } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

export type GenerationStatus = 
  | 'idle'
  | 'analyzing'      // Analyzing requirements
  | 'learning'       // Learning from history
  | 'reasoning'      // Deep reasoning phase
  | 'generating'     // Generating proposal
  | 'finalizing'     // Final touches
  | 'completed'
  | 'error';

export interface GenerationProgress {
  status: GenerationStatus;
  percentage: number;
  currentStep: string;
  estimatedTimeLeft?: number; // seconds
  startedAt: number;
}

export interface GeneratedProposal {
  id: string;
  title: string;
  deliverables: Array<{
    item: string;
    description: string;
    timeline: string;
  }>;
  timeline: {
    total: string;
    milestones: Array<{
      name: string;
      duration: string;
      deliverables: string[];
    }>;
  };
  pricing: {
    amount: number;
    currency: string;
    breakdown: Array<{
      item: string;
      cost: number;
    }>;
  };
  paymentTerms: string;
  summary: string;
  executiveSummary?: string;
  scopeOfWork?: string;
  reasoning?: {
    pricingRationale: string;
    timelineRationale: string;
    risksIdentified: string[];
    assumptions: string[];
  };
}

export interface ProposalGenerationTask {
  id: string;
  clientId: string;
  clientName: string;
  projectId?: string;
  orgId: string;
  brief: string;
  deliverables?: string[];
  budget?: number;
  timeline?: string;
  progress: GenerationProgress;
  proposal?: GeneratedProposal;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

interface ProposalGenerationStore {
  // Active tasks
  tasks: Record<string, ProposalGenerationTask>;
  
  // Widget visibility
  isWidgetVisible: boolean;
  isWidgetMinimized: boolean;
  
  // Actions
  startGeneration: (task: Omit<ProposalGenerationTask, 'id' | 'progress' | 'createdAt'>) => string;
  updateProgress: (taskId: string, progress: Partial<GenerationProgress>) => void;
  completeGeneration: (taskId: string, proposal: GeneratedProposal) => void;
  failGeneration: (taskId: string, error: string) => void;
  removeTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  
  // Widget controls
  showWidget: () => void;
  hideWidget: () => void;
  toggleMinimize: () => void;
  
  // Getters
  getActiveTask: () => ProposalGenerationTask | undefined;
  getCompletedTasks: () => ProposalGenerationTask[];
  hasActiveTasks: () => boolean;
}

// Type for the persisted state (without functions)
type PersistedProposalGenerationState = Pick<
  ProposalGenerationStore,
  'tasks' | 'isWidgetVisible' | 'isWidgetMinimized'
>;

const persistConfig: PersistOptions<ProposalGenerationStore, PersistedProposalGenerationState> = {
  name: 'proposal-generation-store',
  storage: createJSONStorage(() => localStorage),
  partialize: (state): PersistedProposalGenerationState => ({
    tasks: state.tasks,
    isWidgetVisible: state.isWidgetVisible,
    isWidgetMinimized: state.isWidgetMinimized,
  }),
};

const proposalGenerationStoreCreator: StateCreator<ProposalGenerationStore> = (set, get) => ({
      tasks: {},
      isWidgetVisible: false,
      isWidgetMinimized: false,

      startGeneration: (taskData: Omit<ProposalGenerationTask, 'id' | 'progress' | 'createdAt'>) => {
        const id = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const task: ProposalGenerationTask = {
          ...taskData,
          id,
          progress: {
            status: 'analyzing',
            percentage: 0,
            currentStep: 'Analyzing project requirements...',
            startedAt: Date.now(),
          },
          createdAt: Date.now(),
        };

        set((state: ProposalGenerationStore) => ({
          tasks: { ...state.tasks, [id]: task },
          isWidgetVisible: true,
          isWidgetMinimized: false,
        }));

        return id;
      },

      updateProgress: (taskId: string, progressUpdate: Partial<GenerationProgress>) => {
        set((state: ProposalGenerationStore) => {
          const task = state.tasks[taskId];
          if (!task) return state;

          return {
            tasks: {
              ...state.tasks,
              [taskId]: {
                ...task,
                progress: {
                  ...task.progress,
                  ...progressUpdate,
                },
              },
            },
          };
        });
      },

      completeGeneration: (taskId: string, proposal: GeneratedProposal) => {
        set((state: ProposalGenerationStore) => {
          const task = state.tasks[taskId];
          if (!task) return state;

          return {
            tasks: {
              ...state.tasks,
              [taskId]: {
                ...task,
                progress: {
                  ...task.progress,
                  status: 'completed',
                  percentage: 100,
                  currentStep: 'Proposal ready!',
                },
                proposal,
                completedAt: Date.now(),
              },
            },
          };
        });
      },

      failGeneration: (taskId: string, error: string) => {
        set((state: ProposalGenerationStore) => {
          const task = state.tasks[taskId];
          if (!task) return state;

          return {
            tasks: {
              ...state.tasks,
              [taskId]: {
                ...task,
                progress: {
                  ...task.progress,
                  status: 'error',
                  currentStep: 'Generation failed',
                },
                error,
              },
            },
          };
        });
      },

      removeTask: (taskId: string) => {
        set((state: ProposalGenerationStore) => {
          const { [taskId]: removed, ...remaining } = state.tasks;
          const hasRemainingTasks = Object.keys(remaining).length > 0;
          return {
            tasks: remaining,
            isWidgetVisible: hasRemainingTasks,
          };
        });
      },

      clearCompletedTasks: () => {
        set((state: ProposalGenerationStore) => {
          const activeTasks = Object.fromEntries(
            Object.entries(state.tasks).filter(
              ([, task]: [string, ProposalGenerationTask]) => task.progress.status !== 'completed' && task.progress.status !== 'error'
            )
          ) as Record<string, ProposalGenerationTask>;
          return {
            tasks: activeTasks,
            isWidgetVisible: Object.keys(activeTasks).length > 0,
          };
        });
      },

      showWidget: () => set({ isWidgetVisible: true }),
      hideWidget: () => set({ isWidgetVisible: false }),
      toggleMinimize: () => set((state: ProposalGenerationStore) => ({ isWidgetMinimized: !state.isWidgetMinimized })),

      getActiveTask: () => {
        const tasks: Record<string, ProposalGenerationTask> = get().tasks;
        return Object.values(tasks).find((task: ProposalGenerationTask) =>
          task.progress.status !== 'completed' &&
          task.progress.status !== 'error' &&
          task.progress.status !== 'idle'
        );
      },

      getCompletedTasks: () => {
        const tasks: Record<string, ProposalGenerationTask> = get().tasks;
        return Object.values(tasks).filter((task: ProposalGenerationTask) => task.progress.status === 'completed');
      },

      hasActiveTasks: () => {
        const tasks: Record<string, ProposalGenerationTask> = get().tasks;
        return Object.values(tasks).some((task: ProposalGenerationTask) =>
          task.progress.status !== 'completed' &&
          task.progress.status !== 'error' &&
          task.progress.status !== 'idle'
        );
      },
    });

export const useProposalGenerationStore = create<ProposalGenerationStore>(
  persist(
    proposalGenerationStoreCreator as StateCreator<ProposalGenerationStore>,
    persistConfig
  ) as unknown as StateCreator<ProposalGenerationStore>
);
