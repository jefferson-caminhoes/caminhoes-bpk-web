"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownUp,
  BarChart3,
  Download,
  FileSpreadsheet,
  FolderKanban,
  LineChart,
  Plus,
} from "lucide-react";
import { ErrorPanel, LoadingPanel } from "@/components/ui/feedback";
import { appRoutes, projectDetailsRoute } from "@/lib/routes";
import { listEntityAuditLogs } from "@/services/audit-service";
import { listProjectProtocols } from "@/services/protocols-service";
import { listProjects } from "@/services/projects-service";
import type { Project } from "@/types/project";
import type { Protocol } from "@/types/protocol";
import {
  buildHistorySeries,
  buildProjectReports,
  buildReportSelectionLabel,
  buildTrendComparison,
  type HistoryPoint,
  type ProjectReport,
} from "@/lib/project-reporting";
import { exportProjectsExcel, exportProjectsPdf } from "@/lib/report-export";

type HistoryWindow = 6 | 12;

type SelectedScope = "all" | string;

type SummaryCard = {
  label: string;
  value: number;
  helper: string;
};

function statusBadge(project: Project) {
  if (!project.active) {
    return "border-slate-500/40 bg-slate-800 text-slate-200";
  }
  if (project.hasDivergence || project.hasNotFound) {
    return "border-[#ee2331]/50 bg-[#3a0f14] text-[#ffb4bc]";
  }
  return "border-emerald-400/40 bg-emerald-950/60 text-emerald-200";
}

function toneForScore(score: number) {
  if (score >= 20) return "text-[#ffb4bc]";
  if (score >= 10) return "text-amber-200";
  return "text-emerald-200";
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  const signed = value > 0 ? "+" : "";
  return `${signed}${Math.round(value)}%`;
}

function formatRelativeDate(value: string | null) {
  if (!value) return "Sem atividade";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem atividade";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function Sparkline({ points }: { points: HistoryPoint[] }) {
  const width = 140;
  const height = 44;
  const values = points.map((item) => item.value);
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const coords = values.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 6) - 3;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-11 w-full">
      <defs>
        <linearGradient id="sparklineFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ee2331" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#ee2331" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="#ee2331"
        strokeWidth="2.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={coords.join(" ")}
      />
      <polygon
        fill="url(#sparklineFill)"
        points={`${coords.join(" ")} ${width},${height} 0,${height}`}
      />
      {values.map((value, index) => {
        const x = index * step;
        const y = height - (value / max) * (height - 6) - 3;
        return (
          <circle key={`${index}-${value}`} cx={x} cy={y} r="2.8" fill="#fff" stroke="#092946" strokeWidth="1.8" />
        );
      })}
    </svg>
  );
}

