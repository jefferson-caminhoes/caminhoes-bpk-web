import { formatDateTime } from "@/lib/format-date";
import type { AuditLog } from "@/services/audit-service";
import type { Project } from "@/types/project";
import type { Protocol } from "@/types/protocol";

export type ProjectReportEvent = {
  id: string;
  projectId: string;
  projectName: string;
  protocolId: string | null;
  protocolLabel: string | null;
  action: string;
  createdAt: string | null;
  source: "project" | "protocol";
  description: string;
};

export type ProjectReport = {
  project: Project;
  protocols: Protocol[];
  auditLogs: AuditLog[];
  totalProtocols: number;
  activeProtocols: number;
  monitoredProtocols: number;
  divergentProtocols: number;
  notFoundProtocols: number;
  finalizedProtocols: number;
  riskScore: number;
  recentChangeCount: number;
  lastActivityAt: string | null;
  recentEvents: ProjectReportEvent[];
};

export type HistoryPoint = {
  label: string;
  value: number;
};

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

function createEventId(
  projectId: string,
  protocolId: string | null,
  action: string,
  createdAt: string | null,
  index: number,
) {
  return `${projectId}:${protocolId ?? "project"}:${action}:${createdAt ?? "na"}:${index}`;
}

function stringifyChange(change: unknown): string {
  if (typeof change === "string") return change;
  if (!change || typeof change !== "object") return "Alteracao registrada";

  const record = change as Record<string, unknown>;
  const field = typeof record.field === "string" ? record.field : "campo";
  const oldValue = record.old_value ?? record.oldValue;
  const newValue = record.new_value ?? record.newValue;

  return `${field}: ${String(oldValue ?? "-")} -> ${String(newValue ?? "-")}`;
}

function buildLogDescription(action: string, changes: AuditLog["changes"]) {
  const actionLabel =
    {
      create: "criacao",
      update: "atualizacao",
      inactivate: "inativacao",
      import: "importacao",
      close: "encerramento",
      reopen: "reabertura",
    }[action] ?? action;

  if (!changes) return `Evento de ${actionLabel}`;

  if (typeof changes === "string") {
    return `${actionLabel}: ${changes}`;
  }

  const firstChanges = changes.slice(0, 2).map(stringifyChange).join(" | ");
  return firstChanges ? `${actionLabel}: ${firstChanges}` : `Evento de ${actionLabel}`;
}

