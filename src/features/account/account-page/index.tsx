import { PageHeader } from "#/components/ds/app-shell";
import { Button } from "#/components/ui/button";
import type { ApiAccountSession } from "#/server/auth/session";
import { AccountSessionCard } from "./components/account-session-card";
import { InactiveSessionCard } from "./components/inactive-session-card";
import { useLogoutAction } from "./hooks/use-logout-action";

export function AccountPage({ session }: { session: ApiAccountSession | null }) {
  const logout = useLogoutAction();

  if (!session) {
    return (
      <>
        <PageHeader title="Conta" description="Perfil da sessão web." />
        <InactiveSessionCard />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Conta"
        description="Perfil resolvido pelo BFF a partir da conta da API."
        action={
          <Button variant="outline" onClick={logout.submit}>
            Sair
          </Button>
        }
      />
      <AccountSessionCard session={session} />
    </>
  );
}
