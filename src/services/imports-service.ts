import api from "@/lib/api";
import type { ImportError, ImportSummary } from "@/types/imports";

type ImportApiError = {
  line?: number;
  linha?: number;
  row?: number;
  field?: string;
  campo?: string;
  message?: string;
  error?: string;
  erro?: string;
  detail?: string;
};

type ImportApiResponse = {
  projectsCreated?: number;
  projetos_criados?: number;
  protocolsCreated?: number;
  protocolos_criados?: number;
  ignoredRows?: number;
  linhas_ignoradas?: number;
  errors?: ImportApiError[] | string[];
  erros?: ImportApiError[] | string[];
};

type ImportApiWrapper = {
  summary?: ImportApiResponse;
  resultado?: ImportApiResponse;
  errors?: ImportApiError[] | string[];
  erros?: ImportApiError[] | string[];
};

function normalizeErrors(
  raw: ImportApiError[] | string[] | undefined,
): ImportError[] {
  if (!raw) return [];

  return raw.map((item) => {
    if (typeof item === "string") {
      return { message: item };
    }

    return {
      line: item.line ?? item.linha ?? item.row,
      row: item.row ?? item.line ?? item.linha,
      field: item.field ?? item.campo ?? null,
      message: item.message ?? item.error ?? item.erro ?? item.detail ?? "Erro",
    };
  });
}

function normalizeSummary(data: ImportApiResponse): ImportSummary {
  const projectsCreated =
    data.projectsCreated ?? data.projetos_criados ?? (data as any).projects ?? 0;
  const protocolsCreated =
    data.protocolsCreated ??
    data.protocolos_criados ??
    (data as any).protocols ??
    0;
  const ignoredRows =
    data.ignoredRows ?? data.linhas_ignoradas ?? (data as any).ignored ?? 0;

  const errors = normalizeErrors(data.errors ?? data.erros);

  return {
    projectsCreated,
    protocolsCreated,
    ignoredRows,
    errors,
  };
}

export async function uploadProtocolsSpreadsheet(
  file: File,
): Promise<ImportSummary> {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<ImportApiResponse | ImportApiWrapper>(
    "/imports/protocols",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  const payload = (data as ImportApiWrapper).summary ??
    (data as ImportApiWrapper).resultado ??
    (data as ImportApiResponse);

  const summary = normalizeSummary(payload);
  const wrapperErrors = normalizeErrors(
    (data as ImportApiWrapper).errors ?? (data as ImportApiWrapper).erros,
  );

  return {
    ...summary,
    errors: [...summary.errors, ...wrapperErrors],
  };
}
