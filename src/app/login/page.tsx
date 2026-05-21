"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { appRoutes } from "@/lib/routes";
import { useAuth } from "@/hooks/use-auth";
import { login } from "@/services/auth-service";
import type { LoginResponse } from "@/types/auth";

const loginSchema = z.object({
  email: z.string().email("Informe um email valido."),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { saveToken } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response: LoginResponse = await login(data);
      const token = response.access_token;

      if (!token) {
        throw new Error("Token nao encontrado na resposta.");
      }

      saveToken(token);
      router.push(appRoutes.dashboard);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Falha no login. Verifique suas credenciais.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9fb] px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
          Caminhoes BPK
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#092946]">Entrar</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use seu email e senha para acessar o dashboard.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="mt-2 min-h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
              placeholder="voce@email.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <label
              className="text-sm font-semibold text-[#092946]"
              htmlFor="password"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              className="mt-2 min-h-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
              placeholder="********"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
            ) : null}
          </div>

          {submitError ? (
            <p className="rounded-md border border-red-200 bg-[#fff1f2] px-3 py-2 text-xs font-medium text-[#b5121f]">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#092946] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123a60] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
          >
            <LogIn size={16} />
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
