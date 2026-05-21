import axios from "axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  detail?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorPayload | string | undefined;

    if (typeof data === "string" && data.trim().length > 0) {
      return data;
    }

    if (typeof data === "object" && data !== null) {
      if (data.message) return data.message;
      if (data.error) return data.error;
      if (data.detail) return data.detail;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
