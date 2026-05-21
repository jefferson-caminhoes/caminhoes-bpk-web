export type RagSource = {
  id?: string | null;
  type?: string | null;
  label: string;
  projectId?: string | null;
  protocolId?: string | null;
  url?: string | null;
};

export type RagChatResponse = {
  answer: string;
  sources: RagSource[];
};
