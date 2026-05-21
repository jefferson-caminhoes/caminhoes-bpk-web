"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { authenticatedNavItems } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-64 shrink-0 rounded-lg border border-zinc-200 bg-white p-4 md:block">
          <p className="px-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Caminhoes BPK
          </p>
          <nav className="mt-4 space-y-1">
            {authenticatedNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            <LogOut size={16} />
            Sair
          </button>
        </aside>

        <div className="flex min-h-[80vh] w-full flex-col rounded-lg border border-zinc-200 bg-white">
          <header className="border-b border-zinc-200 px-5 py-4">
            <h1 className="text-lg font-semibold">Painel Web</h1>
          </header>
          <main className="flex-1 p-5">{children}</main>
        </div>
      </div>
    </div>
  );
}
