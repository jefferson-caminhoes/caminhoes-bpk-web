export type Project = {
  id: string;
  name: string;
  description?: string | null;
  owner?: string | null;
  active: boolean;
  protocolsCount?: number | null;
  hasDivergence?: boolean;
  hasNotFound?: boolean;
  updatedAt?: string | null;
};

export type ProjectsApiItem = {
  id?: string;
  _id?: string;
  name?: string;
  nome?: string;
  description?: string | null;
  descricao?: string | null;
  owner?: string | null;
  responsible?: string | null;
  responsavel?: string | null;
  active?: boolean;
  ativo?: boolean;
  protocolsCount?: number | null;
  protocol_count?: number | null;
  protocolos_count?: number | null;
  has_divergence?: boolean;
  has_not_found?: boolean;
  updatedAt?: string | null;
  updated_at?: string | null;
};

export type ProjectUpsertPayload = {
  name: string;
  description?: string | null;
  owner?: string | null;
  active: boolean;
};
