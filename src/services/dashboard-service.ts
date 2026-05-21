import api from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

type SummaryApiResponse = Partial<DashboardSummary> & {
  total_projects?: number;
  active_protocols?: number;
  finished_protocols?: number;
  monitored_protocols?: number;
  monitoring_enabled?: number;
  divergent_protocols?: number;
  with_status_divergence?: number;
  not_found_protocols?: number;
  not_found_on_source?: number;
  last_robot_execution?: string | null;
  last_scraping_run_at?: string | null;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<SummaryApiResponse>("/dashboard/summary");

  return {
    totalProjects: data.totalProjects ?? data.total_projects ?? 0,
    activeProtocols: data.activeProtocols ?? data.active_protocols ?? 0,
    finishedProtocols: data.finishedProtocols ?? data.finished_protocols ?? 0,
    monitoredProtocols: data.monitoredProtocols ?? data.monitored_protocols ?? data.monitoring_enabled ?? 0,
    divergentProtocols: data.divergentProtocols ?? data.divergent_protocols ?? data.with_status_divergence ?? 0,
    notFoundProtocols: data.notFoundProtocols ?? data.not_found_protocols ?? data.not_found_on_source ?? 0,
    lastRobotExecution:
      data.lastRobotExecution ?? data.last_robot_execution ?? data.last_scraping_run_at ?? null,
  };
}
