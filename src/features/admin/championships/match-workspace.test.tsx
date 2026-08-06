import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ChampionshipEvidenceCandidatesData,
  ChampionshipMatchOperationsData,
  ChampionshipWorkspaceData,
} from "#/server/api/championship-api";

const server = vi.hoisted(() => ({
  attach: vi.fn(),
  list: vi.fn(),
}));

vi.mock("#/server/api/championship-match-functions", () => ({
  attachChampionshipMatchEvidenceFn: server.attach,
  detachChampionshipMatchEvidenceFn: vi.fn(),
  getChampionshipMatchOperationsFn: vi.fn(),
  listChampionshipEvidenceCandidatesFn: server.list,
  previewChampionshipMatchSettlementFn: vi.fn(),
  settleChampionshipMatchFn: vi.fn(),
  updateChampionshipMatchAttributionsFn: vi.fn(),
}));

vi.mock("@haxbrasil/haxfootball-replay", () => ({
  HaxFootballReplayPlayer: () => <div>Replay</div>,
}));

import { MatchWorkspace } from "./match-workspace";

globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("championship match workspace", () => {
  it("renders an immediately usable manual settlement when evidence is absent", () => {
    render(
      <MatchWorkspace
        data={workspace()}
        selectedMatchUuid={matchUuid}
        onSelectMatch={vi.fn()}
        initialOperations={operations()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Registrar resultado" })).toBeTruthy();
    expect((screen.getByLabelText("Jogado lado A") as HTMLInputElement).value).toBe("0");
    expect((screen.getByLabelText("Jogado lado B") as HTMLInputElement).value).toBe("0");
    expect(screen.getByText("Nenhuma partida registrada vinculada")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Revisar e registrar" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  it("shows a redirected appearance as an effective attribution", () => {
    const targetUuid = "40000000-0000-4000-8000-000000000001";
    const data = {
      ...workspace(),
      participants: {
        items: [{ uuid: targetUuid, displayName: "Quezin", status: "active" }],
      },
    } as unknown as ChampionshipWorkspaceData;

    render(
      <MatchWorkspace
        data={data}
        selectedMatchUuid={matchUuid}
        onSelectMatch={vi.fn()}
        initialOperations={operations({
          appearances: {
            items: [
              {
                sourcePlayerId: "queymar",
                sourceAccountUuid: null,
                displayName: "QUEYMAR",
                observedSide: "a",
                playingTimeSeconds: 120,
                registered: false,
                onRoster: false,
                findings: ["unregistered", "off-roster"],
                attribution: {
                  mode: "redirect",
                  targetParticipantUuid: targetUuid,
                  targetDisplayName: "Quezin",
                  reason: null,
                },
              },
            ],
            totalCount: 1,
            truncated: false,
          },
        })}
      />,
    );

    expect(screen.getAllByText("Redirecionado para Quezin").length).toBeGreaterThan(0);
    expect(screen.queryByText("Conta não registrada")).toBeNull();
    expect(screen.queryByText("Fora do elenco")).toBeNull();
  });

  it("exposes cumulative halves as individual period scores", () => {
    const withEvidence = operations({
      evidence: {
        id: "c23456789",
        kind: "composed",
        scoreMode: "cumulative",
        status: "completed",
        eligible: true,
        quality: "recovered",
        score: { red: 4, blue: 3 },
        claim: null,
        rounds: [round("ab234567", 1, 2, 1), round("bc234567", 2, 4, 3)],
      },
    });

    render(
      <MatchWorkspace
        data={workspace()}
        selectedMatchUuid={matchUuid}
        onSelectMatch={vi.fn()}
        initialOperations={withEvidence}
      />,
    );

    expect(screen.getByRole("tab", { name: "1º tempo: 2 – 1" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "2º tempo: 2 – 2" })).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Revisar e registrar" }).hasAttribute("disabled"),
    ).toBe(true);

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /qualidade da evidência revisada/i,
      }),
    );

    expect(
      screen.getByRole("button", { name: "Revisar e registrar" }).hasAttribute("disabled"),
    ).toBe(false);
  });

  it("composes independent room games and attaches them from the cockpit", async () => {
    server.attach.mockResolvedValue({ ok: true, data: operations() });

    render(
      <MatchWorkspace
        data={workspace()}
        selectedMatchUuid={matchUuid}
        onSelectMatch={vi.fn()}
        initialOperations={operations()}
        initialCandidates={candidates()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buscar evidência" }));
    expect(screen.getByText("Sala deste campeonato")).toBeTruthy();
    expect(screen.getByText("Outra competição")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Adicionar tempo" })[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: "Adicionar tempo" })[0]!);

    expect(screen.getByRole("heading", { name: "Composição de tempos" })).toBeTruthy();
    expect(screen.getByText("Placar final · último tempo")).toBeTruthy();
    expect(screen.getByText("4 – 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Compor e vincular" }));

    await waitFor(() =>
      expect(server.attach).toHaveBeenCalledWith({
        data: expect.objectContaining({
          championshipUuid,
          championshipMatchUuid: matchUuid,
          composition: {
            rounds: [
              {
                kind: "sequential",
                number: 1,
                matchId: "aa234567",
                orientation: "aligned",
              },
              {
                kind: "sequential",
                number: 2,
                matchId: "bb234567",
                orientation: "swapped",
              },
            ],
          },
        }),
      }),
    );
  });

  it("uses the roster-backed inverted orientation recommendation when attaching evidence", async () => {
    server.attach.mockResolvedValue({ ok: true, data: operations() });
    const recommended = candidates();
    recommended.items[0]!.orientationRecommendation = {
      orientation: "swapped",
      matchedPlayers: 5,
      opposingPlayers: 0,
    };

    render(
      <MatchWorkspace
        data={workspace()}
        selectedMatchUuid={matchUuid}
        onSelectMatch={vi.fn()}
        initialOperations={operations()}
        initialCandidates={recommended}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buscar evidência" }));
    expect(screen.getByText("Usará lados invertidos")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Vincular" })[0]!);

    await waitFor(() =>
      expect(server.attach).toHaveBeenCalledWith({
        data: expect.objectContaining({ logicalMatchId: "aa234567", orientation: "swapped" }),
      }),
    );
  });

  it("uses the first selected round's roster-backed orientation for a composition", async () => {
    server.attach.mockResolvedValue({ ok: true, data: operations() });
    const recommended = candidates();
    recommended.items[0]!.orientationRecommendation = {
      orientation: "swapped",
      matchedPlayers: 5,
      opposingPlayers: 0,
    };

    render(
      <MatchWorkspace
        data={workspace()}
        selectedMatchUuid={matchUuid}
        onSelectMatch={vi.fn()}
        initialOperations={operations()}
        initialCandidates={recommended}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Buscar evidência" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Adicionar tempo" })[0]!);
    fireEvent.click(screen.getAllByRole("button", { name: "Adicionar tempo" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Compor e vincular" }));

    await waitFor(() =>
      expect(server.attach).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orientation: "swapped",
          composition: expect.any(Object),
        }),
      }),
    );
  });
});

