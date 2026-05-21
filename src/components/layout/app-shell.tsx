"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import {
  BarChart3,
  Bot,
  FolderKanban,
  LogOut,
  UploadCloud,
  UserCog,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { appRoutes, authenticatedNavItems } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

type AppShellProps = {
  children: React.ReactNode;
};

const navIcons: Record<string, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  [appRoutes.home]: Bot,
  [appRoutes.dashboard]: BarChart3,
  [appRoutes.projects]: FolderKanban,
  [appRoutes.stakeholders]: Users,
  [appRoutes.importSpreadsheet]: UploadCloud,
  [appRoutes.usuarios]: UserCog,
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const currentItem =
    authenticatedNavItems.find((item) => pathname.startsWith(item.href)) ??
    authenticatedNavItems[0];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-slate-200 bg-white px-5 py-6 md:flex md:flex-col">
          <Link
            href={appRoutes.dashboard}
            className="group flex w-full items-center justify-center"
          >
            <BrandLogo size="sm" />
          </Link>

          <nav className="mt-8 space-y-1" aria-label="Navegacao principal">
            {authenticatedNavItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = navIcons[item.href];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-navy text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-brand-navy",
                  )}
                >
                  <Icon size={18} strokeWidth={1.9} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Foco operacional
            </p>
            <p className="mt-1 text-sm text-slate-700">
              Priorize divergencias, protocolos nao encontrados e fontes instaveis.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-brand-navy transition hover:border-brand-red hover:text-brand-red"
          >
            <LogOut size={16} />
            Sair
          </button>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <BrandLogo size="sm" className="md:hidden" />
                <h1 className="text-lg font-semibold text-[#092946]">
                  {currentItem.label}
                </h1>
              </div>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-brand-navy transition hover:border-brand-red hover:text-brand-red md:hidden"
              >
                <LogOut size={16} />
                Sair
              </button>
            </div>
            <nav
              className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto pb-1 md:hidden"
              aria-label="Navegacao principal mobile"
            >
              {authenticatedNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = navIcons[item.href];

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                      isActive
                        ? "border-brand-navy bg-brand-navy text-white"
                        : "border-slate-200 bg-white text-slate-700",
                    )}
                  >
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
