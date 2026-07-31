import type { Meta, StoryObj } from "@storybook/react-vite";
import type {
  ChampionshipMatchOperationsData,
  ChampionshipWorkspaceData,
} from "#/server/api/championship-api";
import { MatchWorkspace } from "./match-workspace";

const championshipUuid = "10000000-0000-4000-8000-000000000001";
const matchUuid = "30000000-0000-4000-8000-000000000001";

const meta = {
  title: "Championships/Match cockpit",
  component: MatchWorkspace,
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
  },
  decorators: [
    (Story) => (
      <main className="min-h-screen bg-background text-foreground">
        <div className="border-b px-5 py-4">
          <div className="text-xs font-semibold uppercase text-emerald-300">Copa BFL 2026</div>
          <h1 className="mt-1 text-xl font-semibold">Operação dos jogos</h1>
        </div>
        <div className="px-4 py-5 sm:px-6">
          <Story />
        </div>
      </main>
    ),
  ],
} satisfies Meta<typeof MatchWorkspace>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RecoveredEvidenceAndCorrection: Story = {
  args: {
    data: workspaceFixture(),
    selectedMatchUuid: matchUuid,
    onSelectMatch: () => undefined,
    initialOperations: operationsFixture(),
  },
};

export const MobileReview: Story = {
  args: {
    data: workspaceFixture(),
    selectedMatchUuid: matchUuid,
    onSelectMatch: () => undefined,
    initialOperations: operationsFixture(),
  },
  parameters: {
    viewport: { defaultViewport: "mobile2" },
  },
};

function workspaceFixture(): ChampionshipWorkspaceData {
  const teams = [
    team("20000000-0000-4000-8000-000000000001", "Aurora", "AUR", ["#34d399", "#0f172a"]),
    team("20000000-0000-4000-8000-000000000002", "Carbono", "CAR", ["#fb7185", "#f8fafc"]),
    team("20000000-0000-4000-8000-000000000003", "Dínamo", "DIN", ["#facc15", "#2563eb"]),
    team("20000000-0000-4000-8000-000000000004", "Horizonte", "HOR", ["#22d3ee", "#f59e0b"]),
  ];
  const matches = [
    formatMatch(matchUuid, "Semifinal 1", teams[0], teams[1], 1, 1, 1),
    formatMatch("30000000-0000-4000-8000-000000000002", "Semifinal 2", teams[2], teams[3], 0, 0, 2),
    formatMatch("30000000-0000-4000-8000-000000000003", "Grande final", null, null, 0, 0, 3),
  ];

  return {
    championship: {
      uuid: championshipUuid,
      revision: 18,
      name: "Copa BFL 2026",
    },
    participants: {
      items: [
        {
          uuid: "90000000-0000-4000-8000-000000000001",
          displayName: "gabinho",
          status: "active",
        },
        {
          uuid: "90000000-0000-4000-8000-000000000002",
          displayName: "Digo0109",
          status: "active",
        },
      ],
      page: { limit: 100, nextCursor: null },
    },
    format: {
      matches: { items: matches, totalCount: 3, truncated: false },
    },
  } as unknown as ChampionshipWorkspaceData;
}

