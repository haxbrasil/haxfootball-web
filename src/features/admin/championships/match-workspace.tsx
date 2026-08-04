import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CalendarClock,
  Check,
  ChevronRight,
  CircleDot,
  Download,
  FileSearch,
  Film,
  History,
  Layers3,
  Link2,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Unlink,
  Users,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { EntityPicker } from "#/components/ds/forms/entity-picker";
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
import { Skeleton } from "#/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Textarea } from "#/components/ui/textarea";
import type {
  ChampionshipEvidenceCandidatesData,
  ChampionshipMatchOperationsData,
  ChampionshipSettlementPreviewData,
  ChampionshipWorkspaceData,
} from "#/server/api/championship-api";
import {
  attachChampionshipMatchEvidenceFn,
  detachChampionshipMatchEvidenceFn,
  getChampionshipMatchOperationsFn,
  listChampionshipEvidenceCandidatesFn,
  previewChampionshipMatchSettlementFn,
  settleChampionshipMatchFn,
  updateChampionshipMatchAttributionsFn,
} from "#/server/api/championship-match-functions";
import {
  appearanceFindingLabel,
  championshipEvidenceScore,
  correctionImpactLabel,
  defaultSettlementDraft,
  durationLabel,
  evidencePeriodScores,
  evidenceQualityLabel,
  evidenceQualityTone,
  evidenceUsesUnconfiguredProgram,
  methodDescription,
  methodLabel,
  numberValue,
  officialScore,
  outcomeLabel,
  type MatchOperations,
  type MatchOutcome,
  type SettlementDraft,
  type SettlementMethod,
  validateSettlementDraft,
} from "./match-workspace-model";

const ReplayPlayer = lazy(() => import("#/features/matches/detail-page/components/replay-player"));

type FormatMatch = ChampionshipWorkspaceData["format"]["matches"]["items"][number];
type AttributionMode = MatchOperations["appearances"]["items"][number]["attribution"]["mode"];
type MatchAppearance = MatchOperations["appearances"]["items"][number];
type AttributionDraft = {
  sourcePlayerId: string;
  mode: AttributionMode;
  targetParticipantUuid: string | null;
  reason: string | null;
};
type EvidenceCandidate = ChampionshipEvidenceCandidatesData["items"][number];
type CompositionGame = {
  candidate: EvidenceCandidate;
  orientation: "aligned" | "swapped";
};

