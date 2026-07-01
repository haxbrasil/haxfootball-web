import { describe, expect, it } from "vitest";
import { serializeLaunchFields, type EditableLaunchField } from "./launch-fields";

function field(input: Partial<EditableLaunchField> = {}): EditableLaunchField {
  return {
    key: "tutorialLink",
    label: "room.launch.field.tutorial-link",
    category: "game",
    valueType: "string",
    required: false,
    defaultValue: "tutorial.bfl.haxbrasil.com",
    defaultEnabled: true,
    secret: false,
    envVar: "TUTORIAL_LINK",
    description: "",
    enumValues: "",
    minimum: "",
    maximum: "",
    requiredPermission: "",
    ...input,
  };
}

describe("serializeLaunchFields", () => {
  it("serializes typed default values and optional metadata", () => {
    const result = serializeLaunchFields([
      field({
        key: "maxPlayers",
        label: "room.launch.field.max-players",
        valueType: "number",
        defaultValue: "25",
        envVar: "MAX_PLAYERS",
        minimum: "1",
        maximum: "30",
      }),
      field({
        key: "noPlayer",
        label: "room.launch.field.no-player",
        valueType: "boolean",
        defaultValue: "true",
        envVar: "NO_PLAYER",
      }),
    ]);

    expect(result.errors).toEqual([]);
    expect(result.fields).toMatchObject([
      {
        key: "maxPlayers",
        defaultValue: 25,
        minimum: 1,
        maximum: 30,
      },
      {
        key: "noPlayer",
        defaultValue: true,
      },
    ]);
  });

  it("rejects duplicate keys and environment variables", () => {
    const result = serializeLaunchFields([
      field(),
      field({
        envVar: "TUTORIAL_LINK",
      }),
    ]);

    expect(result.errors).toContain("Campo 2: chave duplicada.");
    expect(result.errors).toContain("Campo 2: variável de ambiente duplicada.");
  });

  it("rejects enum values for non-string fields and invalid boolean defaults", () => {
    const result = serializeLaunchFields([
      field({
        valueType: "boolean",
        defaultValue: "yes",
        enumValues: "enabled\ndisabled",
      }),
    ]);

    expect(result.errors).toContain("Campo 1: enum só pode ser usado com campos string.");
    expect(result.errors).toContain("Campo 1: default booleano deve ser true ou false.");
  });
});
