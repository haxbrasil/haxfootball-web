import type { ReactNode } from "react";
import { BrandLogo } from "#/components/ds/brand-logo";
import { cn } from "#/lib/utils";

export function LeagueHeader({
  title,
  eyebrow = "Brazilian HaxFootball League",
  description,
  action,
  showBrand = true,
}: {
  title: string;
  eyebrow?: string | null;
  description?: string;
  action?: ReactNode;
  showBrand?: boolean;
}) {
  return (
    <header className="bfl-field-surface mb-6 overflow-hidden rounded-xl border border-border/80 text-foreground shadow-lg">
      <div
        className={cn(
          "grid gap-5 p-5 sm:items-center",
          showBrand && action ? "sm:grid-cols-[auto_1fr_auto]" : null,
          showBrand && !action ? "sm:grid-cols-[auto_1fr]" : null,
          !showBrand && action ? "sm:grid-cols-[1fr_auto]" : null,
        )}
      >
        {showBrand ? (
          <div className="grid size-16 place-items-center rounded-xl border bg-background/70 p-2 shadow-sm">
            <BrandLogo className="h-full w-full" />
          </div>
        ) : null}
        <div>
          {eyebrow ? (
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="mt-1 text-3xl font-semibold tracking-normal sm:text-4xl">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action ? <div className="sm:justify-self-end">{action}</div> : null}
      </div>
    </header>
  );
}
