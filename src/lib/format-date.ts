const SP_TIMEZONE = "America/Sao_Paulo";

export function formatDateTime(value?: string | null): string {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: SP_TIMEZONE,
  }).format(date);
}

export function formatDate(value?: string | null): string {
  if (!value) return "Sem data";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone: SP_TIMEZONE,
  }).format(date);
}
