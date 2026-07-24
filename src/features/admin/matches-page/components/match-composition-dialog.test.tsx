import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatchCompositionDialog } from "./match-composition-dialog";

vi.mock("@tanstack/react-start", () => ({
  useServerFn: () => vi.fn(),
}));

vi.mock("#/server/api/admin-match-functions", () => ({
  findMatchCompositionCandidateFn: vi.fn(),
  saveMatchCompositionFn: vi.fn(),
}));

Element.prototype.scrollIntoView = vi.fn();

const first = {
  kind: "single" as const,
  id: "match001",
  status: "completed" as const,
  initiatedAt: null,
  endedAt: "2026-07-24T20:00:00.000Z",
  score: { red: 7, blue: 35 },
  recording: null,
  gameMode: null,
  eventSchema: null,
  createdAt: "2026-07-24T19:00:00.000Z",
  updatedAt: "2026-07-24T20:00:00.000Z",
};

const second = {
  ...first,
  id: "match002",
  score: { red: 44, blue: 14 },
  createdAt: "2026-07-24T20:01:00.000Z",
  updatedAt: "2026-07-24T21:00:00.000Z",
};

describe("MatchCompositionDialog", () => {
  it("presents the first round as the reference and later rounds with a clear orientation control", () => {
    render(
      <MatchCompositionDialog
        open
        target={first}
        candidates={[second]}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText("Referência dos times")).toBeTruthy();
    expect(
      screen.getByText("Os lados deste tempo definem vermelho e azul na composição."),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Adicionar match002" }));

    expect(screen.getByText("Lados neste tempo")).toBeTruthy();
    expect(screen.getByText("O sistema compara o placar e os jogadores.")).toBeTruthy();
    const orientation = screen.getByRole("combobox", {
      name: "Orientação dos times em match002",
    });

    expect(orientation).toHaveProperty("textContent", "Detectar automaticamente");

    fireEvent.click(orientation);
    fireEvent.click(screen.getByRole("option", { name: "Lados invertidos" }));

    expect(screen.getByText("Na composição")).toBeTruthy();
    expect(orientation).toHaveProperty("textContent", "Lados invertidos");
  });
});
