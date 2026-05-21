export type Protocol = {
  id: string;
  projectId: string;
  activity: string;
  protocolNumber: string;
  cnpj: string;
  stakeholderName?: string | null;
  stakeholderId: string;
  manualStatus?: string | null;
  externalStatus?: string | null;
  hasDivergence: boolean;
  situation?: string | null;
  monitoringEnabled: boolean;
  notFoundOnSource: boolean;
  lastConsultationAt?: string | null;
  owner?: string | null;
  changeLogs?: ProtocolChangeLog[];
};

export type ProtocolChangeLog = {
  id?: string | null;
  createdAt?: string | null;
  user?: string | null;
  message?: string | null;
};

export type ProtocolApiItem = {
  id?: string;
  _id?: string;
  projectId?: string;
  project_id?: string;
  activity?: string;
  atividade?: string;
  protocolNumber?: string;
  numero_protocolo?: string;
  cnpj?: string;
  stakeholderName?: string | null;
  stakeholder_name?: string | null;
  stakeholderId?: string;
  stakeholder_id?: string;
  manualStatus?: string | null;
  status_manual?: string | null;
  externalStatus?: string | null;
  status_externo?: string | null;
  hasDivergence?: boolean;
  has_status_divergence?: boolean;
  situation?: string | null;
  situacao?: string | null;
  monitoringEnabled?: boolean;
  monitoring_enabled?: boolean;
  notFoundOnSource?: boolean;
  not_found_on_source?: boolean;
  lastConsultationAt?: string | null;
  last_consultation_at?: string | null;
  owner?: string | null;
  responsavel?: string | null;
  changeLogs?: ProtocolChangeLogApi[];
  auditLogs?: ProtocolChangeLogApi[];
  logs?: ProtocolChangeLogApi[];
  history?: ProtocolChangeLogApi[];
  historico?: ProtocolChangeLogApi[];
};

export type ProtocolChangeLogApi = {
  id?: string;
  _id?: string;
  createdAt?: string;
  created_at?: string;
  date?: string;
  user?: string;
  userName?: string;
  author?: string;
  message?: string;
  description?: string;
  action?: string;
};

export type CreateProtocolPayload = {
  activity: string;
  protocolNumber: string;
  cnpj: string;
  stakeholderId: string;
  owner?: string | null;
  manualStatus?: string | null;
  situation?: string | null;
  monitoringEnabled: boolean;
};

export type UpdateProtocolPayload = {
  activity: string;
  protocolNumber: string;
  cnpj: string;
  stakeholderId: string;
  owner?: string | null;
  manualStatus?: string | null;
  situation?: string | null;
  monitoringEnabled: boolean;
};
