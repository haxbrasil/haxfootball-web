import { Link } from "@tanstack/react-router";
import { LogIn, UserRound } from "lucide-react";
import type { ApiAccountSession } from "#/server/auth/session";

export function AccountNavLink({ session }: { session?: ApiAccountSession | null }) {
  const accountLabel = session?.account.name ?? "Entrar";
  const accountTitle = session ? `Conta: ${session.account.name}` : "Entrar";
  const Icon = session ? UserRound : LogIn;

  return (
    <Link
      to={session ? "/account" : "/account/login"}
      title={accountTitle}
      className="group inline-flex h-10 items-center gap-2 rounded-full border border-border/80 bg-card/80 px-2.5 pr-3 text-sm font-medium shadow-xs transition hover:border-primary/45 hover:bg-muted/70"
    >
      <span className="grid size-7 place-items-center rounded-full bg-primary/15 text-primary transition group-hover:bg-primary/25">
        <Icon className="size-4" />
      </span>
      <span className="max-w-32 truncate text-foreground">{accountLabel}</span>
    </Link>
  );
}
