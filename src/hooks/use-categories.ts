"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "@/domain/categories/dto/category.dto";
import type {
  Category,
  CategoryType,
} from "@/domain/categories/types/category";

interface CategoriesResponse {
  data: Category[];
}

interface CategoryResponse {
  data: Category;
}

async function fetchCategories(type?: CategoryType): Promise<Category[]> {
  const params = new URLSearchParams();
  if (type) {
    params.set("type", type);
  }

  const response = await fetch(`/api/categories?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }

  const json: CategoriesResponse = await response.json();
  return json.data;
}

async function fetchCategory(id: string): Promise<Category> {
  const response = await fetch(`/api/categories/${id}`);

  if (!response.ok) {
    throw new Error("Failed to fetch category");
  }

  const json: CategoryResponse = await response.json();
  return json.data;
}

async function createCategory(
  dto: Omit<CreateCategoryDTO, "userId">,
): Promise<Category> {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create category");
  }

  const json: CategoryResponse = await response.json();
  return json.data;
}

async function updateCategory(
  dto: Omit<UpdateCategoryDTO, "userId">,
): Promise<Category> {
  const { id, ...data } = dto;
  const response = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update category");
  }

  const json: CategoryResponse = await response.json();
  return json.data;
}

async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`/api/categories/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete category");
  }
}

export function useCategories(type?: CategoryType) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => fetchCategories(type),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: ["categories", id],
    queryFn: () => fetchCategory(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories", data.id] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
