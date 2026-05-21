"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, ClipboardPlus, Save } from "lucide-react";
import { createProtocol } from "@/services/protocols-service";
import { listStakeholders } from "@/services/stakeholders-service";
import { listUsers } from "@/services/users-service";
import { projectProtocolsRoute } from "@/lib/routes";
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
  isFinalized: z.boolean(),
});

type ProtocolFormData = z.infer<typeof protocolSchema>;

export default function NovoProtocoloPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();

  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingStakeholders, setIsLoadingStakeholders] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
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
      isFinalized: false,
    },
  });

  const isFinalized = useWatch({ control, name: "isFinalized" });

  useEffect(() => {
    if (isFinalized) {
      setValue("monitoringEnabled", false);
    }
  }, [isFinalized, setValue]);

  useEffect(() => {
    async function loadDependencies() {
      try {
        const [stakeholdersData, usersData] = await Promise.all([
          listStakeholders(),
          listUsers(true),
        ]);
        setStakeholders(stakeholdersData.filter((item) => item.active));
        setUsers(usersData);
      } finally {
        setIsLoadingStakeholders(false);
      }
    }

    void loadDependencies();
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

      const monitoringEnabled = data.isFinalized ? false : data.monitoringEnabled;
      const situation = data.isFinalized
        ? data.situation?.trim() || "Finalizado"
        : data.situation?.trim() || null;

      await createProtocol(projectId, {
        activity: data.activity,
        protocolNumber: data.protocolNumber,
        cnpj: data.cnpj,
        stakeholderId: data.stakeholderId,
        owner: data.owner?.trim() || null,
        manualStatus: data.manualStatus?.trim() || null,
        situation,
        monitoringEnabled,
      });

      router.push(projectProtocolsRoute(projectId));
    } catch {
      setSubmitError("Nao foi possivel criar o protocolo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
            Monitoramento de protocolos
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[#092946]">
            Novo protocolo
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Cadastre um protocolo para acompanhar status, divergencias e
            atualizacoes de fonte.
          </p>
        </div>
        <Link
          href={projectProtocolsRoute(projectId)}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#092946] shadow-sm transition hover:border-[#ee2331]/50 hover:text-[#ee2331]"
        >
          <ArrowLeft size={16} />
          Voltar
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-[#092946]/20 bg-[#092946] p-5 text-white shadow-sm">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
            <ClipboardPlus size={21} />
          </span>
          <h3 className="mt-4 text-lg font-semibold">Dados de monitoramento</h3>
          <p className="mt-2 text-sm leading-6 text-white/75">
            Preencha os identificadores principais primeiro. Status e situacao
            podem ser ajustados depois na tela do protocolo.
          </p>
          <p className="mt-4 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs text-white/75">
            Projeto: <span className="font-mono">{projectId}</span>
          </p>
        </aside>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="activity">
              Atividade
            </label>
            <input
              id="activity"
              type="text"
              {...register("activity")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
            />
            {errors.activity ? (
              <p className="mt-1 text-xs text-red-600">{errors.activity.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="protocolNumber">
              Numero do protocolo
            </label>
            <input
              id="protocolNumber"
              type="text"
              {...register("protocolNumber")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
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
            <label className="text-sm font-semibold text-[#092946]" htmlFor="cnpj">
              CNPJ
            </label>
            <input
              id="cnpj"
              type="text"
              {...register("cnpj")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
            />
            {errors.cnpj ? (
              <p className="mt-1 text-xs text-red-600">{errors.cnpj.message}</p>
            ) : null}
          </div>

          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="stakeholderId">
              Stakeholder
            </label>
            <select
              id="stakeholderId"
              {...register("stakeholderId")}
              disabled={isLoadingStakeholders}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#ee2331]"
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
            <label className="text-sm font-semibold text-[#092946]" htmlFor="owner">
              Responsavel
            </label>
            <select
              id="owner"
              {...register("owner")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-[#ee2331]"
            >
              <option value="">Sem responsavel</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="manualStatus">
              Status manual
            </label>
            <input
              id="manualStatus"
              type="text"
              {...register("manualStatus")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[#092946]" htmlFor="situation">
              Situacao
            </label>
            <input
              id="situation"
              type="text"
              {...register("situation")}
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
            />
          </div>
        </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-[#092946]">
                Monitoramento ativo
              </span>
              <input
                type="checkbox"
                {...register("monitoringEnabled")}
                className="h-4 w-4"
              />
            </label>
            <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold text-[#092946]">
                Criar como finalizado
              </span>
              <input type="checkbox" {...register("isFinalized")} className="h-4 w-4" />
            </label>
          </div>
        {isFinalized ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Protocolos finalizados ficam com monitoramento desativado.
          </p>
        ) : null}

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
          {isSubmitting ? "Salvando..." : "Salvar protocolo"}
        </button>
        </form>
      </div>
    </section>
  );
}
