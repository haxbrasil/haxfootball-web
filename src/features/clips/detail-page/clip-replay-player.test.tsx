import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { ClipReplayPlayer } from "./clip-replay-player";

let mountedPlayers = 0;

vi.mock("#/features/matches/detail-page/components/replay-player", () => ({
  default: ({ autoPlay, loop }: { autoPlay?: boolean; loop?: boolean }) => {
    const mount = useRef(++mountedPlayers).current;
    return (
      <button
        type="button"
        aria-label="Reproduzir replay"
        data-testid="replay-player"
        data-autoplay={autoPlay ? "true" : "false"}
        data-loop={loop ? "true" : "false"}
        data-mount={mount}
      />
    );
  },
}));

describe("ClipReplayPlayer", () => {
  it("starts automatically and keeps the selected clip in a native loop", async () => {
    mountedPlayers = 0;
    render(
      <ClipReplayPlayer
        source="https://recs.example/clip.hbr2"
        frameWindow={{ startFrame: 100, endFrame: 200 }}
      />,
    );

    const player = await screen.findByTestId("replay-player");
    expect(player.getAttribute("data-autoplay")).toBe("true");
    expect(player.getAttribute("data-loop")).toBe("true");
    expect(player.getAttribute("data-mount")).toBe("1");

    fireEvent.click(player);

    expect((await screen.findByTestId("replay-player")).getAttribute("data-mount")).toBe("1");
  });
});
