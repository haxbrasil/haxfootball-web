import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/matches/test">{children}</a>,
}));

import { PubGameRow } from "./pub-game-row";

describe("PubGameRow", () => {
  it("keeps player names out of the pubs summary", () => {
    render(
      <PubGameRow
        match={
          {
            id: "match-id",
            kind: "single",
            initiatedAt: "2026-07-31T12:00:00.000Z",
            status: "completed",
            score: { red: 2, blue: 1 },
            players: [{ id: "player-id", name: "Jogador secreto", team: "red" }],
          } as never
        }
      />,
    );

    expect(screen.queryByText("Jogador secreto")).toBeNull();
    expect(screen.getByText("2")).not.toBeNull();
    expect(screen.getByText("1")).not.toBeNull();
  });
});
