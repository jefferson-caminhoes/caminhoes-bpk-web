export type Stakeholder = {
  id: string;
  name: string;
  type?: string | null;
  baseUrl?: string | null;
  queryTemplate?: string | null;
  requiresJavascript: boolean;
  hasCaptcha: boolean;
  requiresOffice: boolean;
  notes?: string | null;
  active: boolean;
};

export type StakeholderApiItem = {
  id?: string;
  _id?: string;
  name?: string;
  nome?: string;
  type?: string | null;
  tipo?: string | null;
  baseUrl?: string | null;
  base_url?: string | null;
  queryTemplate?: string | null;
  template_consulta?: string | null;
  requiresJavascript?: boolean;
  requer_javascript?: boolean;
  hasCaptcha?: boolean;
  tem_captcha?: boolean;
  requiresOffice?: boolean;
  exige_oficio?: boolean;
  notes?: string | null;
  observacoes?: string | null;
  active?: boolean;
  ativo?: boolean;
};

export type StakeholderUpsertPayload = {
  name: string;
  type?: string | null;
  baseUrl?: string | null;
  queryTemplate?: string | null;
  requiresJavascript: boolean;
  hasCaptcha: boolean;
  requiresOffice: boolean;
  notes?: string | null;
  active: boolean;
};
