import { describe, expect, it } from "vitest";
import { formatElapsedSeconds, formatRoomEventLabel, formatTeam } from "./match-labels";

describe("match labels", () => {
  it("formats teams", () => {
    expect(formatTeam("red")).toBe("Vermelho");
    expect(formatTeam("blue")).toBe("Azul");
  });

  it("formats elapsed seconds", () => {
    expect(formatElapsedSeconds(75)).toBe("1min 15s");
  });

  it("formats room event labels", () => {
    expect(formatRoomEventLabel("player_join")).toBe("Entrou na sala");
  });
});