export function buildProjectReports(params: {
  projects: Project[];
  protocolsByProject: Record<string, Protocol[]>;
  auditLogsByProject: Record<string, AuditLog[]>;
}) {
  const reports: ProjectReport[] = params.projects.map((project) => {
    const protocols = params.protocolsByProject[project.id] ?? [];
    const auditLogs = params.auditLogsByProject[project.id] ?? [];

    const totalProtocols = protocols.length;
    const activeProtocols = protocols.filter(
      (item) => item.monitoringEnabled && !item.closedManually,
    ).length;
    const monitoredProtocols = protocols.filter((item) => item.monitoringEnabled).length;
    const divergentProtocols = protocols.filter((item) => item.hasDivergence).length;
    const notFoundProtocols = protocols.filter((item) => item.notFoundOnSource).length;
    const finalizedProtocols = protocols.filter(
      (item) =>
        item.closedManually ||
        String(item.manualStatus ?? "").toLowerCase().includes("final"),
    ).length;

    const recentProtocolEvents: ProjectReportEvent[] = protocols.flatMap((protocol) =>
      (protocol.changeLogs ?? []).map((log, index) => ({
        id: createEventId(
          project.id,
          protocol.id,
          log.user ?? log.message ?? "protocol",
          log.createdAt ?? null,
          index,
        ),
        projectId: project.id,
        projectName: project.name,
        protocolId: protocol.id,
        protocolLabel: `${protocol.protocolNumber} - ${protocol.activity}`,
        action: log.message ?? "update",
        createdAt: log.createdAt ?? null,
        source: "protocol" as const,
        description: log.message ?? "Alteracao registrada",
      })),
    );

    const recentProjectEvents: ProjectReportEvent[] = auditLogs.map((log, index) => ({
      id: createEventId(project.id, null, log.action, log.createdAt, index),
      projectId: project.id,
      projectName: project.name,
      protocolId: null,
      protocolLabel: null,
      action: log.action,
      createdAt: log.createdAt,
      source: "project" as const,
      description: buildLogDescription(log.action, log.changes),
    }));

    const recentEvents = [...recentProjectEvents, ...recentProtocolEvents]
      .sort((a, b) => {
        const aTime = parseDate(a.createdAt)?.getTime() ?? 0;
        const bTime = parseDate(b.createdAt)?.getTime() ?? 0;
        return bTime - aTime;
      })
      .slice(0, 12);

    const lastActivityAt =
      recentEvents[0]?.createdAt ??
      protocolLatestUpdate(protocols) ??
      auditLogs[0]?.createdAt ??
      project.updatedAt ??
      null;

    const recentChangeCount = recentEvents.length;
    const riskScore =
      divergentProtocols * 4 +
      notFoundProtocols * 5 +
      (totalProtocols - activeProtocols) * 2 +
      (finalizedProtocols > 0 ? 1 : 0);

    return {
      project,
      protocols,
      auditLogs,
      totalProtocols,
      activeProtocols,
      monitoredProtocols,
      divergentProtocols,
      notFoundProtocols,
      finalizedProtocols,
      riskScore,
      recentChangeCount,
      lastActivityAt,
      recentEvents,
    };
  });

  const allEvents = reports
    .flatMap((report) => report.recentEvents)
    .filter((event) => parseDate(event.createdAt));

  return {
    reports,
    allEvents,
  };
}

function protocolLatestUpdate(protocols: Protocol[]) {
  return protocols
    .map((item) => item.changeLogs?.[0]?.createdAt ?? null)
    .find((value) => value) ?? null;
}

export function buildHistorySeries(events: ProjectReportEvent[], months: number) {
  const now = new Date();
  const buckets: Record<string, number> = {};
  const labels: string[] = [];

  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    buckets[key] = 0;
    labels.push(monthLabel(date));
  }

  for (const event of events) {
    const date = parseDate(event.createdAt);
    if (!date) continue;
    const key = monthKey(date);
    if (key in buckets) {
      buckets[key] += 1;
    }
  }

  return labels.map((label, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return { label, value: buckets[monthKey(date)] ?? 0 };
  });
}

export function buildTrendComparison(events: ProjectReportEvent[]) {
  const sorted = [...events]
    .filter((event) => parseDate(event.createdAt))
    .sort((a, b) => {
      const aTime = parseDate(a.createdAt)?.getTime() ?? 0;
      const bTime = parseDate(b.createdAt)?.getTime() ?? 0;
      return bTime - aTime;
    });

  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - 30);
  const previousStart = new Date(now);
  previousStart.setDate(now.getDate() - 60);

  const current = sorted.filter((event) => {
    const date = parseDate(event.createdAt);
    return date ? date >= currentStart : false;
  }).length;

  const previous = sorted.filter((event) => {
    const date = parseDate(event.createdAt);
    return date ? date < currentStart && date >= previousStart : false;
  }).length;

  const delta = previous === 0 ? current : ((current - previous) / previous) * 100;

  return { current, previous, delta };
}

export function formatEventDate(value: string | null) {
  return value ? formatDateTime(value) : "Sem data";
}

export function buildReportSelectionLabel(report: ProjectReport | null) {
  return report ? report.project.name : "Todos os empreendimentos";
}

export function projectReportEventsByMonth(
  report: ProjectReport,
  months: number,
): HistoryPoint[] {
  return buildHistorySeries(report.recentEvents, months);
}