function TrendChart({
  title,
  data,
  subtitle,
}: {
  title: string;
  data: HistoryPoint[];
  subtitle: string;
}) {
  const width = 800;
  const height = 220;
  const padding = 28;
  const values = data.map((item) => item.value);
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : width - padding * 2;
  const points = values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - (value / max) * (height - padding * 2);
    return { x, y, value, label: data[index]?.label ?? "" };
  });

  return (
    <article className="rounded-[28px] border border-slate-800 bg-[#08111c] p-5 shadow-2xl shadow-slate-950/50">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {subtitle}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-200">
          <LineChart size={13} />
          Visão histórica
        </span>
      </div>
      <div className="mt-5 rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full">
          <defs>
            <linearGradient id="trendLine" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ee2331" />
              <stop offset="100%" stopColor="#ff9da5" />
            </linearGradient>
            <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ee2331" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ee2331" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding + (height - padding * 2) * ratio;
            return (
              <line
                key={ratio}
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="rgba(148,163,184,0.18)"
                strokeDasharray="5 8"
              />
            );
          })}
          <polyline
            fill="none"
            stroke="url(#trendLine)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points.map((point) => `${point.x},${point.y}`).join(" ")}
          />
          <polygon
            fill="url(#trendFill)"
            points={`${points.map((point) => `${point.x},${point.y}`).join(" ")} ${width - padding},${height - padding} ${padding},${height - padding}`}
          />
          {points.map((point, index) => (
            <g key={`${point.label}-${index}`}>
              <circle cx={point.x} cy={point.y} r="5.5" fill="#fff" stroke="#092946" strokeWidth="2.2">
                <title>{`${point.label}: ${point.value}`}</title>
              </circle>
            </g>
          ))}
          {points.map((point, index) => (
            <text
              key={`label-${point.label}-${index}`}
              x={point.x}
              y={height - 6}
              textAnchor="middle"
              fontSize="11"
              fill="#cbd5e1"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
    </article>
  );
}

function RiskChart({
  reports,
  selectedProjectId,
  onSelectProject,
}: {
  reports: ProjectReport[];
  selectedProjectId: SelectedScope;
  onSelectProject: (projectId: string) => void;
}) {
  const topReports = [...reports].sort((a, b) => b.riskScore - a.riskScore).slice(0, 7);
  const max = Math.max(1, ...topReports.map((item) => item.riskScore));

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ee2331]">
            Ranking de risco
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#092946]">
            Empreendimentos que merecem priorizacao
          </h3>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Score calculado por divergencia, nao encontrado e inatividade
        </span>
      </div>
      <div className="mt-5 space-y-3">
        {topReports.map((report) => {
          const widthPct = Math.max(8, (report.riskScore / max) * 100);
          const selected = selectedProjectId === report.project.id;
          return (
            <button
              key={report.project.id}
              type="button"
              onClick={() => onSelectProject(report.project.id)}
              className={`w-full rounded-2xl border p-3 text-left transition ${
                selected
                  ? "border-[#ee2331]/60 bg-[#fff1f2] shadow-md"
                  : "border-slate-200 bg-slate-50 hover:border-[#092946]/35 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#092946]">{report.project.name}</p>
                  <p className="text-xs text-slate-500">
                    {report.totalProtocols} protocolos | {report.divergentProtocols} divergentes | {report.notFoundProtocols} nao encontrados
                  </p>
                </div>
                <span className={`text-sm font-bold ${toneForScore(report.riskScore)}`}>
                  {report.riskScore}
                </span>
              </div>
              <div className="mt-3 h-3 rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-gradient-to-r from-[#092946] via-[#ee2331] to-[#ff9da5]"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </article>
  );
}

function EventFeed({ events }: { events: ProjectReport["recentEvents"] }) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ee2331]">
            Mudancas recentes
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#092946]">
            Ultimos movimentos que afetam a carteira
          </h3>
        </div>
        <ArrowDownUp size={18} className="text-slate-500" />
      </div>
      <div className="mt-5 space-y-3">
        {events.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Nenhuma mudanca recente encontrada no recorte atual.
          </p>
        ) : (
          events.slice(0, 8).map((event) => (
            <div
              key={event.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#092946]">{event.projectName}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                    {event.protocolLabel ?? "Projeto"} | {event.action}
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {formatRelativeDate(event.createdAt)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{event.description}</p>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function ReportCard({
  report,
  selected,
  onSelect,
}: {
  report: ProjectReport;
  selected: boolean;
  onSelect: () => void;
}) {
  const history = useMemo(() => buildHistorySeries(report.recentEvents, 6), [report]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-[28px] border p-5 transition ${
        selected
          ? "border-[#ee2331]/60 bg-[#0b1320] shadow-xl shadow-slate-950/40"
          : "border-slate-800 bg-[#08111c] hover:border-[#ee2331]/35"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-base font-semibold text-white">{report.project.name}</p>
          <p className="mt-1 text-sm text-slate-400">
            {report.project.description ?? "Sem descricao cadastrada."}
          </p>
        </div>
        <span className={`text-lg font-bold ${toneForScore(report.riskScore)}`}>
          {report.riskScore}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Protocolos</p>
          <p className="mt-1 text-lg font-semibold text-white">{report.totalProtocols}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Divergentes</p>
          <p className="mt-1 text-lg font-semibold text-white">{report.divergentProtocols}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Nao encontrados</p>
          <p className="mt-1 text-lg font-semibold text-white">{report.notFoundProtocols}</p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Mudancas</p>
          <p className="mt-1 text-lg font-semibold text-white">{report.recentChangeCount}</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-700 bg-slate-950/80 p-3">
        <Sparkline points={history} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Ultima atividade {formatRelativeDate(report.lastActivityAt)}
        </span>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(report.project)}`}>
          {report.project.active ? "Ativo" : "Inativo"}
        </span>
      </div>
    </button>
  );
}

export function PortfolioAnalytics() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [protocolsByProject, setProtocolsByProject] = useState<Record<string, Protocol[]>>({});
  const [auditLogsByProject, setAuditLogsByProject] = useState<Record<string, Awaited<ReturnType<typeof listEntityAuditLogs>>>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<SelectedScope>("all");
  const [historyWindow, setHistoryWindow] = useState<HistoryWindow>(6);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setError(null);
        const loadedProjects = await listProjects();
        setProjects(loadedProjects);

        const results = await Promise.all(
          loadedProjects.map(async (project) => {
            try {
              const [protocols, auditLogs] = await Promise.all([
                listProjectProtocols(project.id),
                listEntityAuditLogs("project", project.id),
              ]);
              return {
                projectId: project.id,
                protocols,
                auditLogs,
              };
            } catch {
              return {
                projectId: project.id,
                protocols: [] as Protocol[],
                auditLogs: [] as Awaited<ReturnType<typeof listEntityAuditLogs>>,
              };
            }
          }),
        );

        setProtocolsByProject(
          Object.fromEntries(results.map((item) => [item.projectId, item.protocols])),
        );
        setAuditLogsByProject(
          Object.fromEntries(results.map((item) => [item.projectId, item.auditLogs])),
        );
      } catch {
        setError("Nao foi possivel carregar os indicadores da carteira.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const { reports, allEvents } = useMemo(
    () => buildProjectReports({ projects, protocolsByProject, auditLogsByProject }),
    [auditLogsByProject, projects, protocolsByProject],
  );

  const selectedReport =
    selectedProjectId === "all"
      ? null
      : reports.find((report) => report.project.id === selectedProjectId) ?? null;

  const trendEvents = selectedReport ? selectedReport.recentEvents : allEvents;
  const trendData = buildHistorySeries(trendEvents, historyWindow);
  const trendComparison = buildTrendComparison(trendEvents);

  const summary = useMemo(() => {
    const totalProjects = reports.length;
    const activeProjects = reports.filter((report) => report.project.active).length;
    const totalProtocols = reports.reduce((sum, report) => sum + report.totalProtocols, 0);
    const activeProtocols = reports.reduce((sum, report) => sum + report.activeProtocols, 0);
    const monitoredProtocols = reports.reduce((sum, report) => sum + report.monitoredProtocols, 0);
    const divergentProtocols = reports.reduce((sum, report) => sum + report.divergentProtocols, 0);
    const notFoundProtocols = reports.reduce((sum, report) => sum + report.notFoundProtocols, 0);
    const riskProjects = reports.filter((report) => report.riskScore > 0).length;
    return {
      totalProjects,
      activeProjects,
      totalProtocols,
      activeProtocols,
      monitoredProtocols,
      divergentProtocols,
      notFoundProtocols,
      riskProjects,
    };
  }, [reports]);

  const insight = useMemo(() => {
    if (summary.divergentProtocols > summary.notFoundProtocols) {
      return "A carteira apresenta mais divergencias do que ausencias; o melhor retorno vem de ajustes de status e validacao manual.";
    }
    if (summary.notFoundProtocols > 0) {
      return "Priorize os empreendimentos com maior volume de nao encontrados para reduzir risco operacional.";
    }
    if (summary.riskProjects > 0) {
      return "Os riscos estao concentrados em poucos empreendimentos. O foco deve ser nos top ranks do painel.";
    }
    return "Sem anomalias criticas no recorte atual.";
  }, [summary]);

  const selectedLabel = buildReportSelectionLabel(selectedReport);

  const exportSummary = {
    selectionLabel: selectedLabel,
    totalProjects: selectedReport ? 1 : summary.totalProjects,
    totalProtocols: selectedReport ? selectedReport.totalProtocols : summary.totalProtocols,
    activeProtocols: selectedReport ? selectedReport.activeProtocols : summary.activeProtocols,
    monitoredProtocols: selectedReport ? selectedReport.monitoredProtocols : summary.monitoredProtocols,
    divergentProtocols: selectedReport ? selectedReport.divergentProtocols : summary.divergentProtocols,
    notFoundProtocols: selectedReport ? selectedReport.notFoundProtocols : summary.notFoundProtocols,
    trend: trendData,
    trendComparison,
    projects: selectedReport ? [selectedReport] : reports,
    recentEvents: selectedReport ? selectedReport.recentEvents : allEvents,
  };

  const handleExportPdf = () => exportProjectsPdf(exportSummary);
  const handleExportExcel = () => exportProjectsExcel(exportSummary);

  const summaryCards: SummaryCard[] = [
    { label: "Projetos", value: summary.totalProjects, helper: "carteira ativa" },
    { label: "Ativos", value: summary.activeProjects, helper: "status atual" },
    { label: "Protocolos", value: summary.totalProtocols, helper: "base consolidada" },
    { label: "Monitorados", value: summary.monitoredProtocols, helper: "monitoramento em dia" },
    { label: "Divergentes", value: summary.divergentProtocols, helper: "alerta operacional" },
    { label: "Nao encontrados", value: summary.notFoundProtocols, helper: "consulta com falha" },
  ];

  return (
    <section className="space-y-8">
      <div className="overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-br from-[#08111c] via-[#0d1727] to-[#091019] p-6 shadow-2xl shadow-slate-950/50">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#ee2331]/30 bg-[#fff1f2] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#ee2331]">
              <FolderKanban size={13} />
              Centro de inteligência da carteira
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Visão consolidada de risco, evolução e prioridade.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
              {insight}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href={appRoutes.projectNew}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#ee2331]/40 bg-[#ee2331] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#c91422]"
            >
              <Plus size={16} />
              Novo projeto
            </Link>
            <button
              type="button"
              onClick={handleExportPdf}
              className="group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:border-[#ee2331]/60"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[#ee2331]/20 via-white/10 to-[#ff9da5]/20 opacity-0 transition group-hover:opacity-100" />
              <span className="relative inline-flex items-center gap-2">
                <Download size={16} />
                PDF
              </span>
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              className="group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:border-emerald-300/60"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 via-white/10 to-emerald-200/20 opacity-0 transition group-hover:opacity-100" />
              <span className="relative inline-flex items-center gap-2">
                <FileSpreadsheet size={16} />
                Excel
              </span>
            </button>
          </div>
        </div>
      </div>

      {isLoading ? <LoadingPanel message="Carregando indicadores da carteira..." /> : null}
      {error ? <ErrorPanel message={error} /> : null}

      {!isLoading && !error ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {summaryCards.map((item) => (
              <article
                key={item.label}
                className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-4xl font-semibold text-[#092946]">{item.value}</p>
                <p className="mt-2 text-sm text-slate-600">{item.helper}</p>
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <TrendChart
              title={selectedLabel}
              subtitle={`Comparacao historica em ${historyWindow} meses`}
              data={trendData}
            />
            <div className="space-y-6">
              <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ee2331]">
                      Comparacao historica
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[#092946]">
                      Ultimos 30 dias contra o periodo anterior
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#092946] px-3 py-1 text-xs font-semibold text-white">
                    <BarChart3 size={13} />
                    {formatPercent(trendComparison.delta)}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Agora
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#092946]">
                      {trendComparison.current}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Anterior
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#092946]">
                      {trendComparison.previous}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-[#fff1f2] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#ee2331]">
                      Delta
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#ee2331]">
                      {formatPercent(trendComparison.delta)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[6, 12].map((monthCount) => (
                    <button
                      key={monthCount}
                      type="button"
                      onClick={() => setHistoryWindow(monthCount as HistoryWindow)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        historyWindow === monthCount
                          ? "bg-[#092946] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {monthCount} meses
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId("all")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      selectedProjectId === "all"
                        ? "bg-[#ee2331] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Consolidado
                  </button>
                </div>
              </article>

              <RiskChart
                reports={reports}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
              />
            </div>
          </div>

          <EventFeed
            events={selectedReport ? selectedReport.recentEvents : allEvents}
          />

          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {reports.map((report) => (
              <ReportCard
                key={report.project.id}
                report={report}
                selected={selectedProjectId === report.project.id}
                onSelect={() => setSelectedProjectId(report.project.id)}
              />
            ))}
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg">
            <p className="text-sm font-semibold text-[#092946]">Projetos detalhados</p>
            <p className="mt-1 text-sm text-slate-600">
              Clique em um projeto no ranking ou no card para abrir o detalhe completo.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reports.slice(0, 6).map((report) => (
                <Link
                  key={report.project.id}
                  href={projectDetailsRoute(report.project.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-[#092946]/50 hover:text-[#092946]"
                >
                  {report.project.name}
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] ${statusBadge(report.project)}`}>
                    {report.project.active ? "Ativo" : "Inativo"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
