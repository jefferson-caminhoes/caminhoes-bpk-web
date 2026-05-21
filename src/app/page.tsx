import Link from "next/link";
import { BarChart3, LogIn } from "lucide-react";
import { appRoutes } from "@/lib/routes";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fb] px-4 py-10">
      <main className="w-full max-w-3xl rounded-md border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70 sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
          Caminhoes BPK
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-[#092946]">
          Monitoramento de projetos e protocolos
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          Interface operacional para acompanhar carteira, divergencias,
          importacoes e consultas por IA.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={appRoutes.login}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[#092946] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123a60]"
          >
            <LogIn size={16} />
            Ir para Login
          </Link>
          <Link
            href={appRoutes.dashboard}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#092946] transition hover:border-[#ee2331] hover:text-[#ee2331]"
          >
            <BarChart3 size={16} />
            Ver Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
