"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ArrowLeft, FolderPlus, Save } from "lucide-react";
import Link from "next/link";
import { appRoutes, projectDetailsRoute } from "@/lib/routes";
import { createProject } from "@/services/projects-service";

const newProjectSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio."),
  description: z.string().optional(),
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
        owner: null,
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
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Carteira
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">
            Novo projeto
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Cadastre o projeto e depois vincule os protocolos na tela de
            monitoramento.
          </p>
        </div>
        <Link
          href={appRoutes.projects}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#092946] shadow-sm transition hover:border-[#ee2331]/50 hover:text-[#ee2331]"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#092946]/20 bg-[#092946] p-5 text-white shadow-sm">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <FolderPlus size={21} />
          </span>
          <h3 className="mt-4 text-lg font-semibold">Estrutura limpa</h3>
          <p className="mt-2 text-sm leading-6 text-white/75">
            O projeto nasce com nome, descricao e status. Responsaveis ficam fora
            desta etapa para manter o cadastro objetivo.
          </p>
        </aside>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
        >
          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="name">
              Nome do projeto
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
              placeholder="Ex: Residencial Horizonte"
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
              Descricao
            </label>
            <textarea
              id="description"
              rows={5}
              {...register("description")}
              className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
              placeholder="Resumo operacional, escopo ou observacoes do projeto."
            />
          </div>

          <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <span>
              <span className="block font-semibold text-[#092946]">Projeto ativo</span>
              <span className="text-xs text-slate-500">
                Projetos ativos aparecem no monitoramento da carteira.
              </span>
            </span>
            <input type="checkbox" {...register("active")} className="h-4 w-4" />
          </label>

          {submitError ? (
            <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
              {submitError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#092946] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123a60] disabled:opacity-70"
          >
            <Save size={16} />
            {isSubmitting ? "Salvando..." : "Salvar projeto"}
          </button>
        </form>
      </div>
    </section>
  );
}
