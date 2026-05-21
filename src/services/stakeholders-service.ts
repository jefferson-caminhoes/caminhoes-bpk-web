import api from "@/lib/api";
import type {
  Stakeholder,
  StakeholderApiItem,
  StakeholderUpsertPayload,
} from "@/types/stakeholder";

function normalizeStakeholder(item: StakeholderApiItem): Stakeholder {
  return {
    id: item.id ?? item._id ?? "",
    name: item.name ?? item.nome ?? "Sem nome",
    type: item.type ?? item.tipo ?? null,
    baseUrl: item.baseUrl ?? item.base_url ?? null,
    queryTemplate: item.queryTemplate ?? item.query_url_template ?? item.template_consulta ?? null,
    requiresJavascript:
      item.requiresJavascript ?? item.requires_javascript ?? item.requer_javascript ?? false,
    hasCaptcha: item.hasCaptcha ?? item.has_captcha ?? item.tem_captcha ?? false,
    requiresOffice: item.requiresOffice ?? item.requires_oficio ?? item.exige_oficio ?? false,
    notes: item.notes ?? item.observacoes ?? null,
    active: item.active ?? item.ativo ?? true,
  };
}

function toApiPayload(payload: StakeholderUpsertPayload) {
  return {
    name: payload.name,
    type: payload.type ?? "other",
    base_url: payload.baseUrl ?? "",
    query_url_template: payload.queryTemplate ?? null,
    requires_javascript: payload.requiresJavascript,
    has_captcha: payload.hasCaptcha,
    requires_oficio: payload.requiresOffice,
    notes: payload.notes ?? null,
    active: payload.active,
  };
}

export async function listStakeholders(): Promise<Stakeholder[]> {
  const { data } = await api.get<
    StakeholderApiItem[] | { items?: StakeholderApiItem[] }
  >("/stakeholders");

  const rawItems = Array.isArray(data) ? data : data.items ?? [];
  return rawItems.map(normalizeStakeholder).filter((stakeholder) => stakeholder.id);
}

export async function createStakeholder(
  payload: StakeholderUpsertPayload,
): Promise<Stakeholder> {
  const { data } = await api.post<StakeholderApiItem>(
    "/stakeholders",
    toApiPayload(payload),
  );
  return normalizeStakeholder(data);
}

export async function getStakeholderById(
  stakeholderId: string,
): Promise<Stakeholder> {
  const { data } = await api.get<StakeholderApiItem>(
    `/stakeholders/${stakeholderId}`,
  );
  return normalizeStakeholder(data);
}

export async function updateStakeholder(
  stakeholderId: string,
  payload: StakeholderUpsertPayload,
): Promise<Stakeholder> {
  const { data } = await api.patch<StakeholderApiItem>(
    `/stakeholders/${stakeholderId}`,
    toApiPayload(payload),
  );
  return normalizeStakeholder(data);
}
