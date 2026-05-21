"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  FolderKanban,
  Radar,
} from "lucide-react";
import { ErrorPanel, LoadingPanel } from "@/components/ui/feedback";
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
  helper: string;
  tone: "navy" | "red" | "neutral" | "success";
  icon: ComponentType<{ size?: number; className?: string }>;
};

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

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

    const totalProtocols = summary.activeProtocols + summary.finishedProtocols;
    const riskProtocols = summary.divergentProtocols + summary.notFoundProtocols;
    const monitoredRate =
      totalProtocols > 0 ? (summary.monitoredProtocols / totalProtocols) * 100 : 0;

    return [
      {
        label: "Projetos",
        value: summary.totalProjects,
        helper: "Carteira cadastrada",
        tone: "navy",
        icon: FolderKanban,
      },
      {
        label: "Protocolos ativos",
        value: summary.activeProtocols,
        helper: `${summary.finishedProtocols} finalizados`,
        tone: "neutral",
        icon: Activity,
      },
      {
        label: "Em risco",
        value: riskProtocols,
        helper: `${summary.divergentProtocols} divergentes, ${summary.notFoundProtocols} nao encontrados`,
        tone: riskProtocols > 0 ? "red" : "success",
        icon: AlertTriangle,
      },
      {
        label: "Monitorados",
        value: summary.monitoredProtocols,
        helper: `${formatPercent(monitoredRate)} da base de protocolos`,
        tone: "navy",
        icon: Radar,
      },
      {
        label: "Concluidos",
        value: summary.finishedProtocols,
        helper: "Protocolos encerrados",
        tone: "success",
        icon: CheckCircle2,
      },
      {
        label: "Ultima execucao",
        value: formatLastExecution(summary.lastRobotExecution),
        helper: "Referencia do robo de scraping",
        tone: "neutral",
        icon: Bot,
      },
    ];
  }, [summary]);

  const insight = useMemo(() => {
    if (!summary) return null;
    if (summary.divergentProtocols > 0) {
      return "Revise primeiro os protocolos com divergencia entre status manual e externo.";
    }
    if (summary.notFoundProtocols > 0) {
      return "Audite as fontes dos protocolos nao encontrados na ultima consulta.";
    }
    if (summary.monitoredProtocols === 0) {
      return "Ative o monitoramento dos protocolos prioritarios para gerar alertas.";
    }
    return "Operacao sem riscos criticos detectados no resumo atual.";
  }, [summary]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Centro de controle
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">Dashboard</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Visao executiva da carteira, com destaque para protocolos que exigem
            decisao ou revisao operacional.
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingPanel message="Carregando resumo..." />
      ) : null}

      {error ? (
        <ErrorPanel message={error} />
      ) : null}

      {!isLoading && !error && summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const Icon = item.icon;
              const toneClass =
                item.tone === "red"
                  ? "border-[#ee2331]/30 bg-[#fff1f2] text-[#ee2331]"
                  : item.tone === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : item.tone === "navy"
                      ? "border-[#092946]/15 bg-white text-[#092946]"
                      : "border-slate-200 bg-white text-slate-700";

              return (
                <article
                  key={item.label}
                  className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-3 text-3xl font-semibold text-[#092946]">
                        {item.value}
                      </p>
                    </div>
                    <span
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-md border ${toneClass}`}
                    >
                      <Icon size={20} />
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.helper}</p>
                </article>
              );
            })}
          </div>

          <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#092946]">
                  Insight operacional
                </p>
                <p className="mt-1 text-sm text-slate-600">{insight}</p>
              </div>
              <span className="rounded-md bg-[#092946] px-3 py-2 text-sm font-semibold text-white">
                {summary.divergentProtocols + summary.notFoundProtocols} pendencias
              </span>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
