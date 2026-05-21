"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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

  const canSend = input.trim().length > 0 && !isSubmitting;

  const handleSend = async (question?: string) => {
    const content = (question ?? input).trim();
    if (!content || isSubmitting) return;

    setError(null);
    setIsSubmitting(true);
    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      const response = await sendRagChat(content);
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
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
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-zinc-900">Home IA</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Pergunte sobre projetos e protocolos. A IA responde com base nos dados
            cadastrados.
          </p>
        </div>
      </div>

      {!hasMessages ? (
        <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-700">
            Exemplos de perguntas para comecar:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedQuestions.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => handleSend(question)}
                className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 hover:border-zinc-400"
                disabled={isSubmitting}
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-lg border p-4 text-sm ${
              message.role === "user"
                ? "border-zinc-200 bg-zinc-50 text-zinc-900"
                : "border-emerald-200 bg-emerald-50 text-emerald-900"
            }`}
          >
            <p className="font-semibold">
              {message.role === "user" ? "Voce" : "IA"}
            </p>
            <p className="mt-2 whitespace-pre-line text-sm">{message.content}</p>

            {message.sources && message.sources.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                  Fontes
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  {message.sources.map((source, index) => {
                    const href = buildSourceLink(source);
                    const label = getSourceLabel(source);

                    return (
                      <li key={`${source.label}-${index}`}>
                        {href ? (
                          <Link
                            href={href}
                            className="underline underline-offset-2"
                            target={href.startsWith("http") ? "_blank" : undefined}
                            rel={href.startsWith("http") ? "noreferrer" : undefined}
                          >
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
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            A IA esta respondendo...
          </div>
        ) : null}
      </div>

      {error ? <ErrorPanel message={error} className="mt-4" /> : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend();
        }}
        className="mt-6 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row"
      >
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Digite sua pergunta..."
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {isSubmitting ? "Enviando..." : "Perguntar"}
        </button>
      </form>
    </section>
  );
}
