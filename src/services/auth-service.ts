import api from "@/lib/api";
import { AxiosError } from "axios";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export async function login(payload: LoginRequest) {
  try {
    const response = await api.post<LoginResponse>("/auth/login", payload);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const message =
        error.response?.data?.message ??
        "Falha no login. Verifique suas credenciais.";
      throw new Error(message);
    }

    throw new Error("Falha no login. Verifique suas credenciais.");
  }
}
