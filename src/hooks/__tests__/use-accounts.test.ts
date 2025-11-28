import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockAccount, mockAccounts } from "@/testing/fixtures";
import { createWrapper } from "@/testing/test-utils";
import {
  useAccount,
  useAccounts,
  useArchiveAccount,
  useCreateAccount,
  useUpdateAccount,
} from "../use-accounts";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("use-accounts hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("useAccounts", () => {
    it("should fetch accounts successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAccounts }),
      });

      const { result } = renderHook(() => useAccounts(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAccounts);
      expect(mockFetch).toHaveBeenCalledWith("/api/accounts?");
    });

    it("should fetch accounts with archived filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockAccounts }),
      });

      const { result } = renderHook(() => useAccounts(true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/accounts?includeArchived=true",
      );
    });

    it("should handle fetch error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { result } = renderHook(() => useAccounts(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAccount", () => {
    it("should fetch single account by id", async () => {
      const account = mockAccounts[0];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: account }),
      });

      const { result } = renderHook(() => useAccount(account.id), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(account);
      expect(mockFetch).toHaveBeenCalledWith(`/api/accounts/${account.id}`);
    });

    it("should not fetch when id is empty", async () => {
      const { result } = renderHook(() => useAccount(""), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe("idle");
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("useCreateAccount", () => {
    it("should create account successfully", async () => {
      const newAccount = createMockAccount({ name: "New Account" });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: newAccount }),
      });

      const { result } = renderHook(() => useCreateAccount(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: "New Account",
        accountType: "card_credit",
        currency: "BRL",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(newAccount);
      expect(mockFetch).toHaveBeenCalledWith("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      });
    });

    it("should handle create error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Validation failed" }),
      });

      const { result } = renderHook(() => useCreateAccount(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        name: "",
        accountType: "card_credit",
        currency: "BRL",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toBe("Validation failed");
    });
  });

  describe("useUpdateAccount", () => {
    it("should update account successfully", async () => {
      const updatedAccount = { ...mockAccounts[0], name: "Updated Name" };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: updatedAccount }),
      });

      const { result } = renderHook(() => useUpdateAccount(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: updatedAccount.id,
        name: "Updated Name",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedAccount);
    });
  });

  describe("useArchiveAccount", () => {
    it("should archive account successfully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      });

      const { result } = renderHook(() => useArchiveAccount(), {
        wrapper: createWrapper(),
      });

      result.current.mutate("acc-001");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/accounts/acc-001", {
        method: "DELETE",
      });
    });
  });
});
