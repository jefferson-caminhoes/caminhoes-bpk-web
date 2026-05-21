"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { appRoutes, stakeholderDetailsRoute } from "@/lib/routes";
import { createStakeholder } from "@/services/stakeholders-service";
import { getApiErrorMessage } from "@/lib/api-errors";
import { pushToast } from "@/lib/toast";

const stakeholderSchema = z
  .object({
    name: z.string().min(1, "Nome e obrigatorio."),
    type: z.string().optional(),
    baseUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
    queryTemplate: z.string().optional(),
    requiresJavascript: z.boolean(),
    hasCaptcha: z.boolean(),
    requiresOffice: z.boolean(),
    notes: z.string().optional(),
    active: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.type?.toLowerCase() === "cartorio" && !data.requiresOffice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Para cartorio, marque exige oficio/serventia.",
        path: ["requiresOffice"],
      });
    }
  });

type StakeholderFormData = z.infer<typeof stakeholderSchema>;

export default function NovoStakeholderPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<StakeholderFormData>({
    resolver: zodResolver(stakeholderSchema),
    defaultValues: {
      name: "",
      type: "",
      baseUrl: "",
      queryTemplate: "",
      requiresJavascript: false,
      hasCaptcha: false,
      requiresOffice: false,
      notes: "",
      active: true,
    },
  });

  const typeValue = watch("type") ?? "";
  const isCartorio = useMemo(
    () => typeValue.trim().toLowerCase() === "cartorio",
    [typeValue],
  );

  const onSubmit = async (data: StakeholderFormData) => {
    try {
      setSubmitError(null);
      setIsSubmitting(true);
      const isCartorioType = data.type?.trim().toLowerCase() === "cartorio";
      const created = await createStakeholder({
        name: data.name,
        type: data.type?.trim() || null,
        baseUrl: data.baseUrl?.trim() || null,
        queryTemplate: data.queryTemplate?.trim() || null,
        requiresJavascript: data.requiresJavascript,
        hasCaptcha: data.hasCaptcha,
        requiresOffice: isCartorioType ? data.requiresOffice : false,
        notes: data.notes?.trim() || null,
        active: data.active,
      });

      pushToast("Stakeholder criado com sucesso.", "success");
      router.push(stakeholderDetailsRoute(created.id));
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Nao foi possivel criar o stakeholder."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">
            Novo stakeholder
          </h2>
          <p className="mt-2 text-sm text-zinc-600">
            Cadastre uma origem de consulta para o scraping.
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push(appRoutes.stakeholders)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
        >
          Voltar para lista
        </button>
      </div>

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
          <label className="text-sm font-medium text-zinc-700" htmlFor="type">
            Tipo
          </label>
          <input
            id="type"
            type="text"
            placeholder="cartorio, orgao-publico, empresa"
            {...register("type")}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-zinc-700" htmlFor="baseUrl">
            URL base
          </label>
          <input
            id="baseUrl"
            type="url"
            placeholder="https://"
            {...register("baseUrl")}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
          {errors.baseUrl ? (
            <p className="mt-1 text-xs text-red-600">{errors.baseUrl.message}</p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-zinc-700"
            htmlFor="queryTemplate"
          >
            Template de consulta
          </label>
          <input
            id="queryTemplate"
            type="text"
            {...register("queryTemplate")}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" {...register("requiresJavascript")} />
            Requer JavaScript
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" {...register("hasCaptcha")} />
            Tem captcha
          </label>
        </div>

        {isCartorio ? (
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" {...register("requiresOffice")} />
            Exige oficio/serventia
          </label>
        ) : null}
        {errors.requiresOffice ? (
          <p className="text-xs text-red-600">{errors.requiresOffice.message}</p>
        ) : null}

        <div>
          <label className="text-sm font-medium text-zinc-700" htmlFor="notes">
            Observacoes
          </label>
          <textarea
            id="notes"
            rows={3}
            {...register("notes")}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" {...register("active")} />
          Stakeholder ativo
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
          {isSubmitting ? "Salvando..." : "Salvar stakeholder"}
        </button>
      </form>
    </section>
  );
}
