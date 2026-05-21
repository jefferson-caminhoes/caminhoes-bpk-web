import api from "@/lib/api";
import type { RagChatResponse, RagSource } from "@/types/rag";

type RagSourceApi = {
  id?: string;
  type?: string;
  label?: string;
  name?: string;
  title?: string;
  projectId?: string;
  project_id?: string;
  protocolId?: string;
  protocol_id?: string;
  url?: string;
};

type RagChatResponseApi = {
  answer?: string;
  response?: string;
  message?: string;
  content?: string;
  sources?: RagSourceApi[];
  fontes?: RagSourceApi[];
};

function normalizeSources(raw: RagSourceApi[] | undefined): RagSource[] {
  if (!raw) return [];

  return raw.map((item) => ({
    id: item.id ?? null,
    type: item.type ?? null,
    label: item.label ?? item.title ?? item.name ?? "Fonte",
    projectId: item.projectId ?? item.project_id ?? null,
    protocolId: item.protocolId ?? item.protocol_id ?? null,
    url: item.url ?? null,
  }));
}

export async function sendRagChat(question: string): Promise<RagChatResponse> {
  const { data } = await api.post<RagChatResponseApi>("/rag/chat", {
    message: question,
  });

  const answer =
    data.answer ?? data.response ?? data.message ?? data.content ?? "";

  return {
    answer,
    sources: normalizeSources(data.sources ?? data.fontes),
  };
}
