import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";

describe("EmptyLeagueState", () => {
  it("renders intentional empty-state copy", () => {
    render(<EmptyLeagueState title="Nenhuma partida" body="As partidas aparecem aqui." />);

    expect(screen.getByText("Nenhuma partida")).not.toBeNull();
    expect(screen.getByText("As partidas aparecem aqui.")).not.toBeNull();
  });
});
