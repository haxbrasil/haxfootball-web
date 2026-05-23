import type { LucideIcon } from "lucide-react";

export function PubOverviewMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border bg-background/55 p-4 shadow-sm">
      <div className="mb-5 flex items-center">
        <Icon className="size-4 text-primary" />
      </div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}
