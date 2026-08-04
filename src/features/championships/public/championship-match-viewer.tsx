import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarClock, Film, LoaderCircle, Play, Swords, Users } from "lucide-react";
import { Badge } from "#/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Skeleton } from "#/components/ui/skeleton";
import type {
  ChampionshipMatchOperationsData,
  PublicChampionshipDetail,
} from "#/server/api/championship-api";
import { getPublicChampionshipMatchFn } from "#/server/api/championship-match-functions";
import { ChampionshipSectionHeading } from "./championship-section-heading";
import {
  durationLabel,
  evidencePeriodScores,
  evidenceQualityLabel,
  evidenceQualityTone,
  numberValue,
} from "#/features/admin/championships/match-workspace-model";

const ReplayPlayer = lazy(() => import("#/features/matches/detail-page/components/replay-player"));

type FormatMatch = PublicChampionshipDetail["format"]["matches"]["items"][number];
type MatchResult = {
  sideAOfficialScore: number;
  sideBOfficialScore: number;
};

function officialResult(match: FormatMatch): MatchResult | null {
  return (match as FormatMatch & { result?: MatchResult | null }).result ?? null;
}

export function ChampionshipMatchViewer({
  championshipUuid,
  matches,
}: {
  championshipUuid: string;
  matches: FormatMatch[];
}) {
  const [selectedMatchUuid, setSelectedMatchUuid] = useState<string | null>(null);
  const selected = matches.find((match) => match.uuid === selectedMatchUuid) ?? null;

  return (
    <>
      <section className="space-y-5">
        <ChampionshipSectionHeading
          icon={Swords}
          title="Jogos"
          detail="Replays, placares por tempo e participações oficiais ficam reunidos em uma única visualização."
          action={<Badge variant="outline">{matches.length} partidas</Badge>}
        />
        {matches.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((match) => (
              <button
                key={match.uuid}
                type="button"
                className="bfl-panel group min-h-44 overflow-hidden rounded-xl border p-5 text-left transition hover:border-primary/60 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setSelectedMatchUuid(match.uuid)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {match.label}
                    </p>
                    {numberValue(match.resultRevision) > 0 ? (
                      <Badge
                        variant="outline"
                        className="mt-2 border-emerald-400/50 text-emerald-300"
                      >
                        Resultado oficial
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="mt-2">
                        {match.scheduleStatus === "scheduled" ? "Agendada" : "Aguardando resultado"}
                      </Badge>
                    )}
                  </div>
                  <span className="grid size-9 place-items-center rounded-full border text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Play className="size-4" />
                  </span>
                </div>
                <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                  <span className="truncate text-right text-base font-semibold">
                    {match.sideA.team?.name ?? "A definir"}
                  </span>
                  <MatchScore match={match} />
                  <span className="truncate text-base font-semibold">
                    {match.sideB.team?.name ?? "A definir"}
                  </span>
                </div>
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarClock className="size-3.5" />
                  {scheduleLabel(match.scheduledAt, match.scheduleStatus)}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Nenhuma partida foi criada nesta edição.
          </div>
        )}
      </section>
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelectedMatchUuid(null)}>
        <DialogContent className="grid max-h-[94vh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 sm:max-w-6xl">
          {selected ? (
            <MatchViewerContent championshipUuid={championshipUuid} match={selected} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function MatchScore({ match }: { match: FormatMatch }) {
  const result = officialResult(match);
  return result ? (
    <span className="font-mono text-lg font-semibold tabular-nums text-foreground">
      {result.sideAOfficialScore} – {result.sideBOfficialScore}
    </span>
  ) : (
    <span className="text-muted-foreground">×</span>
  );
}

function MatchViewerContent({
  championshipUuid,
  match,
}: {
  championshipUuid: string;
  match: FormatMatch;
}) {
  const getMatch = useServerFn(getPublicChampionshipMatchFn);
  const [operations, setOperations] = useState<ChampionshipMatchOperationsData | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");

  useEffect(() => {
    let active = true;
    setState("loading");
    setOperations(null);
    void getMatch({ data: { championshipUuid, championshipMatchUuid: match.uuid } })
      .then((result) => {
        if (!active) return;
        setOperations(result);
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });

    return () => {
      active = false;
    };
  }, [championshipUuid, getMatch, match.uuid]);

  const periods = useMemo(() => evidencePeriodScores(operations?.evidence ?? null), [operations]);
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? periods[0];

  useEffect(() => setSelectedPeriodId(periods[0]?.id ?? ""), [periods]);

  return (
    <>
      <DialogHeader className="border-b px-5 py-4 sm:px-6">
        <DialogTitle>{match.label}</DialogTitle>
        <DialogDescription>
          {match.sideA.team?.name ?? "A definir"} <span aria-hidden="true">×</span>{" "}
          {match.sideB.team?.name ?? "A definir"}
        </DialogDescription>
      </DialogHeader>
      <div className="bfl-scrollbar min-h-0 overflow-y-auto">
        {state === "loading" ? <MatchViewerSkeleton /> : null}
        {state === "error" ? (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">
            Não foi possível carregar os detalhes desta partida agora.
          </div>
        ) : null}
        {state === "ready" && operations ? (
          <div className="space-y-6 p-5 sm:p-6">
            <MatchSummary operations={operations} />
            {operations.evidence ? (
              <section className="overflow-hidden rounded-lg border">
                <div className="border-b px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Film className="size-4 text-primary" />
                    <h3 className="font-semibold">Replay e tempos</h3>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cada tempo mantém seu próprio replay e placar.
                  </p>
                </div>
                <div className="p-4">
                  <div
                    className="mb-4 flex gap-2 overflow-x-auto"
                    role="tablist"
                    aria-label="Tempos da partida"
                  >
                    {periods.map((period) => (
                      <button
                        key={period.id}
                        type="button"
                        role="tab"
                        aria-selected={selectedPeriod?.id === period.id}
                        className={`min-w-36 border px-3 py-2 text-left text-xs transition-colors ${
                          selectedPeriod?.id === period.id
                            ? "border-primary bg-primary/10"
                            : "hover:bg-muted/40"
                        }`}
                        onClick={() => setSelectedPeriodId(period.id)}
                      >
                        <span className="block font-semibold">{period.label}</span>
                        <span className="mt-1 block font-mono text-base tabular-nums">
                          {period.sideA} – {period.sideB}
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedPeriod?.round.recording ? (
                    <Suspense fallback={<ReplayFallback />}>
                      <ReplayPlayer
                        key={selectedPeriod.round.recording.url}
                        source={selectedPeriod.round.recording.url}
                      />
                    </Suspense>
                  ) : (
                    <div className="flex aspect-video items-center justify-center border bg-muted/20 px-6 text-center text-sm text-muted-foreground">
                      O replay deste tempo não foi preservado, mas os dados registrados continuam
                      disponíveis.
                    </div>
                  )}
                  {selectedPeriod ? (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{durationLabel(selectedPeriod.round.elapsedSeconds)}</span>
                      <span>{selectedPeriod.round.participants.totalCount} participações</span>
                      {selectedPeriod.round.provenance ? (
                        <span>{selectedPeriod.round.provenance.program.name}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </section>
            ) : (
              <EmptyEvidence />
            )}
            <MatchPeople operations={operations} />
          </div>
        ) : null}
      </div>
    </>
  );
}

function MatchSummary({ operations }: { operations: ChampionshipMatchOperationsData }) {
  const result = operations.result;
  const evidence = operations.evidence;

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="grid divide-y sm:grid-cols-[minmax(0,1fr)_220px] sm:divide-x sm:divide-y-0">
        <div className="px-4 py-5">
          <div className="flex flex-wrap items-center gap-2">
            {result ? (
              <Badge variant="outline" className="border-emerald-400/50 text-emerald-300">
                Resultado oficial
              </Badge>
            ) : (
              <Badge variant="outline">Resultado pendente</Badge>
            )}
            {evidence ? (
              <Badge variant="outline" className={evidenceQualityTone(evidence.quality)}>
                {evidenceQualityLabel(evidence.quality)}
              </Badge>
            ) : null}
          </div>
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3">
            <ScoreTeam
              name={operations.match.sideA?.name ?? "A definir"}
              score={result ? numberValue(result.sideAOfficialScore) : null}
              align="right"
            />
            <span className="pb-1 text-xl text-muted-foreground">×</span>
            <ScoreTeam
              name={operations.match.sideB?.name ?? "A definir"}
              score={result ? numberValue(result.sideBOfficialScore) : null}
              align="left"
            />
          </div>
        </div>
        <div className="grid content-center gap-3 px-4 py-5 text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CalendarClock className="size-4" />
            {operations.match.scheduledAt
              ? formatDateTime(operations.match.scheduledAt)
              : "Horário não definido"}
          </span>
          {result ? (
            <span className="text-muted-foreground">
              {result.method === "played"
                ? "Resultado de jogo registrado"
                : "Resultado definido pela organização"}
            </span>
          ) : null}
          {result?.note ? <span className="text-muted-foreground">{result.note}</span> : null}
        </div>
      </div>
    </section>
  );
}

function ScoreTeam({
  name,
  score,
  align,
}: {
  name: string;
  score: number | null;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className="truncate text-sm font-semibold">{name}</div>
      <div className="mt-1 font-mono text-4xl font-semibold tabular-nums">{score ?? "–"}</div>
    </div>
  );
}

function MatchPeople({ operations }: { operations: ChampionshipMatchOperationsData }) {
  const items = [...operations.appearances.items].sort(
    (left, right) => numberValue(right.playingTimeSeconds) - numberValue(left.playingTimeSeconds),
  );
  const sideA = items.filter((appearance) => appearance.observedSide === "a");
  const sideB = items.filter((appearance) => appearance.observedSide === "b");
  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="size-4 text-primary" />
          <h3 className="font-semibold">Participações</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Tempo em campo contabilizado no resultado oficial.
        </p>
      </div>
      {items.length ? (
        <div className="grid divide-y md:grid-cols-2 md:divide-x md:divide-y-0">
          <ParticipationSide items={sideA} teamName={operations.match.sideA?.name ?? "Equipe A"} />
          <ParticipationSide items={sideB} teamName={operations.match.sideB?.name ?? "Equipe B"} />
        </div>
      ) : (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma participação foi registrada para este resultado.
        </div>
      )}
    </section>
  );
}

function ParticipationSide({
  items,
  teamName,
}: {
  items: ChampionshipMatchOperationsData["appearances"]["items"];
  teamName: string;
}) {
  return (
    <div className="min-w-0">
      <div className="border-b bg-muted/20 px-4 py-3 text-sm font-semibold">{teamName}</div>
      {items.length ? (
        <div className="divide-y">
          {items.map((appearance) => (
            <div
              key={appearance.sourcePlayerId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">
                  {appearance.attribution.mode === "redirect"
                    ? (appearance.attribution.targetDisplayName ?? appearance.displayName)
                    : appearance.displayName}
                </div>
                {appearance.attribution.mode === "exclude" ? (
                  <div className="mt-1 text-xs text-muted-foreground">Não contabilizado</div>
                ) : null}
              </div>
              <span className="font-mono text-sm tabular-nums text-muted-foreground">
                {durationLabel(appearance.playingTimeSeconds)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-7 text-sm text-muted-foreground">Sem participações registradas.</p>
      )}
    </div>
  );
}

function EmptyEvidence() {
  return (
    <section className="rounded-lg border px-5 py-10 text-center">
      <Film className="mx-auto size-7 text-muted-foreground" />
      <h3 className="mt-3 font-semibold">Sem replay vinculado</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Esta partida pode ter um resultado manual, histórico ou ainda estar aguardando registro.
      </p>
    </section>
  );
}
function ReplayFallback() {
  return (
    <div className="flex aspect-video items-center justify-center border bg-muted/20 text-sm text-muted-foreground">
      <LoaderCircle className="mr-2 size-4 animate-spin" />
      Carregando replay
    </div>
  );
}
function scheduleLabel(scheduledAt: string | null, status: string) {
  if (scheduledAt) return formatDateTime(scheduledAt);
  if (status === "played") return "Partida disputada";
  if (status === "proposed") return "Horário em negociação";
  return "Horário a definir";
}
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}
function MatchViewerSkeleton() {
  return (
    <div className="space-y-6 p-5 sm:p-6">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="aspect-video w-full" />
      <Skeleton className="h-52 w-full" />
    </div>
  );
}
