"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  getProjectById,
  inactivateProject,
  updateProject,
} from "@/services/projects-service";
import { projectProtocolsRoute } from "@/lib/routes";
import type { Project } from "@/types/project";

const editProjectSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio."),
  description: z.string().optional(),
  owner: z.string().optional(),
  active: z.boolean(),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

export default function ProjetoDetalhePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      owner: "",
      active: true,
    },
  });

  useEffect(() => {
    async function loadProject() {
      try {
        setLoadError(null);
        const data = await getProjectById(projectId);
        setProject(data);
        reset({
          name: data.name,
          description: data.description ?? "",
          owner: data.owner ?? "",
          active: data.active,
        });
      } catch {
        setLoadError("Nao foi possivel carregar o projeto.");
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId) {
      void loadProject();
    }
  }, [projectId, reset]);

  const onSubmit = async (data: EditProjectFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      setIsSubmitting(true);

      const updated = await updateProject(projectId, {
        name: data.name,
        description: data.description?.trim() || null,
        owner: data.owner?.trim() || null,
        active: data.active,
      });

      setProject(updated);
      setSubmitSuccess("Projeto atualizado com sucesso.");
    } catch {
      setSubmitError("Nao foi possivel salvar as alteracoes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInactivate = async () => {
    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      setIsSubmitting(true);
      const updated = await inactivateProject(projectId);
      setProject(updated);
      reset({
        name: updated.name,
        description: updated.description ?? "",
        owner: updated.owner ?? "",
        active: updated.active,
      });
      setSubmitSuccess("Projeto inativado.");
    } catch {
      setSubmitError("Nao foi possivel inativar o projeto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold text-zinc-900">Detalhe do projeto</h2>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Carregando...
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section>
        <h2 className="text-2xl font-semibold text-zinc-900">Detalhe do projeto</h2>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold text-zinc-900">Detalhe do projeto</h2>
      <p className="mt-2 text-sm text-zinc-600">
        ID: <span className="font-mono">{project?.id}</span>
      </p>
      <Link
        href={projectProtocolsRoute(projectId)}
        className="mt-3 inline-block text-sm font-medium text-zinc-700 underline"
      >
        Ver protocolos do projeto
      </Link>

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

        {submitSuccess ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {submitSuccess}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
          </button>

          <button
            type="button"
            onClick={handleInactivate}
            disabled={isSubmitting || project?.active === false}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-70"
          >
            Inativar projeto
          </button>
        </div>
      </form>
    </section>
  );
}
