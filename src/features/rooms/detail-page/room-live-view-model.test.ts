import type { PublicLiveRoom } from "#/lib/rooms/public-room";
import { describe, expect, it } from "vitest";
import {
  groupLiveRoomPlayers,
  roomGameStatusLabel,
  roomLiveFreshness,
  roomLiveFreshnessLabel,
} from "./room-live-view-model";

const observedAt = "2026-07-25T12:00:00.000Z";

const liveRoom: PublicLiveRoom = {
  connected: true,
  lastSeenAt: observedAt,
  gameStatus: "running",
  score: {
    red: 14,
    blue: 7,
  },
  players: [
    {
      roomPlayerId: 1,
      name: "Red player",
      team: "red",
    },
    {
      roomPlayerId: 2,
      name: "Blue player",
      team: "blue",
    },
    {
      roomPlayerId: 3,
      name: "Spectator",
      team: "spectators",
    },
  ],
};

describe("room live view model", () => {
  it("distinguishes fresh, delayed, disconnected and unavailable telemetry", () => {
    expect(roomLiveFreshness(liveRoom, Date.parse(observedAt) + 15_000)).toBe("live");
    expect(roomLiveFreshness(liveRoom, Date.parse(observedAt) + 15_001)).toBe("delayed");
    expect(roomLiveFreshness({ ...liveRoom, connected: false })).toBe("offline");
    expect(roomLiveFreshness(null)).toBe("unavailable");
  });

  it("provides concise Portuguese freshness labels", () => {
    expect(roomLiveFreshnessLabel("live")).toBe("Ao vivo");
    expect(roomLiveFreshnessLabel("delayed")).toBe("Dados atrasados");
    expect(roomLiveFreshnessLabel("offline")).toBe("Atualização interrompida");
    expect(roomLiveFreshnessLabel("unavailable")).toBe("Sem dados ao vivo");
  });

  it("translates native game states without exposing internal values", () => {
    expect(roomGameStatusLabel(liveRoom)).toBe("Jogo em andamento");
    expect(roomGameStatusLabel({ ...liveRoom, gameStatus: "paused" })).toBe("Jogo pausado");
    expect(roomGameStatusLabel({ ...liveRoom, gameStatus: "resuming" })).toBe("Retomando");
    expect(roomGameStatusLabel({ ...liveRoom, gameStatus: "stopped" })).toBe("Aguardando partida");
    expect(roomGameStatusLabel(null)).toBe("Informações ao vivo indisponíveis");
  });

  it("groups players explicitly by their live team", () => {
    const rosters = groupLiveRoomPlayers(liveRoom.players);

    expect(rosters.red.map((player) => player.name)).toEqual(["Red player"]);
    expect(rosters.blue.map((player) => player.name)).toEqual(["Blue player"]);
    expect(rosters.spectators.map((player) => player.name)).toEqual(["Spectator"]);
  });
});
