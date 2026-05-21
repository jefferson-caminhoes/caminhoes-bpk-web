"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createUser } from "@/services/users-service";

const newUserSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio."),
  email: z.string().email("Email invalido."),
  active: z.boolean(),
});

type NewUserFormData = z.infer<typeof newUserSchema>;

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: "",
      email: "",
      active: true,
    },
  });

  const onSubmit = async (data: NewUserFormData) => {
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      await createUser({
        name: data.name,
        email: data.email,
        active: data.active,
      });
      router.push("/usuarios");
    } catch {
      setSubmitError("Nao foi possivel cadastrar o usuario. Verifique se o email ja esta em uso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold text-zinc-900">Novo usuario</h2>
      <p className="mt-2 text-sm text-zinc-600">
        Cadastre um responsavel interno de protocolo.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 max-w-2xl space-y-4 rounded-lg border border-zinc-200 bg-white p-5"
      >
        <div>
          <label className="text-sm font-medium text-zinc-700" htmlFor="name">
            Nome
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          {errors.name ? (
            <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
          ) : null}
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register("email")}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          {errors.email ? (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" {...register("active")} />
          Usuario ativo
        </label>

        {submitError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {submitError}
          </p>
        ) : null}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSubmitting ? "Salvando..." : "Salvar usuario"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/usuarios")}
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>
  );
}
