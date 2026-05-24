import { describe, expect, it } from "vitest";
import { createHaxBallReplayUrl } from "./haxball-replay-url";

describe("createHaxBallReplayUrl", () => {
  it("wraps a recording URL in the official HaxBall replay page", () => {
    expect(createHaxBallReplayUrl("https://recs.bfl.haxbrasil.com/94974b6.hbr2")).toBe(
      "https://www.haxball.com/replay?v=3#https://recs.bfl.haxbrasil.com/94974b6.hbr2",
    );
  });
});
