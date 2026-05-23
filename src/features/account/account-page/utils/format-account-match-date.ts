import { formatDateTime } from "#/lib/date/format-date-time";

export function formatAccountMatchDate(value: string) {
  return formatDateTime(value);
}
