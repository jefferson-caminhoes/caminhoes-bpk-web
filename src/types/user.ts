export type User = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type UserApiItem = {
  id?: string;
  name?: string;
  email?: string;
  active?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UserUpsertPayload = {
  name: string;
  email: string;
  active: boolean;
};
