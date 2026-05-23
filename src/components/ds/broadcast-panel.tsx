import type { ReactNode } from "react";
import { cn } from "#/lib/utils";

export function BroadcastPanel({
  eyebrow,
  title,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bfl-panel overflow-hidden rounded-xl border border-border/80 text-card-foreground",
        className,
      )}
    >
      <header className="bfl-panel-header flex min-h-12 items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          {eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="text-base font-semibold tracking-normal">{title}</h2>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
