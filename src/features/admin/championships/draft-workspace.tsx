import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Check,
  CircleAlert,
  Clock3,
  Crown,
  History,
  Play,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  TimerOff,
  UserPlus,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Progress } from "#/components/ui/progress";
import type { ApiAccountSession } from "#/server/auth/session";
import type {
  ChampionshipWorkspaceData,
  PublicChampionshipDetail,
} from "#/server/api/championship-api";
import { formatSalaryUnits } from "#/features/championships/salary-format";
import {
  acceptChampionshipTradeFn,
  cancelChampionshipTradeFn,
  configureChampionshipDraftFn,
  createChampionshipTradeFn,
  endChampionshipDraftFn,
  getChampionshipDraftFn,
  makeChampionshipDraftPickFn,
  previewChampionshipDraftCorrectionFn,
  rejectChampionshipTradeFn,
  reverseChampionshipDraftPickFn,
  startChampionshipDraftFn,
} from "#/server/api/championship-draft-functions";
import {
  activeTurn,
  countdownLabel,
  draftReadiness,
  eligibleTurns,
  filledTurns,
  numberValue,
  overdueTurns,
  participantSearch,
  projectedTeamCap,
  roundDirection,
  secondsUntil,
  teamCapPercent,
  tradeBalance,
  turnStateLabel,
  type Draft,
  type DraftParticipant,
  type DraftTurn,
  type TradeProjection,
} from "./draft-workspace-model";

type DraftData = Pick<
  ChampionshipWorkspaceData | PublicChampionshipDetail,
  "championship" | "teams" | "draft" | "trades"
>;

export function DraftWorkspace({
  data,
  session,
  mode,
  poll = true,
}: {
  data: DraftData;
  session: ApiAccountSession | null;
  mode: "admin" | "public";
  poll?: boolean;
}) {
  const [projection, setProjection] = useState(data.draft);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const fetchDraft = useServerFn(getChampionshipDraftFn);
  const draft = projection.draft;
  const draftState = draft?.state;
  const draftServerTime = draft?.serverTime;

  useEffect(() => setProjection(data.draft), [data.draft]);

  useEffect(() => {
    if (!draftServerTime || draftState !== "live") {
      return;
    }

    const offset = new Date(draftServerTime).getTime() - Date.now();
    const timer = window.setInterval(() => setNowMs(Date.now() + offset), 250);

    return () => window.clearInterval(timer);
  }, [draftServerTime, draftState]);

  useEffect(() => {
    if (!poll || draftState !== "live") {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchDraft({
        data: {
          championshipUuid: data.championship.uuid,
          turnLimit: 100,
          participantLimit: 100,
        },
      })
        .then(setProjection)
        .catch(() => undefined);
    }, 1_500);

    return () => window.clearInterval(timer);
  }, [data.championship.uuid, draftState, fetchDraft, poll]);

  if (!draft) {
    return mode === "admin" ? <DraftSetup data={data} draft={null} /> : <DraftEmptyState />;
  }

  return (
    <div className="space-y-5">
      {draft.state === "setup" && mode === "admin" ? (
        <DraftSetup data={data} draft={draft} />
      ) : null}
      <DraftStatusBand data={data} draft={draft} nowMs={nowMs} mode={mode} session={session} />
      <TeamCapRail draft={draft} capUnits={numberValue(data.championship.rules.salary.capUnits)} />
      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_350px]">
        <PlayerPool
          data={data}
          draft={draft}
          session={session}
          mode={mode}
          onProjection={setProjection}
        />
        <DraftFeed data={data} draft={draft} mode={mode} onProjection={setProjection} />
      </div>
      <TradeDesk data={data} draft={draft} mode={mode} />
    </div>
  );
}

