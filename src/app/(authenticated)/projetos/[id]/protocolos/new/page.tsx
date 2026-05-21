"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createProtocol } from "@/services/protocols-service";
import { listStakeholders } from "@/services/stakeholders-service";
import { projectProtocolsRoute } from "@/lib/routes";
import type { Stakeholder } from "@/types/stakeholder";

const protocolSchema = z.object({
  activity: z.string().min(1, "Atividade e obrigatoria."),
  protocolNumber: z.string().min(1, "Numero do protocolo e obrigatorio."),
  cnpj: z.string().min(1, "CNPJ e obrigatorio."),
  stakeholderId: z.string().min(1, "Stakeholder e obrigatorio."),
  owner: z.string().optional(),
  manualStatus: z.string().optional(),
  situation: z.string().optional(),
  monitoringEnabled: z.boolean(),
});

type ProtocolFormData = z.infer<typeof protocolSchema>;

export default function NovoProtocoloPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [isLoadingStakeholders, setIsLoadingStakeholders] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProtocolFormData>({
    resolver: zodResolver(protocolSchema),
    defaultValues: {
      activity: "",
      protocolNumber: "",
      cnpj: "",
      stakeholderId: "",
      owner: "",
      manualStatus: "",
      situation: "",
      monitoringEnabled: true,
    },
  });

  useEffect(() => {
    async function loadStakeholders() {
      try {
        const data = await listStakeholders();
        setStakeholders(data.filter((item) => item.active));
      } finally {
        setIsLoadingStakeholders(false);
      }
    }

    void loadStakeholders();
  }, []);

  const stakeholderOptions = useMemo(
    () =>
      stakeholders.map((item) => ({
        value: item.id,
        label: item.type ? `${item.name} (${item.type})` : item.name,
      })),
    [stakeholders],
  );

  const onSubmit = async (data: ProtocolFormData) => {
    try {
      setSubmitError(null);
      setIsSubmitting(true);

      await createProtocol(projectId, {
        activity: data.activity,
        protocolNumber: data.protocolNumber,
        cnpj: data.cnpj,
        stakeholderId: data.stakeholderId,
        owner: data.owner?.trim() || null,
        manualStatus: data.manualStatus?.trim() || null,
        situation: data.situation?.trim() || null,
        monitoringEnabled: data.monitoringEnabled,
      });

      router.push(projectProtocolsRoute(projectId));
    } catch {
      setSubmitError("Nao foi possivel criar o protocolo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <h2 className="text-2xl font-semibold text-zinc-900">Novo protocolo</h2>
      <p className="mt-2 text-sm text-zinc-600">Projeto: {projectId}</p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 max-w-3xl space-y-4 rounded-lg border border-zinc-200 bg-white p-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-zinc-700" htmlFor="activity">
              Atividade
            </label>
            <input
              id="activity"
              type="text"
              {...register("activity")}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            {errors.activity ? (
              <p className="mt-1 text-xs text-red-600">{errors.activity.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700" htmlFor="protocolNumber">
              Numero do protocolo
            </label>
            <input
              id="protocolNumber"
              type="text"
              {...register("protocolNumber")}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            {errors.protocolNumber ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.protocolNumber.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-zinc-700" htmlFor="cnpj">
              CNPJ
            </label>
            <input
              id="cnpj"
              type="text"
              {...register("cnpj")}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            {errors.cnpj ? (
              <p className="mt-1 text-xs text-red-600">{errors.cnpj.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-medium text-zinc-700" htmlFor="stakeholderId">
              Stakeholder
            </label>
            <select
              id="stakeholderId"
              {...register("stakeholderId")}
              disabled={isLoadingStakeholders}
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione</option>
              {stakeholderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.stakeholderId ? (
              <p className="mt-1 text-xs text-red-600">
                {errors.stakeholderId.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
          <div>
            <label className="text-sm font-medium text-zinc-700" htmlFor="manualStatus">
              Status manual
            </label>
            <input
              id="manualStatus"
              type="text"
              {...register("manualStatus")}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-700" htmlFor="situation">
              Situacao
            </label>
            <input
              id="situation"
              type="text"
              {...register("situation")}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" {...register("monitoringEnabled")} />
          Monitoramento ativo
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
          {isSubmitting ? "Salvando..." : "Salvar protocolo"}
        </button>
      </form>
    </section>
  );
}
