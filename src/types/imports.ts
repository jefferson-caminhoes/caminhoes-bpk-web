export type ImportError = {
  line?: number;
  row?: number;
  field?: string | null;
  message: string;
};

export type ImportSummary = {
  projectsCreated: number;
  protocolsCreated: number;
  ignoredRows: number;
  errors: ImportError[];
};
