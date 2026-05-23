import { PageHeader } from "#/components/ds/app-shell";
import type {
  ListAccountLinkedSessionEntriesResponse,
  ListMatchesResponse,
} from "#/server/api/haxfootball";
import type { ApiAccountSession } from "#/server/auth/session";
import { AccountDashboard } from "./components/account-dashboard";
import { AccountProfilePanel } from "./components/account-profile-panel";
import { InactiveSessionCard } from "./components/inactive-session-card";
import { useLogoutAction } from "./hooks/use-logout-action";

type AccountPageData = {
  session: ApiAccountSession | null;
  sessionEntries: ListAccountLinkedSessionEntriesResponse | null;
  matches: ListMatchesResponse | null;
};

export function AccountPage({ data }: { data: AccountPageData }) {
  const logout = useLogoutAction();
  const { session, sessionEntries, matches } = data;

  if (!session) {
    return (
      <>
        <PageHeader title="Minha conta" description="Entre para ver sua conta BFL." />
        <InactiveSessionCard />
      </>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Minha conta"
        description="Acompanhe sua identidade na BFL e vínculos da sua conta."
      />
      <AccountProfilePanel session={session} onLogout={logout.submit} />
      <AccountDashboard sessionEntries={sessionEntries} matches={matches} />
    </div>
  );
}