function operationsFixture(): ChampionshipMatchOperationsData {
  const firstRound = round(
    "ab234567",
    1,
    { red: 2, blue: 1 },
    "complete",
    "normal",
    "2026-08-08T21:10:00.000Z",
  );
  const secondRound = round(
    "bc234567",
    2,
    { red: 3, blue: 3 },
    "recovered",
    "room-process-exit",
    "2026-08-08T21:22:00.000Z",
  );

  return {
    championshipUuid,
    championshipRevision: 18,
    match: {
      uuid: matchUuid,
      label: "Semifinal 1",
      sideA: reference("20000000-0000-4000-8000-000000000001", "Aurora", "AUR", [
        "#34d399",
        "#0f172a",
      ]),
      sideB: reference("20000000-0000-4000-8000-000000000002", "Carbono", "CAR", [
        "#fb7185",
        "#f8fafc",
      ]),
      expectedProgram: {
        uuid: "70000000-0000-4000-8000-000000000001",
        name: "HaxFootball atual",
      },
      scheduledAt: "2026-08-08T21:00:00.000Z",
      scheduleStatus: "scheduled",
      evidenceRevision: 1,
      resultRevision: 1,
      scheduleRevision: 1,
      revision: 3,
    },
    evidence: {
      id: "cde234567",
      kind: "composed",
      scoreMode: "cumulative",
      status: "completed",
      eligible: true,
      quality: "recovered",
      score: { red: 3, blue: 3 },
      claim: { consumerKind: "championship-match", consumerUuid: matchUuid },
      rounds: [firstRound, secondRound],
    },
    evidenceOrientation: "aligned",
    evidenceNote: "Selecionada manualmente no cockpit do campeonato",
    appearances: {
      items: [
        appearance("player-gabinho", "gabinho", "a", true, true, 1_158, []),
        appearance("player-lucas", "Lucas", "a", true, true, 1_042, []),
        appearance("legacy-guest", "Convidado", "b", false, false, 614, [
          "Jogador sem conta registrada",
          "Fora do elenco",
        ]),
        appearance("player-digo", "Digo0109", "b", true, true, 1_173, []),
      ],
      totalCount: 4,
      truncated: false,
    },
    result: {
      uuid: "a0000000-0000-4000-8000-000000000001",
      revision: 1,
      method: "mid-game-forfeit",
      sideAPlayedScore: 3,
      sideBPlayedScore: 3,
      sideAAdministrativeScore: 1,
      sideBAdministrativeScore: 0,
      sideAOfficialScore: 4,
      sideBOfficialScore: 3,
      sideAOutcome: "win",
      sideBOutcome: "loss",
      evidenceDerived: true,
      state: "current",
      note: "Carbono deixou a sala antes do encerramento.",
      settledAt: "2026-08-08T21:25:00.000Z",
      supersededAt: null,
    },
    resultHistory: {
      items: [
        {
          uuid: "a0000000-0000-4000-8000-000000000001",
          revision: 1,
          method: "mid-game-forfeit",
          sideAPlayedScore: 3,
          sideBPlayedScore: 3,
          sideAAdministrativeScore: 1,
          sideBAdministrativeScore: 0,
          sideAOfficialScore: 4,
          sideBOfficialScore: 3,
          sideAOutcome: "win",
          sideBOutcome: "loss",
          evidenceDerived: true,
          state: "current",
          note: "Carbono deixou a sala antes do encerramento.",
          settledAt: "2026-08-08T21:25:00.000Z",
          supersededAt: null,
        },
      ],
      totalCount: 1,
      truncated: false,
    },
  };
}

function team(uuid: string, name: string, abbreviation: string, colors: string[]) {
  return {
    uuid,
    name,
    abbreviation,
    colors,
  };
}

function reference(uuid: string, name: string, abbreviation: string, colors: string[]) {
  return { uuid, name, abbreviation, colors };
}

function formatMatch(
  uuid: string,
  label: string,
  sideA: ReturnType<typeof team> | null,
  sideB: ReturnType<typeof team> | null,
  evidenceRevision: number,
  resultRevision: number,
  displayOrder: number,
) {
  return {
    uuid,
    label,
    sideA: { spotUuid: `${uuid}-a`, team: sideA },
    sideB: { spotUuid: `${uuid}-b`, team: sideB },
    evidenceRevision,
    resultRevision,
    displayOrder,
  };
}

function round(
  matchId: string,
  number: number,
  normalizedScore: { red: number; blue: number },
  quality: "complete" | "recovered",
  completionReason: "normal" | "room-process-exit",
  lastCheckpointAt: string,
) {
  return {
    matchId,
    kind: "sequential" as const,
    number,
    position: number,
    orientation: number === 1 ? ("aligned" as const) : ("swapped" as const),
    status: "completed" as const,
    eligible: true,
    quality,
    completionReason,
    initiatedAt: "2026-08-08T21:00:00.000Z",
    endedAt: lastCheckpointAt,
    elapsedSeconds: number === 1 ? 600 : 720,
    lastCheckpointAt,
    rawScore: number === 1 ? normalizedScore : { red: 3, blue: 3 },
    normalizedScore,
    recording: null,
    provenance: {
      championshipContextUuid: championshipUuid,
      room: { uuid: "60000000-0000-4000-8000-000000000001" },
      program: {
        uuid: "70000000-0000-4000-8000-000000000001",
        name: "haxfootball",
        title: "HaxFootball atual",
      },
      version: {
        uuid: "80000000-0000-4000-8000-000000000001",
        version: "2.14.0",
      },
    },
    participants: { items: [], totalCount: 4, truncated: false },
    events: { items: [], totalCount: number === 1 ? 15 : 12, truncated: false },
  };
}

function appearance(
  sourcePlayerId: string,
  displayName: string,
  observedSide: "a" | "b",
  registered: boolean,
  onRoster: boolean,
  playingTimeSeconds: number,
  findings: string[],
) {
  return {
    sourcePlayerId,
    sourceAccountUuid: registered ? "b0000000-0000-4000-8000-000000000001" : null,
    displayName,
    observedSide,
    registered,
    onRoster,
    playingTimeSeconds,
    findings,
    attribution: {
      mode: "default" as const,
      targetParticipantUuid: null,
      targetDisplayName: null,
      reason: null,
    },
  };
}
