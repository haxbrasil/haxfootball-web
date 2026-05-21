import { describe, expect, it } from "vitest";
import type { RoomLaunchConfigField } from "@haxbrasil/haxfootball-api-sdk";
import { readLaunchConfig } from "./launch-config";

const fields: RoomLaunchConfigField[] = [
  {
    displayName: "Nome",
    envVar: "ROOM_NAME",
    key: "roomName",
    required: true,
    secret: false,
    valueType: "string",
  },
  {
    displayName: "Jogadores",
    envVar: "MAX_PLAYERS",
    key: "maxPlayers",
    required: true,
    secret: false,
    valueType: "number",
  },
  {
    displayName: "Pública",
    envVar: "PUBLIC_ROOM",
    key: "publicRoom",
    required: false,
    secret: false,
    valueType: "boolean",
  },
  {
    displayName: "Senha",
    envVar: "ROOM_PASSWORD",
    key: "password",
    required: false,
    secret: true,
    valueType: "string",
  },
];

describe("readLaunchConfig", () => {
  it("coerces launch config fields from form data", () => {
    const formData = new FormData();

    formData.set("launchConfig.roomName", "BFL 01");
    formData.set("launchConfig.maxPlayers", "20");
    formData.set("launchConfig.publicRoom", "true");

    expect(readLaunchConfig(formData, fields)).toEqual({
      roomName: "BFL 01",
      maxPlayers: 20,
      publicRoom: true,
    });
  });

  it("omits optional empty strings and uses null for required empty fields", () => {
    const formData = new FormData();

    formData.set("launchConfig.roomName", "");
    formData.set("launchConfig.password", "");

    expect(readLaunchConfig(formData, fields)).toEqual({
      maxPlayers: null,
      roomName: null,
      publicRoom: false,
    });
  });
});
