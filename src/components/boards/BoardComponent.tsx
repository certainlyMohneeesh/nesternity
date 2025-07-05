"use client";
import React, { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { GripVertical, Clock, User } from "lucide-react";

interface Task {
  id: string;
  title: string;
  listId: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  assignee?: string;
  dueDate?: string;
}

interface List {
  id: string;
  name: string;
}

const LISTS: List[] = [
  { id: "todo", name: "To Do" },
  { id: "inprogress", name: "In Progress" },
  { id: "done", name: "Done" },
];

const INITIAL_TASKS: Task[] = [
  { 
    id: "task-1", 
    title: "Design homepage mockups", 
    listId: "todo", 
    priority: "HIGH",
    assignee: "Jane Doe",
    dueDate: "Today"
  },
  { 
    id: "task-2", 
    title: "Setup production database", 
    listId: "todo", 
    priority: "MEDIUM",
    assignee: "John Smith"
  },
  { 
    id: "task-3", 
    title: "Implement user authentication", 
    listId: "inprogress", 
    priority: "HIGH",
    assignee: "Sarah Wilson",
    dueDate: "Tomorrow"
  },
  { 
    id: "task-4", 
    title: "Write API documentation", 
    listId: "done", 
    priority: "LOW",
    assignee: "Mike Johnson"
  },
  { 
    id: "task-5", 
    title: "Deploy to staging", 
    listId: "done", 
    priority: "MEDIUM",
    assignee: "Lisa Chen"
  },
];

interface SortableTaskProps {
  task: Task;
}

function SortableTask({ task }: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 cursor-grab active:cursor-grabbing hover:shadow-lg transition-all duration-200 group border-l-4",
        task.priority === "HIGH" && "border-l-red-500",
        task.priority === "MEDIUM" && "border-l-yellow-500", 
        task.priority === "LOW" && "border-l-green-500",
        isDragging && "opacity-50 shadow-2xl rotate-2 scale-105"
      )}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="font-medium text-sm text-foreground leading-snug flex-1">
          {task.title}
        </div>
        <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" />
      </div>
      
      <div className="flex items-center justify-between">
        <Badge 
          variant="outline"
          className={cn(
            "text-xs font-medium",
            task.priority === "HIGH" && "border-red-200 text-red-700 bg-red-50",
            task.priority === "MEDIUM" && "border-yellow-200 text-yellow-700 bg-yellow-50",
            task.priority === "LOW" && "border-green-200 text-green-700 bg-green-50"
          )}
        >
          {task.priority}
        </Badge>
        
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {task.dueDate}
          </div>
        )}
      </div>
      
      {task.assignee && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
            {task.assignee.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-xs text-muted-foreground">{task.assignee}</span>
        </div>
      )}
    </Card>
  );
}

interface DroppableListProps {
  list: List;
  tasks: Task[];
}

function DroppableList({ list, tasks }: DroppableListProps) {
  const { setNodeRef, isOver } = useDroppable({ id: list.id });

  return (
    <div className={cn(
      "w-80 bg-muted/30 rounded-xl p-5 transition-all duration-200",
      isOver && "bg-muted/50 ring-2 ring-primary/20"
    )}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-foreground text-base">{list.name}</h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[400px] space-y-3",
          isOver && "bg-primary/5 rounded-lg p-2 -m-2"
        )}
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTask key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm rounded-lg border-2 border-dashed border-muted">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default function BoardComponent() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration issues by only rendering after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id.toString());
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTaskId = active.id;
    const overId = over.id;

    // Find the active task
    const activeTask = tasks.find((task) => task.id === activeTaskId);
    if (!activeTask) return;

    // If we're dropping on a list, move to the end of that list
    const overList = LISTS.find((list) => list.id === overId);
    if (overList) {
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === activeTaskId
            ? { ...task, listId: overList.id }
            : task
        )
      );
      return;
    }

    // If we're dropping on another task, move to that position
    const overTask = tasks.find((task) => task.id === overId);
    if (overTask && overTask.listId !== activeTask.listId) {
      setTasks((tasks) =>
        tasks.map((task) =>
          task.id === activeTaskId
            ? { ...task, listId: overTask.listId }
            : task
        )
      );
    }
  }, [tasks]);

  const activeTask = activeId ? tasks.find((task) => task.id === activeId) : null;

  // Show loading state during SSR/hydration
  if (!isMounted) {
    return (
      <Card className="w-full bg-background/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Project Board</h3>
              <p className="text-sm text-muted-foreground">Loading interactive demo...</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              ⏳ Loading
            </Badge>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex gap-6 overflow-x-auto pb-4">
            {LISTS.map((list) => (
              <div key={list.id} className="w-80 bg-muted/30 rounded-xl p-5 animate-pulse">
                <div className="flex items-center justify-between mb-6">
                  <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                  <div className="h-5 bg-muted-foreground/20 rounded-full w-8"></div>
                </div>
                <div className="min-h-[400px] space-y-3">
                  {Array.from({ length: list.id === 'todo' ? 2 : list.id === 'inprogress' ? 1 : 2 }).map((_, i) => (
                    <div key={i} className="p-4 bg-muted-foreground/10 rounded-lg h-24"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full bg-background/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
      <div className="p-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1">Project Board</h3>
            <p className="text-sm text-muted-foreground">Drag tasks between columns • Live demo</p>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            ✨ Interactive
          </Badge>
        </div>
      </div>
      
      <div className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-4">
            {LISTS.map((list) => {
              const listTasks = tasks.filter((task) => task.listId === list.id);
              return (
                <DroppableList key={list.id} list={list} tasks={listTasks} />
              );
            })}
          </div>
          
          <DragOverlay>
            {activeTask ? (
              <div className="rotate-2 opacity-95 scale-105">
                <SortableTask task={activeTask} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </Card>
  );
}
