import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchReplayPanel } from "./match-replay-panel";

vi.mock("@haxbrasil/haxfootball-replay", () => ({
  HaxFootballReplayPlayer: ({ source }: { source: string }) => (
    <div data-testid="replay-player">{source}</div>
  ),
}));

describe("MatchReplayPanel", () => {
  it("does not render without a recording", () => {
    const { container } = render(
      <MatchReplayPanel match={{ kind: "single", id: "match-1", recording: null } as never} />,
    );
    expect(container.childElementCount).toBe(0);
  });

  it("changes the composed-match recording and download together", async () => {
    render(
      <MatchReplayPanel
        match={
          {
            kind: "composed",
            rounds: [
              {
                kind: "sequential",
                number: 1,
                matchId: "round-1",
                match: { recording: { url: "https://recs.example/1.hbr2" } },
              },
              {
                kind: "extra-time",
                matchId: "extra-time",
                match: { recording: { url: "https://recs.example/extra.hbr2" } },
              },
            ],
          } as never
        }
      />,
    );

    expect((await screen.findByTestId("replay-player")).textContent).toBe(
      "https://recs.example/1.hbr2",
    );

    fireEvent.change(screen.getByLabelText("Tempo da gravação"), {
      target: { value: "extra-time" },
    });

    expect((await screen.findByTestId("replay-player")).textContent).toBe(
      "https://recs.example/extra.hbr2",
    );
    expect(screen.getByRole("link", { name: "Baixar .hbr2" }).getAttribute("href")).toBe(
      "https://recs.example/extra.hbr2",
    );
  });
});
