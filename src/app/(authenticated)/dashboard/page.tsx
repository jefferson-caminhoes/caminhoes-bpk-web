 "use client";

import { useEffect, useMemo, useState } from "react";
import { getDashboardSummary } from "@/services/dashboard-service";
import type { DashboardSummary } from "@/types/dashboard";

function formatLastExecution(value: string | null) {
  if (!value) {
    return "Sem execucao registrada";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

type SummaryItem = {
  label: string;
  value: string | number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSummary() {
      try {
        setError(null);
        const data = await getDashboardSummary();
        setSummary(data);
      } catch {
        setError("Nao foi possivel carregar o resumo do dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSummary();
  }, []);

  const items: SummaryItem[] = useMemo(() => {
    if (!summary) return [];

    return [
      { label: "Total de projetos", value: summary.totalProjects },
      { label: "Protocolos ativos", value: summary.activeProtocols },
      { label: "Protocolos finalizados", value: summary.finishedProtocols },
      { label: "Protocolos monitorados", value: summary.monitoredProtocols },
      { label: "Protocolos com divergencia", value: summary.divergentProtocols },
      { label: "Protocolos nao encontrados", value: summary.notFoundProtocols },
      {
        label: "Ultima execucao do robo",
        value: formatLastExecution(summary.lastRobotExecution),
      },
    ];
  }, [summary]);

  return (
    <section>
      <h2 className="text-2xl font-semibold text-zinc-900">Dashboard</h2>
      <p className="mt-2 text-sm text-zinc-600">Visao geral do monitoramento.</p>

      {isLoading ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Carregando resumo...
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && summary ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.label}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-semibold text-zinc-900">
                {item.value}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
