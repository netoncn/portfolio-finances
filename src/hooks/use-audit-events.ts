import { useQuery } from "@tanstack/react-query";
import type {
  AuditEvent,
  AuditEventType,
  AuditResourceType,
} from "@/domain/audit/types/audit";

export const auditKeys = {
  all: ["audit"] as const,
  lists: () => [...auditKeys.all, "list"] as const,
  list: (filters?: AuditEventsFilters) =>
    [...auditKeys.lists(), filters] as const,
  resource: (resourceType: AuditResourceType, resourceId: string) =>
    [...auditKeys.all, "resource", resourceType, resourceId] as const,
};

export interface AuditEventsFilters {
  resourceType?: AuditResourceType;
  resourceId?: string;
  eventType?: AuditEventType;
  startDate?: number;
  endDate?: number;
  limit?: number;
}

async function fetchAuditEvents(
  filters: AuditEventsFilters = {},
): Promise<AuditEvent[]> {
  const params = new URLSearchParams();

  if (filters.resourceType) params.set("resourceType", filters.resourceType);
  if (filters.resourceId) params.set("resourceId", filters.resourceId);
  if (filters.eventType) params.set("eventType", filters.eventType);
  if (filters.startDate) params.set("startDate", filters.startDate.toString());
  if (filters.endDate) params.set("endDate", filters.endDate.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());

  const response = await fetch(`/api/audit?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Failed to fetch audit events");
  }

  const json = await response.json();
  return json.data;
}

async function fetchResourceAuditHistory(
  resourceType: AuditResourceType,
  resourceId: string,
): Promise<AuditEvent[]> {
  const response = await fetch(`/api/audit/${resourceType}/${resourceId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch resource audit history");
  }

  const json = await response.json();
  return json.data;
}

export function useAuditEvents(filters: AuditEventsFilters = {}) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: () => fetchAuditEvents(filters),
  });
}

export function useResourceAuditHistory(
  resourceType: AuditResourceType,
  resourceId: string,
  enabled: boolean = true,
) {
  return useQuery({
    queryKey: auditKeys.resource(resourceType, resourceId),
    queryFn: () => fetchResourceAuditHistory(resourceType, resourceId),
    enabled: enabled && !!resourceId,
  });
}
