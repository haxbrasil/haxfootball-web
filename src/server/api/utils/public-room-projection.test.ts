import type { GetRoomQuery, Room } from "@haxbrasil/haxfootball-api-sdk";
import { describe, expect, it } from "vitest";
import {
  isPubliclyAvailableRoom,
  readRoomChampionshipContextUuid,
  toPublicRoomChampionship,
  toPublicLiveRoom,
  toPublicRoomBase,
  toPublicRoomSummary,
} from "./public-room-projection";

describe("public room projection", () => {
  it("only exposes the fields needed by the public room list", () => {
    const room: Room & { state: "running" } = {
      id: "45dfdb1f-388c-4544-a785-493631941e34",
      program: {
        id: "64fa75db-608c-4616-bb03-a0644b9ca06f",
        name: "haxfootball",
        title: "HaxFootball",
      },
      version: {
        id: "47bc658d-1f19-447e-9aa4-5ec31479ecb0",
        version: "v1.0.83",
      },
      state: "running",
      roomLink: "https://www.haxball.com/play?c=public-code",
      launchConfig: {
        roomName: "BFL | Sala 01",
        maxPlayers: 30,
        token: "must-not-be-public",
      },
      public: false,
      proxyEndpoint: {
        displayName: "Oracle São Paulo",
        id: "17226eae-d169-4b79-ad3a-c965588f17da",
        key: "oracle",
        outboundIp: "192.0.2.10",
        proxyUrl: "http://internal-proxy.example",
      },
      createdAt: "2026-07-25T18:00:00.000Z",
      updatedAt: "2026-07-25T18:01:00.000Z",
      closedAt: null,
      failedAt: null,
      failureReason: null,
    };

    expect(isPubliclyAvailableRoom(room)).toBe(true);
    expect(toPublicRoomSummary(room)).toEqual({
      id: "45dfdb1f-388c-4544-a785-493631941e34",
      name: "BFL | Sala 01",
      state: "running",
      roomLink: "https://www.haxball.com/play?c=public-code",
      version: "v1.0.83",
    });
  });

  it("adds capacity and creation time without exposing launch or proxy configuration", () => {
    const room: Room & { state: "running" } = {
      id: "45dfdb1f-388c-4544-a785-493631941e34",
      program: {
        id: "64fa75db-608c-4616-bb03-a0644b9ca06f",
        name: "haxfootball",
        title: "HaxFootball",
      },
      version: {
        id: "47bc658d-1f19-447e-9aa4-5ec31479ecb0",
        version: "v1.0.83",
      },
      state: "running",
      roomLink: "https://www.haxball.com/play?c=public-code",
      launchConfig: {
        roomName: "BFL | Sala 01",
        maxPlayers: 30,
        token: "must-not-be-public",
      },
      public: false,
      proxyEndpoint: {
        displayName: "Oracle São Paulo",
        id: "17226eae-d169-4b79-ad3a-c965588f17da",
        key: "oracle",
        outboundIp: "192.0.2.10",
        proxyUrl: "http://internal-proxy.example",
      },
      createdAt: "2026-07-25T18:00:00.000Z",
      updatedAt: "2026-07-25T18:01:00.000Z",
      closedAt: null,
      failedAt: null,
      failureReason: null,
    };

    expect(toPublicRoomBase(room)).toEqual({
      id: "45dfdb1f-388c-4544-a785-493631941e34",
      name: "BFL | Sala 01",
      state: "running",
      roomLink: "https://www.haxball.com/play?c=public-code",
      version: "v1.0.83",
      capacity: 30,
      createdAt: "2026-07-25T18:00:00.000Z",
      championship: null,
    });
  });

  it("accepts only a well-formed championship context UUID", () => {
    const uuid = "10000000-0000-4000-8000-000000000001";

    expect(readRoomChampionshipContextUuid({ championshipContextUuid: uuid })).toBe(uuid);
    expect(readRoomChampionshipContextUuid({ championshipContextUuid: "copa-bfl" })).toBeNull();
    expect(readRoomChampionshipContextUuid({})).toBeNull();
  });

  it("publishes room context only for public championships", () => {
    const championship = {
      uuid: "10000000-0000-4000-8000-000000000001",
      slug: "copa-bfl-2026",
      name: "Copa BFL",
      editionLabel: "2026",
    };

    expect(toPublicRoomChampionship({ ...championship, visibility: "public" })).toEqual(
      championship,
    );
    expect(toPublicRoomChampionship({ ...championship, visibility: "private" })).toBeNull();
  });

  it("does not expose operational player fields or extension state", () => {
    const liveRoom: NonNullable<GetRoomQuery["liveRoom"]> = {
      id: "45dfdb1f-388c-4544-a785-493631941e34",
      connected: true,
      revision: 27,
      lastSeenAt: "2026-07-25T18:02:00.000Z",
      room: {
        name: "BFL | Sala 01",
        teamsLocked: true,
        gameStatus: "RUNNING",
        scores: {
          red: 14,
          blue: 7,
        },
      },
      players: {
        nodes: [
          {
            roomPlayerId: 4,
            name: "Quarterback",
            team: "RED",
            admin: true,
            avatar: "QB",
            desynced: false,
            sessionKind: "SIGNED_IN",
            playable: true,
            playBlockedReason: null,
          },
          {
            roomPlayerId: 8,
            name: "Spectator",
            team: "SPECTATORS",
            admin: false,
            avatar: null,
            desynced: true,
            sessionKind: null,
            playable: false,
            playBlockedReason: "desynced",
          },
        ],
      },
      stateDocuments: [
        {
          namespace: "haxfootball",
          name: "game",
          version: 1,
          revision: 12,
          updatedAt: "2026-07-25T18:02:00.000Z",
          payload: {
            secretDiagnostic: true,
          },
        },
      ],
      stateFacts: [
        {
          namespace: "runtime",
          key: "diagnostic",
          type: "STRING",
          stringValue: "private",
          numberValue: null,
          booleanValue: null,
        },
      ],
    };

    expect(toPublicLiveRoom(liveRoom)).toEqual({
      connected: true,
      lastSeenAt: "2026-07-25T18:02:00.000Z",
      gameStatus: "running",
      score: {
        red: 14,
        blue: 7,
      },
      players: [
        {
          roomPlayerId: 4,
          name: "Quarterback",
          team: "red",
        },
        {
          roomPlayerId: 8,
          name: "Spectator",
          team: "spectators",
        },
      ],
    });
  });

  it("rejects closed rooms from public routes", () => {
    const room: Room = {
      id: "45dfdb1f-388c-4544-a785-493631941e34",
      program: {
        id: "64fa75db-608c-4616-bb03-a0644b9ca06f",
        name: "haxfootball",
        title: "HaxFootball",
      },
      version: {
        id: "47bc658d-1f19-447e-9aa4-5ec31479ecb0",
        version: "v1.0.83",
      },
      state: "closed",
      roomLink: null,
      launchConfig: {},
      public: false,
      proxyEndpoint: null,
      createdAt: "2026-07-25T18:00:00.000Z",
      updatedAt: "2026-07-25T18:10:00.000Z",
      closedAt: "2026-07-25T18:10:00.000Z",
      failedAt: null,
      failureReason: null,
    };

    expect(isPubliclyAvailableRoom(room)).toBe(false);
  });
});
