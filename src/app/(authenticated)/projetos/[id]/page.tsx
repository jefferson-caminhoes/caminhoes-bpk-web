"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  Save,
  XCircle,
} from "lucide-react";
import {
  getProjectById,
  inactivateProject,
  updateProject,
} from "@/services/projects-service";
import { projectProtocolsRoute } from "@/lib/routes";
import { formatDateTime } from "@/lib/format-date";
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
        <h2 className="text-2xl font-semibold text-[#092946]">Detalhe do projeto</h2>
        <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-4 text-sm text-slate-600 shadow-sm">
          Carregando...
        </div>
      </section>
    );
  }

  if (loadError) {
    return (
      <section>
        <h2 className="text-2xl font-semibold text-[#092946]">Detalhe do projeto</h2>
        <div className="mt-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {loadError}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Contrato / projeto
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">
            {project?.name ?? "Detalhe do projeto"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Visão operacional do projeto, status da carteira e acesso aos
            protocolos monitorados.
          </p>
        </div>
        <Link
          href={projectProtocolsRoute(projectId)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#092946] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123a60]"
        >
          Ver protocolos
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="rounded-3xl border border-[#092946]/20 bg-gradient-to-br from-[#092946] to-[#123a60] p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              <FolderKanban size={14} />
              {project?.active ? "Projeto ativo" : "Projeto inativo"}
            </span>
            <p className="mt-4 text-2xl font-semibold">{project?.name}</p>
            <p className="mt-2 text-sm leading-6 text-white/75">
              {project?.description ?? "Sem descricao cadastrada."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/65">
              ID do projeto
            </p>
            <p className="mt-1 max-w-[260px] truncate font-mono text-sm">
              {project?.id}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Protocolos
          </p>
          <p className="mt-2 text-3xl font-semibold text-[#092946]">
            {project?.protocolsCount ?? 0}
          </p>
        </article>
        <article className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Última atualização
          </p>
          <p className="mt-3 text-sm font-semibold text-[#092946]">
            {formatDateTime(project?.updatedAt)}
          </p>
        </article>
        <article
          className={`rounded-2xl border p-5 shadow-sm ${
            project?.active
              ? "border-emerald-300 bg-emerald-50"
              : "border-slate-300 bg-slate-100"
          }`}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </p>
          <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#092946]">
            {project?.active ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {project?.active ? "Ativo" : "Inativo"}
          </p>
        </article>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#092946] text-white">
              <ClipboardList size={19} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-[#092946]">
                Dados do projeto
              </h3>
              <p className="text-sm text-slate-600">
                Visualização separada da edição para ficar mais legível.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Nome
              </dt>
              <dd className="mt-1 font-semibold text-[#092946]">{project?.name}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Responsável
              </dt>
              <dd className="mt-1 font-semibold text-[#092946]">
                {project?.owner ?? "Não informado"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Descrição
              </dt>
              <dd className="mt-1 leading-6 text-slate-700">
                {project?.description ?? "Sem descrição cadastrada."}
              </dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
        >
          <div>
            <h3 className="text-base font-semibold text-[#092946]">Ajustes rápidos</h3>
            <p className="mt-1 text-sm text-slate-600">
              Atualize campos administrativos sem sair da tela.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="name">
              Nome
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <label
              className="text-sm font-semibold text-[#092946]"
              htmlFor="description"
            >
              Descrição
            </label>
            <textarea
              id="description"
              rows={4}
              {...register("description")}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="owner">
              Responsável
            </label>
            <input
              id="owner"
              type="text"
              {...register("owner")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
            />
          </div>

          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-[#092946]">Projeto ativo</span>
            <input type="checkbox" {...register("active")} className="h-4 w-4" />
          </label>

          {submitError ? (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {submitError}
            </p>
          ) : null}

          {submitSuccess ? (
            <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {submitSuccess}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#092946] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123a60] disabled:opacity-70"
            >
              <Save size={16} />
              {isSubmitting ? "Salvando..." : "Salvar"}
            </button>

            <button
              type="button"
              onClick={handleInactivate}
              disabled={isSubmitting || project?.active === false}
              className="min-h-10 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#ee2331]/50 hover:text-[#ee2331] disabled:opacity-70"
            >
              Inativar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
