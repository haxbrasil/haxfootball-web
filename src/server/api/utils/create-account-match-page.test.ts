import type { MatchSummary } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { createAccountMatchPage } from "./create-account-match-page";

const match = (input: Partial<MatchSummary> & Pick<MatchSummary, "id">): MatchSummary => ({
  createdAt: input.createdAt ?? "2026-01-01T00:00:00.000Z",
  endedAt: input.endedAt ?? null,
  id: input.id,
  initiatedAt: input.initiatedAt ?? null,
  gameMode: input.gameMode ?? null,
  recording: input.recording ?? null,
  score: input.score ?? null,
  statEventSchema: input.statEventSchema ?? null,
  status: input.status ?? "completed",
  updatedAt: input.updatedAt ?? "2026-01-01T00:00:00.000Z",
});

describe("createAccountMatchPage", () => {
  it("deduplicates matches from multiple linked players", () => {
    const page = createAccountMatchPage([match({ id: "one" }), match({ id: "one" })]);

    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.id).toBe("one");
  });

  it("sorts matches by newest playable date first", () => {
    const page = createAccountMatchPage([
      match({ id: "older", initiatedAt: "2026-01-01T00:00:00.000Z" }),
      match({ id: "newer", initiatedAt: "2026-01-02T00:00:00.000Z" }),
    ]);

    expect(page.items.map((item) => item.id)).toEqual(["newer", "older"]);
  });

  it("paginates the merged match list with an offset cursor", () => {
    const page = createAccountMatchPage(
      [
        match({ id: "three", initiatedAt: "2026-01-03T00:00:00.000Z" }),
        match({ id: "two", initiatedAt: "2026-01-02T00:00:00.000Z" }),
        match({ id: "one", initiatedAt: "2026-01-01T00:00:00.000Z" }),
      ],
      { cursor: "1", limit: 1 },
    );

    expect(page.items.map((item) => item.id)).toEqual(["two"]);
    expect(page.page.nextCursor).toBe("2");
  });

  it("treats invalid cursors as the first page", () => {
    const page = createAccountMatchPage([match({ id: "one" })], {
      cursor: "invalid",
      limit: 1,
    });

    expect(page.items.map((item) => item.id)).toEqual(["one"]);
  });
});
