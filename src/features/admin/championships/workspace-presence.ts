import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";

type Presence = ChampionshipWorkspaceData["presence"][number];

export function deduplicateChampionshipPresence(presence: Presence[]) {
  const people = new Map<string, Presence>();

  for (const session of presence) {
    const current = people.get(session.accountUuid);
    if (!current || session.expiresAt > current.expiresAt) {
      people.set(session.accountUuid, session);
    }
  }

  return [...people.values()];
}
