import api from "@/lib/api";
import type { User, UserApiItem, UserUpsertPayload } from "@/types/user";

function normalizeUser(item: UserApiItem): User {
  return {
    id: item.id ?? "",
    name: item.name ?? "",
    email: item.email ?? "",
    active: item.active ?? true,
    createdAt: item.created_at ?? null,
    updatedAt: item.updated_at ?? null,
  };
}

export async function listUsers(active?: boolean): Promise<User[]> {
  const params = active !== undefined ? `?active=${active}` : "";
  const { data } = await api.get<UserApiItem[]>(`/users${params}`);
  const rawItems = Array.isArray(data) ? data : [];
  return rawItems.map(normalizeUser).filter((u) => u.id);
}

export async function createUser(payload: UserUpsertPayload): Promise<User> {
  const { data } = await api.post<UserApiItem>("/users", payload);
  return normalizeUser(data);
}

export async function getUserById(userId: string): Promise<User> {
  const { data } = await api.get<UserApiItem>(`/users/${userId}`);
  return normalizeUser(data);
}

export async function updateUser(
  userId: string,
  payload: Partial<UserUpsertPayload>,
): Promise<User> {
  const { data } = await api.patch<UserApiItem>(`/users/${userId}`, payload);
  return normalizeUser(data);
}
