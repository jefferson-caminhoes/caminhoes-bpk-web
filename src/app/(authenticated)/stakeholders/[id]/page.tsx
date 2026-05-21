"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { getApiErrorMessage } from "@/lib/api-errors";
import { pushToast } from "@/lib/toast";
import { ErrorPanel, LoadingPanel } from "@/components/ui/feedback";
import {
  getStakeholderById,
  updateStakeholder,
} from "@/services/stakeholders-service";

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

export default function StakeholderDetalhePage() {
  const params = useParams<{ id: string }>();
  const stakeholderId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
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

  useEffect(() => {
    async function loadStakeholder() {
      try {
        setLoadError(null);
        const data = await getStakeholderById(stakeholderId);
        reset({
          name: data.name,
          type: data.type ?? "",
          baseUrl: data.baseUrl ?? "",
          queryTemplate: data.queryTemplate ?? "",
          requiresJavascript: data.requiresJavascript,
          hasCaptcha: data.hasCaptcha,
          requiresOffice: data.requiresOffice,
          notes: data.notes ?? "",
          active: data.active,
        });
      } catch (error) {
        setLoadError(
          getApiErrorMessage(error, "Nao foi possivel carregar o stakeholder."),
        );
      } finally {
        setIsLoading(false);
      }
    }

    if (stakeholderId) {
      void loadStakeholder();
    }
  }, [reset, stakeholderId]);

  const onSubmit = async (data: StakeholderFormData) => {
    try {
      setSubmitError(null);
      setSubmitSuccess(null);
      setIsSubmitting(true);
      const isCartorioType = data.type?.trim().toLowerCase() === "cartorio";

      await updateStakeholder(stakeholderId, {
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

      setSubmitSuccess("Stakeholder atualizado com sucesso.");
      pushToast("Stakeholder atualizado.", "success");
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, "Nao foi possivel salvar as alteracoes."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Detalhe do stakeholder
        </h2>
        <LoadingPanel message="Carregando..." className="mt-4" />
      </section>
    );
  }

  if (loadError) {
    return (
      <section>
        <h2 className="text-2xl font-semibold text-zinc-900">
          Detalhe do stakeholder
        </h2>
        <ErrorPanel message={loadError} className="mt-4" />
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold text-zinc-900">
        Detalhe do stakeholder
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        ID: <span className="font-mono">{stakeholderId}</span>
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

        {submitSuccess ? (
          <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            {submitSuccess}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSubmitting ? "Salvando..." : "Salvar alteracoes"}
        </button>
      </form>
    </section>
  );
}
