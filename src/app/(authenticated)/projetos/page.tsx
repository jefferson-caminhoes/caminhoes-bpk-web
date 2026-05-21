"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
import { listProjects } from "@/services/projects-service";
import type { Project } from "@/types/project";

type ViewMode = "lista" | "kanban";
type ActiveFilter = "todos" | "ativos" | "inativos";

function statusBadge(project: Project) {
  if (!project.active) {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }
  if (project.hasDivergence || project.hasNotFound) {
    return "border-[#ee2331]/30 bg-[#fff1f2] text-[#ee2331]";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function ProjetosPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("todos");
  const [viewMode, setViewMode] = useState<ViewMode>("lista");

  useEffect(() => {
    async function loadProjects() {
      try {
        setError(null);
        const data = await listProjects();
        setProjects(data);
      } catch {
        setError("Nao foi possivel carregar os projetos.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesQuery = project.name
        .toLowerCase()
        .includes(query.trim().toLowerCase());

      const matchesStatus =
        activeFilter === "todos" ||
        (activeFilter === "ativos" && project.active) ||
        (activeFilter === "inativos" && !project.active);

      return matchesQuery && matchesStatus;
    });
  }, [activeFilter, projects, query]);

  const stats = useMemo(() => {
    const active = projects.filter((project) => project.active).length;
    const withRisk = projects.filter(
      (project) => project.hasDivergence || project.hasNotFound,
    ).length;
    const protocols = projects.reduce(
      (total, project) => total + (project.protocolsCount ?? 0),
      0,
    );

    return { active, withRisk, protocols };
  }, [projects]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Carteira
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">Projetos</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Acompanhe a saude da carteira e entre nos projetos com sinais de risco
            antes de revisar protocolo por protocolo.
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

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Projetos ativos
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#092946]">{stats.active}</p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Protocolos
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#092946]">
            {stats.protocols}
          </p>
        </article>
        <article className="rounded-md border border-[#ee2331]/30 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#ee2331]">
            Projetos com alerta
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#ee2331]">
            {stats.withRisk}
          </p>
        </article>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome do projeto"
              className="min-h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-[#ee2331]"
            />
          </label>

          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
            className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>

          <div className="grid grid-cols-2 rounded-md border border-slate-300 bg-slate-50 p-1 text-sm">
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
      </div>

      {isLoading ? <LoadingPanel message="Carregando projetos..." /> : null}
      {error ? <ErrorPanel message={error} /> : null}

      {!isLoading && !error && filteredProjects.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Nenhum projeto encontrado para os filtros selecionados.
        </div>
      ) : null}

      {!isLoading && !error && filteredProjects.length > 0 && viewMode === "lista" ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Responsavel</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Sinais</th>
                <th className="px-4 py-3 font-semibold">Protocolos</th>
                <th className="px-4 py-3 font-semibold">Ultima atualizacao</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProjects.map((project) => (
                <tr key={project.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-[#092946]">
                    <Link
                      href={projectDetailsRoute(project.id)}
                      className="hover:text-[#ee2331]"
                    >
                      {project.name}
                    </Link>
                    <p className="mt-1 max-w-md truncate text-xs font-normal text-slate-500">
                      {project.description ?? "Sem descricao cadastrada"}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {project.owner ?? "Nao informado"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${statusBadge(project)}`}
                    >
                      {project.active ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <span className="h-2 w-2 rounded-full bg-current" />
                      )}
                      {project.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {project.hasDivergence ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                          <AlertTriangle size={13} />
                          Divergencia
                        </span>
                      ) : null}
                      {project.hasNotFound ? (
                        <span className="rounded-md bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                          Nao encontrado
                        </span>
                      ) : null}
                      {!project.hasDivergence && !project.hasNotFound ? (
                        <span className="text-xs text-slate-500">Sem alertas</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {project.protocolsCount ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDateTime(project.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isLoading && !error && filteredProjects.length > 0 && viewMode === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className="rounded-md border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[#092946]">
                  <Link href={projectDetailsRoute(project.id)} className="hover:text-[#ee2331]">
                    {project.name}
                  </Link>
                </h3>
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold ${statusBadge(project)}`}
                >
                  {project.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                {project.description ?? "Sem descricao cadastrada."}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Responsavel
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {project.owner ?? "Nao informado"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Protocolos
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {project.protocolsCount ?? "-"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ultima atualizacao
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {formatDateTime(project.updatedAt)}
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
