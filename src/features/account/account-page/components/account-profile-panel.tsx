import { LogOut } from "lucide-react";
import { BrandLogo } from "#/components/ds/brand-logo";
import { StatusBadge } from "#/components/ds/status-badge";
import { Button } from "#/components/ui/button";
import type { ApiAccountSession } from "#/server/auth/session";

export function AccountProfilePanel({
  session,
  onLogout,
}: {
  session: ApiAccountSession;
  onLogout: () => void;
}) {
  return (
    <section className="bfl-panel relative overflow-hidden rounded-xl border p-6 sm:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent_34%)]" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-lg border bg-background/55 p-2 shadow-sm">
            <BrandLogo className="h-full w-full" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              Minha conta
            </p>
            <h1 className="mt-1 truncate text-3xl font-semibold tracking-normal">
              {session.account.name}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge value={session.account.role.title} />
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={onLogout}>
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>
    </section>
  );
}
