import type { NavItem } from "@/types/navigation";

export const appRoutes = {
  login: "/login",
  home: "/home",
  dashboard: "/dashboard",
  projects: "/projetos",
  projectNew: "/projetos/new",
  stakeholders: "/stakeholders",
  stakeholderNew: "/stakeholders/new",
  importSpreadsheet: "/importar-planilha",
} as const;

export function projectDetailsRoute(projectId: string) {
  return `/projetos/${projectId}`;
}

export function projectProtocolsRoute(projectId: string) {
  return `/projetos/${projectId}/protocolos`;
}

export function projectProtocolsNewRoute(projectId: string) {
  return `/projetos/${projectId}/protocolos/new`;
}

export function projectProtocolDetailsRoute(projectId: string, protocolId: string) {
  return `/projetos/${projectId}/protocolos/${protocolId}`;
}

export function stakeholderDetailsRoute(stakeholderId: string) {
  return `/stakeholders/${stakeholderId}`;
}

export const authenticatedNavItems: NavItem[] = [
  { label: "Home IA", href: appRoutes.home },
  { label: "Dashboard", href: appRoutes.dashboard },
  { label: "Projetos", href: appRoutes.projects },
  { label: "Stakeholders", href: appRoutes.stakeholders },
  { label: "Importacao", href: appRoutes.importSpreadsheet },
];
