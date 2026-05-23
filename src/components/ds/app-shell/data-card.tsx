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
    <article className={cn("bfl-panel rounded-xl border p-4 text-card-foreground", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </h2>
        {meta}
      </div>
      {children}
    </article>
  );
}
