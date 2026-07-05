import { useState } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, X } from "lucide-react";
import { Button } from "#/components/ui/button";
import { notifyAccountSessionChanged } from "#/features/account/utils/session-events";
import type { ApiAccountSession } from "#/server/auth/session";
import { stopImpersonationFn } from "#/server/auth/functions";

export function ImpersonationBanner({ session }: { session: ApiAccountSession }) {
  const navigate = useNavigate();
  const router = useRouter();
  const stopImpersonation = useServerFn(stopImpersonationFn);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session.impersonation) {
    return null;
  }

  async function stop() {
    setMessage(null);
    setIsSubmitting(true);

    const result = await stopImpersonation();

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage(result.message);

      return;
    }

    notifyAccountSessionChanged();
    await router.invalidate();
    await navigate({ to: "/account" });
  }

  return (
    <div className="border-b bg-primary/12 text-sm text-foreground">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/18 text-primary">
            <Eye className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="font-medium">
              Visualizando como <span className="font-semibold">{session.account.name}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Sessão iniciada por {session.impersonation.actor.name}
              {message ? ` - ${message}` : ""}
            </p>
          </div>
        </div>

        <Button type="button" size="sm" variant="outline" disabled={isSubmitting} onClick={stop}>
          <X className="size-4" />
          Sair da visualização
        </Button>
      </div>
    </div>
  );
}