export function MatchWorkspace({
  data,
  selectedMatchUuid,
  onSelectMatch,
  initialOperations,
  initialCandidates,
}: {
  data: ChampionshipWorkspaceData;
  selectedMatchUuid: string | null;
  onSelectMatch: (matchUuid: string) => void;
  initialOperations?: ChampionshipMatchOperationsData;
  initialCandidates?: ChampionshipEvidenceCandidatesData;
}) {
  const selected =
    data.format.matches.items.find((match) => match.uuid === selectedMatchUuid) ??
    data.format.matches.items[0] ??
    null;
  const [operations, setOperations] = useState<ChampionshipMatchOperationsData | null>(
    initialOperations ?? null,
  );
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    initialOperations ? "ready" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const getOperations = useServerFn(getChampionshipMatchOperationsFn);

  useEffect(() => {
    if (!selected) return;
    if (initialOperations?.match.uuid === selected.uuid) {
      setOperations(initialOperations);
      setState("ready");
      return;
    }

    let active = true;
    setOperations(null);
    setState("loading");
    setError(null);
    void getOperations({
      data: {
        championshipUuid: data.championship.uuid,
        championshipMatchUuid: selected.uuid,
      },
    })
      .then((result) => {
        if (!active) return;
        setOperations(result);
        setState("ready");
      })
      .catch((cause) => {
        if (!active) return;
        setError(errorMessage(cause));
        setState("error");
      });

    return () => {
      active = false;
    };
  }, [data.championship.uuid, getOperations, initialOperations, selected]);

  if (!selected) {
    return (
      <div className="bfl-panel flex min-h-[60vh] items-center justify-center rounded-xl border">
        <div className="max-w-md px-6 text-center">
          <CircleDot className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 font-semibold">Nenhum jogo criado</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Crie os spots e jogos no formato para começar a operação.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-5 grid min-h-[calc(100vh-13rem)] sm:-mx-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <MatchQueue
        matches={data.format.matches.items}
        selectedUuid={selected.uuid}
        onSelect={onSelectMatch}
      />
      <div className="min-w-0">
        {state === "loading" ? (
          <MatchCockpitSkeleton />
        ) : state === "error" ? (
          <div className="p-6">
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Não foi possível abrir o jogo</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : operations ? (
          <MatchCockpit
            key={`${operations.match.uuid}:${operations.match.resultRevision}:${operations.match.evidenceRevision}`}
            data={data}
            operations={operations}
            initialCandidates={initialCandidates}
            onOperations={setOperations}
          />
        ) : null}
      </div>
    </div>
  );
}

function MatchQueue({
  matches,
  selectedUuid,
  onSelect,
}: {
  matches: FormatMatch[];
  selectedUuid: string;
  onSelect: (matchUuid: string) => void;
}) {
  const [search, setSearch] = useState("");
  const normalized = search.trim().toLocaleLowerCase("pt-BR");
  const filtered = matches.filter((match) =>
    [match.label, match.sideA.team?.name, match.sideB.team?.name]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("pt-BR")
      .includes(normalized),
  );

  return (
    <aside className="border-b bg-card/25 lg:border-r lg:border-b-0">
      <div className="sticky top-20">
        <div className="border-b p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              aria-label="Buscar jogos"
              className="h-9 pl-8"
              placeholder="Buscar jogo ou equipe"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] uppercase text-muted-foreground">
            <span>Fila de operação</span>
            <span>{filtered.length} jogos</span>
          </div>
        </div>
        <div className="max-h-[35vh] overflow-y-auto lg:max-h-[calc(100vh-12.5rem)]">
          {filtered.map((match) => (
            <button
              key={match.uuid}
              type="button"
              className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b px-3 py-3 text-left transition-colors ${
                match.uuid === selectedUuid
                  ? "border-l-2 border-l-primary bg-primary/8"
                  : "border-l-2 border-l-transparent hover:bg-muted/45"
              }`}
              onClick={() => onSelect(match.uuid)}
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold">{match.label}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {match.sideA.team?.abbreviation ?? "A definir"} ·{" "}
                  {match.sideB.team?.abbreviation ?? "A definir"}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <MatchQueueState match={match} />
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

function MatchQueueState({ match }: { match: FormatMatch }) {
  if (numberValue(match.resultRevision) > 0) {
    return <span className="size-2 rounded-full bg-emerald-400" title="Resultado registrado" />;
  }
  if (numberValue(match.evidenceRevision) > 0) {
    return <span className="size-2 rounded-full bg-amber-400" title="Aguardando resultado" />;
  }
  return <span className="size-2 rounded-full bg-muted-foreground/40" title="Sem evidência" />;
}

function MatchCockpit({
  data,
  operations,
  initialCandidates,
  onOperations,
}: {
  data: ChampionshipWorkspaceData;
  operations: ChampionshipMatchOperationsData;
  initialCandidates?: ChampionshipEvidenceCandidatesData;
  onOperations: (operations: ChampionshipMatchOperationsData) => void;
}) {
  const [attributions, setAttributions] = useState<AttributionDraft[]>(() =>
    attributionDrafts(operations),
  );

  return (
    <div>
      <MatchScoreHeader operations={operations} />
      <div>
        <div className="min-w-0 border-b">
          <EvidencePanel
            data={data}
            operations={operations}
            initialCandidates={initialCandidates}
            onOperations={onOperations}
          />
          <EligibilityPanel
            data={data}
            operations={operations}
            attributions={attributions}
            onAttributions={setAttributions}
            onOperations={onOperations}
          />
        </div>
        <SettlementPanel
          operations={operations}
          attributions={attributions}
          allowedProgramUuids={(data.championship.roomPrograms ?? [])
            .filter((program) => program.state === "active")
            .map((program) => program.uuid)}
          onOperations={onOperations}
        />
      </div>
      <ResultHistory operations={operations} />
    </div>
  );
}

function MatchScoreHeader({ operations }: { operations: MatchOperations }) {
  const match = operations.match;
  const result = operations.result;

  return (
    <header className="border-b bg-card/20 px-4 py-5 sm:px-6">
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{match.label}</Badge>
            <Badge
              variant="outline"
              className={
                result
                  ? "border-emerald-400/50 text-emerald-300"
                  : operations.evidence
                    ? "border-amber-400/50 text-amber-300"
                    : ""
              }
            >
              {result ? "Resultado oficial" : operations.evidence ? "Em revisão" : "Sem evidência"}
            </Badge>
            {operations.evidence ? (
              <Badge variant="outline" className={evidenceQualityTone(operations.evidence.quality)}>
                {evidenceQualityLabel(operations.evidence.quality)}
              </Badge>
            ) : null}
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {match.scheduledAt ? formatDateTime(match.scheduledAt) : "Horário não definido"}
            <span>·</span>
            <span>{match.expectedProgram?.name ?? "Programa herdado"}</span>
          </div>
        </div>
        <div className="grid w-full max-w-2xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
          <TeamScore
            team={match.sideA}
            score={result ? numberValue(result.sideAOfficialScore) : null}
            align="right"
          />
          <span className="text-lg text-muted-foreground">×</span>
          <TeamScore
            team={match.sideB}
            score={result ? numberValue(result.sideBOfficialScore) : null}
            align="left"
          />
        </div>
      </div>
    </header>
  );
}

function TeamScore({
  team,
  score,
  align,
}: {
  team: MatchOperations["match"]["sideA"];
  score: number | null;
  align: "left" | "right";
}) {
  return (
    <div className={align === "right" ? "text-right" : "text-left"}>
      <div className="truncate text-sm font-semibold">{team?.name ?? "A definir"}</div>
      <div className="mt-0.5 font-mono text-3xl font-semibold tabular-nums">
        {score === null ? "–" : score}
      </div>
    </div>
  );
}

function EvidencePanel({
  data,
  operations,
  initialCandidates,
  onOperations,
}: {
  data: ChampionshipWorkspaceData;
  operations: MatchOperations;
  initialCandidates?: ChampionshipEvidenceCandidatesData;
  onOperations: (operations: ChampionshipMatchOperationsData) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [detachOpen, setDetachOpen] = useState(false);
  const detach = useServerFn(detachChampionshipMatchEvidenceFn);
  const [busy, setBusy] = useState(false);
  const evidence = operations.evidence;
  const periods = useMemo(
    () => evidencePeriodScores(evidence, operations.evidenceOrientation ?? "aligned"),
    [evidence, operations.evidenceOrientation],
  );
  const [selectedPeriodId, setSelectedPeriodId] = useState(periods[0]?.id ?? "");
  const selectedPeriod = periods.find((period) => period.id === selectedPeriodId) ?? periods[0];

  useEffect(() => setSelectedPeriodId(periods[0]?.id ?? ""), [periods]);

  async function confirmDetach() {
    setBusy(true);
    const result = await detach({
      data: {
        championshipUuid: operations.championshipUuid,
        championshipMatchUuid: operations.match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(operations.championshipRevision),
        expectedEvidenceRevision: numberValue(operations.match.evidenceRevision),
        reason: "Evidência desvinculada pela operação do campeonato",
      },
    });
    setBusy(false);

    if (result.ok) {
      onOperations(result.data);
      setDetachOpen(false);
    } else {
      toast.error(result.message);
    }
  }

  return (
    <section aria-labelledby="evidence-heading">
      <SectionBar
        icon={Film}
        title="Evidência e replay"
        description={evidence ? `Registro ${evidence.id}` : "Selecione uma partida registrada"}
        action={
          <div className="flex gap-2">
            {evidence ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setDetachOpen(true)}
              >
                <Unlink />
                Desvincular
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={() => setSearchOpen(true)}>
              <FileSearch />
              {evidence ? "Trocar evidência" : "Buscar evidência"}
            </Button>
          </div>
        }
      />
      {evidence ? (
        <>
          <div className="grid gap-px border-y bg-border sm:grid-cols-3">
            <EvidenceDatum label="Estado" value={evidenceQualityLabel(evidence.quality)} />
            <EvidenceDatum
              label="Programa"
              value={
                selectedPeriod?.round.provenance
                  ? `${selectedPeriod.round.provenance.program.name} ${selectedPeriod.round.provenance.version.version}`
                  : "Proveniência indisponível"
              }
            />
            <EvidenceDatum
              label="Recuperação"
              value={
                selectedPeriod?.round.lastCheckpointAt
                  ? `Checkpoint ${formatDateTime(selectedPeriod.round.lastCheckpointAt)}`
                  : "Sem recuperação"
              }
            />
          </div>
          <div className="p-4 sm:p-5">
            <div className="mb-4 flex gap-1 overflow-x-auto" role="tablist" aria-label="Tempos">
              {periods.map((period) => (
                <button
                  key={period.id}
                  type="button"
                  role="tab"
                  aria-label={`${period.label}: ${period.sideA} – ${period.sideB}`}
                  aria-selected={period.id === selectedPeriod?.id}
                  className={`min-w-32 border px-3 py-2 text-left text-xs ${
                    period.id === selectedPeriod?.id
                      ? "border-primary bg-primary/8"
                      : "bg-card/30 text-muted-foreground"
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
              <div>
                <Suspense
                  fallback={
                    <div className="flex aspect-video items-center justify-center border bg-muted/20 text-sm text-muted-foreground">
                      <LoaderCircle className="mr-2 size-4 animate-spin" />
                      Carregando replay
                    </div>
                  }
                >
                  <ReplayPlayer
                    key={selectedPeriod.round.recording.url}
                    source={selectedPeriod.round.recording.url}
                  />
                </Suspense>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {durationLabel(selectedPeriod.round.elapsedSeconds)} ·{" "}
                    {selectedPeriod.round.participants.totalCount} participantes ·{" "}
                    {selectedPeriod.round.events.totalCount} eventos
                  </span>
                  <Button asChild variant="ghost" size="sm">
                    <a href={selectedPeriod.round.recording.url} download>
                      <Download />
                      Baixar replay
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <Alert>
                <Film />
                <AlertTitle>Replay ausente</AlertTitle>
                <AlertDescription>
                  O placar e os metadados continuam disponíveis para a decisão.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </>
      ) : (
        <div className="px-6 py-14 text-center">
          <Link2 className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">Nenhuma partida registrada vinculada</p>
          <p className="mx-auto mt-1 max-w-lg text-xs text-muted-foreground">
            Você ainda pode registrar um resultado manual ou histórico. A busca nunca identifica o
            jogo automaticamente.
          </p>
        </div>
      )}
      <EvidenceSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        data={data}
        operations={operations}
        initialCandidates={initialCandidates}
        onOperations={(next) => {
          onOperations(next);
          setSearchOpen(false);
        }}
      />
      <Dialog open={detachOpen} onOpenChange={setDetachOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desvincular evidência?</DialogTitle>
            <DialogDescription>
              O registro de sala será liberado para outro jogo. As atribuições já salvas permanecem
              no histórico.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetachOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" disabled={busy} onClick={confirmDetach}>
              <Unlink />
              {busy ? "Desvinculando" : "Desvincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function EvidenceSearchDialog({
  open,
  onOpenChange,
  operations,
  initialCandidates,
  onOperations,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ChampionshipWorkspaceData;
  operations: MatchOperations;
  initialCandidates?: ChampionshipEvidenceCandidatesData;
  onOperations: (operations: ChampionshipMatchOperationsData) => void;
}) {
  const list = useServerFn(listChampionshipEvidenceCandidatesFn);
  const attach = useServerFn(attachChampionshipMatchEvidenceFn);
  const [candidates, setCandidates] = useState<ChampionshipEvidenceCandidatesData | null>(
    initialCandidates ?? null,
  );
  const [search, setSearch] = useState("");
  const [quality, setQuality] = useState<"all" | "complete" | "recovered" | "partial" | "legacy">(
    "all",
  );
  const [includeAllPrograms, setIncludeAllPrograms] = useState(false);
  const [showClaimed, setShowClaimed] = useState(false);
  const [orientation, setOrientation] = useState<"aligned" | "swapped">("aligned");
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    initialCandidates ? "ready" : "idle",
  );
  const [compositionGames, setCompositionGames] = useState<CompositionGame[]>([]);
  const [lastGameIsOvertime, setLastGameIsOvertime] = useState(false);
  const [composeBusy, setComposeBusy] = useState(false);
  const [attachingId, setAttachingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const resultsScrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryRevisionRef = useRef(0);
  const failedCursorRef = useRef<string | null>(null);

  const fetchCandidates = useCallback(
    (cursor?: string) =>
      list({
        data: {
          championshipUuid: operations.championshipUuid,
          championshipMatchUuid: operations.match.uuid,
          ...(search.trim() ? { playerSearch: search.trim() } : {}),
          ...(quality === "all" ? {} : { quality }),
          claimState: showClaimed ? "all" : "available",
          includeAllPrograms,
          limit: 25,
          ...(cursor ? { cursor } : {}),
        },
      }),
    [
      includeAllPrograms,
      list,
      operations.championshipUuid,
      operations.match.uuid,
      quality,
      search,
      showClaimed,
    ],
  );

  const runSearch = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      const queryRevision = ++queryRevisionRef.current;
      failedCursorRef.current = null;
      setState("loading");
      setLoadingMore(false);
      setMessage(null);

      try {
        const result = await fetchCandidates();
        if (queryRevision !== queryRevisionRef.current) return;
        setCandidates(result);
        setState("ready");
      } catch {
        if (queryRevision !== queryRevisionRef.current) return;
        setMessage("Não foi possível buscar as partidas. Tente novamente.");
        setState("error");
      }
    },
    [fetchCandidates],
  );
  const runSearchRef = useRef(runSearch);

  useEffect(() => {
    runSearchRef.current = runSearch;
  }, [runSearch]);

  const loadMore = useCallback(async () => {
    const cursor = candidates?.nextCursor;
    if (!cursor || loadingMore || state === "loading" || failedCursorRef.current === cursor) return;

    const queryRevision = queryRevisionRef.current;
    setLoadingMore(true);
    setMessage(null);

    try {
      const result = await fetchCandidates(cursor);
      if (queryRevision !== queryRevisionRef.current) return;

      setCandidates((current) => {
        if (!current) return result;

        const existingIds = new Set(current.items.map((item) => item.evidence.id));
        return {
          ...result,
          items: [
            ...current.items,
            ...result.items.filter((item) => !existingIds.has(item.evidence.id)),
          ],
          totalInspected: numberValue(current.totalInspected) + numberValue(result.totalInspected),
        };
      });
    } catch {
      if (queryRevision === queryRevisionRef.current) {
        failedCursorRef.current = cursor;
        setMessage("Não foi possível carregar mais partidas. Use Atualizar para tentar novamente.");
      }
    } finally {
      if (queryRevision === queryRevisionRef.current) setLoadingMore(false);
    }
  }, [candidates?.nextCursor, fetchCandidates, loadingMore, state]);

  useEffect(() => {
    if (!open) return;
    const timeout = window.setTimeout(() => void runSearchRef.current(), 300);
    return () => window.clearTimeout(timeout);
  }, [
    includeAllPrograms,
    open,
    operations.championshipUuid,
    operations.match.uuid,
    quality,
    search,
    showClaimed,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;
    const root = resultsScrollRef.current;
    if (!open || !candidates?.nextCursor || !target || !root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadMore();
      },
      { root, rootMargin: "240px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [candidates?.nextCursor, loadMore, open]);

  async function selectCandidate(candidate: EvidenceCandidate) {
    const logicalMatchId = candidate.evidence.id;
    const recommendedOrientation = candidate.orientationRecommendation?.orientation ?? orientation;
    setMessage(null);
    setAttachingId(logicalMatchId);
    const result = await attach({
      data: {
        championshipUuid: operations.championshipUuid,
        championshipMatchUuid: operations.match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(operations.championshipRevision),
        expectedEvidenceRevision: numberValue(operations.match.evidenceRevision),
        logicalMatchId,
        orientation: recommendedOrientation,
        note: "Selecionada manualmente no cockpit do campeonato",
      },
    });
    setAttachingId(null);

    if (result.ok) {
      onOperations(result.data);
      onOpenChange(false);
      toast.success("Partida registrada vinculada.");
    } else setMessage(result.message);
  }

  function toggleCompositionGame(candidate: EvidenceCandidate) {
    setCompositionGames((current) => {
      const selected = current.some((item) => item.candidate.evidence.id === candidate.evidence.id);

      if (selected) {
        return normalizeCompositionGames(
          current.filter((item) => item.candidate.evidence.id !== candidate.evidence.id),
        );
      }

      return normalizeCompositionGames([
        ...current,
        {
          candidate,
          orientation: current.length === 0 ? "aligned" : "swapped",
        },
      ]);
    });
  }

  function moveCompositionGame(index: number, direction: -1 | 1) {
    setCompositionGames((current) => {
      const destination = index + direction;

      if (destination < 0 || destination >= current.length) return current;

      const next = [...current];
      const [item] = next.splice(index, 1);

      if (!item) return current;
      next.splice(destination, 0, item);
      return normalizeCompositionGames(next);
    });
  }

  function setCompositionOrientation(index: number, value: "aligned" | "swapped") {
    setCompositionGames((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, orientation: itemIndex === 0 ? "aligned" : value } : item,
      ),
    );
  }

  async function composeAndAttach() {
    if (compositionGames.length < 2) return;

    setComposeBusy(true);
    setMessage(null);
    const result = await attach({
      data: {
        championshipUuid: operations.championshipUuid,
        championshipMatchUuid: operations.match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(operations.championshipRevision),
        expectedEvidenceRevision: numberValue(operations.match.evidenceRevision),
        composition: {
          rounds: compositionGames.map((item, index) =>
            lastGameIsOvertime && index === compositionGames.length - 1
              ? {
                  kind: "extra-time" as const,
                  number: null,
                  matchId: item.candidate.evidence.id,
                  orientation: item.orientation,
                }
              : {
                  kind: "sequential" as const,
                  number: index + 1,
                  matchId: item.candidate.evidence.id,
                  orientation: item.orientation,
                },
          ),
        },
        orientation,
        note: "Tempos selecionados e associados manualmente no cockpit do campeonato",
      },
    });
    setComposeBusy(false);

    if (result.ok) {
      setCompositionGames([]);
      setLastGameIsOvertime(false);
      onOperations(result.data);
    } else {
      setMessage(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="grid max-h-[min(900px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Buscar partida registrada</DialogTitle>
          <DialogDescription>
            Compare placar, participantes, programa e qualidade antes de vincular.
          </DialogDescription>
        </DialogHeader>
        <div className="bfl-scrollbar min-h-0 overflow-y-auto pr-1">
          <form
            className="grid gap-3 border-y py-4 sm:grid-cols-[minmax(0,1fr)_170px_auto]"
            onSubmit={runSearch}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
              <Input
                aria-label="Jogador ou código da partida"
                className="pl-8"
                placeholder="Jogador ou código"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <NativeSelect
              aria-label="Qualidade"
              value={quality}
              onChange={(event) => setQuality(event.target.value as typeof quality)}
            >
              <NativeSelectOption value="all">Toda qualidade</NativeSelectOption>
              <NativeSelectOption value="complete">Completa</NativeSelectOption>
              <NativeSelectOption value="recovered">Recuperada</NativeSelectOption>
              <NativeSelectOption value="partial">Parcial</NativeSelectOption>
              <NativeSelectOption value="legacy">Proveniência indisponível</NativeSelectOption>
            </NativeSelect>
            <Button type="submit" variant="outline" disabled={state === "loading"}>
              <RefreshCw className={state === "loading" ? "animate-spin" : ""} />
              Atualizar
            </Button>
            <label
              htmlFor="include-all-programs"
              className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2"
            >
              <Checkbox
                id="include-all-programs"
                checked={includeAllPrograms}
                onCheckedChange={(value) => setIncludeAllPrograms(value === true)}
              />
              Incluir programas não autorizados nesta edição
            </label>
            <label
              htmlFor="show-claimed-evidence"
              className="flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Checkbox
                id="show-claimed-evidence"
                checked={showClaimed}
                onCheckedChange={(value) => setShowClaimed(value === true)}
              />
              Mostrar partidas já vinculadas
            </label>
            <div className="flex items-center justify-end gap-1 text-xs">
              <span className="mr-1 text-muted-foreground">Orientação</span>
              <Button
                type="button"
                size="sm"
                variant={orientation === "aligned" ? "secondary" : "ghost"}
                onClick={() => setOrientation("aligned")}
              >
                Normal
              </Button>
              <Button
                type="button"
                size="sm"
                variant={orientation === "swapped" ? "secondary" : "ghost"}
                onClick={() => setOrientation("swapped")}
              >
                <ArrowLeftRight />
                Invertida
              </Button>
            </div>
          </form>
          {compositionGames.length ? (
            <EvidenceCompositionBuilder
              games={compositionGames}
              lastGameIsOvertime={lastGameIsOvertime}
              sideAName={operations.match.sideA?.abbreviation ?? "Lado A"}
              sideBName={operations.match.sideB?.abbreviation ?? "Lado B"}
              championshipOrientation={orientation}
              busy={composeBusy}
              onMove={moveCompositionGame}
              onRemove={(candidate) => toggleCompositionGame(candidate)}
              onOrientation={setCompositionOrientation}
              onLastGameIsOvertime={setLastGameIsOvertime}
              onSubmit={composeAndAttach}
            />
          ) : null}
          {message ? <InlineError message={message} /> : null}
          <div
            ref={resultsScrollRef}
            className="min-h-72 max-h-[min(48vh,34rem)] overflow-y-auto rounded-md border bg-background/30"
          >
            {state === "loading" ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-24 w-full" />
                ))}
              </div>
            ) : candidates?.items.length ? (
              <div className="divide-y">
                {candidates.items.map((candidate) => (
                  <article
                    key={candidate.evidence.id}
                    className="grid gap-4 p-4 transition-colors hover:bg-muted/25 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-semibold">
                          {candidate.evidence.id}
                        </span>
                        <Badge
                          variant="outline"
                          className={evidenceQualityTone(candidate.evidence.quality)}
                        >
                          {evidenceQualityLabel(candidate.evidence.quality)}
                        </Badge>
                        {candidate.championshipContext === "matched" ? (
                          <Badge variant="outline" className="border-cyan-400/45 text-cyan-300">
                            <Link2 />
                            Sala deste campeonato
                          </Badge>
                        ) : candidate.championshipContext === "other" ? (
                          <Badge variant="outline" className="border-amber-400/45 text-amber-300">
                            Outra competição
                          </Badge>
                        ) : null}
                        {!candidate.programCompatible ? (
                          <Badge variant="outline" className="border-amber-400/50 text-amber-300">
                            Programa não autorizado
                          </Badge>
                        ) : null}
                        {candidate.orientationRecommendation ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-400/45 text-emerald-300"
                          >
                            {candidate.orientationRecommendation.orientation === "aligned"
                              ? "Lados compatíveis"
                              : "Usará lados invertidos"}
                          </Badge>
                        ) : null}
                        {candidate.alreadyClaimed ? (
                          <Badge variant="destructive">Já vinculada</Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono text-base text-foreground">
                          {(() => {
                            const score = championshipEvidenceScore(
                              candidate.evidence.score,
                              candidate.orientationRecommendation?.orientation ?? orientation,
                            );
                            return `${score.a} – ${score.b}`;
                          })()}
                        </span>
                        <span>{candidate.evidence.rounds.length} tempos</span>
                        {candidate.evidence.rounds[0]?.initiatedAt ? (
                          <span>
                            <CalendarClock className="mr-1 inline size-3" />
                            {formatDateTime(candidate.evidence.rounds[0].initiatedAt)}
                          </span>
                        ) : null}
                        <span>
                          {Array.from(
                            new Set(
                              candidate.evidence.rounds
                                .map((round) => round.provenance?.program.name)
                                .filter((name): name is string => !!name),
                            ),
                          ).join(", ") || "Sem programa registrado"}
                        </span>
                        <span>
                          {candidate.evidence.rounds
                            .flatMap((round) =>
                              round.participants.items.map((item) => item.player.name),
                            )
                            .filter((name, index, all) => all.indexOf(name) === index)
                            .slice(0, 6)
                            .join(", ") || "Sem participantes"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2">
                      {candidate.evidence.kind === "single" ? (
                        <Button
                          size="sm"
                          variant={
                            compositionGames.some(
                              (item) => item.candidate.evidence.id === candidate.evidence.id,
                            )
                              ? "secondary"
                              : "outline"
                          }
                          disabled={candidate.alreadyClaimed || attachingId !== null}
                          onClick={() => toggleCompositionGame(candidate)}
                        >
                          <Layers3 />
                          {compositionGames.some(
                            (item) => item.candidate.evidence.id === candidate.evidence.id,
                          )
                            ? "Selecionado"
                            : "Adicionar tempo"}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        disabled={candidate.alreadyClaimed || attachingId !== null}
                        onClick={() => selectCandidate(candidate)}
                      >
                        {attachingId === candidate.evidence.id ? (
                          <LoaderCircle className="animate-spin" />
                        ) : (
                          <Link2 />
                        )}
                        {attachingId === candidate.evidence.id ? "Vinculando" : "Vincular"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-72 items-center justify-center text-center">
                <div>
                  <FileSearch className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">Nenhuma candidata encontrada</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Amplie os filtros ou confirme o código do registro.
                  </p>
                </div>
              </div>
            )}
            {candidates && state !== "loading" ? (
              <div
                ref={loadMoreRef}
                className="flex h-14 items-center justify-center gap-2 border-t text-xs text-muted-foreground"
              >
                {loadingMore ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Carregando mais partidas
                  </>
                ) : candidates.nextCursor ? (
                  "Role para carregar mais"
                ) : (
                  "Todas as partidas encontradas foram exibidas"
                )}
              </div>
            ) : null}
          </div>
          <div className="flex justify-between gap-3 py-2 text-xs text-muted-foreground">
            <span>{candidates ? `${candidates.totalInspected} registros inspecionados` : ""}</span>
            <span>
              {candidates?.nextCursor
                ? "Mais resultados disponíveis"
                : candidates
                  ? "Fim dos resultados"
                  : ""}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EvidenceCompositionBuilder({
  games,
  lastGameIsOvertime,
  sideAName,
  sideBName,
  championshipOrientation,
  busy,
  onMove,
  onRemove,
  onOrientation,
  onLastGameIsOvertime,
  onSubmit,
}: {
  games: CompositionGame[];
  lastGameIsOvertime: boolean;
  sideAName: string;
  sideBName: string;
  championshipOrientation: "aligned" | "swapped";
  busy: boolean;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (candidate: EvidenceCandidate) => void;
  onOrientation: (index: number, value: "aligned" | "swapped") => void;
  onLastGameIsOvertime: (value: boolean) => void;
  onSubmit: () => void;
}) {
  const finalGame = games.at(-1);
  const finalScore = finalGame
    ? championshipEvidenceScore(finalGame.candidate.evidence.score, finalGame.orientation)
    : { a: 0, b: 0 };
  const championshipScore =
    championshipOrientation === "aligned" ? finalScore : { a: finalScore.b, b: finalScore.a };

  return (
    <section className="-mx-6 border-b bg-primary/5 px-6 py-4" aria-label="Composição de tempos">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers3 className="size-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold">Composição de tempos</h3>
            <p className="text-xs text-muted-foreground">
              {games.length} {games.length === 1 ? "tempo registrado" : "tempos registrados"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Placar final · último tempo
          </p>
          <div className="flex items-baseline justify-end gap-3 font-mono tabular-nums">
            <span className="text-xs text-muted-foreground">{sideAName}</span>
            <strong className="text-xl">
              {championshipScore.a} – {championshipScore.b}
            </strong>
            <span className="text-xs text-muted-foreground">{sideBName}</span>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto border bg-background/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Ordem</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead className="w-32">Placar registrado</TableHead>
              <TableHead className="w-48">Lados</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Remover</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {games.map((item, index) => {
              const isLast = index === games.length - 1;
              const label = isLast && lastGameIsOvertime ? "Prorrogação" : `${index + 1}º tempo`;

              return (
                <TableRow
                  key={item.candidate.evidence.id}
                  className={isLast ? "bg-primary/5" : undefined}
                >
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        title="Mover para cima"
                        aria-label="Mover para cima"
                        disabled={index === 0}
                        onClick={() => onMove(index, -1)}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        title="Mover para baixo"
                        aria-label="Mover para baixo"
                        disabled={isLast}
                        onClick={() => onMove(index, 1)}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="block text-xs font-semibold">
                      {label}
                      {isLast ? <Badge className="ml-2 align-middle">Placar final</Badge> : null}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {item.candidate.evidence.id}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {numberValue(item.candidate.evidence.score?.red)} –{" "}
                    {numberValue(item.candidate.evidence.score?.blue)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={item.orientation === "aligned" ? "secondary" : "ghost"}
                        onClick={() => onOrientation(index, "aligned")}
                      >
                        Normal
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={item.orientation === "swapped" ? "secondary" : "ghost"}
                        disabled={index === 0}
                        onClick={() => onOrientation(index, "swapped")}
                      >
                        <ArrowLeftRight />
                        Invertidos
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      title="Remover tempo"
                      aria-label={`Remover ${label}`}
                      onClick={() => onRemove(item.candidate)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="sticky bottom-0 z-10 -mx-6 mt-3 flex flex-wrap items-center justify-between gap-3 border-t bg-background/95 px-6 py-3 backdrop-blur">
        <div className="space-y-1 text-xs">
          <label htmlFor="last-game-is-overtime" className="flex items-center gap-2">
            <Checkbox
              id="last-game-is-overtime"
              checked={lastGameIsOvertime}
              disabled={games.length < 2}
              onCheckedChange={(value) => onLastGameIsOvertime(value === true)}
            />
            Último tempo é prorrogação
          </label>
          <p className="text-muted-foreground">O último tempo selecionado define o placar final.</p>
        </div>
        <Button type="button" disabled={games.length < 2 || busy} onClick={onSubmit}>
          <Link2 />
          {busy ? "Associando" : "Compor e vincular"}
        </Button>
      </div>
    </section>
  );
}

function normalizeCompositionGames(games: CompositionGame[]): CompositionGame[] {
  return games.map((item, index) => (index === 0 ? { ...item, orientation: "aligned" } : item));
}

const resolvedAttributionFindingCodes = new Set([
  "unregistered",
  "edition-unregistered",
  "off-roster",
  "wrong-side",
]);

function attributionTargetName(
  data: ChampionshipWorkspaceData,
  appearance: MatchAppearance,
  attribution: AttributionDraft,
): string | null {
  if (attribution.mode !== "redirect") return null;
  return (
    data.participants.items.find(
      (participant) => participant.uuid === attribution.targetParticipantUuid,
    )?.displayName ??
    appearance.attribution.targetDisplayName ??
    null
  );
}

function visibleAppearanceFindings(
  appearance: MatchAppearance,
  attribution: AttributionDraft,
  targetName: string | null,
): string[] {
  if (attribution.mode === "exclude") return [];
  if (attribution.mode === "redirect" && targetName) {
    return appearance.findings.filter((finding) => !resolvedAttributionFindingCodes.has(finding));
  }
  return appearance.findings;
}

function AppearanceStatus({
  data,
  appearance,
  attribution,
}: {
  data: ChampionshipWorkspaceData;
  appearance: MatchAppearance;
  attribution: AttributionDraft;
}) {
  const targetName = attributionTargetName(data, appearance, attribution);
  const findings = visibleAppearanceFindings(appearance, attribution, targetName);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {attribution.mode === "exclude" ? (
        <Badge variant="outline" className="border-slate-400/50 text-slate-200">
          Estatísticas excluídas
        </Badge>
      ) : targetName ? (
        <Badge variant="outline" className="border-sky-400/50 text-sky-200">
          Redirecionado para {targetName}
        </Badge>
      ) : null}
      {findings.map((finding) => (
        <Badge key={finding} variant="outline" className="border-amber-400/40 text-amber-200">
          {appearanceFindingLabel(finding)}
        </Badge>
      ))}
      {!findings.length && attribution.mode === "default" ? (
        <span className="text-xs text-emerald-300">Regular</span>
      ) : null}
    </div>
  );
}

function EligibilityPanel({
  data,
  operations,
  attributions,
  onAttributions,
  onOperations,
}: {
  data: ChampionshipWorkspaceData;
  operations: MatchOperations;
  attributions: AttributionDraft[];
  onAttributions: (attributions: AttributionDraft[]) => void;
  onOperations: (operations: ChampionshipMatchOperationsData) => void;
}) {
  const update = useServerFn(updateChampionshipMatchAttributionsFn);
  const [busy, setBusy] = useState(false);
  const hasFindings = operations.appearances.items.some((appearance, index) => {
    const attribution = attributions[index]!;
    const targetName = attributionTargetName(data, appearance, attribution);
    return visibleAppearanceFindings(appearance, attribution, targetName).length > 0;
  });

  async function save() {
    setBusy(true);
    const result = await update({
      data: {
        championshipUuid: operations.championshipUuid,
        championshipMatchUuid: operations.match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(operations.championshipRevision),
        expectedResultRevision: numberValue(operations.match.resultRevision),
        attributions,
      },
    });
    setBusy(false);

    if (result.ok) {
      onOperations(result.data);
      toast.success("Atribuições atualizadas.");
    } else {
      toast.error(result.message);
    }
  }

  return (
    <section className="border-t" aria-labelledby="eligibility-heading">
      <SectionBar
        icon={Users}
        title="Elegibilidade e atribuição"
        description={`${operations.appearances.totalCount} participações observadas`}
        action={
          operations.result ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={save}>
              <Check />
              {busy ? "Salvando" : "Salvar atribuições"}
            </Button>
          ) : null
        }
      />
      {hasFindings ? (
        <div className="border-y border-amber-400/25 bg-amber-400/5 px-4 py-3 text-xs text-amber-100">
          <ShieldAlert className="mr-2 inline size-4" />
          Há participações que ainda exigem uma decisão de atribuição. Revise cada linha.
        </div>
      ) : null}
      <div className="w-full min-w-0 divide-y sm:hidden">
        {operations.appearances.items.map((appearance, index) => (
          <article key={appearance.sourcePlayerId} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-medium">{appearance.displayName}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {appearance.sourcePlayerId}
                </div>
              </div>
              <div className="flex gap-4 text-xs">
                <div>
                  <div className="uppercase text-muted-foreground">Lado</div>
                  <div className="mt-1 font-semibold">
                    {appearance.observedSide === "a" ? "A" : "B"}
                  </div>
                </div>
                <div>
                  <div className="uppercase text-muted-foreground">Tempo</div>
                  <div className="mt-1 font-mono font-semibold tabular-nums">
                    {durationLabel(appearance.playingTimeSeconds)}
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase text-muted-foreground">Situação</div>
              <div className="mt-1">
                <AppearanceStatus
                  data={data}
                  appearance={appearance}
                  attribution={attributions[index]!}
                />
              </div>
            </div>
            <AttributionControls
              compact
              data={data}
              appearance={appearance}
              attribution={attributions[index]!}
              index={index}
              attributions={attributions}
              onAttributions={onAttributions}
            />
          </article>
        ))}
      </div>
      <div className="hidden w-full min-w-0 sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jogador observado</TableHead>
              <TableHead>Lado</TableHead>
              <TableHead>Tempo</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Atribuição oficial</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.appearances.items.map((appearance, index) => {
              const attribution = attributions[index]!;
              return (
                <TableRow key={appearance.sourcePlayerId}>
                  <TableCell>
                    <div className="font-medium">{appearance.displayName}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {appearance.sourcePlayerId}
                    </div>
                  </TableCell>
                  <TableCell>{appearance.observedSide === "a" ? "A" : "B"}</TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {durationLabel(appearance.playingTimeSeconds)}
                  </TableCell>
                  <TableCell className="min-w-0">
                    <AppearanceStatus
                      data={data}
                      appearance={appearance}
                      attribution={attribution}
                    />
                  </TableCell>
                  <TableCell className="min-w-0">
                    <AttributionControls
                      data={data}
                      appearance={appearance}
                      attribution={attribution}
                      index={index}
                      attributions={attributions}
                      onAttributions={onAttributions}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {operations.appearances.truncated ? (
        <p className="border-t px-4 py-2 text-xs text-amber-300">
          A lista está parcial. Refine o registro antes de decidir.
        </p>
      ) : null}
    </section>
  );
}

function AttributionControls({
  data,
  appearance,
  attribution,
  index,
  attributions,
  onAttributions,
  compact = false,
}: {
  data: ChampionshipWorkspaceData;
  appearance: MatchAppearance;
  attribution: AttributionDraft;
  index: number;
  attributions: AttributionDraft[];
  onAttributions: (attributions: AttributionDraft[]) => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "grid w-full gap-2" : "flex w-full min-w-0 items-center gap-2"}>
      <NativeSelect
        className="w-44 min-w-44 shrink-0"
        aria-label={`Atribuição de ${appearance.displayName}`}
        value={attribution.mode}
        onChange={(event) =>
          onAttributions(
            attributions.map((item, itemIndex) =>
              itemIndex === index
                ? {
                    ...item,
                    mode: event.target.value as typeof item.mode,
                    targetParticipantUuid:
                      event.target.value === "redirect" ? item.targetParticipantUuid : null,
                  }
                : item,
            ),
          )
        }
      >
        <NativeSelectOption value="default">Manter</NativeSelectOption>
        <NativeSelectOption value="exclude">Excluir estatísticas</NativeSelectOption>
        <NativeSelectOption value="redirect">Redirecionar</NativeSelectOption>
      </NativeSelect>
      {attribution.mode === "redirect" ? (
        <EntityPicker
          ariaLabel={`Destino de ${appearance.displayName}`}
          value={attribution.targetParticipantUuid ?? ""}
          onValueChange={(value) =>
            onAttributions(
              attributions.map((item, itemIndex) =>
                itemIndex === index
                  ? {
                      ...item,
                      targetParticipantUuid: value || null,
                    }
                  : item,
              ),
            )
          }
          placeholder="Escolha o destino"
          searchPlaceholder="Buscar participante…"
          emptyLabel="Nenhum participante ativo encontrado."
          className={compact ? "w-full" : "w-64 max-w-full min-w-0 shrink-0"}
          options={data.participants.items
            .filter((participant) => participant.status === "active")
            .map((participant) => ({
              value: participant.uuid,
              label: participant.displayName,
            }))}
        />
      ) : null}
    </div>
  );
}

function SettlementPanel({
  operations,
  attributions,
  allowedProgramUuids,
  onOperations,
}: {
  operations: MatchOperations;
  attributions: AttributionDraft[];
  allowedProgramUuids: readonly string[];
  onOperations: (operations: ChampionshipMatchOperationsData) => void;
}) {
  const preview = useServerFn(previewChampionshipMatchSettlementFn);
  const settle = useServerFn(settleChampionshipMatchFn);
  const [draft, setDraft] = useState(() => defaultSettlementDraft(operations));
  const [impact, setImpact] = useState<ChampionshipSettlementPreviewData | null>(null);
  const [impactOpen, setImpactOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const correction = Boolean(operations.result);
  const issues = validateSettlementDraft(draft, Boolean(operations.evidence));
  const [officialA, officialB] = officialScore(draft);

  async function previewDecision() {
    if (issues.length) {
      setMessage(issues.join(" "));
      return;
    }
    setBusy(true);
    setMessage(null);

    try {
      const result = await preview({
        data: {
          championshipUuid: operations.championshipUuid,
          championshipMatchUuid: operations.match.uuid,
          correction,
          settlement: settlementPayload(draft, attributions),
        },
      });
      setImpact(result);
      setImpactOpen(true);
    } catch (cause) {
      setMessage(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDecision() {
    if (!impact) return;
    setBusy(true);
    setMessage(null);
    const result = await settle({
      data: {
        championshipUuid: operations.championshipUuid,
        championshipMatchUuid: operations.match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(impact.championshipRevision),
        expectedEvidenceRevision: numberValue(impact.evidenceRevision),
        expectedResultRevision: numberValue(impact.resultRevision),
        correction,
        previewHash: impact.previewHash,
        settlement: settlementPayload(draft, attributions),
      },
    });
    setBusy(false);

    if (result.ok) {
      onOperations(result.data);
      setImpactOpen(false);
      setImpact(null);
      setMessage(correction ? "Correção aplicada." : "Resultado registrado.");
    } else {
      setImpactOpen(false);
      setMessage(result.message);
    }
  }

  return (
    <section className="min-w-0" aria-labelledby="settlement-heading">
      <SectionBar
        icon={Sparkles}
        title={correction ? "Corrigir resultado" : "Registrar resultado"}
        description="Resultado, estatísticas e progressão em uma decisão"
      />
      <div className="space-y-5 p-4 sm:p-5">
        <Field label="Método">
          <NativeSelect
            className="min-w-52"
            value={draft.method}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                method: event.target.value as SettlementMethod,
              }))
            }
          >
            {(
              [
                "played",
                "manual",
                "full-forfeit",
                "mid-game-forfeit",
                "double-forfeit",
                "historical",
              ] as const
            ).map((method) => (
              <NativeSelectOption key={method} value={method}>
                {methodLabel(method)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <p className="-mt-3 text-xs text-muted-foreground">{methodDescription(draft.method)}</p>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            Camadas do placar
          </div>
          <div className="overflow-hidden border">
            <ScoreLayerRow
              label="Jogado"
              sideA={draft.sideAPlayedScore}
              sideB={draft.sideBPlayedScore}
              editable
              onSideA={(score) => setDraft((current) => ({ ...current, sideAPlayedScore: score }))}
              onSideB={(score) => setDraft((current) => ({ ...current, sideBPlayedScore: score }))}
            />
            <ScoreLayerRow
              label="Administrativo"
              sideA={draft.sideAAdministrativeScore}
              sideB={draft.sideBAdministrativeScore}
              editable
              onSideA={(score) =>
                setDraft((current) => ({
                  ...current,
                  sideAAdministrativeScore: score,
                }))
              }
              onSideB={(score) =>
                setDraft((current) => ({
                  ...current,
                  sideBAdministrativeScore: score,
                }))
              }
            />
            <ScoreLayerRow label="Oficial" sideA={officialA} sideB={officialB} />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Pontos administrativos contam para a equipe, nunca para estatísticas individuais.
          </p>
          {draft.sideAAdministrativeScore > 0 || draft.sideBAdministrativeScore > 0 ? (
            <p className="mt-2 text-xs text-amber-200">
              Pontos administrativos registram um ajuste oficial da organização. Métodos
              compatíveis: Manual, Desistência durante o jogo ou Registro histórico.
            </p>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <OutcomeField
            label={operations.match.sideA?.abbreviation ?? "Lado A"}
            value={draft.sideAOutcome}
            onChange={(outcome) => setDraft((current) => ({ ...current, sideAOutcome: outcome }))}
          />
          <OutcomeField
            label={operations.match.sideB?.abbreviation ?? "Lado B"}
            value={draft.sideBOutcome}
            onChange={(outcome) => setDraft((current) => ({ ...current, sideBOutcome: outcome }))}
          />
        </div>
        {evidenceUsesUnconfiguredProgram(operations, allowedProgramUuids) ? (
          <Field label="Justificativa para programa não autorizado">
            <Textarea
              rows={2}
              value={draft.programMismatchReason ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  programMismatchReason: event.target.value || null,
                }))
              }
            />
          </Field>
        ) : null}
        <Field label="Nota interna">
          <Textarea
            rows={3}
            value={draft.note ?? ""}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                note: event.target.value || null,
              }))
            }
          />
        </Field>
        {operations.evidence ? (
          <label
            htmlFor="evidence-quality-reviewed"
            className="flex items-start gap-3 border bg-card/35 p-3 text-sm"
          >
            <Checkbox
              id="evidence-quality-reviewed"
              className="mt-0.5"
              checked={draft.evidenceQualityReviewed}
              onCheckedChange={(value) =>
                setDraft((current) => ({
                  ...current,
                  evidenceQualityReviewed: value === true,
                }))
              }
            />
            <span>
              <span className="block font-medium">Qualidade da evidência revisada</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                Replay ausente ou malformado não impede a decisão.
              </span>
            </span>
          </label>
        ) : null}
        {issues.length ? (
          <ul className="space-y-1 text-xs text-amber-300">
            {issues.map((issue) => (
              <li key={issue}>• {issue}</li>
            ))}
          </ul>
        ) : null}
        {message ? <InlineMessage message={message} /> : null}
        <Button className="w-full" disabled={busy || issues.length > 0} onClick={previewDecision}>
          {correction ? <History /> : <Check />}
          {busy
            ? "Calculando impacto"
            : correction
              ? "Revisar impacto da correção"
              : "Revisar e registrar"}
        </Button>
      </div>
      <SettlementImpactDialog
        open={impactOpen}
        onOpenChange={setImpactOpen}
        preview={impact}
        correction={correction}
        busy={busy}
        onConfirm={confirmDecision}
      />
    </section>
  );
}

function SettlementImpactDialog({
  open,
  onOpenChange,
  preview,
  correction,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preview: ChampionshipSettlementPreviewData | null;
  correction: boolean;
  busy: boolean;
  onConfirm: () => void;
}) {
  if (!preview) return null;

  const findings = settlementPreviewFindings(preview);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {correction ? "Impacto completo da correção" : "Confirmar resultado"}
          </DialogTitle>
          <DialogDescription>{correctionImpactLabel(preview)}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-px border bg-border sm:grid-cols-3">
          <EvidenceDatum
            label="Placar oficial"
            value={`${preview.result.sideAOfficialScore} – ${preview.result.sideBOfficialScore}`}
          />
          <EvidenceDatum
            label="Progressões"
            value={`${preview.progression.length} destinos atualizados`}
          />
          <EvidenceDatum label="Participações" value={`${preview.appearances.length} revisadas`} />
        </div>
        {findings.length ? (
          <div className="divide-y border">
            {findings.map((finding) => (
              <div key={`${finding.code}:${finding.message}`} className="flex gap-3 p-3 text-sm">
                <AlertTriangle
                  className={`mt-0.5 size-4 ${
                    finding.severity === "blocking"
                      ? "text-red-300"
                      : finding.severity === "warning"
                        ? "text-amber-300"
                        : "text-muted-foreground"
                  }`}
                />
                <span>{finding.message}</span>
              </div>
            ))}
          </div>
        ) : (
          <Alert>
            <Check />
            <AlertTitle>Sem pendências</AlertTitle>
            <AlertDescription>
              O resultado e todas as rotas podem ser aplicados nesta revisão.
            </AlertDescription>
          </Alert>
        )}
        {preview.downstream.length ? (
          <div className="max-h-52 overflow-y-auto border">
            {preview.downstream.map((item) => (
              <div
                key={item.matchUuid}
                className="grid grid-cols-[1fr_auto] gap-3 border-b px-3 py-2 text-sm last:border-b-0"
              >
                <span>{item.label}</span>
                <span className="text-xs text-muted-foreground">
                  {item.hadResult ? "resultado removido" : "rota recalculada"}
                  {item.hadEvidence ? " · evidência liberada" : ""}
                  {item.schedulePreserved ? " · horário mantido" : ""}
                </span>
              </div>
            ))}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button
            variant={
              findings.some((finding) => finding.severity === "blocking")
                ? "destructive"
                : "default"
            }
            disabled={busy || findings.some((finding) => finding.severity === "blocking")}
            onClick={onConfirm}
          >
            <Check />
            {busy ? "Aplicando" : correction ? "Aplicar correção" : "Registrar resultado"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function settlementPreviewFindings(preview: ChampionshipSettlementPreviewData) {
  const appearanceByFindingCode = new Map<
    string,
    ChampionshipSettlementPreviewData["appearances"][number]
  >();

  for (const appearance of preview.appearances) {
    for (const finding of appearance.findings) {
      appearanceByFindingCode.set(`${finding}:${appearance.sourcePlayerId}`, appearance);
    }
  }

  const findings = preview.findings.filter((finding) => {
    const appearance = appearanceByFindingCode.get(finding.code);
    return !appearance || appearance.attribution.mode === "default";
  });
  const resolutions = preview.appearances.flatMap((appearance) => {
    if (appearance.attribution.mode === "redirect" && appearance.attribution.targetDisplayName) {
      return [
        {
          code: `attribution:${appearance.sourcePlayerId}`,
          severity: "info" as const,
          message: `${appearance.displayName}: atribuição redirecionada para ${appearance.attribution.targetDisplayName}.`,
        },
      ];
    }
    if (appearance.attribution.mode === "exclude") {
      return [
        {
          code: `attribution:${appearance.sourcePlayerId}`,
          severity: "info" as const,
          message: `${appearance.displayName}: estatísticas excluídas desta edição.`,
        },
      ];
    }
    return [];
  });

  return [...findings, ...resolutions];
}

function ResultHistory({ operations }: { operations: MatchOperations }) {
  if (!operations.resultHistory.items.length) return null;

  return (
    <section className="border-t">
      <SectionBar
        icon={History}
        title="Histórico de resultados"
        description={`${operations.resultHistory.totalCount} revisões preservadas`}
      />
      <div className="divide-y sm:hidden">
        {operations.resultHistory.items.map((result) => (
          <article key={result.uuid} className="space-y-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono font-semibold">Revisão #{result.revision}</div>
                <div className="mt-1 text-sm">{methodLabel(result.method)}</div>
              </div>
              <Badge variant="outline">
                {result.state === "current"
                  ? "Atual"
                  : result.state === "superseded"
                    ? "Substituído"
                    : "Invalidado"}
              </Badge>
            </div>
            <div className="grid grid-cols-3 divide-x border text-center">
              <HistoryScore
                label="Jogado"
                value={`${result.sideAPlayedScore} – ${result.sideBPlayedScore}`}
              />
              <HistoryScore
                label="Administrativo"
                value={`+${result.sideAAdministrativeScore} – +${result.sideBAdministrativeScore}`}
              />
              <HistoryScore
                label="Oficial"
                value={`${result.sideAOfficialScore} – ${result.sideBOfficialScore}`}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Decidido em {formatDateTime(result.settledAt)}
            </div>
          </article>
        ))}
      </div>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Revisão</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Jogado</TableHead>
              <TableHead>Administrativo</TableHead>
              <TableHead>Oficial</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Decidido em</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {operations.resultHistory.items.map((result) => (
              <TableRow key={result.uuid}>
                <TableCell className="font-mono">#{result.revision}</TableCell>
                <TableCell>{methodLabel(result.method)}</TableCell>
                <TableCell className="font-mono">
                  {result.sideAPlayedScore} – {result.sideBPlayedScore}
                </TableCell>
                <TableCell className="font-mono">
                  +{result.sideAAdministrativeScore} – +{result.sideBAdministrativeScore}
                </TableCell>
                <TableCell className="font-mono font-semibold">
                  {result.sideAOfficialScore} – {result.sideBOfficialScore}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {result.state === "current"
                      ? "Atual"
                      : result.state === "superseded"
                        ? "Substituído"
                        : "Invalidado"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDateTime(result.settledAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function HistoryScore({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-2 py-2">
      <div className="truncate text-[10px] uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-xs font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ScoreLayerRow({
  label,
  sideA,
  sideB,
  editable = false,
  onSideA,
  onSideB,
}: {
  label: string;
  sideA: number;
  sideB: number;
  editable?: boolean;
  onSideA?: (score: number) => void;
  onSideB?: (score: number) => void;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_72px_18px_72px] items-center gap-2 border-b px-3 py-2 last:border-b-0 ${
        label === "Oficial" ? "bg-emerald-400/8" : "bg-background"
      }`}
    >
      <span className="text-xs font-medium">{label}</span>
      {editable ? (
        <Input
          aria-label={`${label} lado A`}
          className="h-8 text-center font-mono"
          type="number"
          min={0}
          value={sideA}
          onChange={(event) => onSideA?.(Number(event.target.value))}
        />
      ) : (
        <span className="text-center font-mono text-lg font-semibold">{sideA}</span>
      )}
      <span className="text-center text-muted-foreground">–</span>
      {editable ? (
        <Input
          aria-label={`${label} lado B`}
          className="h-8 text-center font-mono"
          type="number"
          min={0}
          value={sideB}
          onChange={(event) => onSideB?.(Number(event.target.value))}
        />
      ) : (
        <span className="text-center font-mono text-lg font-semibold">{sideB}</span>
      )}
    </div>
  );
}

function OutcomeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: MatchOutcome;
  onChange: (outcome: MatchOutcome) => void;
}) {
  return (
    <Field label={`Resultado · ${label}`}>
      <NativeSelect
        value={value}
        onChange={(event) => onChange(event.target.value as MatchOutcome)}
      >
        {(["win", "loss", "draw"] as const).map((outcome) => (
          <NativeSelectOption key={outcome} value={outcome}>
            {outcomeLabel(outcome)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
  );
}

function EvidenceDatum({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-background px-4 py-3">
      <div className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 truncate text-xs">{value}</div>
    </div>
  );
}

function SectionBar({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Film;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="size-4 text-primary" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="truncate text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <Alert variant="destructive">
      <AlertTriangle />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function InlineMessage({ message }: { message: string }) {
  const error = /não|erro|conflito|inválid/i.test(message);
  return error ? (
    <InlineError message={message} />
  ) : (
    <Alert>
      <Check />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

function MatchCockpitSkeleton() {
  return (
    <div className="space-y-5 p-6" aria-label="Carregando operação do jogo">
      <div className="flex justify-between">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-16 w-72" />
      </div>
      <Skeleton className="aspect-video w-full max-w-4xl" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
    </div>
  );
}

function settlementPayload(draft: SettlementDraft, attributions: AttributionDraft[]) {
  return {
    method: draft.method,
    sideAPlayedScore: draft.sideAPlayedScore,
    sideBPlayedScore: draft.sideBPlayedScore,
    sideAAdministrativeScore: draft.sideAAdministrativeScore,
    sideBAdministrativeScore: draft.sideBAdministrativeScore,
    sideAOutcome: draft.sideAOutcome,
    sideBOutcome: draft.sideBOutcome,
    evidenceQualityReviewed: draft.evidenceQualityReviewed,
    programMismatchReason: draft.programMismatchReason,
    note: draft.note,
    attributions,
  };
}

function attributionDrafts(operations: MatchOperations): AttributionDraft[] {
  return operations.appearances.items.map((appearance) => ({
    sourcePlayerId: appearance.sourcePlayerId,
    mode: appearance.attribution.mode,
    targetParticipantUuid: appearance.attribution.targetParticipantUuid,
    reason: appearance.attribution.reason,
  }));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}
