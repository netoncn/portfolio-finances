/**
 * Tests for use-categories hook
 */

import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockCategory, mockCategories } from "@/testing/fixtures";
import { createWrapper } from "@/testing/test-utils";
import {
  useCategories,
  useCategory,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../use-categories";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("use-categories hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useCategories", () => {
    it("should fetch all categories successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCategories }),
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockCategories);
      expect(mockFetch).toHaveBeenCalledWith("/api/categories?");
    });

    it("should fetch categories filtered by type", async () => {
      const expenseCategories = mockCategories.filter(
        (c) => c.type === "expense",
      );
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: expenseCategories }),
      });

      const { result } = renderHook(() => useCategories("expense"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/categories?type=expense");
      expect(result.current.data).toEqual(expenseCategories);
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useCategories(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useCategory", () => {
    it("should fetch single category by id", async () => {
      const category = mockCategories[0];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: category }),
      });

      const { result } = renderHook(() => useCategory(category.id), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(category);
      expect(mockFetch).toHaveBeenCalledWith(`/api/categories/${category.id}`);
    });

    it("should not fetch when id is empty", async () => {
      const { result } = renderHook(() => useCategory(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("useCreateCategory", () => {
    it("should create category successfully", async () => {
      const newCategory = createMockCategory({ name: "Nova Categoria" });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: newCategory }),
      });

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: "Nova Categoria",
        type: "expense",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(newCategory);
    });

    it("should handle create error with custom message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Category already exists" }),
      });

      const { result } = renderHook(() => useCreateCategory(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: "Existing",
        type: "expense",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Category already exists");
    });
  });

  describe("useUpdateCategory", () => {
    it("should update category successfully", async () => {
      const updatedCategory = { ...mockCategories[0], name: "Updated Name" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedCategory }),
      });

      const { result } = renderHook(() => useUpdateCategory(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: updatedCategory.id,
        name: "Updated Name",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedCategory);
    });
  });

  describe("useDeleteCategory", () => {
    it("should delete category successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("cat-001");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/categories/cat-001", {
        method: "DELETE",
      });
    });

    it("should handle delete error for system category", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Cannot delete system category" }),
      });

      const { result } = renderHook(() => useDeleteCategory(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("cat-system");

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe(
        "Cannot delete system category",
      );
    });
  });
});
