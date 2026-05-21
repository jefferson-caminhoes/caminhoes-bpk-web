import Link from "next/link";
import { appRoutes } from "@/lib/routes";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-10">
        <h1 className="text-3xl font-semibold text-zinc-900">Caminhoes BPK Web</h1>
        <p className="mt-3 text-sm text-zinc-600">
          Base inicial do frontend do MVP com autenticacao e rotas principais.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={appRoutes.login}
            className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
          >
            Ir para Login
          </Link>
          <Link
            href={appRoutes.dashboard}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            Ver Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
