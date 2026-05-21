import api from "@/lib/api";
import type {
  CreateProtocolPayload,
  Protocol,
  ProtocolApiItem,
  ProtocolChangeLog,
  ProtocolChangeLogApi,
  UpdateProtocolPayload,
} from "@/types/protocol";

function normalizeChangeLogs(
  raw: ProtocolChangeLogApi[] | undefined,
): ProtocolChangeLog[] {
  if (!raw) return [];

  return raw.map((item) => ({
    id: item.id ?? item._id ?? null,
    createdAt: item.createdAt ?? item.created_at ?? item.date ?? null,
    user: item.changed_by ?? item.user ?? item.userName ?? item.author ?? null,
    message: item.message ?? item.description ?? item.action ?? null,
  }));
}

function normalizeProtocol(item: ProtocolApiItem): Protocol {
  const changeLogs = normalizeChangeLogs(
    item.changeLogs ??
      item.audit_logs ??
      item.auditLogs ??
      item.logs ??
      item.history ??
      item.historico,
  );

  return {
    id: item.id ?? item._id ?? "",
    projectId: item.projectId ?? item.project_id ?? "",
    activity: item.activity ?? item.atividade ?? "Sem atividade",
    protocolNumber: item.protocol_number ?? item.protocolNumber ?? item.numero_protocolo ?? "",
    cnpj: item.cnpj ?? "",
    stakeholderName: item.stakeholderName ?? item.stakeholder_name ?? null,
    stakeholderId: item.stakeholderId ?? item.stakeholder_id ?? "",
    manualStatus: item.manual_status ?? item.manualStatus ?? item.status_manual ?? null,
    externalStatus: item.external_status ?? item.externalStatus ?? item.status_externo ?? null,
    hasDivergence: item.has_divergence ?? item.hasDivergence ?? item.has_status_divergence ?? false,
    situation: item.situation ?? item.external_situation ?? item.situacao ?? null,
    monitoringEnabled: item.monitoring_enabled ?? item.monitoringEnabled ?? true,
    notFoundOnSource:
      item.notFoundOnSource ??
      item.not_found_on_source ??
      (item.found_in_last_search !== undefined ? !item.found_in_last_search : false),
    lastConsultationAt:
      item.last_consulted_at ?? item.lastConsultationAt ?? item.last_consultation_at ?? null,
    owner: item.owner ?? item.responsavel ?? null,
    openingDate: item.opening_date ?? null,
    closingDate: item.closing_date ?? null,
    lastObservation: item.last_observation ?? null,
    assignedTo: item.assigned_to ?? null,
    assignedToName: item.assigned_to_name ?? null,
    notes: item.notes ?? null,
    changeLogs,
  };
}

export async function listProjectProtocols(projectId: string): Promise<Protocol[]> {
  const { data } = await api.get<ProtocolApiItem[] | { items?: ProtocolApiItem[] }>(
    `/projects/${projectId}/protocols`,
  );
  const rawItems = Array.isArray(data) ? data : data.items ?? [];
  return rawItems.map(normalizeProtocol).filter((protocol) => protocol.id);
}

function toApiCreatePayload(payload: CreateProtocolPayload) {
  return {
    stakeholder_id: payload.stakeholderId,
    cnpj: payload.cnpj,
    protocol_number: payload.protocolNumber,
    activity: payload.activity,
    manual_status: payload.manualStatus ?? null,
    situation: payload.situation ?? null,
    monitoring_enabled: payload.monitoringEnabled,
    assigned_to: payload.owner ?? null,
  };
}

function toApiUpdatePayload(payload: UpdateProtocolPayload) {
  return {
    stakeholder_id: payload.stakeholderId,
    cnpj: payload.cnpj,
    protocol_number: payload.protocolNumber,
    activity: payload.activity,
    manual_status: payload.manualStatus ?? null,
    situation: payload.situation ?? null,
    monitoring_enabled: payload.monitoringEnabled,
    assigned_to: payload.owner ?? null,
  };
}

export async function createProtocol(
  projectId: string,
  payload: CreateProtocolPayload,
): Promise<Protocol> {
  const { data } = await api.post<ProtocolApiItem>(
    `/projects/${projectId}/protocols`,
    toApiCreatePayload(payload),
  );
  return normalizeProtocol(data);
}

export async function getProtocolById(
  projectId: string,
  protocolId: string,
): Promise<Protocol> {
  const { data } = await api.get<ProtocolApiItem>(
    `/projects/${projectId}/protocols/${protocolId}`,
  );
  return normalizeProtocol(data);
}

export async function updateProtocol(
  projectId: string,
  protocolId: string,
  payload: UpdateProtocolPayload,
): Promise<Protocol> {
  const { data } = await api.patch<ProtocolApiItem>(
    `/projects/${projectId}/protocols/${protocolId}`,
    toApiUpdatePayload(payload),
  );
  return normalizeProtocol(data);
}

export async function finalizeProtocol(
  projectId: string,
  protocolId: string,
): Promise<Protocol> {
  const { data } = await api.patch<ProtocolApiItem>(
    `/projects/${projectId}/protocols/${protocolId}/close`,
    {},
  );
  return normalizeProtocol(data);
}

export async function reopenProtocolMonitoring(
  projectId: string,
  protocolId: string,
): Promise<Protocol> {
  const { data } = await api.patch<ProtocolApiItem>(
    `/projects/${projectId}/protocols/${protocolId}/reopen`,
    { monitoring_enabled: true },
  );
  return normalizeProtocol(data);
}

export async function createProtocolScrapingJob(protocolId: string): Promise<void> {
  await api.post(`/protocols/${protocolId}/scraping-jobs`);
}
