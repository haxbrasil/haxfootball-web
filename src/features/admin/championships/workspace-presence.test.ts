import { describe, expect, it } from "vitest";
import { deduplicateChampionshipPresence } from "./workspace-presence";

describe("championship workspace presence", () => {
  it("shows one person when the same account has multiple live sessions", () => {
    const people = deduplicateChampionshipPresence([
      presence("account-a", "session-a", "setup", "2026-07-31T12:00:00.000Z"),
      presence("account-a", "session-b", "activity", "2026-07-31T12:01:00.000Z"),
    ]);

    expect(people).toHaveLength(1);
    expect(people[0]).toMatchObject({ sessionUuid: "session-b", contextType: "activity" });
  });

  it("keeps different accounts even when their display names match", () => {
    const people = deduplicateChampionshipPresence([
      presence("account-a", "session-a", "setup", "2026-07-31T12:00:00.000Z"),
      presence("account-b", "session-b", "activity", "2026-07-31T12:00:00.000Z"),
    ]);

    expect(people).toHaveLength(2);
  });
});

function presence(
  accountUuid: string,
  sessionUuid: string,
  contextType: string,
  expiresAt: string,
) {
  return {
    accountUuid,
    sessionUuid,
    contextType,
    contextUuid: null,
    expiresAt,
    name: "gabinho",
  };
}
