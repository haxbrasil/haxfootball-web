import { useEffect, useId, useMemo, useState, type CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarClock,
  Bell,
  Check,
  CircleAlert,
  Clock3,
  GitBranch,
  LoaderCircle,
  MessageSquareText,
  Route,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  TableProperties,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { ChampionshipDoubleEliminationPreview } from "@haxbrasil/haxfootball-api-sdk";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
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
import { Textarea } from "#/components/ui/textarea";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import type {
  ChampionshipMatchSchedulingData,
  ChampionshipSpotPlacementPreviewData,
  ChampionshipWorkspaceData,
  PublicChampionshipDetail,
  Serializable,
} from "#/server/api/championship-api";
import {
  generateChampionshipDoubleEliminationFn,
  generateChampionshipSingleEliminationFn,
  placeChampionshipSpotFn,
  previewChampionshipSpotPlacementFn,
  previewChampionshipDoubleEliminationFn,
  scheduleChampionshipLogicalMatchFn,
  authorizeChampionshipLatePlayFn,
  createChampionshipScheduleProposalFn,
  decideChampionshipScheduleProposalFn,
  getChampionshipMatchSchedulingFn,
  remindChampionshipScheduleFn,
  revokeChampionshipLatePlayFn,
} from "#/server/api/championship-format-functions";
import {
  buildBracketLayout,
  focusedTeamMatchUuids,
  focusedRoute,
  numberValue,
  roundLabel,
  spotOccupancy,
  type FormatMatch,
  type FormatProjection,
  type FormatStage,
} from "./format-workspace-model";
import { StandingsWorkspace } from "./standings-workspace";

export type FormatData = Pick<
  ChampionshipWorkspaceData | PublicChampionshipDetail,
  "championship" | "teams" | "format"
> &
  Partial<Pick<ChampionshipWorkspaceData, "roomPrograms">>;

export function FormatWorkspace({
  data,
  mode,
  canNegotiateSchedule = false,
}: {
  data: FormatData;
  mode: "admin" | "public";
  canNegotiateSchedule?: boolean;
}) {
  const [projection, setProjection] = useState(data.format);
  const [stageUuid, setStageUuid] = useState(data.format.stages.items[0]?.uuid ?? "");
  const [view, setView] = useState<"bracket" | "table">("bracket");
  const [focusTeam, setFocusTeam] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [generatorOpen, setGeneratorOpen] = useState(false);

  useEffect(() => setProjection(data.format), [data.format]);
  const stage =
    projection.stages.items.find((candidate) => candidate.uuid === stageUuid) ??
    projection.stages.items[0] ??
    null;

  if (!stage) {
    return (
      <>
        <FormatEmptyState admin={mode === "admin"} onGenerate={() => setGeneratorOpen(true)} />
        <EliminationGenerator
          data={data}
          projection={projection}
          open={generatorOpen}
          onOpenChange={setGeneratorOpen}
          onProjection={(next) => {
            setProjection(next);
            setStageUuid(next.stages.items.at(-1)?.uuid ?? "");
          }}
        />
      </>
    );
  }

  if (stage.engine === "standings") {
    return (
      <>
        <StandingsWorkspace
          data={data}
          projection={projection}
          stage={stage}
          admin={mode === "admin"}
          onProjection={setProjection}
          onStage={setStageUuid}
          onGenerateElimination={() => setGeneratorOpen(true)}
        />
        <EliminationGenerator
          data={data}
          projection={projection}
          open={generatorOpen}
          onOpenChange={setGeneratorOpen}
          onProjection={(next) => {
            setProjection(next);
            setStageUuid(next.stages.items.at(-1)?.uuid ?? "");
          }}
        />
      </>
    );
  }

  return (
    <div className="space-y-5">
      <FormatToolbar
        data={data}
        projection={projection}
        stage={stage}
        stageUuid={stage.uuid}
        view={view}
        scale={scale}
        focusTeam={focusTeam}
        admin={mode === "admin"}
        onStage={setStageUuid}
        onView={setView}
        onScale={setScale}
        onFocus={setFocusTeam}
        onGenerate={() => setGeneratorOpen(true)}
      />
      {projection.stages.truncated ||
      projection.spots.truncated ||
      projection.matches.truncated ||
      projection.routes.truncated ? (
        <Alert>
          <CircleAlert />
          <AlertDescription>
            Esta visualização atingiu o limite de {projection.limit} itens. Refine a etapa antes de
            editar.
          </AlertDescription>
        </Alert>
      ) : null}
      {view === "bracket" ? (
        <BracketCanvas
          data={data}
          projection={projection}
          stage={stage}
          scale={scale}
          focusTeam={focusTeam}
          admin={mode === "admin"}
          negotiationEnabled={mode === "admin" || canNegotiateSchedule}
          onProjection={setProjection}
        />
      ) : (
        <BracketTable
          data={data}
          projection={projection}
          stage={stage}
          admin={mode === "admin"}
          negotiationEnabled={mode === "admin" || canNegotiateSchedule}
          onProjection={setProjection}
        />
      )}
      <CompetitionRoundRail projection={projection} stage={stage} />
      {mode === "admin" ? (
        <TeamBench data={data} projection={projection} stage={stage} onProjection={setProjection} />
      ) : null}
      <EliminationGenerator
        data={data}
        projection={projection}
        open={generatorOpen}
        onOpenChange={setGeneratorOpen}
        onProjection={(next) => {
          setProjection(next);
          setStageUuid(next.stages.items.at(-1)?.uuid ?? "");
        }}
      />
    </div>
  );
}

function FormatToolbar({
  data,
  projection,
  stage,
  view,
  scale,
  focusTeam,
  admin,
  onStage,
  onView,
  onScale,
  onFocus,
  onGenerate,
}: {
  data: FormatData;
  projection: FormatProjection;
  stage: FormatStage;
  stageUuid: string;
  view: "bracket" | "table";
  scale: number;
  focusTeam: string | null;
  admin: boolean;
  onStage: (uuid: string) => void;
  onView: (view: "bracket" | "table") => void;
  onScale: (scale: number) => void;
  onFocus: (teamUuid: string | null) => void;
  onGenerate: () => void;
}) {
  const stageSelectId = useId();
  const focusSelectId = useId();

  return (
    <header className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-4 px-4 py-4 xl:flex-row xl:items-end sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            <h2 className="font-semibold">Formato e classificação</h2>
            <Badge variant="outline">{engineLabel(stage.engine)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {projection.matches.items.filter((match) => match.stageUuid === stage.uuid).length}{" "}
            partidas · {projection.routes.items.length} rotas ativas ou auditadas
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-end">
          <div className="space-y-1.5">
            <Label htmlFor={stageSelectId}>Etapa</Label>
            <NativeSelect
              id={stageSelectId}
              value={stage.uuid}
              onChange={(event) => onStage(event.target.value)}
            >
              {projection.stages.items.map((item) => (
                <NativeSelectOption key={item.uuid} value={item.uuid}>
                  {item.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={focusSelectId}>Traçar equipe</Label>
            <NativeSelect
              id={focusSelectId}
              value={focusTeam ?? ""}
              onChange={(event) => onFocus(event.target.value || null)}
            >
              <NativeSelectOption value="">Todas as rotas</NativeSelectOption>
              {data.teams.items.map((team) => (
                <NativeSelectOption key={team.uuid} value={team.uuid}>
                  {team.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="flex h-9 items-center border">
            <Button
              variant="ghost"
              size="icon"
              title="Diminuir zoom"
              onClick={() => onScale(Math.max(0.65, scale - 0.1))}
            >
              <ZoomOut />
            </Button>
            <span className="w-14 text-center text-xs tabular-nums">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              title="Aumentar zoom"
              onClick={() => onScale(Math.min(1.35, scale + 0.1))}
            >
              <ZoomIn />
            </Button>
          </div>
          <div className="flex h-9 items-center border p-0.5">
            <Button
              variant={view === "bracket" ? "secondary" : "ghost"}
              size="icon"
              title="Visualização da chave"
              onClick={() => onView("bracket")}
            >
              <Route />
            </Button>
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="icon"
              title="Visualização em tabela"
              onClick={() => onView("table")}
            >
              <TableProperties />
            </Button>
          </div>
          {admin ? (
            <Button onClick={onGenerate}>
              <Sparkles />
              Nova chave
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function BracketCanvas({
  data,
  projection,
  stage,
  scale,
  focusTeam,
  admin,
  negotiationEnabled,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  stage: FormatStage;
  scale: number;
  focusTeam: string | null;
  admin: boolean;
  negotiationEnabled: boolean;
  onProjection: (format: FormatProjection) => void;
}) {
  const layout = useMemo(
    () => buildBracketLayout(projection, stage.uuid),
    [projection, stage.uuid],
  );
  const focusedMatches = useMemo(
    () => focusedTeamMatchUuids(projection, stage.uuid, focusTeam),
    [focusTeam, projection, stage.uuid],
  );
  const [selectedMatch, setSelectedMatch] = useState<FormatMatch | null>(null);

  if (layout.nodes.length === 0) {
    return (
      <div className="bfl-panel rounded-xl border px-6 py-16 text-center text-sm text-muted-foreground">
        Esta etapa é manual e ainda não tem partidas posicionadas.
      </div>
    );
  }

  return (
    <>
      <section className="bfl-panel relative overflow-auto rounded-xl border">
        <div className="sticky top-0 left-0 z-10 flex w-fit gap-4 p-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-px w-5 bg-primary" /> vencedor
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-px w-5 border-t border-dashed border-amber-400" /> perdedor
          </span>
          {stage.engine === "double-elimination" ? (
            <span className="inline-flex items-center gap-1">
              <span className="h-px w-5 border-t border-dotted border-cyan-400" /> reset condicional
            </span>
          ) : null}
          {admin ? <span>Arraste uma equipe para trocar um spot</span> : null}
        </div>
        <div
          className="origin-top-left"
          style={{
            width: layout.width * scale + 48,
            height: layout.height * scale + 48,
          }}
        >
          <div
            className="relative m-6 origin-top-left"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `scale(${scale})`,
            }}
          >
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              width={layout.width}
              height={layout.height}
              aria-hidden="true"
            >
              {layout.edges.map((edge) => {
                const focus = focusedMatches
                  ? focusedMatches.has(edge.source.match.uuid) &&
                    (!edge.destination || focusedMatches.has(edge.destination.match.uuid))
                    ? "focused"
                    : "muted"
                  : focusedRoute(edge, null);

                return (
                  <path
                    key={edge.route.uuid}
                    d={edge.path}
                    fill="none"
                    stroke={
                      focus === "muted"
                        ? "hsl(var(--muted-foreground))"
                        : edge.route.sourceOutcome === "loser"
                          ? "#f59e0b"
                          : edge.route.condition !== "always"
                            ? "#22d3ee"
                            : "#34d399"
                    }
                    strokeWidth={focus === "focused" ? 3 : 1.5}
                    strokeDasharray={
                      edge.route.sourceOutcome === "loser"
                        ? "6 5"
                        : edge.route.condition !== "always"
                          ? "2 5"
                          : undefined
                    }
                    opacity={edge.route.state === "disabled" ? 0.12 : focus === "muted" ? 0.2 : 0.8}
                  />
                );
              })}
            </svg>
            {layout.sections.map((section) => (
              <div
                key={section.key}
                className="absolute top-0 text-xs font-semibold uppercase text-muted-foreground"
                style={{ left: section.x, top: section.y }}
              >
                {section.label}
              </div>
            ))}
            {layout.nodes.map((node) => (
              <BracketMatchNode
                key={node.match.uuid}
                data={data}
                projection={projection}
                match={node.match}
                focused={focusedMatches?.has(node.match.uuid) ?? false}
                muted={focusedMatches ? !focusedMatches.has(node.match.uuid) : false}
                admin={admin}
                style={{
                  left: node.x,
                  top: node.y + 24,
                  width: node.width,
                  height: node.height,
                }}
                onProjection={onProjection}
                onSchedule={() => setSelectedMatch(node.match)}
              />
            ))}
          </div>
        </div>
      </section>
      <ScheduleMatchDialog
        data={data}
        projection={projection}
        match={selectedMatch}
        readOnly={!admin}
        negotiationEnabled={negotiationEnabled}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
        onProjection={(next) => {
          onProjection(next);
          setSelectedMatch(
            next.matches.items.find((candidate) => candidate.uuid === selectedMatch?.uuid) ?? null,
          );
        }}
      />
    </>
  );
}

function BracketMatchNode({
  data,
  projection,
  match,
  focused,
  muted,
  admin,
  style,
  onProjection,
  onSchedule,
}: {
  data: FormatData;
  projection: FormatProjection;
  match: FormatMatch;
  focused: boolean;
  muted: boolean;
  admin: boolean;
  style: CSSProperties;
  onProjection: (format: FormatProjection) => void;
  onSchedule: () => void;
}) {
  const isBye = match.matchRulesOverride?.bye === true;

  return (
    <article
      className={`absolute border border-l-2 bg-background shadow-sm transition-opacity ${
        match.bracket === "losers"
          ? "border-l-amber-400"
          : match.bracket === "grand-final"
            ? "border-l-cyan-400"
            : "border-l-primary"
      } ${focused ? "border-primary ring-1 ring-primary/40" : ""} ${muted ? "opacity-35" : ""}`}
      style={style}
    >
      <div className="flex h-8 items-center justify-between border-b px-2.5">
        <span className="min-w-0">
          <span className="block truncate text-[11px] font-semibold uppercase">{match.label}</span>
          {match.bracket !== "none" ? (
            <span className="block text-[9px] text-muted-foreground">
              {bracketLabel(match.bracket)}
            </span>
          ) : null}
        </span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          title={admin ? "Agendar partida" : "Detalhes da partida"}
          onClick={onSchedule}
        >
          <CalendarClock className="size-3.5" />
        </button>
      </div>
      <BracketTeamSpot
        data={data}
        projection={projection}
        spotUuid={match.sideA.spotUuid}
        team={match.sideA.team}
        admin={admin}
        onProjection={onProjection}
      />
      <BracketTeamSpot
        data={data}
        projection={projection}
        spotUuid={match.sideB.spotUuid}
        team={match.sideB.team}
        admin={admin}
        onProjection={onProjection}
      />
      {isBye ? (
        <span className="absolute right-2 bottom-1 text-[10px] font-semibold uppercase text-primary">
          bye
        </span>
      ) : null}
    </article>
  );
}

function BracketTeamSpot({
  data,
  projection,
  spotUuid,
  team,
  admin,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  spotUuid: string;
  team: FormatMatch["sideA"]["team"];
  admin: boolean;
  onProjection: (format: FormatProjection) => void;
}) {
  const place = useServerFn(placeChampionshipSpotFn);
  const previewPlacement = useServerFn(previewChampionshipSpotPlacementFn);
  const [busy, setBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedTeamUuid, setSelectedTeamUuid] = useState(team?.uuid ?? "");
  const [impact, setImpact] = useState<ChampionshipSpotPlacementPreviewData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const spot = projection.spots.items.find((candidate) => candidate.uuid === spotUuid);

  useEffect(() => setSelectedTeamUuid(team?.uuid ?? ""), [team?.uuid]);

  async function review(teamUuid: string | null) {
    if (!admin || !spot || busy || team?.uuid === teamUuid) {
      return;
    }
    setPickerOpen(true);
    setBusy(true);
    setMessage(null);
    setImpact(null);
    setSelectedTeamUuid(teamUuid ?? "");
    const source = teamUuid
      ? projection.spots.items.find(
          (candidate) =>
            candidate.stageUuid === spot.stageUuid &&
            candidate.currentTeam?.uuid === teamUuid &&
            candidate.uuid !== spot.uuid,
        )
      : undefined;
    try {
      const result = await previewPlacement({
        data: {
          championshipUuid: data.championship.uuid,
          spotUuid: spot.uuid,
          teamId: teamUuid,
          sourceSpotId: source?.uuid,
        },
      });
      if (result.ok) {
        setImpact(result.data);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível calcular o impacto da alteração.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    if (!admin || !spot || !impact || busy) return;
    setBusy(true);
    setMessage(null);
    const currentTarget = projection.spots.items.find(
      (candidate) => candidate.uuid === impact.targetSpot.uuid,
    );
    const currentSource = impact.sourceSpot
      ? projection.spots.items.find((candidate) => candidate.uuid === impact.sourceSpot?.uuid)
      : null;
    if (!currentTarget || (impact.sourceSpot && !currentSource)) {
      setBusy(false);
      setImpact(null);
      setMessage("A chave mudou. Revise a alteração novamente.");
      return;
    }
    const result = await place({
      data: {
        championshipUuid: data.championship.uuid,
        spotUuid: currentTarget.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(projection.championshipRevision),
        expectedSpotRevision: numberValue(currentTarget.revision),
        teamId: selectedTeamUuid || null,
        sourceSpotId: currentSource?.uuid,
        expectedSourceSpotRevision: currentSource ? numberValue(currentSource.revision) : undefined,
        confirmedImpactMatchUuids: impact.affectedMatches.map((match) => match.matchUuid),
        reason: selectedTeamUuid
          ? "Posicionamento manual na chave"
          : "Spot liberado manualmente na chave",
      },
    });

    setBusy(false);
    if (result.ok) {
      onProjection(result.data);
      setPickerOpen(false);
      setImpact(null);
    } else {
      setMessage(result.message);
      setImpact(null);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={!admin || busy}
        className={`flex h-9 w-full items-center gap-2 border-b px-2.5 text-left last:border-b-0 ${
          admin ? "hover:bg-muted/40 focus-visible:bg-muted/40" : "disabled:opacity-100"
        }`}
        title={admin ? "Escolher equipe para este spot" : undefined}
        onClick={() => setPickerOpen(true)}
        onDragOver={admin ? (event) => event.preventDefault() : undefined}
        onDrop={
          admin
            ? (event) => {
                event.preventDefault();
                void review(event.dataTransfer.getData("application/x-championship-team"));
              }
            : undefined
        }
      >
        <TeamMark team={team} />
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {busy ? "Movendo…" : (team?.name ?? "A definir")}
        </span>
        {team ? (
          <span className="text-[10px] text-muted-foreground">{team.abbreviation}</span>
        ) : null}
      </button>
      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) {
            setImpact(null);
            setMessage(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Posicionar equipe</DialogTitle>
            <DialogDescription>
              Escolha a ocupante de {spot?.label ?? "este spot"}. Uma equipe já posicionada será
              movida automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor={`spot-team-${spotUuid}`}>Equipe</Label>
            <NativeSelect
              id={`spot-team-${spotUuid}`}
              value={selectedTeamUuid}
              onChange={(event) => {
                setSelectedTeamUuid(event.target.value);
                setImpact(null);
                setMessage(null);
              }}
            >
              <NativeSelectOption value="">A definir</NativeSelectOption>
              {data.teams.items.map((candidate) => (
                <NativeSelectOption key={candidate.uuid} value={candidate.uuid}>
                  {candidate.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          {impact ? <SpotPlacementImpact impact={impact} /> : null}
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPickerOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={busy || selectedTeamUuid === (team?.uuid ?? "")}
              onClick={() => (impact ? void confirm() : void review(selectedTeamUuid || null))}
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <Check />}
              {busy ? "Calculando…" : impact ? "Confirmar alteração" : "Revisar impacto"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function BracketTable({
  data,
  projection,
  stage,
  admin,
  negotiationEnabled,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  stage: FormatStage;
  admin: boolean;
  negotiationEnabled: boolean;
  onProjection: (format: FormatProjection) => void;
}) {
  const matches = projection.matches.items.filter((match) => match.stageUuid === stage.uuid);
  const [selectedMatch, setSelectedMatch] = useState<FormatMatch | null>(null);

  return (
    <>
      <div className="overflow-x-auto border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fase</TableHead>
              <TableHead>Partida</TableHead>
              <TableHead>Equipe A</TableHead>
              <TableHead>Equipe B</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead>Programa</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {matches.map((match) => (
              <TableRow key={match.uuid}>
                <TableCell>
                  <span className="block text-xs text-muted-foreground">
                    {bracketLabel(match.bracket)}
                  </span>
                  {match.bracketRound
                    ? roundLabel(
                        numberValue(match.bracketRound),
                        stageRoundCount(
                          matches.filter((candidate) => candidate.bracket === match.bracket),
                        ),
                      )
                    : "Manual"}
                </TableCell>
                <TableCell className="font-medium">{match.label}</TableCell>
                <TableCell>{match.sideA.team?.name ?? "A definir"}</TableCell>
                <TableCell>{match.sideB.team?.name ?? "A definir"}</TableCell>
                <TableCell>
                  {projection.competitionRounds.items.find(
                    (round) => round.uuid === match.competitionRoundUuid,
                  )?.name ?? "Sem período"}
                </TableCell>
                <TableCell>
                  {match.scheduledAt ? formatDateTime(match.scheduledAt) : "A definir"}
                </TableCell>
                <TableCell>{match.roomProgram?.name ?? "Padrão herdado"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    title={admin ? "Editar agenda" : "Ver agenda"}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <CalendarClock />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {stage.engine === "double-elimination" ? (
        <ProgressionRouteTable projection={projection} stage={stage} />
      ) : null}
      <ScheduleMatchDialog
        data={data}
        projection={projection}
        match={selectedMatch}
        readOnly={!admin}
        negotiationEnabled={negotiationEnabled}
        onOpenChange={(open) => !open && setSelectedMatch(null)}
        onProjection={(next) => {
          onProjection(next);
          setSelectedMatch(
            next.matches.items.find((candidate) => candidate.uuid === selectedMatch?.uuid) ?? null,
          );
        }}
      />
    </>
  );
}

function ProgressionRouteTable({
  projection,
  stage,
}: {
  projection: FormatProjection;
  stage: FormatStage;
}) {
  const stageMatches = projection.matches.items.filter((match) => match.stageUuid === stage.uuid);
  const matchByUuid = new Map(stageMatches.map((match) => [match.uuid, match]));
  const spotByUuid = new Map(
    projection.spots.items
      .filter((spot) => spot.stageUuid === stage.uuid)
      .map((spot) => [spot.uuid, spot]),
  );
  const routes = projection.routes.items.filter(
    (route) => route.sourceMatchUuid !== null && matchByUuid.has(route.sourceMatchUuid),
  );

  return (
    <section className="mt-5">
      <div className="mb-2 px-1">
        <h3 className="text-xs font-semibold uppercase">Mapa de progressão</h3>
        <p className="text-xs text-muted-foreground">
          Alternativa textual às conexões visuais da chave.
        </p>
      </div>
      <div className="overflow-x-auto border-y">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Origem</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead>Destino</TableHead>
              <TableHead>Condição</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {routes.map((route) => (
              <TableRow key={route.uuid}>
                <TableCell className="font-medium">
                  {matchByUuid.get(route.sourceMatchUuid!)?.label ?? "Partida"}
                </TableCell>
                <TableCell>{route.sourceOutcome === "loser" ? "Perdedor" : "Vencedor"}</TableCell>
                <TableCell>
                  {spotByUuid.get(route.destinationSpotUuid)?.label ?? "Spot de destino"}
                </TableCell>
                <TableCell>{routeConditionLabel(route.condition)}</TableCell>
                <TableCell>
                  <Badge variant={route.state === "active" ? "secondary" : "outline"}>
                    {route.state === "active" ? "Ativa" : "Desativada"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function TeamBench({
  data,
  projection,
  stage,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  stage: FormatStage;
  onProjection: (format: FormatProjection) => void;
}) {
  const place = useServerFn(placeChampionshipSpotFn);
  const previewPlacement = useServerFn(previewChampionshipSpotPlacementFn);
  const occupied = spotOccupancy(projection, stage.uuid);
  const [removalSpotUuid, setRemovalSpotUuid] = useState<string | null>(null);
  const [impact, setImpact] = useState<ChampionshipSpotPlacementPreviewData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reviewRemoval(teamUuid: string) {
    const source = occupied.get(teamUuid);
    if (!source || busy) return;
    setRemovalSpotUuid(source.uuid);
    setImpact(null);
    setMessage(null);
    setBusy(true);
    const preview = await previewPlacement({
      data: {
        championshipUuid: data.championship.uuid,
        spotUuid: source.uuid,
        teamId: null,
      },
    });
    setBusy(false);
    if (preview.ok) setImpact(preview.data);
    else setMessage(preview.message);
  }

  async function confirmRemoval() {
    if (!removalSpotUuid || !impact || busy) return;
    const source = projection.spots.items.find((spot) => spot.uuid === removalSpotUuid);
    if (!source) {
      setMessage("A posição mudou. Feche e revise a alteração.");
      setImpact(null);
      return;
    }
    setBusy(true);
    const result = await place({
      data: {
        championshipUuid: data.championship.uuid,
        spotUuid: source.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(projection.championshipRevision),
        expectedSpotRevision: numberValue(source.revision),
        teamId: null,
        confirmedImpactMatchUuids: impact.affectedMatches.map((match) => match.matchUuid),
        reason: "Removida da chave pelo painel de equipes",
      },
    });
    setBusy(false);
    if (result.ok) {
      onProjection(result.data);
      setRemovalSpotUuid(null);
      setImpact(null);
    } else {
      setMessage(result.message);
      setImpact(null);
    }
  }

  return (
    <>
      <section className="bfl-panel overflow-hidden rounded-xl border">
        <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
          <div>
            <h3 className="text-sm font-semibold">Equipes da chave</h3>
            <p className="text-xs text-muted-foreground">
              Arraste para um spot; solte aqui para retirar da posição atual.
            </p>
          </div>
          <Shield className="size-4 text-muted-foreground" />
        </div>
        <div
          className="flex min-h-20 flex-wrap gap-2 px-4 py-4 sm:px-6"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            void reviewRemoval(event.dataTransfer.getData("application/x-championship-team"));
          }}
        >
          {data.teams.items.map((team) => (
            <button
              key={team.uuid}
              type="button"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("application/x-championship-team", team.uuid);
                event.dataTransfer.effectAllowed = "move";
              }}
              className={`flex h-10 items-center gap-2 border px-3 text-sm ${
                occupied.has(team.uuid) ? "bg-background" : "border-dashed text-muted-foreground"
              }`}
              title={
                occupied.has(team.uuid)
                  ? `Posição: ${occupied.get(team.uuid)!.label}`
                  : "Equipe sem posição nesta etapa"
              }
            >
              <TeamMark team={team} />
              {team.name}
            </button>
          ))}
        </div>
      </section>
      <Dialog
        open={removalSpotUuid !== null}
        onOpenChange={(open) => {
          if (!open) {
            setRemovalSpotUuid(null);
            setImpact(null);
            setMessage(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retirar equipe da chave</DialogTitle>
            <DialogDescription>
              A posição ficará vazia. Revise todas as partidas afetadas antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          {busy && !impact ? (
            <div className="flex items-center gap-2 border px-4 py-5 text-sm text-muted-foreground">
              <LoaderCircle className="animate-spin" />
              Calculando o impacto na chave…
            </div>
          ) : impact ? (
            <SpotPlacementImpact impact={impact} />
          ) : null}
          {message ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemovalSpotUuid(null)}>
              Cancelar
            </Button>
            <Button disabled={!impact || busy} onClick={() => void confirmRemoval()}>
              {busy ? <LoaderCircle className="animate-spin" /> : <X />}
              Confirmar retirada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SpotPlacementImpact({ impact }: { impact: ChampionshipSpotPlacementPreviewData }) {
  const destructive = impact.affectedMatches.some((match) => match.hadResult || match.hadEvidence);

  return (
    <div className="space-y-3">
      <div className="grid gap-px overflow-hidden border bg-border sm:grid-cols-2">
        <div className="bg-background px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Origem</p>
          <p className="mt-1 truncate text-sm font-medium">
            {impact.sourceSpot?.label ?? "Sem outra posição"}
          </p>
        </div>
        <div className="bg-background px-4 py-3">
          <p className="text-[10px] font-semibold uppercase text-muted-foreground">Destino</p>
          <p className="mt-1 truncate text-sm font-medium">{impact.targetSpot.label}</p>
        </div>
      </div>
      {destructive ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>
            Resultados e partidas de sala indicados abaixo serão desvinculados. A agenda permanece
            preservada.
          </AlertDescription>
        </Alert>
      ) : null}
      {impact.affectedMatches.length > 0 ? (
        <div className="max-h-64 divide-y overflow-auto border">
          {impact.affectedMatches.map((match) => (
            <div key={match.matchUuid} className="flex items-center gap-3 px-3 py-2.5">
              <span className="grid size-7 shrink-0 place-items-center border text-xs font-bold">
                {match.depth}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{match.label}</span>
              {match.hadResult ? <Badge variant="destructive">resultado</Badge> : null}
              {match.hadEvidence ? <Badge variant="outline">sala vinculada</Badge> : null}
            </div>
          ))}
        </div>
      ) : (
        <Alert>
          <Check />
          <AlertDescription>Nenhuma partida existente será alterada.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function CompetitionRoundRail({
  projection,
  stage,
}: {
  projection: FormatProjection;
  stage: FormatStage;
}) {
  const rounds = projection.competitionRounds.items.filter(
    (round) => round.stageUuid === stage.uuid,
  );

  if (!rounds.length) return null;

  return (
    <section>
      <div className="mb-2 flex items-center gap-2 px-1">
        <CalendarClock className="size-4 text-primary" />
        <h3 className="text-xs font-semibold uppercase">Períodos da competição</h3>
      </div>
      <div className="bfl-panel grid overflow-hidden rounded-xl border md:grid-cols-2 xl:grid-cols-4">
        {rounds.map((round) => (
          <div key={round.uuid} className="border-b px-4 py-4 md:border-r">
            <div className="text-sm font-semibold">{round.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {round.startsAt ? formatDateTime(round.startsAt) : "Início em aberto"}
              {round.endsAt ? ` até ${formatDateTime(round.endsAt)}` : ""}
            </div>
            <div className="mt-2 text-[11px] uppercase text-muted-foreground">
              {round.schedulingAuthority === "staff"
                ? "Agenda da organização"
                : "Agenda negociável"}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

type DoubleEliminationPreview = Serializable<ChampionshipDoubleEliminationPreview>;

function EliminationGenerator({
  data,
  projection,
  open,
  onOpenChange,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjection: (format: FormatProjection) => void;
}) {
  const generateSingle = useServerFn(generateChampionshipSingleEliminationFn);
  const generateDouble = useServerFn(generateChampionshipDoubleEliminationFn);
  const previewDouble = useServerFn(previewChampionshipDoubleEliminationFn);
  const [engine, setEngine] = useState<"single" | "double">("single");
  const [name, setName] = useState("Mata-mata");
  const [teamIds, setTeamIds] = useState(() => data.teams.items.map((team) => team.uuid));
  const [grandFinalReset, setGrandFinalReset] = useState(true);
  const [roundHours, setRoundHours] = useState(168);
  const [competitionRoundMode, setCompetitionRoundMode] = useState<
    "per-bracket-round" | "single-period"
  >("per-bracket-round");
  const [firstRound, setFirstRound] = useState("");
  const [programId, setProgramId] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [preview, setPreview] = useState<DoubleEliminationPreview | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setPreview(null);
  }, [engine, grandFinalReset, teamIds]);

  function selectEngine(next: "single" | "double") {
    setEngine(next);
    setName((current) =>
      current === "Mata-mata" || current === "Dupla eliminação"
        ? next === "single"
          ? "Mata-mata"
          : "Dupla eliminação"
        : current,
    );
  }

  async function refreshPreview() {
    if (engine !== "double" || teamIds.length < 2) return;
    setPreviewBusy(true);
    setMessage(null);
    const result = await previewDouble({
      data: {
        championshipUuid: data.championship.uuid,
        teamIds,
        grandFinalReset,
      },
    });
    setPreviewBusy(false);
    if (result.ok) {
      setPreview(result.data);
    } else {
      setMessage(result.message);
    }
  }

  async function submit() {
    setBusy(true);
    setMessage(null);
    const common = {
      championshipUuid: data.championship.uuid,
      commandUuid: crypto.randomUUID(),
      expectedRevision: numberValue(projection.championshipRevision),
      name,
      teamIds,
      createCompetitionRounds: true,
      competitionRoundMode,
      firstRoundStartsAt: firstRound ? new Date(firstRound).toISOString() : null,
      roundDurationHours: roundHours,
      defaultRoomProgramId: programId || undefined,
    };
    const result =
      engine === "double"
        ? await generateDouble({
            data: { ...common, grandFinalReset },
          })
        : await generateSingle({ data: common });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onProjection(result.data);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Gerar chave eliminatória</DialogTitle>
          <DialogDescription>
            Confira toda a estrutura antes de materializar spots, rotas e períodos editáveis.
          </DialogDescription>
        </DialogHeader>
        {data.championship.competitionType.cadence === "single-event" ? (
          <div className="flex flex-col gap-3 border-y border-emerald-500/30 bg-emerald-500/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium">Competição de evento único</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Use um único período para todas as partidas do dia.
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                selectEngine("single");
                setCompetitionRoundMode("single-period");
                setRoundHours(24);
                setName("Evento principal");
                if (data.championship.startsAt) {
                  setFirstRound(toLocalDateTime(data.championship.startsAt));
                }
              }}
            >
              <CalendarClock />
              Aplicar fluxo de um dia
            </Button>
          </div>
        ) : null}
        <div className="grid grid-cols-2 border p-0.5">
          <Button
            variant={engine === "single" ? "secondary" : "ghost"}
            onClick={() => selectEngine("single")}
          >
            Eliminação simples
          </Button>
          <Button
            variant={engine === "double" ? "secondary" : "ghost"}
            onClick={() => selectEngine("double")}
          >
            Dupla eliminação
          </Button>
        </div>
        <div className="grid gap-5 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="format-name">Nome da etapa</Label>
              <Input
                id="format-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="format-start">Início</Label>
                <Input
                  id="format-start"
                  type="datetime-local"
                  value={firstRound}
                  onChange={(event) => setFirstRound(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="format-duration">Horas por fase</Label>
                <Input
                  id="format-duration"
                  type="number"
                  min={1}
                  max={744}
                  value={roundHours}
                  onChange={(event) => setRoundHours(Number(event.target.value))}
                />
              </div>
            </div>
            <label
              htmlFor="single-period-format"
              className="flex items-start gap-3 border-y py-3 text-sm"
            >
              <Checkbox
                id="single-period-format"
                checked={competitionRoundMode === "single-period"}
                onCheckedChange={(checked) =>
                  setCompetitionRoundMode(checked === true ? "single-period" : "per-bracket-round")
                }
              />
              <span>
                <span className="block font-medium">Um único período para toda a chave</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Todas as fases acontecem dentro da mesma janela de tempo.
                </span>
              </span>
            </label>
            {data.roomPrograms ? (
              <div className="space-y-2">
                <Label htmlFor="format-program">Programa padrão</Label>
                <NativeSelect
                  id="format-program"
                  value={programId}
                  onChange={(event) => setProgramId(event.target.value)}
                >
                  <NativeSelectOption value="">Padrão do campeonato</NativeSelectOption>
                  {data.roomPrograms.items.map((program) => (
                    <NativeSelectOption key={program.id} value={program.id}>
                      {program.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ) : null}
            {engine === "double" ? (
              <label
                htmlFor="grand-final-reset"
                className="flex items-start gap-3 border-y py-3 text-sm"
              >
                <Checkbox
                  id="grand-final-reset"
                  checked={grandFinalReset}
                  onCheckedChange={(checked) => setGrandFinalReset(checked === true)}
                />
                <span>
                  <span className="block font-medium">Final com reset condicional</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    A final decisiva só é ativada quando a equipe da chave inferior vence a primeira
                    final.
                  </span>
                </span>
              </label>
            ) : null}
            <div>
              <Label>Equipes e ordem de seed</Label>
              <div className="mt-2 max-h-56 divide-y overflow-y-auto border-y">
                {data.teams.items.map((team, index) => (
                  <label key={team.uuid} className="flex h-11 items-center gap-3 px-2 text-sm">
                    <Checkbox
                      checked={teamIds.includes(team.uuid)}
                      onCheckedChange={(checked) =>
                        setTeamIds((current) =>
                          checked
                            ? [...current, team.uuid]
                            : current.filter((uuid) => uuid !== team.uuid),
                        )
                      }
                    />
                    <span className="w-5 text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <TeamMark team={team} />
                    <span className="truncate">{team.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <GeneratorPreview
            engine={engine}
            teamCount={teamIds.length}
            preview={preview}
            busy={previewBusy}
            onPreview={() => void refreshPreview()}
          />
        </div>
        {message ? (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={busy || teamIds.length < 2 || (engine === "double" && !preview)}
            onClick={() => void submit()}
          >
            <Sparkles />
            {busy
              ? "Gerando…"
              : engine === "double" && !preview
                ? "Revise a prévia"
                : `Gerar com ${teamIds.length} equipes`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GeneratorPreview({
  engine,
  teamCount,
  preview,
  busy,
  onPreview,
}: {
  engine: "single" | "double";
  teamCount: number;
  preview: DoubleEliminationPreview | null;
  busy: boolean;
  onPreview: () => void;
}) {
  if (engine === "single") {
    const bracketSize = teamCount < 2 ? 0 : 2 ** Math.ceil(Math.log2(teamCount));
    const rounds = bracketSize ? Math.log2(bracketSize) : 0;

    return (
      <section className="bfl-panel overflow-hidden rounded-xl border">
        <div className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Prévia da estrutura</h3>
          <p className="mt-1 text-xs text-muted-foreground">Seed padrão, sem reseeding.</p>
        </div>
        <div className="grid grid-cols-3 divide-x py-4 text-center">
          <PreviewMetric label="Partidas" value={bracketSize ? bracketSize - 1 : 0} />
          <PreviewMetric label="Fases" value={rounds} />
          <PreviewMetric label="Byes" value={Math.max(0, bracketSize - teamCount)} />
        </div>
      </section>
    );
  }

  return (
    <section className="bfl-panel min-h-80 overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Prévia completa</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Superior, inferior, quedas e finais condicionais.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={busy || teamCount < 2} onClick={onPreview}>
          <Route />
          {busy ? "Calculando…" : "Atualizar"}
        </Button>
      </div>
      {!preview ? (
        <div className="px-5 py-14 text-center text-sm text-muted-foreground">
          Gere a prévia para revisar todos os jogos e destinos antes de criar a etapa.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 divide-x border-b py-3 text-center">
            <PreviewMetric label="Partidas" value={preview.matches.length} />
            <PreviewMetric label="Rotas" value={preview.routes.length} />
            <PreviewMetric
              label="Byes"
              value={preview.matches.filter((match) => match.autoBye).length}
            />
            <PreviewMetric label="Reset" value={preview.grandFinalReset ? "Ativo" : "Não"} />
          </div>
          <div className="max-h-72 overflow-y-auto">
            {(["winners", "losers", "grand-final"] as const).map((bracket) => {
              const matches = preview.matches.filter((match) => match.bracket === bracket);
              if (!matches.length) return null;

              return (
                <div key={bracket} className="border-b px-4 py-3 last:border-b-0">
                  <div className="mb-2 text-xs font-semibold uppercase">
                    {bracketLabel(bracket)}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {matches.map((match) => (
                      <Badge key={match.key} variant={match.autoBye ? "outline" : "secondary"}>
                        {match.label}
                        {match.autoBye ? " · bye" : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function PreviewMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-2">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{label}</div>
    </div>
  );
}

function ScheduleMatchDialog({
  data,
  projection,
  match,
  readOnly = false,
  negotiationEnabled = false,
  onOpenChange,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  match: FormatMatch | null;
  readOnly?: boolean;
  negotiationEnabled?: boolean;
  onOpenChange: (open: boolean) => void;
  onProjection: (format: FormatProjection) => void;
}) {
  const schedule = useServerFn(scheduleChampionshipLogicalMatchFn);
  const getScheduling = useServerFn(getChampionshipMatchSchedulingFn);
  const propose = useServerFn(createChampionshipScheduleProposalFn);
  const decide = useServerFn(decideChampionshipScheduleProposalFn);
  const authorizeLate = useServerFn(authorizeChampionshipLatePlayFn);
  const revokeLate = useServerFn(revokeChampionshipLatePlayFn);
  const remind = useServerFn(remindChampionshipScheduleFn);
  const [scheduledAt, setScheduledAt] = useState("");
  const [roundId, setRoundId] = useState("");
  const [programId, setProgramId] = useState("");
  const [scheduling, setScheduling] = useState<ChampionshipMatchSchedulingData | null>(null);
  const [loadingScheduling, setLoadingScheduling] = useState(false);
  const [proposalMode, setProposalMode] = useState<"exact-time" | "availability-range">(
    "exact-time",
  );
  const [proposalAt, setProposalAt] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [availableTo, setAvailableTo] = useState("");
  const [proposalNote, setProposalNote] = useState("");
  const [countering, setCountering] = useState<
    ChampionshipMatchSchedulingData["proposals"]["items"][number] | null
  >(null);
  const [decisionAt, setDecisionAt] = useState("");
  const [lateReason, setLateReason] = useState("");
  const [lateExpiry, setLateExpiry] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setScheduledAt(match?.scheduledAt ? toLocalDateTime(match.scheduledAt) : "");
    setRoundId(match?.competitionRoundUuid ?? "");
    setProgramId(match?.roomProgram?.uuid ?? "");
    setMessage(null);
    setScheduling(null);
    setCountering(null);
    setDecisionAt("");
    if (!match || !negotiationEnabled) return;

    let active = true;
    setLoadingScheduling(true);
    void getScheduling({
      data: {
        championshipUuid: data.championship.uuid,
        matchUuid: match.uuid,
      },
    })
      .then((next) => {
        if (active) {
          setScheduling(next);
          if (next.proposalMode !== "both") {
            setProposalMode(next.proposalMode);
          }
        }
      })
      .catch(() => {
        if (active) {
          setMessage("Não foi possível carregar a negociação deste jogo.");
        }
      })
      .finally(() => {
        if (active) setLoadingScheduling(false);
      });

    return () => {
      active = false;
    };
  }, [data.championship.uuid, getScheduling, match, negotiationEnabled]);

  async function submitDirectSchedule() {
    if (!match) return;
    setBusy(true);
    setMessage(null);
    const result = await schedule({
      data: {
        championshipUuid: data.championship.uuid,
        matchUuid: match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(projection.championshipRevision),
        expectedMatchRevision: numberValue(match.revision),
        competitionRoundId: roundId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        scheduleStatus: scheduledAt ? "scheduled" : "unscheduled",
        roomProgramId: programId || undefined,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onProjection(result.data);
    onOpenChange(false);
  }

  function applyScheduling(next: ChampionshipMatchSchedulingData) {
    setScheduling(next);
    onProjection(mergeSchedulingProjection(projection, next));
  }

  async function submitProposal() {
    if (!match || !scheduling) return;
    setBusy(true);
    setMessage(null);
    const result = await propose({
      data: {
        championshipUuid: data.championship.uuid,
        matchUuid: match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(scheduling.championshipRevision),
        expectedMatchScheduleRevision: numberValue(scheduling.match.scheduleRevision),
        parentProposalId: countering?.uuid ?? null,
        expectedParentProposalRevision: countering ? numberValue(countering.revision) : null,
        mode: proposalMode,
        exactTime:
          proposalMode === "exact-time" && proposalAt ? new Date(proposalAt).toISOString() : null,
        availableFrom:
          proposalMode === "availability-range" && availableFrom
            ? new Date(availableFrom).toISOString()
            : null,
        availableTo:
          proposalMode === "availability-range" && availableTo
            ? new Date(availableTo).toISOString()
            : null,
        note: proposalNote || null,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    applyScheduling(result.data);
    setCountering(null);
    setProposalNote("");
  }

  async function decideProposal(
    proposal: ChampionshipMatchSchedulingData["proposals"]["items"][number],
    decision: "accept" | "reject" | "withdraw",
  ) {
    if (!match || !scheduling) return;
    setBusy(true);
    setMessage(null);
    const result = await decide({
      data: {
        championshipUuid: data.championship.uuid,
        matchUuid: match.uuid,
        proposalUuid: proposal.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(scheduling.championshipRevision),
        expectedMatchScheduleRevision: numberValue(scheduling.match.scheduleRevision),
        expectedProposalRevision: numberValue(proposal.revision),
        decision,
        scheduledAt:
          decision === "accept" && proposal.mode === "availability-range" && decisionAt
            ? new Date(decisionAt).toISOString()
            : null,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    applyScheduling(result.data);
    setDecisionAt("");
  }

  async function sendReminder() {
    if (!match || !scheduling) return;
    setBusy(true);
    setMessage(null);
    const result = await remind({
      data: {
        championshipUuid: data.championship.uuid,
        matchUuid: match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(scheduling.championshipRevision),
        note: proposalNote || null,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    applyScheduling(result.data);
    setMessage("Lembrete enviado no site para o outro GM.");
  }

  async function authorizeLatePlay() {
    if (!match || !scheduling || !lateReason.trim()) return;
    setBusy(true);
    setMessage(null);
    const result = await authorizeLate({
      data: {
        championshipUuid: data.championship.uuid,
        matchUuid: match.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(scheduling.championshipRevision),
        expectedMatchScheduleRevision: numberValue(scheduling.match.scheduleRevision),
        reason: lateReason,
        expiresAt: lateExpiry ? new Date(lateExpiry).toISOString() : null,
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    applyScheduling(result.data);
    setLateReason("");
    setLateExpiry("");
  }

  async function revokeLatePlay(
    authorization: ChampionshipMatchSchedulingData["lateAuthorizations"]["items"][number],
  ) {
    if (!match || !scheduling) return;
    setBusy(true);
    setMessage(null);
    const result = await revokeLate({
      data: {
        championshipUuid: data.championship.uuid,
        matchUuid: match.uuid,
        authorizationUuid: authorization.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(scheduling.championshipRevision),
        expectedAuthorizationRevision: numberValue(authorization.revision),
        reason: "Revogada pela organização",
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    applyScheduling(result.data);
  }

  return (
    <Dialog open={match !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{match?.label ?? "Partida"}</DialogTitle>
            <Badge variant="outline">
              {scheduleStatusLabel(scheduling?.match.scheduleStatus ?? match?.scheduleStatus)}
            </Badge>
          </div>
          <DialogDescription>
            {match?.sideA.team?.name ?? "A definir"} contra {match?.sideB.team?.name ?? "A definir"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid border-y text-sm sm:grid-cols-3">
          <ScheduleFact
            label="Período"
            value={
              scheduling?.competitionRound?.name ??
              projection.competitionRounds.items.find(
                (round) => round.uuid === match?.competitionRoundUuid,
              )?.name ??
              "Sem período"
            }
          />
          <ScheduleFact
            label="Horário confirmado"
            value={
              scheduling
                ? scheduling.match.scheduledAt
                  ? formatDateTime(scheduling.match.scheduledAt)
                  : "A definir"
                : match?.scheduledAt
                  ? formatDateTime(match.scheduledAt)
                  : "A definir"
            }
          />
          <ScheduleFact
            label="Quem agenda"
            value={
              scheduling?.competitionRound
                ? schedulingAuthorityLabel(scheduling.competitionRound.schedulingAuthority)
                : "Regra geral"
            }
          />
        </div>

        {!readOnly ? (
          <section className="space-y-3 border-b pb-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-sm font-semibold">Intervenção da organização</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
              <div className="space-y-2">
                <Label htmlFor="schedule-round">Período</Label>
                <NativeSelect
                  id="schedule-round"
                  value={roundId}
                  disabled={readOnly}
                  onChange={(event) => setRoundId(event.target.value)}
                >
                  <NativeSelectOption value="">Sem período</NativeSelectOption>
                  {projection.competitionRounds.items.map((round) => (
                    <NativeSelectOption key={round.uuid} value={round.uuid}>
                      {round.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-at">Horário</Label>
                <Input
                  id="schedule-at"
                  type="datetime-local"
                  value={scheduledAt}
                  disabled={readOnly}
                  onChange={(event) => setScheduledAt(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-program">Programa da sala</Label>
                <NativeSelect
                  id="schedule-program"
                  value={programId}
                  disabled={!data.roomPrograms}
                  onChange={(event) => setProgramId(event.target.value)}
                >
                  <NativeSelectOption value="">Herdar da etapa</NativeSelectOption>
                  {data.roomPrograms?.items.map((program) => (
                    <NativeSelectOption key={program.id} value={program.id}>
                      {program.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <Button disabled={busy} onClick={() => void submitDirectSchedule()}>
                <Check />
                Salvar
              </Button>
            </div>
          </section>
        ) : null}

        {negotiationEnabled ? (
          loadingScheduling ? (
            <div className="flex min-h-36 items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              Carregando negociação
            </div>
          ) : scheduling ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,0.85fr)]">
              <section className="min-w-0 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageSquareText className="size-4 text-cyan-300" />
                    <h3 className="text-sm font-semibold">Negociação</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void sendReminder()}
                  >
                    <Bell />
                    Lembrar
                  </Button>
                </div>
                {scheduling.proposals.items.length === 0 ? (
                  <div className="border-y px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum horário foi proposto.
                  </div>
                ) : (
                  <div className="divide-y border-y">
                    {scheduling.proposals.items.map((proposal) => {
                      const own =
                        scheduling.actor.access === "gm" &&
                        proposal.proposingTeam?.uuid === scheduling.actor.team?.uuid;
                      const pending = proposal.state === "pending";
                      return (
                        <div key={proposal.uuid} className="space-y-3 px-3 py-4">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <div className="font-medium">
                                {proposal.proposingTeam?.name ?? "Organização"}
                              </div>
                              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock3 className="size-3" />
                                {proposalTimeLabel(proposal)}
                              </div>
                            </div>
                            <Badge variant="outline">{proposalStateLabel(proposal.state)}</Badge>
                          </div>
                          {proposal.note ? (
                            <p className="text-sm text-muted-foreground">{proposal.note}</p>
                          ) : null}
                          {pending && proposal.mode === "availability-range" && !own ? (
                            <div className="max-w-xs space-y-2">
                              <Label htmlFor={`decision-${proposal.uuid}`}>
                                Horário dentro da faixa
                              </Label>
                              <Input
                                id={`decision-${proposal.uuid}`}
                                type="datetime-local"
                                value={decisionAt}
                                onChange={(event) => setDecisionAt(event.target.value)}
                              />
                            </div>
                          ) : null}
                          {pending ? (
                            <div className="flex flex-wrap gap-2">
                              {own && scheduling.actor.access === "gm" ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={busy}
                                  onClick={() => void decideProposal(proposal, "withdraw")}
                                >
                                  <X />
                                  Retirar
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    disabled={
                                      busy ||
                                      (proposal.mode === "availability-range" && !decisionAt)
                                    }
                                    onClick={() => void decideProposal(proposal, "accept")}
                                  >
                                    <Check />
                                    Aceitar
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={busy}
                                    onClick={() => void decideProposal(proposal, "reject")}
                                  >
                                    <X />
                                    Recusar
                                  </Button>
                                  {scheduling.actor.canPropose ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setCountering(proposal)}
                                    >
                                      Contrapropor
                                    </Button>
                                  ) : null}
                                </>
                              )}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <aside className="space-y-5">
                {scheduling.actor.canPropose ? (
                  <section className="space-y-3 border-y py-4">
                    <div>
                      <h3 className="text-sm font-semibold">
                        {countering ? "Nova contraproposta" : "Propor horário"}
                      </h3>
                      {countering ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Respondendo a {countering.proposingTeam?.name ?? "organização"}
                        </p>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 border">
                      {(["exact-time", "availability-range"] as const)
                        .filter(
                          (mode) =>
                            scheduling.proposalMode === "both" || scheduling.proposalMode === mode,
                        )
                        .map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            className={`h-9 px-3 text-xs font-medium ${
                              proposalMode === mode
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground"
                            }`}
                            onClick={() => setProposalMode(mode)}
                          >
                            {mode === "exact-time" ? "Horário exato" : "Faixa"}
                          </button>
                        ))}
                    </div>
                    {proposalMode === "exact-time" ? (
                      <div className="space-y-2">
                        <Label htmlFor="proposal-at">Data e horário</Label>
                        <Input
                          id="proposal-at"
                          type="datetime-local"
                          value={proposalAt}
                          onChange={(event) => setProposalAt(event.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label htmlFor="available-from">De</Label>
                          <Input
                            id="available-from"
                            type="datetime-local"
                            value={availableFrom}
                            onChange={(event) => setAvailableFrom(event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="available-to">Até</Label>
                          <Input
                            id="available-to"
                            type="datetime-local"
                            value={availableTo}
                            onChange={(event) => setAvailableTo(event.target.value)}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="proposal-note">Observação</Label>
                      <Textarea
                        id="proposal-note"
                        rows={2}
                        value={proposalNote}
                        onChange={(event) => setProposalNote(event.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      {countering ? (
                        <Button variant="ghost" size="sm" onClick={() => setCountering(null)}>
                          Cancelar
                        </Button>
                      ) : null}
                      <Button
                        className="ml-auto"
                        size="sm"
                        disabled={
                          busy ||
                          (proposalMode === "exact-time"
                            ? !proposalAt
                            : !availableFrom || !availableTo)
                        }
                        onClick={() => void submitProposal()}
                      >
                        <Send />
                        Enviar
                      </Button>
                    </div>
                  </section>
                ) : null}

                {scheduling.actor.canIntervene ? (
                  <section className="space-y-3 border-y py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-amber-300" />
                      <h3 className="text-sm font-semibold">Jogo após o período</h3>
                    </div>
                    {scheduling.lateAuthorizations.items.map((authorization) => (
                      <div
                        key={authorization.uuid}
                        className="border-l-2 border-amber-400 px-3 py-2"
                      >
                        <div className="text-sm font-medium">
                          {authorization.active ? "Autorização ativa" : "Autorização encerrada"}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">{authorization.reason}</p>
                        {authorization.active ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1"
                            disabled={busy}
                            onClick={() => void revokeLatePlay(authorization)}
                          >
                            Revogar
                          </Button>
                        ) : null}
                      </div>
                    ))}
                    <Input
                      aria-label="Motivo da autorização"
                      placeholder="Motivo obrigatório"
                      value={lateReason}
                      onChange={(event) => setLateReason(event.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        aria-label="Validade da autorização"
                        type="datetime-local"
                        value={lateExpiry}
                        onChange={(event) => setLateExpiry(event.target.value)}
                      />
                      <Button
                        variant="outline"
                        disabled={busy || !lateReason.trim()}
                        onClick={() => void authorizeLatePlay()}
                      >
                        Autorizar
                      </Button>
                    </div>
                  </section>
                ) : null}
              </aside>
            </div>
          ) : null
        ) : (
          <div className="border-y px-4 py-6 text-center text-sm text-muted-foreground">
            Entre como GM de uma das equipes para negociar este horário.
          </div>
        )}
        {message ? (
          <Alert variant={message.includes("enviado") ? "default" : "destructive"}>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-4 py-3 sm:border-r">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 truncate font-medium">{value}</div>
    </div>
  );
}

function FormatEmptyState({ admin, onGenerate }: { admin: boolean; onGenerate: () => void }) {
  return (
    <div className="bfl-panel rounded-xl border px-6 py-16 text-center">
      <GitBranch className="mx-auto size-8 text-muted-foreground" />
      <h2 className="mt-4 text-lg font-semibold">Formato ainda não construído</h2>
      <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
        Etapas manuais e chaves geradas usam os mesmos spots e rotas, então qualquer resultado pode
        ser ajustado pela organização sem perder o histórico.
      </p>
      {admin ? (
        <Button className="mt-5" onClick={onGenerate}>
          <Sparkles />
          Gerar primeira chave
        </Button>
      ) : null}
    </div>
  );
}

function TeamMark({
  team,
}: {
  team: FormatMatch["sideA"]["team"] | ChampionshipWorkspaceData["teams"]["items"][number] | null;
}) {
  const colors = team?.colors;

  return (
    <span
      className="size-5 shrink-0 border"
      style={{
        background:
          colors && colors.length > 1
            ? `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50%)`
            : (colors?.[0] ?? "#64748b"),
      }}
    />
  );
}

function stageRoundCount(matches: FormatMatch[]) {
  return Math.max(1, ...matches.map((match) => numberValue(match.bracketRound)));
}

function engineLabel(engine: FormatStage["engine"]) {
  return {
    manual: "Manual",
    "single-elimination": "Eliminação simples",
    "double-elimination": "Eliminação dupla",
    standings: "Classificação",
  }[engine];
}

function bracketLabel(bracket: FormatMatch["bracket"]) {
  return {
    winners: "Chave superior",
    losers: "Chave inferior",
    "grand-final": "Finais",
    placement: "Colocação",
    none: "Manual",
  }[bracket];
}

function routeConditionLabel(condition: FormatProjection["routes"]["items"][number]["condition"]) {
  return {
    always: "Sempre",
    "if-side-a-wins": "Se o lado A vencer",
    "if-side-b-wins": "Se o lado B vencer",
  }[condition];
}

function scheduleStatusLabel(status: FormatMatch["scheduleStatus"] | undefined) {
  if (!status) return "A definir";
  return {
    unscheduled: "Sem horário",
    proposed: "Em negociação",
    scheduled: "Agendada",
    "late-authorized": "Atraso autorizado",
    played: "Disputada",
    canceled: "Cancelada",
  }[status];
}

function schedulingAuthorityLabel(
  authority: NonNullable<
    ChampionshipMatchSchedulingData["competitionRound"]
  >["schedulingAuthority"],
) {
  return {
    staff: "Organização",
    gms: "GMs",
    "staff-and-gms": "GMs e organização",
  }[authority];
}

function proposalStateLabel(
  state: ChampionshipMatchSchedulingData["proposals"]["items"][number]["state"],
) {
  return {
    pending: "Aguardando resposta",
    countered: "Contraproposta recebida",
    accepted: "Aceita",
    rejected: "Recusada",
    withdrawn: "Retirada",
    "staff-decided": "Encerrada pela organização",
  }[state];
}

function proposalTimeLabel(
  proposal: ChampionshipMatchSchedulingData["proposals"]["items"][number],
) {
  if (proposal.mode === "exact-time" && proposal.exactTime) {
    return formatDateTime(proposal.exactTime);
  }
  if (proposal.availableFrom && proposal.availableTo) {
    return `${formatDateTime(proposal.availableFrom)} até ${formatDateTime(proposal.availableTo)}`;
  }
  return "Horário incompleto";
}

function mergeSchedulingProjection(
  projection: FormatProjection,
  scheduling: ChampionshipMatchSchedulingData,
): FormatProjection {
  return {
    ...projection,
    championshipRevision: scheduling.championshipRevision,
    matches: {
      ...projection.matches,
      items: projection.matches.items.map((match) =>
        match.uuid === scheduling.match.uuid
          ? {
              ...match,
              scheduledAt: scheduling.match.scheduledAt,
              scheduleStatus: scheduling.match.scheduleStatus,
              scheduleRevision: scheduling.match.scheduleRevision,
              revision: scheduling.match.revision,
            }
          : match,
      ),
    },
  };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
