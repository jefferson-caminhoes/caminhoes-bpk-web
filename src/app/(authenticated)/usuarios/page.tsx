"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ErrorPanel, LoadingPanel } from "@/components/ui/feedback";
import { listUsers } from "@/services/users-service";
import type { User } from "@/types/user";

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUsers() {
      try {
        setError(null);
        const data = await listUsers();
        setUsers(data);
      } catch {
        setError("Nao foi possivel carregar os usuarios.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadUsers();
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Responsaveis
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">Usuarios</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Usuarios internos responsaveis pelo acompanhamento de protocolos.
          </p>
        </div>
        <Link
          href="/usuarios/new"
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#092946] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123a60]"
        >
          <Plus size={16} />
          Novo usuario
        </Link>
      </div>

      {isLoading ? <LoadingPanel message="Carregando usuarios..." /> : null}
      {error ? <ErrorPanel message={error} /> : null}

      {!isLoading && !error && users.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Nenhum usuario cadastrado.
        </div>
      ) : null}

      {!isLoading && !error && users.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Nome</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-[#092946]">
                    {user.name}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${
                        user.active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-100 text-slate-600"
                      }`}
                    >
                      {user.active ? "Ativo" : "Inativo"}
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
