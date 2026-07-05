import { describe, expect, it } from "vitest";
import {
  extractGeoLaunchConfigFields,
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

const geoFields: WebRoomLaunchConfigField[] = [
  {
    label: { value: "room.launch.field.geo-code", label: "País" },
    category: "room",
    envVar: "GEO_CODE",
    key: "geoCode",
    required: false,
    secret: false,
    valueType: "string",
  },
  {
    label: { value: "room.launch.field.geo-latitude", label: "Latitude" },
    category: "room",
    envVar: "GEO_LAT",
    key: "geoLat",
    required: false,
    secret: false,
    valueType: "number",
  },
  {
    label: { value: "room.launch.field.geo-longitude", label: "Longitude" },
    category: "room",
    envVar: "GEO_LON",
    key: "geoLon",
    required: false,
    secret: false,
    valueType: "number",
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

  it("reads geo values from hidden inputs", () => {
    const formData = new FormData();

    formData.set("launchConfig.geoCode", "BR");
    formData.set("launchConfig.geoLat", "-23.55");
    formData.set("launchConfig.geoLon", "-46.63");

    expect(readLaunchConfig(formData, geoFields)).toEqual({
      geoCode: "BR",
      geoLat: -23.55,
      geoLon: -46.63,
    });
  });
});

describe("extractGeoLaunchConfigFields", () => {
  it("extracts geo fields when all three fields are present", () => {
    const result = extractGeoLaunchConfigFields([...fields, ...geoFields]);

    expect(result.geoFields).toEqual({
      geoCode: geoFields[0],
      geoLat: geoFields[1],
      geoLon: geoFields[2],
    });
    expect(result.fieldsWithoutGeo.map((field) => field.key)).not.toContain("geoCode");
    expect(result.fieldsWithoutGeo.map((field) => field.key)).not.toContain("geoLat");
    expect(result.fieldsWithoutGeo.map((field) => field.key)).not.toContain("geoLon");
  });

  it("leaves fields unchanged when a geo field is missing", () => {
    const incompleteFields = [...fields, geoFields[0], geoFields[1]];
    const result = extractGeoLaunchConfigFields(incompleteFields);

    expect(result.geoFields).toBeNull();
    expect(result.fieldsWithoutGeo).toBe(incompleteFields);
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
