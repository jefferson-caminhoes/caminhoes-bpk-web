"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Link2, Send, Sparkles, UserRound } from "lucide-react";
import { ErrorPanel } from "@/components/ui/feedback";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  projectDetailsRoute,
  projectProtocolDetailsRoute,
} from "@/lib/routes";
import { sendRagChat } from "@/services/rag-service";
import type { RagSource } from "@/types/rag";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
};

const suggestedQuestions = [
  "Quais protocolos estao com divergencia?",
  "Qual o tempo medio dos protocolos da Copel?",
  "Me fale sobre o projeto Residencial Horizonte.",
  "Quais protocolos nao foram encontrados na ultima consulta?",
];

function buildSourceLink(source: RagSource) {
  if (source.type === "project" && source.projectId) {
    return projectDetailsRoute(source.projectId);
  }

  if (source.type === "protocol" && source.projectId && source.protocolId) {
    return projectProtocolDetailsRoute(source.projectId, source.protocolId);
  }

  return source.url ?? null;
}

function getSourceLabel(source: RagSource) {
  if (source.label?.trim()) return source.label;
  if (source.type === "project") return "Projeto";
  if (source.type === "protocol") return "Protocolo";
  return "Fonte";
}

export default function HomePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);

  const canSend = input.trim().length > 0 && !isSubmitting;

  const handleSend = async (question?: string) => {
    const content = (question ?? input).trim();
    if (!content || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    messageIdRef.current += 1;
    const userMessage: ChatMessage = {
      id: `${messageIdRef.current}-user`,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await sendRagChat(content);
      messageIdRef.current += 1;
      const assistantMessage: ChatMessage = {
        id: `${messageIdRef.current}-assistant`,
        role: "assistant",
        content: response.answer || "Sem resposta da IA.",
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Nao foi possivel consultar a IA no momento."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasMessages = messages.length > 0;
  const lastMessage = useMemo(() => messages[messages.length - 1], [messages]);

  return (
    <section className="min-h-[calc(100vh-120px)]">
      <div className="mx-auto flex min-h-[calc(100vh-160px)] max-w-5xl flex-col">
        <div className="flex-1 space-y-6 pt-4">
          <div className="text-center">
            <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#092946] text-white shadow-sm">
              <Sparkles size={22} />
            </span>
            <h2 className="mt-6 text-4xl font-semibold tracking-tight text-[#092946] sm:text-5xl">
              Como posso ajudar hoje?
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Consulte projetos, protocolos, divergencias e fontes monitoradas
              com base nos dados cadastrados no sistema.
            </p>
          </div>

          {!hasMessages ? (
            <div className="mx-auto grid w-full max-w-3xl gap-2 md:grid-cols-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => handleSend(question)}
                  className="min-h-20 rounded-2xl border border-slate-300 bg-white p-3 text-left text-xs font-semibold text-[#092946] shadow-sm transition hover:-translate-y-0.5 hover:border-[#ee2331]/50 hover:bg-[#fff1f2] hover:shadow-md sm:text-sm"
                disabled={isSubmitting}
              >
                  <span className="mb-2 inline-flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-[#092946]">
                    <Bot size={14} />
                  </span>
                {question}
              </button>
            ))}
          </div>
          ) : null}

          <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
                className={`rounded-2xl border p-4 text-sm shadow-sm ${
              message.role === "user"
                    ? "ml-auto max-w-3xl border-slate-300 bg-white text-slate-900"
                    : "max-w-4xl border-[#092946]/20 bg-[#f8fafc] text-[#092946]"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-xl ${
                  message.role === "user"
                    ? "bg-slate-100 text-slate-700"
                    : "bg-[#092946] text-white"
                }`}
              >
                {message.role === "user" ? (
                  <UserRound size={15} />
                ) : (
                  <Bot size={15} />
                )}
              </span>
              {message.role === "user" ? "Voce" : "IA"}
            </div>
            <p className="mt-3 whitespace-pre-line leading-6">{message.content}</p>

            {message.sources && message.sources.length > 0 ? (
                  <div className="mt-4 rounded-2xl border border-slate-300 bg-white p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#ee2331]">
                  Fontes consultadas
                </p>
                <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  {message.sources.map((source, index) => {
                    const href = buildSourceLink(source);
                    const label = getSourceLabel(source);

                    return (
                      <li key={`${source.label}-${index}`}>
                        {href ? (
                          <Link
                            href={href}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-2.5 py-1.5 font-medium text-[#092946] hover:border-[#ee2331]/40 hover:text-[#ee2331]"
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel={href.startsWith("http") ? "noreferrer" : undefined}
                          >
                            <Link2 size={14} />
                            {label}
                          </Link>
                        ) : (
                          <span>{label}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
          </div>
        ))}

        {isSubmitting && lastMessage?.role === "user" ? (
              <div className="rounded-2xl border border-[#092946]/20 bg-white p-4 text-sm font-medium text-[#092946] shadow-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ee2331]" />
              A IA esta respondendo...
            </span>
          </div>
        ) : null}
          </div>

          {error ? <ErrorPanel message={error} /> : null}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleSend();
          }}
          className={
            hasMessages
              ? "sticky bottom-4 mt-6 rounded-3xl border border-slate-300 bg-white p-2 shadow-xl shadow-slate-200/70"
              : "mx-auto mt-2 w-full max-w-3xl rounded-3xl border border-slate-300 bg-white p-2 shadow-xl shadow-slate-200/70"
          }
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pergunte sobre projetos, protocolos ou riscos..."
              className="min-h-14 w-full rounded-2xl border border-transparent bg-slate-50 px-4 py-3 text-sm focus:border-[#ee2331] focus:bg-white"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#092946] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#123a60] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={16} />
              {isSubmitting ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
