import api from "@/lib/api";
import type {
  CreateProtocolPayload,
  Protocol,
  ProtocolApiItem,
  UpdateProtocolPayload,
} from "@/types/protocol";

function normalizeProtocol(item: ProtocolApiItem): Protocol {
  return {
    id: item.id ?? item._id ?? "",
    projectId: item.projectId ?? item.project_id ?? "",
    activity: item.activity ?? item.atividade ?? "Sem atividade",
    protocolNumber: item.protocolNumber ?? item.numero_protocolo ?? "",
    cnpj: item.cnpj ?? "",
    stakeholderName: item.stakeholderName ?? item.stakeholder_name ?? null,
    stakeholderId: item.stakeholderId ?? item.stakeholder_id ?? "",
    manualStatus: item.manualStatus ?? item.status_manual ?? null,
    externalStatus: item.externalStatus ?? item.status_externo ?? null,
    hasDivergence: item.hasDivergence ?? item.has_status_divergence ?? false,
    situation: item.situation ?? item.situacao ?? null,
    monitoringEnabled: item.monitoringEnabled ?? item.monitoring_enabled ?? true,
    notFoundOnSource: item.notFoundOnSource ?? item.not_found_on_source ?? false,
    lastConsultationAt:
      item.lastConsultationAt ?? item.last_consultation_at ?? null,
    owner: item.owner ?? item.responsavel ?? null,
  };
}

export async function listProjectProtocols(projectId: string): Promise<Protocol[]> {
  const { data } = await api.get<ProtocolApiItem[] | { items?: ProtocolApiItem[] }>(
    `/projects/${projectId}/protocols`,
  );
  const rawItems = Array.isArray(data) ? data : data.items ?? [];
  return rawItems.map(normalizeProtocol).filter((protocol) => protocol.id);
}

export async function createProtocol(
  projectId: string,
  payload: CreateProtocolPayload,
): Promise<Protocol> {
  const { data } = await api.post<ProtocolApiItem>(
    `/projects/${projectId}/protocols`,
    payload,
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
    payload,
  );
  return normalizeProtocol(data);
}

export async function finalizeProtocol(
  projectId: string,
  protocolId: string,
): Promise<Protocol> {
  const { data } = await api.patch<ProtocolApiItem>(
    `/projects/${projectId}/protocols/${protocolId}`,
    {
      monitoringEnabled: false,
      situation: "Finalizado pelo usuario",
      closedManually: true,
    },
  );
  return normalizeProtocol(data);
}

export async function reopenProtocolMonitoring(
  projectId: string,
  protocolId: string,
): Promise<Protocol> {
  const { data } = await api.patch<ProtocolApiItem>(
    `/projects/${projectId}/protocols/${protocolId}`,
    {
      monitoringEnabled: true,
      closedManually: false,
    },
  );
  return normalizeProtocol(data);
}

export async function createProtocolScrapingJob(protocolId: string): Promise<void> {
  await api.post(`/protocols/${protocolId}/scraping-jobs`);
}
