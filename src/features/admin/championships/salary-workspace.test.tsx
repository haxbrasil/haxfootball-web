import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TeamConfigurationMenu } from "./salary-workspace";

afterEach(cleanup);

describe("team configuration menu", () => {
  it("opens General Manager management after the menu dismisses", async () => {
    render(
      <TeamConfigurationMenu
        team={{ uuid: "team-1", name: "Equipe Aurora" } as never}
        participants={
          [
            {
              uuid: "participant-1",
              displayName: "Gabinho",
              membership: { role: "player" },
            },
          ] as never
        }
        onMoveRequest={vi.fn()}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Configurar equipe" });
    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
    await waitFor(() =>
      expect(screen.getByRole("menuitem", { name: "Gerenciar General Managers" })).toBeTruthy(),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Gerenciar General Managers" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "General Managers de Equipe Aurora" }),
      ).toBeTruthy(),
    );
  });
});
