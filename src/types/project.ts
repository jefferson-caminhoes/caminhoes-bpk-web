export type Project = {
  id: string;
  name: string;
  description?: string | null;
  owner?: string | null;
  active: boolean;
  protocolsCount?: number | null;
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
  responsavel?: string | null;
  active?: boolean;
  ativo?: boolean;
  protocolsCount?: number | null;
  protocolos_count?: number | null;
  updatedAt?: string | null;
  updated_at?: string | null;
};

export type ProjectUpsertPayload = {
  name: string;
  description?: string | null;
  owner?: string | null;
  active: boolean;
};
