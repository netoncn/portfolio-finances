import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateGoalDTO,
  Goal,
  GoalSummary,
  UpdateGoalDTO,
} from "@/domain/goals";

async function fetchGoals(): Promise<Goal[]> {
  const response = await fetch("/api/goals");

  if (!response.ok) {
    throw new Error("Failed to fetch goals");
  }

  const json = await response.json();
  return json.data;
}

async function fetchGoalsSummary(): Promise<GoalSummary> {
  const response = await fetch("/api/goals/summary");

  if (!response.ok) {
    throw new Error("Failed to fetch goals summary");
  }

  const json = await response.json();
  return json.data;
}

async function createGoal(data: Omit<CreateGoalDTO, "userId">): Promise<Goal> {
  const response = await fetch("/api/goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create goal");
  }

  const json = await response.json();
  return json.data;
}

async function updateGoal(data: Omit<UpdateGoalDTO, "userId">): Promise<Goal> {
  const { id, ...updates } = data;

  const response = await fetch(`/api/goals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update goal");
  }

  const json = await response.json();
  return json.data;
}

async function deleteGoal(id: string): Promise<void> {
  const response = await fetch(`/api/goals/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete goal");
  }
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: fetchGoals,
  });
}

export function useGoalsSummary() {
  return useQuery({
    queryKey: ["goals", "summary"],
    queryFn: fetchGoalsSummary,
  });
}

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
  });
}
