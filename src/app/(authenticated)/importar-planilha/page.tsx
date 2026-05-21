"use client";

import { useState } from "react";
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
    <section>
      <h2 className="text-2xl font-semibold text-zinc-900">Importar planilha</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Upload da planilha modelo para onboarding inicial do sistema.
      </p>

      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Esta planilha deve ser usada apenas para carga inicial. Certifique-se de
        usar o modelo oficial.
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 max-w-2xl space-y-4 rounded-lg border border-zinc-200 bg-white p-5"
      >
        <div>
          <label className="text-sm font-medium text-zinc-700" htmlFor="file">
            Arquivo .xlsx
          </label>
          <input
            id="file"
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          />
          <p className="mt-2 text-xs text-zinc-500">
            Formato aceito: .xlsx
          </p>
        </div>

        {error ? <ErrorPanel message={error} /> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSubmitting ? "Importando..." : "Importar planilha"}
        </button>
      </form>

      {isSubmitting ? (
        <LoadingPanel message="Processando importacao..." className="mt-6" />
      ) : null}

      {summary ? (
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Projetos criados
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {summary.projectsCreated}
              </p>
            </article>
            <article className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Protocolos criados
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {summary.protocolsCreated}
              </p>
            </article>
            <article className="rounded-lg border border-zinc-200 bg-white p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Linhas ignoradas
              </p>
              <p className="mt-2 text-2xl font-semibold text-zinc-900">
                {summary.ignoredRows}
              </p>
            </article>
          </div>

          {hasErrors ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <h3 className="text-sm font-semibold text-red-800">
                Erros encontrados
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-red-700">
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
