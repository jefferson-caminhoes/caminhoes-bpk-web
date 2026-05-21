 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { appRoutes, projectDetailsRoute } from "@/lib/routes";
import { listProjects } from "@/services/projects-service";
import type { Project } from "@/types/project";

type ViewMode = "lista" | "kanban";
type ActiveFilter = "todos" | "ativos" | "inativos";

function formatDate(value?: string | null) {
  if (!value) return "Sem atualizacao";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
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

  return (
    <section>
      <h2 className="text-2xl font-semibold text-zinc-900">Projetos</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Listagem com busca, filtro e alternancia entre lista e kanban.
      </p>

      <div className="mt-6 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome do projeto"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        />

        <select
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value as ActiveFilter)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="todos">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>

        <div className="flex rounded-md border border-zinc-300 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => setViewMode("lista")}
            className={`w-full rounded px-3 py-1.5 ${
              viewMode === "lista" ? "bg-zinc-900 text-white" : "text-zinc-700"
            }`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setViewMode("kanban")}
            className={`w-full rounded px-3 py-1.5 ${
              viewMode === "kanban" ? "bg-zinc-900 text-white" : "text-zinc-700"
            }`}
          >
            Kanban
          </button>
        </div>

        <Link
          href={appRoutes.projectNew}
          className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Novo projeto
        </Link>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Carregando projetos...
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && filteredProjects.length === 0 ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Nenhum projeto encontrado para os filtros selecionados.
        </div>
      ) : null}

      {!isLoading && !error && filteredProjects.length > 0 && viewMode === "lista" ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Responsavel</th>
                <th className="px-4 py-3 font-medium">Ativo</th>
                <th className="px-4 py-3 font-medium">Protocolos</th>
                <th className="px-4 py-3 font-medium">Ultima atualizacao</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <tr key={project.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={projectDetailsRoute(project.id)}
                      className="hover:underline"
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {project.owner ?? "Nao informado"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {project.active ? "Sim" : "Nao"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {project.protocolsCount ?? "-"}
                  </td>
                  <td className="px-4 py-3 text-zinc-700">
                    {formatDate(project.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isLoading && !error && filteredProjects.length > 0 && viewMode === "kanban" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              className="rounded-lg border border-zinc-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-zinc-900">
                  <Link href={projectDetailsRoute(project.id)} className="hover:underline">
                    {project.name}
                  </Link>
                </h3>
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    project.active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-zinc-200 text-zinc-700"
                  }`}
                >
                  {project.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="mt-2 text-sm text-zinc-600">
                {project.description ?? "Sem descricao"}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-zinc-600">
                <div>
                  <dt className="font-medium text-zinc-500">Responsavel</dt>
                  <dd>{project.owner ?? "Nao informado"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-zinc-500">Protocolos</dt>
                  <dd>{project.protocolsCount ?? "-"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="font-medium text-zinc-500">Ultima atualizacao</dt>
                  <dd>{formatDate(project.updatedAt)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
