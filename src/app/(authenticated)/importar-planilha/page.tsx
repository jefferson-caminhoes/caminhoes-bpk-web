"use client";

import { useState } from "react";
import { CheckCircle2, FileSpreadsheet, UploadCloud, XCircle } from "lucide-react";
import { ErrorPanel, LoadingPanel } from "@/components/ui/feedback";
import { getApiErrorMessage } from "@/lib/api-errors";
import { pushToast } from "@/lib/toast";
import { uploadProtocolsSpreadsheet } from "@/services/imports-service";
import type { ImportSummary } from "@/types/imports";

const EMPTY_SUMMARY: ImportSummary = {
  projectsCreated: 0,
  protocolsCreated: 0,
  ignoredRows: 0,
  errors: [],
};

export default function ImportarPlanilhaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0] ?? null;
    setSummary(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!selected.name.toLowerCase().endsWith(".xlsx")) {
      setFile(null);
      setError("Envie apenas arquivos .xlsx do modelo de onboarding.");
      event.target.value = "";
      return;
    }

    setError(null);
    setFile(selected);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) {
      setError("Selecione um arquivo .xlsx antes de importar.");
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      const result = await uploadProtocolsSpreadsheet(file);
      setSummary(result);
      pushToast("Planilha importada com sucesso.", "success");
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Nao foi possivel importar a planilha."),
      );
      setSummary(EMPTY_SUMMARY);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasErrors = (summary?.errors ?? []).length > 0;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
          Onboarding de dados
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[#092946]">
          Importar planilha
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Carga inicial de projetos e protocolos a partir do modelo oficial do
          sistema.
        </p>
      </div>

      <div className="rounded-2xl border border-[#092946]/20 bg-white p-5 shadow-sm">
        <div className="flex gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#092946] text-white shadow-sm">
            <FileSpreadsheet size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#092946]">
              Use apenas para carga inicial
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Verifique se o arquivo segue o modelo oficial antes de enviar para
              evitar duplicidades ou linhas ignoradas.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl space-y-5 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="text-sm font-semibold text-[#092946]" htmlFor="file">
            Arquivo .xlsx
          </label>
          <label
            htmlFor="file"
            className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#092946]/30 bg-gradient-to-br from-slate-50 to-white px-5 py-8 text-center transition hover:border-[#ee2331]/60 hover:bg-[#fff1f2]"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#092946] text-white shadow-sm">
              <UploadCloud size={22} />
            </span>
            <span className="mt-3 text-sm font-semibold text-[#092946]">
              {file ? file.name : "Clique para escolher a planilha"}
            </span>
            <span className="mt-1 text-xs text-slate-500">
              Apenas arquivos .xlsx do modelo oficial
            </span>
          </label>
          <input
            id="file"
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="sr-only"
          />
        </div>

        {error ? <ErrorPanel message={error} /> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#092946] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123a60] disabled:opacity-70"
        >
          <UploadCloud size={16} />
          {isSubmitting ? "Importando..." : "Importar planilha"}
        </button>
      </form>

      {isSubmitting ? (
        <LoadingPanel message="Processando importação..." />
      ) : null}

    </section>
  );
}
