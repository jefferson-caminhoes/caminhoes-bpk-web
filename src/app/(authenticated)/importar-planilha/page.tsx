"use client";

import { useState } from "react";
import { FileSpreadsheet, UploadCloud } from "lucide-react";
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

      <div className="rounded-md border border-[#092946]/15 bg-white p-4 shadow-sm">
        <div className="flex gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#092946] text-white">
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
        className="max-w-2xl space-y-4 rounded-md border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div>
          <label className="text-sm font-semibold text-[#092946]" htmlFor="file">
            Arquivo .xlsx
          </label>
          <input
            id="file"
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <p className="mt-2 text-xs text-slate-500">
            Formato aceito: .xlsx
          </p>
        </div>

        {error ? <ErrorPanel message={error} /> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#092946] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123a60] disabled:opacity-70"
        >
          <UploadCloud size={16} />
          {isSubmitting ? "Importando..." : "Importar planilha"}
        </button>
      </form>

      {isSubmitting ? (
        <LoadingPanel message="Processando importacao..." />
      ) : null}

      {summary ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Projetos criados
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#092946]">
                {summary.projectsCreated}
              </p>
            </article>
            <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Protocolos criados
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#092946]">
                {summary.protocolsCreated}
              </p>
            </article>
            <article className="rounded-md border border-[#ee2331]/30 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#ee2331]">
                Linhas ignoradas
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#ee2331]">
                {summary.ignoredRows}
              </p>
            </article>
          </div>

          {hasErrors ? (
            <div className="rounded-md border border-red-200 bg-[#fff1f2] p-4">
              <h3 className="text-sm font-semibold text-[#b5121f]">
                Erros encontrados
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-[#b5121f]">
                {summary.errors.map((item, index) => (
                  <li key={`${item.message}-${index}`}>
                    {(item.line ?? item.row) ? `Linha ${item.line ?? item.row}: ` : ""}
                    {item.field ? `${item.field} - ` : ""}
                    {item.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
