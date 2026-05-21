"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { listStakeholders } from "@/services/stakeholders-service";
import { listUsers } from "@/services/users-service";
import {
  createProtocolScrapingJob,
  finalizeProtocol,
  getProtocolById,
  reopenProtocolMonitoring,
  updateProtocol,
} from "@/services/protocols-service";
import { projectProtocolsRoute } from "@/lib/routes";
import { formatDateTime } from "@/lib/format-date";
import type { Protocol } from "@/types/protocol";
import type { Stakeholder } from "@/types/stakeholder";
import type { User } from "@/types/user";

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

export default function ProtocoloDetalhePage() {
  const params = useParams<{ id: string; protocolId: string }>();
  const projectId = params.id;
  const protocolId = params.protocolId;

  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
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
    async function loadData() {
      try {
        setErrorMessage(null);
        const [protocolData, stakeholdersData, usersData] = await Promise.all([
          getProtocolById(projectId, protocolId),
          listStakeholders(),
          listUsers(true),
        ]);
        setProtocol(protocolData);
        setStakeholders(stakeholdersData);
        setUsers(usersData);
        reset({
          activity: protocolData.activity,
          protocolNumber: protocolData.protocolNumber,
          cnpj: protocolData.cnpj,
          stakeholderId: protocolData.stakeholderId,
          owner: protocolData.assignedTo ?? "",
          manualStatus: protocolData.manualStatus ?? "",
          situation: protocolData.situation ?? "",
          monitoringEnabled: protocolData.monitoringEnabled,
        });
      } catch {
        setErrorMessage("Nao foi possivel carregar o protocolo.");
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId && protocolId) {
      void loadData();
    }
  }, [projectId, protocolId, reset]);

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
      setErrorMessage(null);
      setStatusMessage(null);
      setIsSaving(true);
      const updated = await updateProtocol(projectId, protocolId, {
        activity: data.activity,
        protocolNumber: data.protocolNumber,
        cnpj: data.cnpj,
        stakeholderId: data.stakeholderId,
        owner: data.owner?.trim() || null,
        manualStatus: data.manualStatus?.trim() || null,
        situation: data.situation?.trim() || null,
        monitoringEnabled: data.monitoringEnabled,
      });
      setProtocol(updated);
      setStatusMessage("Protocolo atualizado com sucesso.");
    } catch {
      setErrorMessage("Nao foi possivel salvar o protocolo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleConsultNow = async () => {
    try {
      setErrorMessage(null);
      setStatusMessage(null);
      setIsSaving(true);
      await createProtocolScrapingJob(protocolId);
      setStatusMessage("Consulta enviada para fila.");
    } catch {
      setErrorMessage(
        "Nao foi possivel enviar a consulta. Verifique se o protocolo esta finalizado ou sem monitoramento.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalize = async () => {
    try {
      setErrorMessage(null);
      setStatusMessage(null);
      setIsSaving(true);
      const updated = await finalizeProtocol(projectId, protocolId);
      setProtocol(updated);
      reset({
        activity: updated.activity,
        protocolNumber: updated.protocolNumber,
        cnpj: updated.cnpj,
        stakeholderId: updated.stakeholderId,
        owner: updated.assignedTo ?? "",
        manualStatus: updated.manualStatus ?? "",
        situation: updated.situation ?? "",
        monitoringEnabled: updated.monitoringEnabled,
      });
      setStatusMessage("Protocolo finalizado.");
    } catch {
      setErrorMessage("Nao foi possivel finalizar o protocolo.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReopen = async () => {
    try {
      setErrorMessage(null);
      setStatusMessage(null);
      setIsSaving(true);
      const updated = await reopenProtocolMonitoring(projectId, protocolId);
      setProtocol(updated);
      reset({
        activity: updated.activity,
        protocolNumber: updated.protocolNumber,
        cnpj: updated.cnpj,
        stakeholderId: updated.stakeholderId,
        owner: updated.assignedTo ?? "",
        manualStatus: updated.manualStatus ?? "",
        situation: updated.situation ?? "",
        monitoringEnabled: updated.monitoringEnabled,
      });
      setStatusMessage("Monitoramento reativado.");
    } catch {
      setErrorMessage("Nao foi possivel reabrir o monitoramento.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section>
        <h2 className="text-2xl font-semibold text-zinc-900">Detalhe do protocolo</h2>
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          Carregando...
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Detalhe do protocolo</h2>
          <p className="mt-2 text-sm text-zinc-600">
            <Link href={projectProtocolsRoute(projectId)} className="underline">
              Voltar para protocolos
            </Link>
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          Última consulta: {formatDateTime(protocol?.lastConsultationAt)}
        </p>
      </div>

      {protocol?.hasDivergence ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Divergência detectada entre status manual e status externo.
        </div>
      ) : null}
      {protocol?.notFoundOnSource ? (
        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          Protocolo não encontrado na última consulta da origem.
        </div>
      ) : null}
      {protocol && !protocol.monitoringEnabled ? (
        <div className="mt-3 rounded-lg border border-zinc-300 bg-zinc-100 p-3 text-sm text-zinc-700">
          Monitoramento desativado para este protocolo.
        </div>
      ) : null}
      {errorMessage ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
      {statusMessage ? (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {statusMessage}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Status manual
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {protocol?.manualStatus ?? "Nao informado"}
          </p>
        </article>
        <article className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Status externo
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {protocol?.externalStatus ?? "Nao informado"}
          </p>
        </article>
        <article className="rounded-lg border border-zinc-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Responsável
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900">
            {protocol?.assignedToName ?? "Sem responsável"}
          </p>
        </article>
      </div>

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
              Número do protocolo
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
              Responsável
            </label>
            <select
              id="owner"
              {...register("owner")}
              className="mt-2 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Sem responsável</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
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
              Situação
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

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {isSaving ? "Salvando..." : "Salvar alteracoes"}
          </button>
          <button
            type="button"
            onClick={handleConsultNow}
            disabled={isSaving}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 disabled:opacity-70"
          >
            Consultar agora
          </button>
          <button
            type="button"
            onClick={handleFinalize}
            disabled={isSaving || protocol?.monitoringEnabled === false}
            className="rounded-md border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-700 disabled:opacity-70"
          >
            Finalizar protocolo
          </button>
          <button
            type="button"
            onClick={handleReopen}
            disabled={isSaving || protocol?.monitoringEnabled === true}
            className="rounded-md border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 disabled:opacity-70"
          >
            Reabrir monitoramento
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900">Logs de alteracao</h3>
        {protocol?.changeLogs && protocol.changeLogs.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            {protocol.changeLogs.map((log, index) => (
              <li key={`${log.id ?? "log"}-${index}`} className="rounded-md bg-zinc-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                  <span>{log.user ?? "Usuario"}</span>
                  <span>{formatDateTime(log.createdAt)}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-800">
                  {log.message ?? "Alteracao registrada."}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">
            Nenhum log de alteracao manual encontrado.
          </p>
        )}
      </div>
    </section>
  );
}
