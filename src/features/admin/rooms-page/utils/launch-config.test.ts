import { describe, expect, it } from "vitest";
import {
  getVersionOptions,
  readLaunchConfig,
  type WebRoomLaunchConfigField,
} from "./launch-config";

const fields: WebRoomLaunchConfigField[] = [
  {
    label: { value: "room.launch.field.room-name", label: "Nome" },
    category: "room",
    envVar: "ROOM_NAME",
    key: "roomName",
    required: true,
    secret: false,
    valueType: "string",
  },
  {
    label: { value: "room.launch.field.max-players", label: "Jogadores" },
    category: "room",
    envVar: "MAX_PLAYERS",
    key: "maxPlayers",
    required: true,
    secret: false,
    valueType: "number",
  },
  {
    label: { value: "room.launch.field.public-room", label: "Pública" },
    category: "room",
    envVar: "PUBLIC_ROOM",
    key: "publicRoom",
    required: false,
    secret: false,
    valueType: "boolean",
  },
  {
    label: { value: "room.launch.field.password", label: "Senha" },
    category: "room",
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

describe("getVersionOptions", () => {
  it("orders concrete versions semantically so the last option is the latest version", () => {
    const options = getVersionOptions(
      {
        versionsByProgramId: {
          program: {
            items: [{ version: "v1.0.72" }, { version: "v1.0.54" }, { version: "v1.0.9" }],
          },
        },
        aliasesByProgramId: {},
      } as never,
      "program",
    );

    expect(options.at(-1)).toEqual({ label: "v1.0.72", value: "v1.0.72" });
  });
});
