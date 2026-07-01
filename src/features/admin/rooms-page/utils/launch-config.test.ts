import { describe, expect, it } from "vitest";
import {
  getDefaultVersionValue,
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
  it("orders concrete versions semantically with latest first", () => {
    const options = getVersionOptions(
      {
        versionsByProgramId: {
          program: {
            items: [{ version: "v1.0.8" }, { version: "v1.0.74" }, { version: "v1.0.9" }],
          },
        },
        aliasesByProgramId: {},
      } as never,
      "program",
    );

    expect(options.map((option) => option.value)).toEqual(["v1.0.74", "v1.0.9", "v1.0.8"]);
  });

  it("uses the latest concrete version as the default even when aliases exist", () => {
    const defaultVersion = getDefaultVersionValue(
      {
        versionsByProgramId: {
          program: {
            items: [{ version: "v1.0.8" }, { version: "v1.0.74" }],
          },
        },
        aliasesByProgramId: {
          program: {
            items: [{ alias: "stable", version: { version: "v1.0.8" } }],
          },
        },
      } as never,
      "program",
    );

    expect(defaultVersion).toBe("v1.0.74");
  });
});
