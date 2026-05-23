import { formatDateTime } from "#/lib/date/format-date-time";

export function formatSessionEntryJoinedAt(createdAt: string) {
  const formatted = formatDateTime(createdAt, "data desconhecida");

  return `Sessão iniciada em ${formatted}`;
}
