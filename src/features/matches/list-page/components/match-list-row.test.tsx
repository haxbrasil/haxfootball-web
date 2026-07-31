import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="/matches/test">{children}</a>,
}));

import { MatchListRow } from "./match-list-row";

describe("MatchListRow", () => {
  it("shows player names without team colors or team dots", () => {
    render(
      <MatchListRow
        match={
          {
            id: "match-id",
            kind: "single",
            initiatedAt: "2026-07-31T12:00:00.000Z",
            status: "completed",
            score: { red: 2, blue: 1 },
            players: [
              { id: "red-player", name: "Jogador vermelho", team: "red" },
              { id: "blue-player", name: "Jogador azul", team: "blue" },
            ],
          } as never
        }
      />,
    );

    const playerBadges = screen.getByLabelText("Jogadores da partida");

    expect(screen.getByText("Jogador vermelho")).not.toBeNull();
    expect(screen.getByText("Jogador azul")).not.toBeNull();
    expect(playerBadges.querySelector("[aria-hidden='true']")).toBeNull();
    expect(playerBadges.querySelector(".text-red-200, .text-blue-200")).toBeNull();
  });
});
