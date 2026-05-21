"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  projectProtocolDetailsRoute,
  projectProtocolsNewRoute,
  projectDetailsRoute,
} from "@/lib/routes";
import { listProjectProtocols } from "@/services/protocols-service";
import type { Protocol } from "@/types/protocol";

type ViewMode = "lista" | "kanban";

export default function ProtocolosProjetoPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [protocols, setProtocols] = useState<Protocol[]>([]);
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
        const data = await listProjectProtocols(projectId);
        setProtocols(data);
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
        protocol.cnpj.toLowerCase().includes(normalizedQuery);

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

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Protocolos</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Projeto:{" "}
            <Link href={projectDetailsRoute(projectId)} className="font-medium underline">
              {projectId}
            </Link>
          </p>
        </div>
        <Link
          href={projectProtocolsNewRoute(projectId)}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Novo protocolo
        </Link>
      </div>

      <div className="mt-6 grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 md:grid-cols-2 lg:grid-cols-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por atividade, numero ou CNPJ"
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
        />
        <label className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={showOnlyDivergent}
            onChange={(event) => setShowOnlyDivergent(event.target.checked)}
          />
          Apenas divergencia
        </label>
        <label className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={showOnlyNotFound}
            onChange={(event) => setShowOnlyNotFound(event.target.checked)}
          />
          Apenas nao encontrados
        </label>
        <label className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={showOnlyMonitoringEnabled}
            onChange={(event) => setShowOnlyMonitoringEnabled(event.target.checked)}
          />
          Apenas monitoramento ativo
        </label>
      </div>

      <div className="mt-4 flex w-fit rounded-md border border-zinc-300 bg-white p-1 text-sm">
        <button
          type="button"
          onClick={() => setViewMode("lista")}
          className={`rounded px-3 py-1.5 ${
            viewMode === "lista" ? "bg-zinc-900 text-white" : "text-zinc-700"
          }`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setViewMode("kanban")}
          className={`rounded px-3 py-1.5 ${
            viewMode === "kanban" ? "bg-zinc-900 text-white" : "text-zinc-700"
          }`}
        >
          Kanban
        </button>
      </div>

      {isLoading ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Carregando protocolos...
        </div>
      ) : null}
      {error ? (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {!isLoading && !error && filteredProtocols.length === 0 ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Nenhum protocolo encontrado para os filtros selecionados.
        </div>
      ) : null}

      {!isLoading && !error && filteredProtocols.length > 0 && viewMode === "lista" ? (
        <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Atividade</th>
                <th className="px-4 py-3 font-medium">Protocolo</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Stakeholder</th>
                <th className="px-4 py-3 font-medium">Status manual</th>
                <th className="px-4 py-3 font-medium">Status externo</th>
                <th className="px-4 py-3 font-medium">Divergencia</th>
                <th className="px-4 py-3 font-medium">Situacao</th>
                <th className="px-4 py-3 font-medium">Monitoramento</th>
                <th className="px-4 py-3 font-medium">Nao encontrado</th>
              </tr>
            </thead>
            <tbody>
              {filteredProtocols.map((protocol) => (
                <tr key={protocol.id} className="border-t border-zinc-200">
                  <td className="px-4 py-3">{protocol.activity}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={projectProtocolDetailsRoute(projectId, protocol.id)}
                      className="font-medium underline"
                    >
                      {protocol.protocolNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{protocol.cnpj}</td>
                  <td className="px-4 py-3">{protocol.stakeholderName ?? "-"}</td>
                  <td className="px-4 py-3">{protocol.manualStatus ?? "-"}</td>
                  <td className="px-4 py-3">{protocol.externalStatus ?? "-"}</td>
                  <td className="px-4 py-3">{protocol.hasDivergence ? "Sim" : "Nao"}</td>
                  <td className="px-4 py-3">{protocol.situation ?? "-"}</td>
                  <td className="px-4 py-3">
                    {protocol.monitoringEnabled ? "Ativo" : "Inativo"}
                  </td>
                  <td className="px-4 py-3">
                    {protocol.notFoundOnSource ? "Sim" : "Nao"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {!isLoading && !error && filteredProtocols.length > 0 && viewMode === "kanban" ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProtocols.map((protocol) => (
            <article key={protocol.id} className="rounded-lg border border-zinc-200 bg-white p-4">
              <h3 className="text-base font-semibold text-zinc-900">{protocol.activity}</h3>
              <p className="mt-1 text-xs text-zinc-500">
                <Link
                  href={projectProtocolDetailsRoute(projectId, protocol.id)}
                  className="underline"
                >
                  #{protocol.protocolNumber}
                </Link>
              </p>
              <dl className="mt-4 grid gap-1 text-sm text-zinc-700">
                <div className="flex justify-between gap-3">
                  <dt>CNPJ</dt>
                  <dd>{protocol.cnpj}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Stakeholder</dt>
                  <dd>{protocol.stakeholderName ?? "-"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Divergencia</dt>
                  <dd>{protocol.hasDivergence ? "Sim" : "Nao"}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>Nao encontrado</dt>
                  <dd>{protocol.notFoundOnSource ? "Sim" : "Nao"}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
