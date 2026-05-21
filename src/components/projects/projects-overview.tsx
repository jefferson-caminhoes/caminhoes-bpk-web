"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  KanbanSquare,
  LayoutList,
  Plus,
  Search,
} from "lucide-react";
import { ErrorPanel, LoadingPanel } from "@/components/ui/feedback";
import { appRoutes, projectDetailsRoute } from "@/lib/routes";
import { formatDateTime } from "@/lib/format-date";
import { listEntityAuditLogs } from "@/services/audit-service";
import { listProjectProtocols } from "@/services/protocols-service";
import { listProjects } from "@/services/projects-service";
import type { Project } from "@/types/project";
import type { Protocol } from "@/types/protocol";
import { buildProjectReports } from "@/lib/project-reporting";

type ViewMode = "lista" | "kanban";

type ActiveFilter = "todos" | "ativos" | "inativos";

function statusBadge(project: Project) {
  if (!project.active) {
    return "border-slate-500/40 bg-slate-800 text-slate-200";
  }
  if (project.hasDivergence || project.hasNotFound) {
    return "border-[#ee2331]/50 bg-[#3a0f14] text-[#ffb4bc]";
  }
  return "border-emerald-400/40 bg-emerald-950/60 text-emerald-200";
}

export function ProjectsOverview() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [protocolsByProject, setProtocolsByProject] = useState<Record<string, Protocol[]>>({});
  const [auditLogsByProject, setAuditLogsByProject] = useState<Record<string, Awaited<ReturnType<typeof listEntityAuditLogs>>>>({});
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");
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
        setError("Nao foi possivel carregar os projetos.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const { reports } = useMemo(
    () => buildProjectReports({ projects, protocolsByProject, auditLogsByProject }),
    [auditLogsByProject, projects, protocolsByProject],
  );

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const normalizedQuery = query.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        report.project.name.toLowerCase().includes(normalizedQuery) ||
        (report.project.description ?? "").toLowerCase().includes(normalizedQuery);

      const matchesStatus =
        activeFilter === "todos" ||
        (activeFilter === "ativos" && report.project.active) ||
        (activeFilter === "inativos" && !report.project.active);

      return matchesQuery && matchesStatus;
    });
  }, [activeFilter, query, reports]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Carteira
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">Projetos</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Acompanhe a saude da carteira e entre nos projetos com sinais de risco.
          </p>
        </div>
        <Link
          href={appRoutes.projectNew}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#092946] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123a60]"
        >
          <Plus size={16} />
          Novo projeto
        </Link>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome do projeto"
              className="min-h-12 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-[#ee2331]"
            />
          </label>
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
            className="min-h-12 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
          <div className="grid grid-cols-2 rounded-md border border-slate-300 bg-slate-950 p-1 text-sm">
            <button
              type="button"
              onClick={() => setViewMode("lista")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 font-medium ${
                viewMode === "lista"
                  ? "bg-white text-[#092946]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <LayoutList size={16} />
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 font-medium ${
                viewMode === "kanban"
                  ? "bg-white text-[#092946]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <KanbanSquare size={16} />
              Kanban
            </button>
          </div>
        </div>
      </div>

      {isLoading ? <LoadingPanel message="Carregando projetos..." /> : null}
      {error ? <ErrorPanel message={error} /> : null}

      {!isLoading && !error && filteredReports.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Nenhum projeto encontrado para os filtros selecionados.
        </div>
      ) : null}

      {!isLoading && !error && filteredReports.length > 0 && viewMode === "lista" ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase tracking-[0.2em] text-slate-300">
              <tr>
                <th className="px-4 py-4 font-semibold">Nome</th>
                <th className="px-4 py-4 font-semibold">Responsavel</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 font-semibold">Sinais</th>
                <th className="px-4 py-4 font-semibold">Protocolos</th>
                <th className="px-4 py-4 font-semibold">Ultima atualizacao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.map((report) => (
                <tr
                  key={report.project.id}
                  className="cursor-pointer hover:bg-[#f8fafc]"
                  onClick={() => router.push(projectDetailsRoute(report.project.id))}
                >
                  <td className="px-4 py-4 font-semibold text-[#092946]">
                    <Link
                      href={projectDetailsRoute(report.project.id)}
                      className="hover:text-[#ee2331]"
                    >
                      {report.project.name}
                    </Link>
                    <p className="mt-1 max-w-md truncate text-xs font-normal text-slate-500">
                      {report.project.description ?? "Sem descricao cadastrada"}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {report.project.owner ?? "Nao informado"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge(report.project)}`}
                    >
                      {report.project.active ? <CheckCircle2 size={13} /> : <span className="h-2 w-2 rounded-full bg-current" />}
                      {report.project.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {report.project.hasDivergence ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                          <AlertTriangle size={13} />
                          Divergencia
                        </span>
                      ) : null}
                      {report.project.hasNotFound ? (
                        <span className="rounded-full bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                          Nao encontrado
                        </span>
                      ) : null}
                      {!report.project.hasDivergence && !report.project.hasNotFound ? (
                        <span className="text-xs text-slate-500">Sem alertas</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-700">
                    {report.totalProtocols}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDateTime(report.project.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isLoading && !error && filteredReports.length > 0 && viewMode === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredReports.map((report) => (
            <article
              key={report.project.id}
              className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-xl transition hover:border-[#092946]/35 hover:shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[#092946]">
                  <Link
                    href={projectDetailsRoute(report.project.id)}
                    className="hover:text-[#ee2331]"
                  >
                    {report.project.name}
                  </Link>
                </h3>
                <span
                  className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusBadge(report.project)}`}
                >
                  {report.project.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                {report.project.description ?? "Sem descricao cadastrada."}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Responsavel
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {report.project.owner ?? "Nao informado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Protocolos
                  </dt>
                  <dd className="mt-1 text-slate-800">{report.totalProtocols}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ultima atualização
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {formatDateTime(report.project.updatedAt)}
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