const championshipUuid = "10000000-0000-4000-8000-000000000001";
const matchUuid = "30000000-0000-4000-8000-000000000001";

function workspace(): ChampionshipWorkspaceData {
  return {
    championship: { uuid: championshipUuid },
    participants: { items: [], page: { limit: 100, nextCursor: null } },
    format: {
      matches: {
        items: [
          {
            uuid: matchUuid,
            label: "Final",
            sideA: { team: { name: "Aurora", abbreviation: "AUR" } },
            sideB: { team: { name: "Carbono", abbreviation: "CAR" } },
            evidenceRevision: 0,
            resultRevision: 0,
          },
        ],
      },
    },
  } as unknown as ChampionshipWorkspaceData;
}

function operations(
  overrides: Partial<ChampionshipMatchOperationsData> = {},
): ChampionshipMatchOperationsData {
  return {
    championshipUuid,
    championshipRevision: 1,
    match: {
      uuid: matchUuid,
      label: "Final",
      sideA: {
        uuid: "20000000-0000-4000-8000-000000000001",
        name: "Aurora",
        abbreviation: "AUR",
        colors: ["#34d399"],
      },
      sideB: {
        uuid: "20000000-0000-4000-8000-000000000002",
        name: "Carbono",
        abbreviation: "CAR",
        colors: ["#fb7185"],
      },
      scheduledAt: null,
      scheduleStatus: "unscheduled",
      expectedProgram: null,
      evidenceRevision: 0,
      resultRevision: 0,
      scheduleRevision: 0,
      revision: 1,
    },
    evidence: null,
    evidenceOrientation: null,
    evidenceNote: null,
    appearances: { items: [], totalCount: 0, truncated: false },
    result: null,
    resultHistory: { items: [], totalCount: 0, truncated: false },
    ...overrides,
  };
}

function round(matchId: string, number: number, red: number, blue: number) {
  return {
    matchId,
    kind: "sequential" as const,
    number,
    position: number,
    orientation: number === 1 ? ("aligned" as const) : ("swapped" as const),
    status: "completed" as const,
    eligible: true,
    quality: number === 1 ? ("complete" as const) : ("recovered" as const),
    completionReason: number === 1 ? ("normal" as const) : ("room-process-exit" as const),
    initiatedAt: null,
    endedAt: null,
    elapsedSeconds: 600,
    lastCheckpointAt: null,
    rawScore: { red, blue },
    normalizedScore: { red, blue },
    recording: null,
    provenance: null,
    participants: { items: [], totalCount: 0, truncated: false },
    events: { items: [], totalCount: 0, truncated: false },
  };
}

function candidates(): ChampionshipEvidenceCandidatesData {
  return {
    items: [
      evidenceCandidate("aa234567", 3, 1, "matched"),
      evidenceCandidate("bb234567", 2, 4, "other"),
    ],
    nextCursor: null,
    totalInspected: 2,
  } as ChampionshipEvidenceCandidatesData;
}

function evidenceCandidate(
  id: string,
  red: number,
  blue: number,
  championshipContext: "matched" | "other" | "untagged",
) {
  return {
    expectedProgram: null,
    programCompatible: true,
    orientationRecommendation: null,
    championshipContext,
    alreadyClaimed: false,
    evidence: {
      id,
      kind: "single",
      scoreMode: "per-game",
      status: "completed",
      eligible: true,
      quality: "complete",
      score: { red, blue },
      claim: null,
      rounds: [round(id, 1, red, blue)],
    },
  };
}
