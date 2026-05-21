"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Search } from "lucide-react";
import { appRoutes, stakeholderDetailsRoute } from "@/lib/routes";
import { getApiErrorMessage } from "@/lib/api-errors";
import { ErrorPanel, LoadingPanel } from "@/components/ui/feedback";
import { listStakeholders } from "@/services/stakeholders-service";
import type { Stakeholder } from "@/types/stakeholder";

export default function StakeholdersPage() {
  const router = useRouter();
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
      } catch (error) {
        setError(
          getApiErrorMessage(error, "Nao foi possivel carregar os stakeholders."),
        );
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
          (item.type ?? "").toLowerCase().includes(q) ||
          (item.baseUrl ?? "").toLowerCase().includes(q);
        const matchesStatus =
          statusFilter === "todos" ||
          (statusFilter === "ativos" && item.active) ||
          (statusFilter === "inativos" && !item.active);
        return matchesQuery && matchesStatus;
      }),
    [query, stakeholders, statusFilter],
  );

  const stats = useMemo(() => {
    const active = stakeholders.filter((item) => item.active).length;
    const complex = stakeholders.filter(
      (item) => item.hasCaptcha || item.requiresJavascript,
    ).length;
    const requiresOffice = stakeholders.filter((item) => item.requiresOffice).length;

    return { active, complex, requiresOffice };
  }, [stakeholders]);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Fontes de consulta
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">
            Stakeholders
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Gerencie as origens do scraping e identifique fontes que exigem oficio,
            captcha ou execucao com Javascript.
          </p>
        </div>
        <Link
          href={appRoutes.stakeholderNew}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#092946] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123a60]"
        >
          <Plus size={16} />
          Novo stakeholder
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Ativos
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#092946]">{stats.active}</p>
        </article>
        <article className="rounded-md border border-[#ee2331]/30 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#ee2331]">
            Alta complexidade
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#ee2331]">
            {stats.complex}
          </p>
        </article>
        <article className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Exigem oficio
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#092946]">
            {stats.requiresOffice}
          </p>
        </article>
      </div>

      <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nome, tipo ou URL"
              className="min-h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 text-sm focus:border-[#ee2331]"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "todos" | "ativos" | "inativos")
            }
            className="min-h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </div>
      </div>

      {isLoading ? <LoadingPanel message="Carregando stakeholders..." /> : null}
      {error ? <ErrorPanel message={error} /> : null}
      {!isLoading && !error && filtered.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Nenhum stakeholder encontrado.
        </div>
      ) : null}

      {!isLoading && !error && filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">URL</th>
                <th className="px-4 py-3 font-semibold">Automacao</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(stakeholderDetailsRoute(item.id))}>
                  <td className="px-4 py-3 font-semibold text-[#092946]">
                    <Link
                      href={stakeholderDetailsRoute(item.id)}
                      className="hover:text-[#ee2331]"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{item.type ?? "-"}</td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-slate-600">
                    {item.baseUrl ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {item.requiresOffice ? (
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                          Oficio
                        </span>
                      ) : null}
                      {item.requiresJavascript ? (
                        <span className="rounded-md bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                          Javascript
                        </span>
                      ) : null}
                      {item.hasCaptcha ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#fff1f2] px-2 py-1 text-xs font-semibold text-[#ee2331]">
                          <AlertTriangle size={13} />
                          Captcha
                        </span>
                      ) : null}
                      {!item.requiresOffice &&
                      !item.requiresJavascript &&
                      !item.hasCaptcha ? (
                        <span className="text-xs text-slate-500">Padrao</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold ${
                        item.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-500"
                      }`}
                    >
                      {item.active ? <CheckCircle2 size={13} /> : null}
                      {item.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
