 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { projectDetailsRoute } from "@/lib/routes";
import { createProject } from "@/services/projects-service";

const newProjectSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio."),
  description: z.string().optional(),
  owner: z.string().optional(),
  active: z.boolean(),
});

type NewProjectFormData = z.infer<typeof newProjectSchema>;

export default function NovoProjetoPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewProjectFormData>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      owner: "",
      active: true,
    },
  });

  const onSubmit = async (data: NewProjectFormData) => {
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      const created = await createProject({
        name: data.name,
        description: data.description?.trim() || null,
        owner: data.owner?.trim() || null,
        active: data.active,
      });
      router.push(projectDetailsRoute(created.id));
    } catch {
      setSubmitError("Nao foi possivel criar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold text-zinc-900">Novo projeto</h2>
      <p className="mt-2 text-sm text-zinc-600">Preencha os dados do projeto.</p>

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
          <label className="text-sm font-medium text-zinc-700" htmlFor="description">
            Descricao
          </label>
          <textarea
            id="description"
            rows={3}
            {...register("description")}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700" htmlFor="owner">
            Responsavel
          </label>
          <input
            id="owner"
            type="text"
            {...register("owner")}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" {...register("active")} />
          Projeto ativo
        </label>

        {submitError ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSubmitting ? "Salvando..." : "Salvar projeto"}
        </button>
      </form>
    </section>
  );
}
