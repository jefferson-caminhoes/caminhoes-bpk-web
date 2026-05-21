"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Link2, Send, UserRound } from "lucide-react";
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
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#ee2331]">
          Assistente operacional
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-[#092946]">Home IA</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Pergunte sobre projetos e protocolos. A IA responde com base nos dados
          cadastrados.
        </p>
      </div>

      {!hasMessages ? (
        <div className="rounded-md border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#092946] text-white">
              <Bot size={20} />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#092946]">
                Perguntas para gerar insight
              </p>
              <p className="text-sm text-slate-600">
                Comece por riscos, prazos, divergencias e fontes problematicas.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => handleSend(question)}
                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-[#ee2331]/40 hover:bg-[#fff1f2] hover:text-[#092946]"
                disabled={isSubmitting}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-md border p-4 text-sm shadow-sm ${
              message.role === "user"
                ? "border-slate-200 bg-white text-slate-900"
                : "border-[#092946]/15 bg-[#f8fafc] text-[#092946]"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold">
              <span
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${
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
              <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
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
                            className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-[#092946] hover:border-[#ee2331]/40 hover:text-[#ee2331]"
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
          <div className="rounded-md border border-[#092946]/15 bg-white p-4 text-sm font-medium text-[#092946] shadow-sm">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-[#ee2331]" />
              A IA esta respondendo...
            </span>
          </div>
        ) : null}
      </div>

      {error ? <ErrorPanel message={error} /> : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend();
        }}
        className="sticky bottom-4 flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-3 shadow-lg sm:flex-row"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Digite sua pergunta sobre projetos, protocolos ou riscos..."
          className="min-h-11 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#ee2331]"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#092946] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#123a60] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={16} />
          {isSubmitting ? "Enviando..." : "Perguntar"}
        </button>
      </form>
    </section>
  );
}