function DraftSetup({ data, draft }: { data: DraftData; draft: Draft | null }) {
  const configure = useServerFn(configureChampionshipDraftFn);
  const start = useServerFn(startChampionshipDraftFn);
  const router = useRouter();
  const [teamIds, setTeamIds] = useState(
    draft
      ? [...draft.teams]
          .sort((left, right) => numberValue(left.position) - numberValue(right.position))
          .map((team) => team.uuid)
      : data.teams.items.map((team) => team.uuid),
  );
  const [rounds, setRounds] = useState(draft ? numberValue(draft.rounds) : 4);
  const [countdown, setCountdown] = useState(
    draft
      ? numberValue(draft.countdownSeconds)
      : numberValue(data.championship.rules.draft.countdownSeconds),
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const readiness = draftReadiness(
    draft,
    data.championship.registrationState,
    data.championship.priceState === "locked",
  );

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;

    if (target < 0 || target >= teamIds.length) {
      return;
    }

    setTeamIds((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    const result = await configure({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(data.championship.revision),
        teamIds,
        rounds,
        countdownSeconds: countdown,
      },
    });

    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await router.invalidate();
  }

  async function begin() {
    if (!draft) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const result = await start({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(data.championship.revision),
        expectedDraftRevision: numberValue(draft.revision),
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await router.invalidate();
  }

  return (
    <section className="border-y bg-card/45">
      <div className="grid gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_310px] sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-emerald-300" />
            <h2 className="font-semibold">Preparação do draft</h2>
            <Badge variant="outline">Serpentina</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Defina a prioridade inicial. A direção alterna automaticamente a cada rodada.
          </p>
          <div className="mt-4 divide-y border-y">
            {teamIds.map((teamId, index) => {
              const team = data.teams.items.find((item) => item.uuid === teamId);

              return (
                <div key={teamId} className="flex min-h-12 items-center gap-3 px-2">
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">
                    {index + 1}
                  </span>
                  <TeamSwatch colors={team?.colors} />
                  <span className="min-w-0 flex-1 truncate text-sm">{team?.name ?? teamId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Mover equipe para cima"
                    disabled={index === 0 || busy}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Mover equipe para baixo"
                    disabled={index === teamIds.length - 1 || busy}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-4 border-l-0 lg:border-l lg:pl-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="draft-rounds">Rodadas</Label>
              <Input
                id="draft-rounds"
                type="number"
                min={1}
                max={100}
                value={rounds}
                onChange={(event) => setRounds(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="draft-countdown">Segundos</Label>
              <Input
                id="draft-countdown"
                type="number"
                min={0}
                max={3_600}
                value={countdown}
                onChange={(event) => setCountdown(Number(event.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            {readiness.checks.map((check) => (
              <div key={check.key} className="flex items-center gap-2 text-sm">
                {check.ready ? (
                  <Check className="size-4 text-emerald-300" />
                ) : (
                  <CircleAlert className="size-4 text-amber-300" />
                )}
                <span className={check.ready ? "" : "text-muted-foreground"}>{check.label}</span>
              </div>
            ))}
          </div>
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={busy}
              onClick={() => void save()}
            >
              {draft ? "Salvar ordem" : "Criar draft"}
            </Button>
            {draft ? (
              <Button
                className="flex-1"
                disabled={busy || !readiness.ready}
                onClick={() => void begin()}
              >
                <Play />
                Iniciar
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function DraftStatusBand({
  data,
  draft,
  nowMs,
  mode,
  session,
}: {
  data: DraftData;
  draft: Draft;
  nowMs: number;
  mode: "admin" | "public";
  session: ApiAccountSession | null;
}) {
  const turn = activeTurn(draft);
  const overdue = overdueTurns(draft);
  const remaining = secondsUntil(turn?.deadlineAt, nowMs);

  return (
    <section className="border-y bg-foreground text-background">
      <div className="grid min-h-36 gap-5 px-5 py-6 md:grid-cols-[1fr_auto] md:items-center sm:px-7">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase">
            <span>{draft.state === "live" ? "Draft ao vivo" : draftStateLabel(draft.state)}</span>
            {overdue.length ? (
              <Badge variant="destructive" className="bg-red-700 text-white">
                {overdue.length} escolhas atrasadas
              </Badge>
            ) : null}
          </div>
          {turn ? (
            <>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                <h2 className="text-3xl font-semibold">{turn.team.name}</h2>
                <span className="text-sm opacity-70">
                  rodada {numberValue(turn.round)} · escolha {numberValue(turn.sequence)}
                </span>
              </div>
              <p className="mt-2 text-sm opacity-70">
                {roundDirection(numberValue(turn.round)) === "forward"
                  ? "Ordem de ida"
                  : "Ordem de volta"}{" "}
                na serpentina
              </p>
            </>
          ) : (
            <h2 className="mt-2 text-2xl font-semibold">
              {draft.state === "completed" ? "Draft encerrado" : "Aguardando início"}
            </h2>
          )}
        </div>
        <div className="min-w-44 border-l border-background/25 pl-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase opacity-70">
            {remaining === null ? <TimerOff className="size-4" /> : <Clock3 className="size-4" />}
            Tempo da escolha
          </div>
          <div className="mt-1 font-mono text-4xl font-semibold tabular-nums">
            {countdownLabel(remaining)}
          </div>
          <div className="mt-1 text-xs opacity-65">
            {session
              ? eligibleTurns(draft).length
                ? "Você pode escolher agora"
                : "Acompanhando em tempo real"
              : mode === "public"
                ? "Atualização automática"
                : data.championship.name}
          </div>
        </div>
      </div>
    </section>
  );
}

function TeamCapRail({ draft, capUnits }: { draft: Draft; capUnits: number }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase">Equipes e teto</h3>
        <span className="text-xs text-muted-foreground">{draft.teams.length} equipes</span>
      </div>
      <div className="grid border-y bg-card/40 sm:grid-cols-2 xl:grid-cols-4">
        {draft.teams.map((team) => (
          <div key={team.uuid} className="min-w-0 border-b px-4 py-4 sm:border-r">
            <div className="flex items-center gap-3">
              <TeamSwatch colors={team.colors} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{team.name}</div>
                <div className="text-xs text-muted-foreground">
                  {numberValue(team.rosterSize)} no elenco
                </div>
              </div>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  team.overCap ? "text-red-300" : ""
                }`}
              >
                {numberValue(team.remainingUnits)}
              </span>
            </div>
            <Progress
              className="mt-3 h-1.5"
              value={teamCapPercent(team, capUnits)}
              aria-label={`Uso do teto de ${team.name}`}
            />
            <div className="mt-3 flex flex-wrap gap-1">
              {team.roster.slice(0, 5).map((member) => (
                <span
                  key={member.participantUuid}
                  className="max-w-24 truncate border px-1.5 py-0.5 text-[11px]"
                >
                  {member.displayName}
                </span>
              ))}
              {team.roster.length > 5 ? (
                <span className="px-1.5 py-0.5 text-[11px] text-muted-foreground">
                  +{team.roster.length - 5}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlayerPool({
  data,
  draft,
  mode,
  onProjection,
}: {
  data: DraftData;
  draft: Draft;
  session: ApiAccountSession | null;
  mode: "admin" | "public";
  onProjection: (draft: DraftData["draft"]) => void;
}) {
  const pick = useServerFn(makeChampionshipDraftPickFn);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const available = useMemo(
    () => participantSearch(draft.availableParticipants.items, query),
    [draft.availableParticipants.items, query],
  );
  const eligible = eligibleTurns(draft);
  const targetTurn = eligible[0] ?? null;
  const targetTeam = targetTurn
    ? draft.teams.find((team) => team.uuid === targetTurn.team.uuid)
    : null;
  const capUnits = numberValue(data.championship.rules.salary.capUnits);

  async function choose(participant: DraftParticipant) {
    if (!targetTurn) {
      return;
    }
    setBusyId(participant.uuid);
    setMessage(null);
    const result = await pick({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft.championshipRevision),
        expectedDraftRevision: numberValue(draft.revision),
        participantId: participant.uuid,
        teamId: targetTurn.team.uuid,
      },
    });
    setBusyId(null);
    if (!result.ok) {
      setMessage(
        result.code === "CONFLICT"
          ? "Outra escolha venceu esta disputa. O quadro foi atualizado."
          : result.message,
      );
      return;
    }
    onProjection(result.data);
  }

  return (
    <section>
      <div className="flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <h3 className="font-semibold">Jogadores disponíveis</h3>
          <p className="text-sm text-muted-foreground">
            {draft.availableParticipants.items.length} opções nesta página
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Buscar jogador"
            placeholder="Buscar jogador"
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      {message ? (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {available.length === 0 ? (
        <div className="border-b py-12 text-center text-sm text-muted-foreground">
          Nenhum jogador disponível corresponde à busca.
        </div>
      ) : (
        <div className="divide-y border-b">
          {available.map((participant) => {
            const projection = targetTeam
              ? projectedTeamCap(targetTeam, participant, capUnits)
              : null;
            const cannotPick = !targetTurn || Boolean(projection?.overCap);

            return (
              <div
                key={participant.uuid}
                className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-2 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{participant.displayName}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>
                      {participant.priceUnits === null
                        ? "Sem valor"
                        : formatSalaryUnits(
                            numberValue(participant.priceUnits),
                            data.championship.rules.salary.displayLabel,
                          )}
                    </span>
                    {projection && targetTeam ? (
                      <span className={projection.overCap ? "text-red-300" : ""}>
                        {targetTeam.name}: {projection.remainingUnits} restantes
                      </span>
                    ) : null}
                  </div>
                </div>
                {mode === "admin" || eligible.length ? (
                  <Button
                    size="sm"
                    variant={cannotPick ? "outline" : "default"}
                    disabled={cannotPick || busyId !== null}
                    onClick={() => void choose(participant)}
                  >
                    <UserPlus />
                    {busyId === participant.uuid ? "Escolhendo…" : "Escolher"}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Disponível</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DraftFeed({
  data,
  draft,
  mode,
  onProjection,
}: {
  data: DraftData;
  draft: Draft;
  mode: "admin" | "public";
  onProjection: (draft: DraftData["draft"]) => void;
}) {
  const preview = useServerFn(previewChampionshipDraftCorrectionFn);
  const reverse = useServerFn(reverseChampionshipDraftPickFn);
  const end = useServerFn(endChampionshipDraftFn);
  const [selected, setSelected] = useState<DraftTurn | null>(null);
  const [impact, setImpact] = useState<Awaited<ReturnType<typeof preview>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const feed = filledTurns(draft);

  async function inspect(turn: DraftTurn) {
    setSelected(turn);
    setImpact(null);
    setImpact(
      await preview({
        data: { championshipUuid: data.championship.uuid, turnUuid: turn.uuid },
      }),
    );
  }

  async function confirmReverse() {
    if (!selected || !impact) {
      return;
    }
    setBusy(true);
    const result = await reverse({
      data: {
        championshipUuid: data.championship.uuid,
        turnUuid: selected.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft.championshipRevision),
        expectedDraftRevision: numberValue(draft.revision),
        reason: "Correção confirmada após visualização do impacto",
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onProjection(result.data);
    setSelected(null);
  }

  async function finish() {
    setBusy(true);
    const result = await end({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft.championshipRevision),
        expectedDraftRevision: numberValue(draft.revision),
        reason: "Encerrado pela organização",
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onProjection(result.data);
  }

  return (
    <aside className="border-y bg-card/35">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Linha do tempo</h3>
          <p className="text-xs text-muted-foreground">Escolhas mais recentes primeiro</p>
        </div>
        <History className="size-4 text-muted-foreground" />
      </div>
      {message ? (
        <Alert variant="destructive" className="m-3">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="max-h-[540px] divide-y overflow-y-auto">
        {feed.length ? (
          feed.map((turn) => (
            <div key={turn.uuid} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 grid size-7 shrink-0 place-items-center border text-xs font-semibold">
                {numberValue(turn.sequence)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {turn.selectedParticipant?.displayName}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {turn.team.name} · rodada {numberValue(turn.round)}
                </div>
              </div>
              {mode === "admin" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Revisar e corrigir escolha"
                  onClick={() => void inspect(turn)}
                >
                  <RotateCcw />
                </Button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            A primeira escolha aparecerá aqui.
          </div>
        )}
      </div>
      {mode === "admin" && draft.state === "live" ? (
        <div className="border-t p-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => void finish()}
          >
            <Check />
            Encerrar draft
          </Button>
        </div>
      ) : null}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Corrigir escolha</DialogTitle>
            <DialogDescription>
              A escolha será reaberta imediatamente. Confira todo o impacto antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          {!impact ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Calculando impacto…
            </div>
          ) : (
            <div className="space-y-3 border-y py-4 text-sm">
              <ImpactRow label="Jogador" value={impact.participant?.displayName ?? "Sem jogador"} />
              <ImpactRow label="Equipe" value={impact.team.name} />
              <ImpactRow
                label="Teto após correção"
                value={`${numberValue(impact.team.usageAfterUnits)} usados · ${numberValue(
                  impact.team.remainingAfterUnits,
                )} restantes`}
              />
              <ImpactRow label="Nova situação" value={turnStateLabel(impact.reopenedState)} />
              {impact.reasons.map((reason) => (
                <Alert key={reason}>
                  <AlertDescription>{reason}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !impact?.canReverse}
              onClick={() => void confirmReverse()}
            >
              <RotateCcw />
              Reabrir escolha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function TradeDesk({
  data,
  draft,
  mode,
}: {
  data: DraftData;
  draft: Draft;
  mode: "admin" | "public";
}) {
  const createTrade = useServerFn(createChampionshipTradeFn);
  const accept = useServerFn(acceptChampionshipTradeFn);
  const reject = useServerFn(rejectChampionshipTradeFn);
  const cancel = useServerFn(cancelChampionshipTradeFn);
  const router = useRouter();
  const [fromTeamId, setFromTeamId] = useState(draft.teams[0]?.uuid ?? "");
  const [toTeamId, setToTeamId] = useState(draft.teams[1]?.uuid ?? "");
  const [fromPlayerId, setFromPlayerId] = useState("");
  const [toPlayerId, setToPlayerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function propose() {
    if (!fromPlayerId || !toPlayerId) {
      setMessage("Selecione um jogador de cada equipe.");
      return;
    }
    setBusy(true);
    const result = await createTrade({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft.championshipRevision),
        proposingTeamId: fromTeamId,
        receivingTeamId: toTeamId,
        proposingParticipantIds: [fromPlayerId],
        receivingParticipantIds: [toPlayerId],
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await router.invalidate();
  }

  async function decide(trade: TradeProjection, action: "accept" | "reject" | "cancel") {
    setBusy(true);
    const fn = action === "accept" ? accept : action === "reject" ? reject : cancel;
    const result = await fn({
      data: {
        championshipUuid: data.championship.uuid,
        tradeUuid: trade.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft.championshipRevision),
        expectedTradeRevision: numberValue(trade.revision),
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await router.invalidate();
  }

  return (
    <section className="border-y bg-card/40">
      <div className="flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-emerald-300" />
            <h3 className="font-semibold">Central de trocas</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Valores congelados e impacto no teto são revalidados na confirmação.
          </p>
        </div>
        <Badge variant="outline">{data.trades.items.length} negociações visíveis</Badge>
      </div>
      {mode === "admin" || draft.actor.gmTeamIds.length ? (
        <div className="grid gap-3 border-b px-4 py-4 lg:grid-cols-[1fr_1fr_auto] sm:px-6">
          <TradeSide
            label="Equipe que propõe"
            teamId={fromTeamId}
            playerId={fromPlayerId}
            teams={draft.teams}
            onTeam={setFromTeamId}
            onPlayer={setFromPlayerId}
          />
          <TradeSide
            label="Equipe que recebe"
            teamId={toTeamId}
            playerId={toPlayerId}
            teams={draft.teams}
            onTeam={setToTeamId}
            onPlayer={setToPlayerId}
          />
          <Button className="self-end" disabled={busy} onClick={() => void propose()}>
            <ArrowLeftRight />
            Propor troca
          </Button>
        </div>
      ) : null}
      {message ? (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="divide-y">
        {data.trades.items.length ? (
          data.trades.items.map((trade) => {
            const balance = tradeBalance(trade);

            return (
              <div
                key={trade.uuid}
                className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center sm:px-6"
              >
                <TradeTeam
                  name={trade.proposingTeam.name}
                  players={trade.items.filter(
                    (item) => item.fromTeamUuid === trade.proposingTeam.uuid,
                  )}
                  value={balance.proposing}
                />
                <ArrowLeftRight className="hidden size-4 text-muted-foreground lg:block" />
                <TradeTeam
                  name={trade.receivingTeam.name}
                  players={trade.items.filter(
                    (item) => item.fromTeamUuid === trade.receivingTeam.uuid,
                  )}
                  value={balance.receiving}
                />
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Badge
                    variant="outline"
                    className={
                      trade.state === "accepted"
                        ? "border-emerald-500/50 text-emerald-300"
                        : trade.state === "proposed"
                          ? "border-amber-500/50 text-amber-200"
                          : ""
                    }
                  >
                    {tradeStateLabel(trade.state)}
                  </Badge>
                  {trade.actorActions.canAccept ? (
                    <Button size="sm" disabled={busy} onClick={() => void decide(trade, "accept")}>
                      <Check />
                      Aceitar
                    </Button>
                  ) : null}
                  {trade.actorActions.canReject ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Recusar troca"
                      disabled={busy}
                      onClick={() => void decide(trade, "reject")}
                    >
                      <X />
                    </Button>
                  ) : null}
                  {trade.actorActions.canCancel ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Cancelar proposta"
                      disabled={busy}
                      onClick={() => void decide(trade, "cancel")}
                    >
                      <X />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            Nenhuma troca concluída ou aguardando sua equipe.
          </div>
        )}
      </div>
    </section>
  );
}

function TradeSide({
  label,
  teamId,
  playerId,
  teams,
  onTeam,
  onPlayer,
}: {
  label: string;
  teamId: string;
  playerId: string;
  teams: Draft["teams"];
  onTeam: (value: string) => void;
  onPlayer: (value: string) => void;
}) {
  const team = teams.find((item) => item.uuid === teamId);
  const teamSelectId = useId();
  const playerSelectId = useId();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={teamSelectId}>{label}</Label>
        <NativeSelect
          id={teamSelectId}
          value={teamId}
          onChange={(event) => {
            onTeam(event.target.value);
            onPlayer("");
          }}
        >
          {teams.map((item) => (
            <NativeSelectOption key={item.uuid} value={item.uuid}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={playerSelectId}>Jogador</Label>
        <NativeSelect
          id={playerSelectId}
          value={playerId}
          onChange={(event) => onPlayer(event.target.value)}
        >
          <NativeSelectOption value="">Selecione</NativeSelectOption>
          {team?.roster
            .filter((member) => member.role === "player")
            .map((member) => (
              <NativeSelectOption key={member.participantUuid} value={member.participantUuid}>
                {member.displayName}
              </NativeSelectOption>
            ))}
        </NativeSelect>
      </div>
    </div>
  );
}

function TradeTeam({
  name,
  players,
  value,
}: {
  name: string;
  players: TradeProjection["items"];
  value: number;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-muted-foreground" />
        <span className="truncate text-sm font-semibold">{name}</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="mt-1 truncate text-xs text-muted-foreground">
        {players.map((item) => item.participant.displayName).join(", ")}
      </div>
    </div>
  );
}

function DraftEmptyState() {
  return (
    <div className="border-y bg-card/45 px-6 py-16 text-center">
      <Crown className="mx-auto size-7 text-muted-foreground" />
      <h2 className="mt-3 font-semibold">Draft ainda não configurado</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A ordem pública aparecerá aqui quando a organização preparar o evento.
      </p>
    </div>
  );
}

function TeamSwatch({ colors }: { colors: string[] | null | undefined }) {
  return (
    <span
      className="size-7 shrink-0 border"
      style={{
        background:
          colors && colors.length > 1
            ? `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50%)`
            : (colors?.[0] ?? "#64748b"),
      }}
    />
  );
}

function ImpactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function draftStateLabel(state: Draft["state"]) {
  return {
    setup: "Em preparação",
    live: "Ao vivo",
    completed: "Encerrado",
    canceled: "Cancelado",
  }[state];
}

function tradeStateLabel(state: TradeProjection["state"]) {
  return {
    proposed: "Aguardando",
    accepted: "Aceita",
    rejected: "Recusada",
    canceled: "Cancelada",
    expired: "Expirada",
  }[state];
}
