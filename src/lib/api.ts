import axios from "axios";
import Cookies from "js-cookie";
import { appRoutes } from "@/lib/routes";
import { getApiErrorMessage } from "@/lib/api-errors";
import { pushToast } from "@/lib/toast";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("auth-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      const status = error?.response?.status;

      if (status === 401) {
        Cookies.remove("auth-token", { path: "/" });
        window.location.href = appRoutes.login;
      }

      const message = getApiErrorMessage(
        error,
        "Nao foi possivel completar a requisicao.",
      );

      if (message) {
        pushToast(message, "error");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
