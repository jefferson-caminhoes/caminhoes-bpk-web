import api from "@/lib/api";
import type {
  Project,
  ProjectsApiItem,
  ProjectUpsertPayload,
} from "@/types/project";

function normalizeProject(item: ProjectsApiItem): Project {
  return {
    id: item.id ?? item._id ?? "",
    name: item.name ?? item.nome ?? "Sem nome",
    description: item.description ?? item.descricao ?? null,
    owner: item.owner ?? item.responsavel ?? null,
    active: item.active ?? item.ativo ?? true,
    protocolsCount: item.protocolsCount ?? item.protocolos_count ?? null,
    updatedAt: item.updatedAt ?? item.updated_at ?? null,
  };
}

function toApiPayload(payload: ProjectUpsertPayload) {
  return {
    name: payload.name,
    description: payload.description ?? null,
    owner: payload.owner ?? null,
    active: payload.active,
  };
}

export async function listProjects(): Promise<Project[]> {
  const { data } = await api.get<ProjectsApiItem[] | { items?: ProjectsApiItem[] }>(
    "/projects",
  );

  const rawItems = Array.isArray(data) ? data : data.items ?? [];
  return rawItems.map(normalizeProject).filter((project) => project.id);
}

export async function createProject(payload: ProjectUpsertPayload): Promise<Project> {
  const { data } = await api.post<ProjectsApiItem>("/projects", toApiPayload(payload));
  return normalizeProject(data);
}

export async function getProjectById(projectId: string): Promise<Project> {
  const { data } = await api.get<ProjectsApiItem>(`/projects/${projectId}`);
  return normalizeProject(data);
}

export async function updateProject(
  projectId: string,
  payload: ProjectUpsertPayload,
): Promise<Project> {
  const { data } = await api.patch<ProjectsApiItem>(
    `/projects/${projectId}`,
    toApiPayload(payload),
  );
  return normalizeProject(data);
}

export async function inactivateProject(projectId: string): Promise<Project> {
  const { data } = await api.patch<ProjectsApiItem>(`/projects/${projectId}`, {
    active: false,
  });
  return normalizeProject(data);
}
