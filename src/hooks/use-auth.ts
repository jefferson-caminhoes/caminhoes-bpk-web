"use client";

import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/lib/routes";

const AUTH_COOKIE_NAME = "auth-token";

export function useAuth() {
  const router = useRouter();

  function saveToken(token: string) {
    Cookies.set(AUTH_COOKIE_NAME, token, {
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  function logout() {
    Cookies.remove(AUTH_COOKIE_NAME, { path: "/" });
    router.replace(appRoutes.login);
  }

  return { saveToken, logout };
}
