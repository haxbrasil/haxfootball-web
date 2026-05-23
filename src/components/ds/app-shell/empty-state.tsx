import { EmptyLeagueState } from "#/components/ds/empty-league-state";

export function EmptyState({ title, body }: { title: string; body?: string }) {
  return <EmptyLeagueState title={title} body={body} />;
}
