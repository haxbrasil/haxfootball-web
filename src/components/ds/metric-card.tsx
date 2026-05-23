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
    <DataCard title={label} className="border-l-4 border-l-primary">
      <div className="text-3xl font-semibold leading-none">{value}</div>
      {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
    </DataCard>
  );
}
