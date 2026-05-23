import { StatusBadge } from "#/components/ds/status-badge";

export function MatchStatusBadge({ value }: { value: string | null | undefined }) {
  if (value === "completed") {
    return null;
  }

  return <StatusBadge value={value} />;
}
