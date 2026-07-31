import type { ApiAccountSession } from "#/server/auth/session";
import { AppShell } from "./app-shell";

export function SessionAwareAppShell({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: ApiAccountSession | null;
}) {
  return <AppShell session={initialSession}>{children}</AppShell>;
}
