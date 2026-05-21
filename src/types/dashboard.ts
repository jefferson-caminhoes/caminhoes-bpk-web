export type DashboardSummary = {
  totalProjects: number;
  activeProtocols: number;
  finishedProtocols: number;
  monitoredProtocols: number;
  divergentProtocols: number;
  notFoundProtocols: number;
  lastRobotExecution: string | null;
};
