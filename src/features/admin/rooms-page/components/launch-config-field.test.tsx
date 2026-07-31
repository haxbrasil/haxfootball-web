import { cleanup, render, screen } from "@testing-library/react";
import type { Championship } from "@haxbrasil/haxfootball-api-sdk";
import { afterEach, describe, expect, it } from "vitest";
import type { WebRoomLaunchConfigField } from "../utils/launch-config";
import { LaunchConfigField } from "./launch-config-field";

const field: WebRoomLaunchConfigField = {
  label: {
    value: "room.launch.field.championship-context",
    label: "Campeonato",
  },
  description: {
    value: "room.launch.field.championship-context.description",
    label: "Ajuda a localizar partidas registradas; não vincula resultados.",
  },
  category: "room",
  envVar: "CHAMPIONSHIP_CONTEXT_UUID",
  key: "championshipContextUuid",
  required: false,
  secret: false,
  valueType: "string",
};

afterEach(cleanup);

describe("championship room launch context", () => {
  it("offers setup and active championships without implying automatic matching", () => {
    render(
      <LaunchConfigField
        field={field}
        championships={[
          championship("setup", "Copa em preparação"),
          championship("active", "Copa em andamento"),
          championship("completed", "Copa encerrada"),
        ]}
      />,
    );

    const select = screen.getByRole("combobox", { name: "Campeonato" });
    const options = Array.from(select.querySelectorAll("option")).map((option) => option.text);

    expect(options).toEqual([
      "Sala comum",
      "Copa em preparação · 2026",
      "Copa em andamento · 2026",
    ]);
    expect(
      screen.getByText("Ajuda a localizar partidas registradas; não vincula resultados."),
    ).toBeTruthy();
  });
});

function championship(lifecycle: Championship["lifecycle"], name: string): Championship {
  return {
    uuid: crypto.randomUUID(),
    lifecycle,
    name,
    editionLabel: "2026",
  } as Championship;
}
