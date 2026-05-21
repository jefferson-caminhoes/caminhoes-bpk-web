 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { appRoutes, stakeholderDetailsRoute } from "@/lib/routes";
import { listStakeholders } from "@/services/stakeholders-service";
import type { Stakeholder } from "@/types/stakeholder";

export default function StakeholdersPage() {
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">(
    "todos",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setError(null);
        const data = await listStakeholders();
        setStakeholders(data);
      } catch {
        setError("Nao foi possivel carregar os stakeholders.");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const filtered = useMemo(
    () =>
      stakeholders.filter((item) => {
        const q = query.trim().toLowerCase();
        const matchesQuery =
          q.length === 0 ||
          item.name.toLowerCase().includes(q) ||
          (item.type ?? "").toLowerCase().includes(q);
        const matchesStatus =
          statusFilter === "todos" ||
          (statusFilter === "ativos" && item.active) ||
          (statusFilter === "inativos" && !item.active);
        return matchesQuery && matchesStatus;
      }),
    [query, stakeholders, statusFilter],
  );

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Stakeholders</h2>
          <p className="mt-2 text-sm text-zinc-600">Origens de consulta do scraping.</p>
        </div>
        <Link
          href={appRoutes.stakeholderNew}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Novo stakeholder
        </Link>
      </div>

      <div className="mt-6 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-2">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome ou tipo"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "todos" | "ativos" | "inativos")
          }
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          <option value="todos">Todos</option>
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
        </select>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Carregando stakeholders...
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {!isLoading && !error && filtered.length === 0 ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Nenhum stakeholder encontrado.
        </div>
      ) : null}

      {!isLoading && !error && filtered.length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">Exige oficio</th>
                <th className="px-4 py-3 font-medium">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3">
                    <Link href={stakeholderDetailsRoute(item.id)} className="underline">
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{item.type ?? "-"}</td>
                  <td className="px-4 py-3">{item.baseUrl ?? "-"}</td>
                  <td className="px-4 py-3">{item.requiresOffice ? "Sim" : "Nao"}</td>
                  <td className="px-4 py-3">{item.active ? "Sim" : "Nao"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
