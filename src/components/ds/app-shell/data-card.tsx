import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

export function DataCard({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={cn("rounded-lg border bg-card p-4 text-card-foreground shadow-xs", className)}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold tracking-normal">{title}</h2>
        {meta}
      </div>
      {children}
    </article>
  );
}
