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
import api from "@/lib/api";

const stakeholderSchema = z
  .object({
    name: z.string().min(1, "Nome e obrigatorio."),
    type: z.string().optional(),
    baseUrl: z.string().url("Informe uma URL valida.").optional().or(z.literal("")),
    requiresJavascript: z.boolean(),
    hasCaptcha: z.boolean(),
    requiresOffice: z.boolean(),
    useCredentials: z.boolean(),
    login: z.string().optional(),
    password: z.string().optional(),
    hasExistingCredentials: z.boolean(),
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
    if (data.useCredentials) {
      if (!data.login?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe o login.",
          path: ["login"],
        });
      }
      if (!data.password?.trim() && !data.hasExistingCredentials) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Informe a senha.",
          path: ["password"],
        });
      }
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

  // AI URL Analyzer state
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeResult, setAnalyzeResult] = useState<{status: string; portalType?: string; confidence?: number; steps?: number; analyzedAt?: string; error?: string} | null>(null);

  const handleAnalyzeUrl = async () => {
    if (!analyzeUrl.trim()) return;
    setIsAnalyzing(true);
    setAnalyzeResult(null);
    try {
      await api.post(`/stakeholders/${stakeholderId}/analyze-url`, { url: analyzeUrl.trim() });
      setAnalyzeResult({ status: "queued" });
      // Poll probe status
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const { data } = await api.get(`/stakeholders/${stakeholderId}/probe`);
          if (data.status === "analyzed" && data.site_probe) {
            clearInterval(poll);
            setIsAnalyzing(false);
            setAnalyzeResult({
              status: "analyzed",
              portalType: data.site_probe.portal_type,
              confidence: data.site_probe.confidence,
              steps: data.site_probe.steps?.length ?? 0,
              analyzedAt: data.site_probe.analyzed_at,
            });
            pushToast("Análise concluída com sucesso!", "success");
          } else if (data.status === "error") {
            clearInterval(poll);
            setIsAnalyzing(false);
            setAnalyzeResult({ status: "error", error: data.error ?? "Erro ao analisar URL" });
          } else if (attempts >= 30) {
            clearInterval(poll);
            setIsAnalyzing(false);
            setAnalyzeResult({ status: "timeout", error: "Análise em andamento (pode levar alguns minutos)" });
          }
        } catch { /* keep polling */ }
      }, 5000);
    } catch (error) {
      setIsAnalyzing(false);
      setAnalyzeResult({ status: "error", error: getApiErrorMessage(error, "Erro ao enfileirar análise") });
    }
  };

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
      requiresJavascript: false,
      hasCaptcha: false,
      requiresOffice: false,
      useCredentials: false,
      login: "",
      password: "",
      hasExistingCredentials: false,
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
          requiresJavascript: data.requiresJavascript,
          hasCaptcha: data.hasCaptcha,
          requiresOffice: data.requiresOffice,
          useCredentials: data.requiresAuthentication || data.hasCredentials,
          login: data.authUsername ?? "",
          password: "",
          hasExistingCredentials: data.hasCredentials,
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
        requiresJavascript: data.requiresJavascript,
        hasCaptcha: data.hasCaptcha,
        requiresOffice: isCartorioType ? data.requiresOffice : false,
        useCredentials: data.useCredentials,
        login: data.login?.trim() || null,
        password: data.password?.trim() || null,
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

        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
            <input type="checkbox" {...register("useCredentials")} />
            Usar login e senha para este stakeholder
          </label>
          <p className="mt-2 text-xs text-zinc-500">
            Opcional. Se a senha ficar vazia e ja existir uma salva, a senha atual sera mantida.
          </p>

          {watch("useCredentials") ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-zinc-700" htmlFor="login">
                  Login
                </label>
                <input
                  id="login"
                  type="text"
                  {...register("login")}
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                {errors.login ? (
                  <p className="mt-1 text-xs text-red-600">{errors.login.message}</p>
                ) : null}
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-700" htmlFor="password">
                  Senha
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder={watch("hasExistingCredentials") ? "Deixe em branco para manter" : ""}
                  {...register("password")}
                  className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                />
                {errors.password ? (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

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
        <input type="hidden" {...register("hasExistingCredentials")} />

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

      {/* AI URL Analyzer */}
      <div className="mt-8 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-5">
        <h3 className="text-base font-semibold text-blue-900">
          🤖 Analisar URL com IA
        </h3>
        <p className="mt-1 text-xs text-blue-700">
          Informe a URL do portal e a IA criará automaticamente a receita de scraping.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="url"
            value={analyzeUrl}
            onChange={(e) => setAnalyzeUrl(e.target.value)}
            placeholder="https://portal.exemplo.gov.br/consulta"
            className="flex-1 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            type="button"
            onClick={() => void handleAnalyzeUrl()}
            disabled={isAnalyzing || !analyzeUrl.trim()}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-800"
          >
            {isAnalyzing ? "Analisando..." : "Analisar"}
          </button>
        </div>

        {isAnalyzing && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-700">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            IA analisando o portal... (pode levar até 60s)
          </div>
        )}

        {analyzeResult && analyzeResult.status === "analyzed" && (
          <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <p className="text-sm font-semibold text-emerald-800">✅ Scraping configurado automaticamente!</p>
            <div className="mt-2 grid grid-cols-2 gap-1 text-xs text-emerald-700">
              <span>Tipo de portal: <strong>{analyzeResult.portalType}</strong></span>
              <span>Confiança: <strong>{((analyzeResult.confidence ?? 0) * 100).toFixed(0)}%</strong></span>
              <span>Passos gerados: <strong>{analyzeResult.steps}</strong></span>
              <span>Analisado em: <strong>{analyzeResult.analyzedAt ? new Date(analyzeResult.analyzedAt).toLocaleString("pt-BR") : "-"}</strong></span>
            </div>
          </div>
        )}

        {analyzeResult && (analyzeResult.status === "error" || analyzeResult.status === "timeout") && (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {analyzeResult.status === "timeout" ? "⏳" : "⚠️"} {analyzeResult.error}
          </p>
        )}

        {analyzeResult && analyzeResult.status === "queued" && !isAnalyzing && (
          <p className="mt-3 text-xs text-blue-600">Análise enfileirada. Aguardando resultado...</p>
        )}
      </div>
    </section>
  );
}
