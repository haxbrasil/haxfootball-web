import type { Room } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import { roomDisplayName } from "./room-display-name";

const room: Room = {
  id: "45dfdb1f-388c-4544-a785-493631941e34",
  program: {
    id: "64fa75db-608c-4616-bb03-a0644b9ca06f",
    name: "haxfootball",
    title: "HaxFootball",
  },
  version: {
    id: "47bc658d-1f19-447e-9aa4-5ec31479ecb0",
    version: "v1.0.82",
  },
  state: "running",
  roomLink: "https://www.haxball.com/play?c=example",
  launchConfig: {
    roomName: "BFL | Sala 01",
  },
  public: true,
  proxyEndpoint: null,
  createdAt: "2026-07-24T20:00:00.000Z",
  updatedAt: "2026-07-24T20:01:00.000Z",
  closedAt: null,
  failedAt: null,
  failureReason: null,
};

describe("roomDisplayName", () => {
  it("uses the configured HaxBall room name", () => {
    expect(roomDisplayName(room)).toBe("BFL | Sala 01");
  });

  it("falls back to the program title when the room has no configured name", () => {
    const roomWithoutName: Room = {
      ...room,
      launchConfig: {
        roomName: "   ",
      },
    };

    expect(roomDisplayName(roomWithoutName)).toBe("HaxFootball");
  });

  it("falls back to the program identifier when its title is unavailable", () => {
    const roomWithoutNameOrProgramTitle: Room = {
      ...room,
      program: {
        ...room.program,
        title: null,
      },
      launchConfig: {
        roomName: null,
      },
    };

    expect(roomDisplayName(roomWithoutNameOrProgramTitle)).toBe("haxfootball");
  });
});
