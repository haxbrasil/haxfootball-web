import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { accountSessionChangedEvent } from "#/features/account/utils/session-events";
import { getCurrentSessionFn } from "#/server/auth/functions";
import type { ApiAccountSession } from "#/server/auth/session";
import { AppShell } from "./app-shell";

export function SessionAwareAppShell({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: ApiAccountSession | null;
}) {
  const [session, setSession] = useState<ApiAccountSession | null>(initialSession);
  const locationHref = useRouterState({ select: (state) => state.location.href });
  const getCurrentSession = useServerFn(getCurrentSessionFn);

  useEffect(() => {
    setSession(initialSession);
  }, [initialSession]);

  useEffect(() => {
    let isMounted = true;

    getCurrentSession().then((session) => {
      if (isMounted) {
        setSession(session);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [getCurrentSession, locationHref]);

  useEffect(() => {
    const refreshSession = () => {
      getCurrentSession().then(setSession);
    };

    window.addEventListener(accountSessionChangedEvent, refreshSession);

    return () => {
      window.removeEventListener(accountSessionChangedEvent, refreshSession);
    };
  }, [getCurrentSession]);

  return <AppShell session={session}>{children}</AppShell>;
}
