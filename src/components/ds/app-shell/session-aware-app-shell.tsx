import type { ApiAccountSession } from "#/server/auth/session";
import type { ProductFeatures } from "#/server/features";
import { AppShell } from "./app-shell";

export function SessionAwareAppShell({
  children,
  features,
  initialSession,
}: {
  children: React.ReactNode;
  features: ProductFeatures;
  initialSession: ApiAccountSession | null;
}) {
  return (
    <AppShell session={initialSession} features={features}>
      {children}
    </AppShell>
  );
}
