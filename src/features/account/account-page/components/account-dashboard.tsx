import type {
  ListAccountLinkedSessionEntriesResponse,
  ListMatchesResponse,
} from "#/server/api/haxfootball";
import { AccountLinkedSessionEntriesPanel } from "./account-linked-session-entries-panel";
import { AccountRecentMatchesPanel } from "./account-recent-matches-panel";

export function AccountDashboard({
  sessionEntries,
  matches,
}: {
  sessionEntries: ListAccountLinkedSessionEntriesResponse | null;
  matches: ListMatchesResponse | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_405px]">
      <AccountRecentMatchesPanel matches={matches} />
      <AccountLinkedSessionEntriesPanel sessionEntries={sessionEntries} />
    </div>
  );
}
