import api from "@/lib/api";

export type AuditChange = {
  field?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
};

export type AuditLog = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  createdAt: string | null;
  changedBy: string | null;
  changes: AuditChange[] | string | null;
};

type AuditLogApiItem = {
  id?: string;
  _id?: string;
  entity_type?: string;
  entityType?: string;
  entity_id?: string;
  entityId?: string;
  action?: string;
  created_at?: string;
  createdAt?: string;
  changed_by?: string;
  changedBy?: string;
  changes?: unknown;
};

function normalizeChanges(raw: unknown): AuditChange[] | string | null {
  if (raw == null) return null;
  if (typeof raw === "string") return raw;
  if (!Array.isArray(raw)) return null;

  return raw.map((item) => {
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      return {
        field: (record.field as string | null | undefined) ?? null,
        oldValue: record.old_value ?? record.oldValue ?? null,
        newValue: record.new_value ?? record.newValue ?? null,
      };
    }
    return { field: null, oldValue: null, newValue: null };
  });
}

function normalizeAuditLog(item: AuditLogApiItem): AuditLog {
  return {
    id: item.id ?? item._id ?? "",
    entityType: item.entity_type ?? item.entityType ?? "",
    entityId: item.entity_id ?? item.entityId ?? "",
    action: item.action ?? "update",
    createdAt: item.created_at ?? item.createdAt ?? null,
    changedBy: item.changed_by ?? item.changedBy ?? null,
    changes: normalizeChanges(item.changes),
  };
}

export async function listEntityAuditLogs(
  entityType: string,
  entityId: string,
): Promise<AuditLog[]> {
  const { data } = await api.get<AuditLogApiItem[]>(
    `/audit-logs/${entityType}/${entityId}`,
  );

  return data.map(normalizeAuditLog).filter((item) => item.id);
}
