import api from "@/lib/api";
import type { DashboardSummary } from "@/types/dashboard";

type SummaryApiResponse = Partial<DashboardSummary> & {
  total_projects?: number;
  active_protocols?: number;
  finished_protocols?: number;
  monitored_protocols?: number;
  divergent_protocols?: number;
  not_found_protocols?: number;
  last_robot_execution?: string | null;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get<SummaryApiResponse>("/dashboard/summary");

  return {
    totalProjects: data.totalProjects ?? data.total_projects ?? 0,
    activeProtocols: data.activeProtocols ?? data.active_protocols ?? 0,
    finishedProtocols: data.finishedProtocols ?? data.finished_protocols ?? 0,
    monitoredProtocols: data.monitoredProtocols ?? data.monitored_protocols ?? 0,
    divergentProtocols: data.divergentProtocols ?? data.divergent_protocols ?? 0,
    notFoundProtocols: data.notFoundProtocols ?? data.not_found_protocols ?? 0,
    lastRobotExecution:
      data.lastRobotExecution ?? data.last_robot_execution ?? null,
  };
}
