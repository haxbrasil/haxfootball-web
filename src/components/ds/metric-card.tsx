import { DataCard } from "#/components/ds/app-shell";

export function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail?: string;
}) {
  return (
    <DataCard title={label}>
      <div className="text-2xl font-semibold">{value}</div>
      {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
    </DataCard>
  );
}
