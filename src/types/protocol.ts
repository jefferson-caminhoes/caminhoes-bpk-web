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
  openingDate?: string | null;
  closingDate?: string | null;
  lastObservation?: string | null;
  assignedTo?: string | null;
  assignedToName?: string | null;
  notes?: string | null;
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
  // protocol number — actual API field is protocol_number
  protocolNumber?: string;
  protocol_number?: string;
  numero_protocolo?: string;
  cnpj?: string;
  stakeholderName?: string | null;
  stakeholder_name?: string | null;
  stakeholderId?: string;
  stakeholder_id?: string;
  // statuses — actual API fields are manual_status / external_status
  manualStatus?: string | null;
  manual_status?: string | null;
  status_manual?: string | null;
  externalStatus?: string | null;
  external_status?: string | null;
  status_externo?: string | null;
  external_situation?: string | null;
  // divergence — API has both has_divergence and computed has_status_divergence
  hasDivergence?: boolean;
  has_divergence?: boolean;
  has_status_divergence?: boolean;
  situation?: string | null;
  situacao?: string | null;
  monitoringEnabled?: boolean;
  monitoring_enabled?: boolean;
  // not-found — API returns found_in_last_search (true = found); computed not_found_on_source = !found
  notFoundOnSource?: boolean;
  not_found_on_source?: boolean;
  found_in_last_search?: boolean;
  lastConsultationAt?: string | null;
  last_consultation_at?: string | null;
  last_consulted_at?: string | null;
  owner?: string | null;
  responsavel?: string | null;
  assigned_to?: string | null;
  assigned_to_name?: string | null;
  opening_date?: string | null;
  closing_date?: string | null;
  last_observation?: string | null;
  notes?: string | null;
  changeLogs?: ProtocolChangeLogApi[];
  audit_logs?: ProtocolChangeLogApi[];
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
  changed_by?: string;
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
