"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Eye,
  KanbanSquare,
  LayoutList,
  Plus,
  Radar,
  Search,
} from "lucide-react";
import { ErrorPanel, LoadingPanel } from "@/components/ui/feedback";
import {
  projectProtocolDetailsRoute,
  projectProtocolsNewRoute,
  projectDetailsRoute,
} from "@/lib/routes";
import { listProjectProtocols } from "@/services/protocols-service";
import { getProjectById } from "@/services/projects-service";
import { formatDate } from "@/lib/format-date";
import type { Protocol } from "@/types/protocol";
import type { Project } from "@/types/project";

type ViewMode = "lista" | "kanban";

function statusTone(value?: string | null) {
  if (!value) return "border-slate-200 bg-slate-100 text-slate-500";
  const normalized = value.toLowerCase();
  if (normalized.includes("final") || normalized.includes("conclu")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (normalized.includes("pend") || normalized.includes("erro")) {
    return "border-[#ee2331]/30 bg-[#fff1f2] text-[#ee2331]";
  }
  return "border-[#092946]/15 bg-slate-50 text-[#092946]";
}

export default function ProtocolosProjetoPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [showOnlyDivergent, setShowOnlyDivergent] = useState(false);
  const [showOnlyNotFound, setShowOnlyNotFound] = useState(false);
  const [showOnlyMonitoringEnabled, setShowOnlyMonitoringEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProtocols() {
      try {
        setError(null);
        const [protocolsData, projectData] = await Promise.all([
          listProjectProtocols(projectId),
          getProjectById(projectId),
        ]);
        setProtocols(protocolsData);
        setProject(projectData);
      } catch {
        setError("Nao foi possivel carregar os protocolos deste projeto.");
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId) {
      void loadProtocols();
    }
  }, [projectId]);

  const filteredProtocols = useMemo(() => {
    return protocols.filter((protocol) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        protocol.activity.toLowerCase().includes(normalizedQuery) ||
        protocol.protocolNumber.toLowerCase().includes(normalizedQuery) ||
        protocol.cnpj.toLowerCase().includes(normalizedQuery) ||
        (protocol.stakeholderName ?? "").toLowerCase().includes(normalizedQuery);

      const matchesDivergence = !showOnlyDivergent || protocol.hasDivergence;
      const matchesNotFound = !showOnlyNotFound || protocol.notFoundOnSource;
      const matchesMonitoring =
        !showOnlyMonitoringEnabled || protocol.monitoringEnabled;

      return (
        matchesQuery &&
        matchesDivergence &&
        matchesNotFound &&
        matchesMonitoring
      );
    });
  }, [
    protocols,
    query,
    showOnlyDivergent,
    showOnlyNotFound,
    showOnlyMonitoringEnabled,
  ]);

  const stats = useMemo(() => {
    return {
      total: protocols.length,
      divergent: protocols.filter((protocol) => protocol.hasDivergence).length,
      notFound: protocols.filter((protocol) => protocol.notFoundOnSource).length,
      monitored: protocols.filter((protocol) => protocol.monitoringEnabled).length,
      withExternalStatus: protocols.filter((protocol) => protocol.externalStatus)
        .length,
    };
  }, [protocols]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Monitoramento de protocolos
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">Protocolos</h2>
          <p className="mt-2 text-sm text-slate-600">
            Projeto:{" "}
            <Link
              href={projectDetailsRoute(projectId)}
              className="font-semibold text-[#092946] hover:text-[#ee2331]"
            >
              {project?.name ?? projectId}
            </Link>
          </p>
        </div>
        <Link
          href={projectProtocolsNewRoute(projectId)}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#092946] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123a60]"
        >
          <Plus size={16} />
          Novo protocolo
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#092946]">{stats.total}</p>
        </article>
        <article className="rounded-md border border-[#ee2331]/30 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#ee2331]">
            Divergentes
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#ee2331]">
            {stats.divergent}
          </p>
        </article>
        <article className="rounded-md border border-[#ee2331]/30 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#ee2331]">
            Nao encontrados
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#ee2331]">
            {stats.notFound}
          </p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Monitorados
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#092946]">
            {stats.monitored}
          </p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status externo
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#092946]">
            {stats.withExternalStatus}
          </p>
        </article>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por atividade, numero, CNPJ ou stakeholder"
              className="min-h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-[#ee2331]"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showOnlyDivergent}
                onChange={(event) => setShowOnlyDivergent(event.target.checked)}
              />
              Divergencia
            </label>
            <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showOnlyNotFound}
                onChange={(event) => setShowOnlyNotFound(event.target.checked)}
              />
              Nao encontrados
            </label>
            <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showOnlyMonitoringEnabled}
                onChange={(event) =>
                  setShowOnlyMonitoringEnabled(event.target.checked)
                }
              />
              Monitoramento ativo
            </label>
          </div>
        </div>

        <div className="mt-3 grid w-full max-w-xs grid-cols-2 rounded-md border border-slate-300 bg-slate-50 p-1 text-sm">
          <button
            type="button"
            onClick={() => setViewMode("lista")}
            className={`inline-flex items-center justify-center gap-2 rounded px-3 py-1.5 font-medium ${
              viewMode === "lista"
                ? "bg-[#092946] text-white"
                : "text-slate-700 hover:text-[#092946]"
            }`}
          >
            <LayoutList size={16} />
            Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`inline-flex items-center justify-center gap-2 rounded px-3 py-1.5 font-medium ${
              viewMode === "kanban"
                ? "bg-[#092946] text-white"
                : "text-slate-700 hover:text-[#092946]"
            }`}
          >
            <KanbanSquare size={16} />
            Kanban
          </button>
        </div>
      </div>

      {isLoading ? <LoadingPanel message="Carregando protocolos..." /> : null}
      {error ? <ErrorPanel message={error} /> : null}
      {!isLoading && !error && filteredProtocols.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Nenhum protocolo encontrado para os filtros selecionados.
        </div>
      ) : null}

      {!isLoading && !error && filteredProtocols.length > 0 && viewMode === "lista" ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Atividade</th>
                <th className="px-4 py-3 font-semibold">Protocolo</th>
                <th className="px-4 py-3 font-semibold">Responsavel</th>
                <th className="px-4 py-3 font-semibold">Status manual</th>
                <th className="px-4 py-3 font-semibold">Status externo</th>
                <th className="px-4 py-3 font-semibold">Alertas</th>
                <th className="px-4 py-3 font-semibold">Situacao</th>
                <th className="px-4 py-3 font-semibold">Abertura</th>
                <th className="px-4 py-3 font-semibold">Ultima obs.</th>
                <th className="px-4 py-3 font-semibold">Monit.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProtocols.map((protocol) => (
                <tr key={protocol.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(projectProtocolDetailsRoute(projectId, protocol.id))}>
                  <td className="px-4 py-3 font-medium text-[#092946]">
                    {protocol.activity}
                    <p className="mt-1 text-xs font-normal text-slate-500">
                      {protocol.stakeholderName ?? "Stakeholder nao informado"}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={projectProtocolDetailsRoute(projectId, protocol.id)}
                      className="font-semibold text-[#092946] hover:text-[#ee2331]"
                    >
                      {protocol.protocolNumber}
                    </Link>
                    <div className="mt-1 text-xs text-slate-500">{protocol.cnpj}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {protocol.assignedTo ?? protocol.owner ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusTone(protocol.manualStatus)}`}
                    >
                      {protocol.manualStatus ?? "N/A"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${statusTone(protocol.externalStatus)}`}
                    >
                      {protocol.externalStatus ?? "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {protocol.hasDivergence ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                          <AlertTriangle size={13} />
                          Divergencia
                        </span>
                      ) : null}
                      {protocol.notFoundOnSource ? (
                        <span className="rounded-md bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                          Nao encontrado
                        </span>
                      ) : null}
                      {!protocol.hasDivergence && !protocol.notFoundOnSource ? (
                        <span className="text-xs text-slate-500">Sem alertas</span>
                      ) : null}
                    </div>
                  </td>
                  <td
                    className="max-w-[180px] truncate px-4 py-3 text-slate-600"
                    title={protocol.situation ?? ""}
                  >
                    {protocol.situation ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(protocol.openingDate)}
                  </td>
                  <td
                    className="max-w-[220px] truncate px-4 py-3 text-slate-600"
                    title={protocol.lastObservation ?? ""}
                  >
                    {protocol.lastObservation ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${
                        protocol.monitoringEnabled
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      <Radar size={13} />
                      {protocol.monitoringEnabled ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isLoading && !error && filteredProtocols.length > 0 && viewMode === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProtocols.map((protocol) => (
            <article
              key={protocol.id}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[#092946]">
                  {protocol.activity}
                </h3>
                <Link
                  href={projectProtocolDetailsRoute(projectId, protocol.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-[#092946] hover:border-[#ee2331]/40 hover:text-[#ee2331]"
                >
                  <Eye size={13} />
                  Ver
                </Link>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                #{protocol.protocolNumber} - {protocol.cnpj}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {protocol.hasDivergence ? (
                  <span className="rounded-md bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                    Divergencia
                  </span>
                ) : null}
                {protocol.notFoundOnSource ? (
                  <span className="rounded-md bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                    Nao encontrado
                  </span>
                ) : null}
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${
                    protocol.monitoringEnabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {protocol.monitoringEnabled ? "Monitorado" : "Sem monitoramento"}
                </span>
              </div>

              <dl className="mt-5 grid gap-3 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Stakeholder</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {protocol.stakeholderName ?? "-"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Manual</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {protocol.manualStatus ?? "N/A"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-slate-500">Externo</dt>
                  <dd className="text-right font-medium text-slate-800">
                    {protocol.externalStatus ?? "-"}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
