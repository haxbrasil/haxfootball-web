import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { ClipCreatorDialog } from "./clip-editor-dialog";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => async () => undefined,
}));

vi.mock("#/server/api/functions", () => ({
  createClipFn: vi.fn(),
  getClipConfigurationFn: vi.fn().mockResolvedValue({
    maxDurationSeconds: 30,
    maxDurationFrames: 1800,
  }),
}));

vi.mock("@haxbrasil/haxfootball-replay", () => ({
  HaxFootballReplayPlayer: ({
    onReady,
    onFrameChange,
    seekFrame,
  }: {
    onReady?: (info: { totalFrames: number }) => void;
    onFrameChange?: (frame: number) => void;
    seekFrame?: number;
  }) => {
    useEffect(() => {
      onReady?.({ totalFrames: 600 });
    }, [onReady]);
    useEffect(() => {
      onFrameChange?.(seekFrame ?? 0);
    }, [onFrameChange, seekFrame]);
    return <div data-testid="clip-replay" />;
  },
}));

describe("ClipCreatorDialog", () => {
  it("opens as an editor and exposes the selection workflow", async () => {
    render(
      <ClipCreatorDialog
        recording={{
          id: "recording-1",
          label: "Final · 1º tempo",
          format: "hbr2",
          url: "https://recs.example/final.hbr2",
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /criar clipe/i }));

    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Criar clipe" })).toBeTruthy();
    expect(screen.getByText("Janela de corte")).toBeTruthy();
    expect(screen.getByLabelText("Início do clipe")).toBeTruthy();
    expect(screen.getByLabelText("Fim do clipe")).toBeTruthy();

    await waitFor(() => expect(screen.getByText("10s selecionados")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Prévia da seleção" }));
    expect(screen.getByRole("button", { name: "Parar prévia" })).toBeTruthy();
  });
});
