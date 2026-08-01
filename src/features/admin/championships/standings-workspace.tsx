import { useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  CircleAlert,
  Info,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Settings2,
  Sparkles,
  TableProperties,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
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
import { Switch } from "#/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import {
  applyChampionshipClassificationFn,
  configureChampionshipStandingsFn,
  createChampionshipGroupFn,
  createChampionshipLogicalMatchFn,
  generateChampionshipRoundRobinFn,
  getChampionshipFormatFn,
  getChampionshipStandingsFn,
  previewChampionshipClassificationFn,
  previewChampionshipRoundRobinFn,
} from "#/server/api/championship-format-functions";
import type {
  ChampionshipRoundRobinPreviewData,
  ChampionshipStandingsData,
} from "#/server/api/championship-api";
import type { FormatData } from "./format-workspace";
import { numberValue, type FormatProjection, type FormatStage } from "./format-workspace-model";

type Rule = ChampionshipStandingsData["rules"][number];
type Criterion = Rule["criterion"];

export function StandingsWorkspace({
  data,
  projection,
  stage,
  admin,
  showQualificationDestinations = true,
  onProjection,
  actionsControl,
}: {
  data: FormatData;
  projection: FormatProjection;
  stage: FormatStage;
  admin: boolean;
  showQualificationDestinations?: boolean;
  onProjection: (projection: FormatProjection) => void;
  actionsControl: ReactNode;
}) {
  const groups = useMemo(
    () => projection.groups.items.filter((group) => group.stageUuid === stage.uuid),
    [projection.groups.items, stage.uuid],
  );
  const [standingsByGroup, setStandingsByGroup] = useState<
    Record<string, ChampionshipStandingsData>
  >({});
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const [matchOpen, setMatchOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [classificationOpen, setClassificationOpen] = useState(false);
  const [classification, setClassification] = useState<ChampionshipStandingsData | null>(null);
  const getStandings = useServerFn(getChampionshipStandingsFn);
  const previewClassification = useServerFn(previewChampionshipClassificationFn);

  useEffect(() => {
    if (groups.length === 0) {
      setStandingsByGroup({});
      return;
    }
    let active = true;
    setLoading(true);
    setMessage(null);
    void Promise.all(
      groups.map(async (group) => {
        const standings = await getStandings({
          data: {
            championshipUuid: data.championship.uuid,
            stageUuid: stage.uuid,
            groupUuid: group.uuid,
          },
        });
        return [group.uuid, standings] as const;
      }),
    )
      .then((entries) => {
        if (active) setStandingsByGroup(Object.fromEntries(entries));
      })
      .catch((error: unknown) => {
        if (active) {
          setMessage(
            error instanceof Error ? error.message : "Não foi possível carregar a classificação.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    data.championship.uuid,
    getStandings,
    groups,
    stage.uuid,
    projection.championshipRevision,
    refreshToken,
  ]);

  async function openClassificationPreview(groupUuid: string) {
    setLoading(true);
    setMessage(null);
    try {
      const result = await previewClassification({
        data: {
          championshipUuid: data.championship.uuid,
          stageUuid: stage.uuid,
          groupUuid,
        },
      });
      if (result.ok) {
        setClassification(result.data);
        setClassificationOpen(true);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível calcular o impacto da classificação.",
      );
    } finally {
      setLoading(false);
    }
  }

  const firstStandings = standingsByGroup[groups[0]?.uuid ?? ""] ?? null;

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <header className="border-b">
        <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <TableProperties className="size-4 text-cyan-300" />
              <h2 className="font-semibold">Formato e classificação</h2>
              <Badge variant="outline">Tabela</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {groups.length} {groups.length === 1 ? "grupo" : "grupos"} exibidos verticalmente
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:items-end">
            {admin ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      Ações
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      disabled={groups.length === 0}
                      onSelect={() => setMatchOpen(true)}
                    >
                      <Plus />
                      Adicionar partida
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setGroupOpen(true)}>
                      <Users />
                      Grupos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={!firstStandings}
                      onSelect={() => setRulesOpen(true)}
                    >
                      <Settings2 />
                      Critérios
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      disabled={groups.length === 0}
                      onSelect={() => setScheduleOpen(true)}
                    >
                      <Sparkles />
                      Gerar partidas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {actionsControl}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </div>
        </div>
      </header>

      {message ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {groups.length === 0 ? (
        <section className="px-6 py-16 text-center">
          <Users className="mx-auto size-8 text-muted-foreground" />
          <h3 className="mt-4 font-semibold">Esta tabela ainda não tem grupos</h3>
          <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
            Um campeonato pode ter um único grupo ou vários. As equipes ocupam spots de entrada,
            então a composição continua totalmente editável.
          </p>
          {admin ? (
            <Button className="mt-5" onClick={() => setGroupOpen(true)}>
              <Plus />
              Criar primeiro grupo
            </Button>
          ) : null}
        </section>
      ) : (
        <div className="divide-y">
          {groups.map((group) => {
            const standings = standingsByGroup[group.uuid];
            return standings ? (
              <section key={group.uuid}>
                <StandingsTable standings={standings} />
                {showQualificationDestinations ? <QualificationRail standings={standings} /> : null}
                {admin ? (
                  <div className="flex justify-end border-t px-4 py-3 sm:px-6">
                    <Button
                      disabled={loading}
                      onClick={() => void openClassificationPreview(group.uuid)}
                    >
                      {loading ? <LoaderCircle className="animate-spin" /> : <Trophy />}
                      Aplicar classificação de {group.name}
                    </Button>
                  </div>
                ) : null}
              </section>
            ) : (
              <StandingsSkeleton key={group.uuid} />
            );
          })}
        </div>
      )}

      <GroupDialog
        data={data}
        projection={projection}
        stage={stage}
        open={groupOpen}
        onOpenChange={setGroupOpen}
        onProjection={(next) => {
          onProjection(next);
        }}
      />
      <StandingsMatchDialog
        data={data}
        projection={projection}
        stage={stage}
        groups={groups}
        open={matchOpen}
        onOpenChange={setMatchOpen}
        onProjection={onProjection}
      />
      <RulesDialog
        data={data}
        projection={projection}
        standings={firstStandings}
        open={rulesOpen}
        onOpenChange={setRulesOpen}
        onProjection={onProjection}
        onSaved={async () => setRefreshToken((value) => value + 1)}
      />
      <RoundRobinDialog
        data={data}
        projection={projection}
        stage={stage}
        groups={groups}
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        onProjection={onProjection}
      />
      <ClassificationDialog
        data={data}
        projection={projection}
        standings={classification}
        open={classificationOpen}
        onOpenChange={setClassificationOpen}
        onProjection={onProjection}
        onApplied={(next) => {
          setStandingsByGroup((current) => ({ ...current, [next.group.uuid]: next }));
          setClassification(next);
        }}
      />
    </section>
  );
}

function StandingsTable({ standings }: { standings: ChampionshipStandingsData }) {
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  return (
    <section className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h3 className="font-semibold">{standings.group.name}</h3>
          <p className="text-xs text-muted-foreground">
            Vitória {standings.scoring.win} · empate {standings.scoring.draw} · derrota{" "}
            {standings.scoring.loss}
          </p>
        </div>
        {standings.unresolvedTies.length > 0 ? (
          <Badge variant="outline" className="border-amber-500/50 text-amber-300">
            <CircleAlert />
            {standings.unresolvedTies.length}{" "}
            {standings.unresolvedTies.length === 1 ? "empate pendente" : "empates pendentes"}
          </Badge>
        ) : (
          <Badge variant="outline" className="border-emerald-500/50 text-emerald-300">
            <Check />
            Ordem válida
          </Badge>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">#</TableHead>
            <TableHead>Equipe</TableHead>
            <TableHead className="w-14 text-center">J</TableHead>
            <TableHead className="hidden w-14 text-center sm:table-cell">V</TableHead>
            <TableHead className="hidden w-14 text-center sm:table-cell">E</TableHead>
            <TableHead className="hidden w-14 text-center sm:table-cell">D</TableHead>
            <TableHead className="hidden w-20 text-center md:table-cell">GP</TableHead>
            <TableHead className="hidden w-20 text-center md:table-cell">GC</TableHead>
            <TableHead className="w-20 text-center">SG</TableHead>
            <TableHead className="w-20 text-center">Pts</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Explicação</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.rows.map((row) => (
            <StandingsRow
              key={row.team.uuid}
              row={row}
              qualification={standings.qualification.filter(
                (route) => route.rank === row.rank && route.nextTeam?.uuid === row.team.uuid,
              )}
              expanded={expandedTeam === row.team.uuid}
              onExpanded={(expanded) => setExpandedTeam(expanded ? row.team.uuid : null)}
            />
          ))}
        </TableBody>
      </Table>
    </section>
  );
}

function StandingsRow({
  row,
  qualification,
  expanded,
  onExpanded,
}: {
  row: ChampionshipStandingsData["rows"][number];
  qualification: ChampionshipStandingsData["qualification"];
  expanded: boolean;
  onExpanded: (expanded: boolean) => void;
}) {
  return (
    <>
      <TableRow
        className={
          row.unresolvedTie
            ? "bg-amber-500/[0.06] hover:bg-amber-500/[0.1]"
            : qualification.length > 0
              ? "bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]"
              : undefined
        }
      >
        <TableCell className="text-center">
          <span
            className={`inline-grid size-7 place-items-center border text-xs font-bold ${
              qualification.length > 0
                ? "border-emerald-500/50 text-emerald-300"
                : row.unresolvedTie
                  ? "border-amber-500/50 text-amber-300"
                  : "border-border"
            }`}
          >
            {row.rank}
          </span>
        </TableCell>
        <TableCell>
          <div className="flex min-w-0 items-center gap-3">
            <TeamSwatch colors={row.team.colors} />
            <div className="min-w-0">
              <p className="truncate font-medium">{row.team.name}</p>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {qualification.map((route) => (
                  <span
                    key={route.routeUuid}
                    className="text-[10px] font-semibold uppercase text-emerald-300"
                  >
                    → {route.destinationSpotLabel}
                  </span>
                ))}
                {row.unresolvedTie ? (
                  <span className="text-[10px] font-semibold uppercase text-amber-300">
                    desempate necessário
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </TableCell>
        <TableCell className="text-center tabular-nums">{row.played}</TableCell>
        <TableCell className="hidden text-center tabular-nums sm:table-cell">{row.wins}</TableCell>
        <TableCell className="hidden text-center tabular-nums sm:table-cell">{row.draws}</TableCell>
        <TableCell className="hidden text-center tabular-nums sm:table-cell">
          {row.losses}
        </TableCell>
        <TableCell className="hidden text-center tabular-nums md:table-cell">
          {row.scoreFor}
        </TableCell>
        <TableCell className="hidden text-center tabular-nums md:table-cell">
          {row.scoreAgainst}
        </TableCell>
        <TableCell className="text-center tabular-nums">
          {signed(numberValue(row.scoreDifference))}
        </TableCell>
        <TableCell className="text-center text-base font-bold tabular-nums">{row.points}</TableCell>
        <TableCell>
          <Button
            variant="ghost"
            size="icon"
            title="Explicar classificação"
            aria-expanded={expanded}
            onClick={() => onExpanded(!expanded)}
          >
            {expanded ? <ChevronDown /> : <Info />}
          </Button>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell colSpan={11} className="px-6 py-4">
            <div className="grid gap-px overflow-hidden border bg-border sm:grid-cols-2 xl:grid-cols-4">
              {row.criteria.map((criterion, index) => (
                <div key={`${criterion.criterion}-${index}`} className="bg-background px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                    {index + 1}. {criterionLabel(criterion.criterion)}
                  </p>
                  <p className="mt-1 font-mono text-sm">
                    {criterion.value}
                    <span className="ml-2 text-[10px] text-muted-foreground">
                      {scopeLabel(criterion.scope)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}

function QualificationRail({ standings }: { standings: ChampionshipStandingsData }) {
  if (standings.qualification.length === 0) return null;
  const columnCount = Math.min(4, Math.ceil(Math.sqrt(standings.qualification.length)));

  return (
    <section className="overflow-hidden border-t">
      <div className="border-b px-4 py-3 sm:px-6">
        <h3 className="font-semibold">Destinos da classificação</h3>
        <p className="text-xs text-muted-foreground">
          A mesma rota serve para aplicação automática e interferência manual.
        </p>
      </div>
      <div
        className="grid gap-px bg-border sm:grid-cols-[repeat(var(--qualification-columns),minmax(0,1fr))]"
        style={{ "--qualification-columns": columnCount } as CSSProperties}
      >
        {standings.qualification.map((route) => (
          <div key={route.routeUuid} className="min-w-0 bg-card/30 px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline">{route.rank}º</Badge>
              {route.blocked ? (
                <CircleAlert className="size-4 text-amber-300" />
              ) : route.changed ? (
                <RefreshCcw className="size-4 text-cyan-300" />
              ) : (
                <Check className="size-4 text-emerald-300" />
              )}
            </div>
            <p className="mt-3 truncate font-medium">
              {route.nextTeam?.name ?? "Sem equipe definida"}
            </p>
            <p className="truncate text-xs text-muted-foreground">{route.destinationSpotLabel}</p>
            {qualificationIssue(route) ? (
              <p className="mt-2 text-xs text-amber-300">{qualificationIssue(route)}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function StandingsMatchDialog({
  data,
  projection,
  stage,
  groups,
  open,
  onOpenChange,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  stage: FormatStage;
  groups: Array<{ uuid: string; name: string }>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjection: (projection: FormatProjection) => void;
}) {
  const createMatch = useServerFn(createChampionshipLogicalMatchFn);
  const [groupUuid, setGroupUuid] = useState("");
  const [sideA, setSideA] = useState("");
  const [sideB, setSideB] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const spots = projection.spots.items.filter(
    (spot) => spot.stageUuid === stage.uuid && spot.groupUuid === groupUuid && spot.currentTeam,
  );
  const teamSpots = spots.flatMap((spot) =>
    spot.currentTeam ? [{ spot, team: spot.currentTeam }] : [],
  );
  const selectedA = teamSpots.find(({ team }) => team.uuid === sideA)?.team;
  const selectedB = teamSpots.find(({ team }) => team.uuid === sideB)?.team;

  useEffect(() => {
    if (!open) return;
    setGroupUuid(groups[0]?.uuid ?? "");
    setSideA("");
    setSideB("");
    setLabel("");
    setMessage(null);
  }, [groups, open]);

  async function submit() {
    const sideASpot = teamSpots.find(({ team }) => team.uuid === sideA)?.spot;
    const sideBSpot = teamSpots.find(({ team }) => team.uuid === sideB)?.spot;
    if (!sideASpot || !sideBSpot || sideA === sideB || busy) return;
    setBusy(true);
    setMessage(null);
    const result = await createMatch({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(projection.championshipRevision),
        stageId: stage.uuid,
        groupId: groupUuid,
        label:
          label.trim() || `${selectedA?.name ?? "Equipe A"} × ${selectedB?.name ?? "Equipe B"}`,
        sideASpotId: sideASpot.uuid,
        sideBSpotId: sideBSpot.uuid,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar partida à tabela</DialogTitle>
          <DialogDescription>
            Esta partida entra diretamente na classificação do grupo escolhido.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="standings-match-group">Grupo</Label>
            <NativeSelect
              id="standings-match-group"
              value={groupUuid}
              onChange={(event) => {
                setGroupUuid(event.target.value);
                setSideA("");
                setSideB("");
              }}
            >
              {groups.map((group) => (
                <NativeSelectOption key={group.uuid} value={group.uuid}>
                  {group.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TeamSpotSelect
              label="Equipe A"
              value={sideA}
              options={teamSpots}
              onChange={setSideA}
            />
            <TeamSpotSelect
              label="Equipe B"
              value={sideB}
              options={teamSpots}
              onChange={setSideB}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="standings-match-label">Nome da partida</Label>
            <Input
              id="standings-match-label"
              value={label}
              placeholder={
                selectedA && selectedB
                  ? `${selectedA.name} × ${selectedB.name}`
                  : "Equipe A × Equipe B"
              }
              onChange={(event) => setLabel(event.target.value)}
            />
          </div>
          {sideA && sideA === sideB ? (
            <Alert variant="destructive">
              <AlertDescription>Escolha duas equipes diferentes.</AlertDescription>
            </Alert>
          ) : null}
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!sideA || !sideB || sideA === sideB || busy}
            onClick={() => void submit()}
          >
            {busy ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Criar partida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeamSpotSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ team: { uuid: string; name: string } }>;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <NativeSelectOption value="">Selecionar equipe</NativeSelectOption>
        {options.map(({ team }) => (
          <NativeSelectOption key={team.uuid} value={team.uuid}>
            {team.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function GroupDialog({
  data,
  projection,
  stage,
  open,
  onOpenChange,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  stage: FormatStage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjection: (projection: FormatProjection) => void;
}) {
  const createGroup = useServerFn(createChampionshipGroupFn);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const groupedTeams = new Set(
    projection.spots.items
      .filter(
        (spot) => spot.stageUuid === stage.uuid && spot.kind === "group-entry" && spot.currentTeam,
      )
      .map((spot) => spot.currentTeam!.uuid),
  );
  const availableTeams = data.teams.items.filter((team) => !groupedTeams.has(team.uuid));

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    setMessage(null);
    const currentStage = projection.stages.items.find((item) => item.uuid === stage.uuid) ?? stage;
    const result = await createGroup({
      data: {
        championshipUuid: data.championship.uuid,
        stageUuid: stage.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(projection.championshipRevision),
        expectedStageRevision: numberValue(currentStage.revision),
        name: name.trim(),
        teamIds: selected,
      },
    });
    setBusy(false);
    if (result.ok) {
      onProjection(result.data);
      setName("");
      setSelected([]);
      onOpenChange(false);
    } else {
      setMessage(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Composição dos grupos</DialogTitle>
          <DialogDescription>
            Crie um grupo e posicione equipes agora. Depois, cada entrada continua sendo um spot
            editável.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="group-name">Nome</Label>
            <Input
              id="group-name"
              value={name}
              placeholder="Grupo A"
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="max-h-72 overflow-auto border">
            {availableTeams.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                Todas as equipes já estão posicionadas nesta etapa.
              </p>
            ) : (
              availableTeams.map((team) => {
                const checked = selected.includes(team.uuid);
                return (
                  <label
                    key={team.uuid}
                    className="flex cursor-pointer items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-muted/30"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        setSelected((current) =>
                          next
                            ? [...current, team.uuid]
                            : current.filter((uuid) => uuid !== team.uuid),
                        )
                      }
                    />
                    <TeamSwatch colors={team.colors} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground">{team.abbreviation}</span>
                  </label>
                );
              })
            )}
          </div>
          {message ? <p className="text-sm text-destructive">{message}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!name.trim() || busy} onClick={() => void submit()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Plus />}
            Criar grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RulesDialog({
  data,
  projection,
  standings,
  open,
  onOpenChange,
  onProjection,
  onSaved,
}: {
  data: FormatData;
  projection: FormatProjection;
  standings: ChampionshipStandingsData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjection: (projection: FormatProjection) => void;
  onSaved: () => Promise<void>;
}) {
  const configure = useServerFn(configureChampionshipStandingsFn);
  const [rules, setRules] = useState<Rule[]>([]);
  const [manualOrder, setManualOrder] = useState<string[]>([]);
  const [win, setWin] = useState(3);
  const [draw, setDraw] = useState(1);
  const [loss, setLoss] = useState(0);
  const [restart, setRestart] = useState<"continue" | "restart-for-subgroup">("continue");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !standings) return;
    setRules(standings.rules);
    setManualOrder(standings.rows.map((row) => row.team.uuid));
    setWin(numberValue(standings.scoring.win));
    setDraw(numberValue(standings.scoring.draw));
    setLoss(numberValue(standings.scoring.loss));
    setRestart(standings.headToHeadRestart);
    setMessage(null);
  }, [open, standings]);

  function moveRule(index: number, direction: -1 | 1) {
    setRules((current) => moveItem(current, index, direction));
  }

  async function submit() {
    if (!standings || rules.length === 0 || busy) return;
    setBusy(true);
    setMessage(null);
    const result = await configure({
      data: {
        championshipUuid: data.championship.uuid,
        stageUuid: standings.stage.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(projection.championshipRevision),
        expectedStageRevision: numberValue(standings.stage.revision),
        scoring: { win, draw, loss },
        headToHeadRestart: restart,
        rules: rules.map((rule) => ({
          criterion: rule.criterion,
          direction: rule.criterion === "manual" ? "asc" : rule.direction,
          config: rule.criterion === "manual" ? { teamOrder: manualOrder } : rule.config,
        })),
      },
    });
    setBusy(false);
    if (result.ok) {
      onProjection(result.data);
      onOpenChange(false);
      await onSaved();
    } else {
      setMessage(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Critérios de classificação</DialogTitle>
          <DialogDescription>
            Os critérios são avaliados em ordem e apenas dentro de cada grupo ainda empatado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField label="Vitória" value={win} onChange={setWin} />
          <NumberField label="Empate" value={draw} onChange={setDraw} />
          <NumberField label="Derrota" value={loss} onChange={setLoss} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="head-to-head-restart">Subgrupo no confronto direto</Label>
          <NativeSelect
            id="head-to-head-restart"
            value={restart}
            onChange={(event) =>
              setRestart(event.target.value as "continue" | "restart-for-subgroup")
            }
          >
            <NativeSelectOption value="continue">
              Continuar para o próximo critério
            </NativeSelectOption>
            <NativeSelectOption value="restart-for-subgroup">
              Reiniciar o confronto direto no novo subgrupo
            </NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="space-y-2">
          {rules.map((rule, index) => (
            <div
              key={`${rule.uuid ?? rule.criterion}-${index}`}
              className="grid items-center gap-2 border p-2 sm:grid-cols-[2rem_minmax(0,1fr)_8rem_6.5rem]"
            >
              <span className="text-center text-xs font-bold text-muted-foreground">
                {index + 1}
              </span>
              <NativeSelect
                value={rule.criterion}
                onChange={(event) =>
                  setRules((current) =>
                    current.map((candidate, candidateIndex) =>
                      candidateIndex === index
                        ? {
                            ...candidate,
                            criterion: event.target.value as Criterion,
                            direction:
                              event.target.value === "manual" ? "asc" : candidate.direction,
                          }
                        : candidate,
                    ),
                  )
                }
              >
                {criterionOptions.map((criterion) => (
                  <NativeSelectOption key={criterion} value={criterion}>
                    {criterionLabel(criterion)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <NativeSelect
                value={rule.criterion === "manual" ? "asc" : rule.direction}
                disabled={rule.criterion === "manual"}
                onChange={(event) =>
                  setRules((current) =>
                    current.map((candidate, candidateIndex) =>
                      candidateIndex === index
                        ? {
                            ...candidate,
                            direction: event.target.value as "asc" | "desc",
                          }
                        : candidate,
                    ),
                  )
                }
              >
                <NativeSelectOption value="desc">Maior primeiro</NativeSelectOption>
                <NativeSelectOption value="asc">Menor primeiro</NativeSelectOption>
              </NativeSelect>
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  title="Mover critério para cima"
                  disabled={index === 0}
                  onClick={() => moveRule(index, -1)}
                >
                  <ArrowUp />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Mover critério para baixo"
                  disabled={index === rules.length - 1}
                  onClick={() => moveRule(index, 1)}
                >
                  <ArrowDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Remover critério"
                  disabled={rules.length === 1}
                  onClick={() =>
                    setRules((current) =>
                      current.filter((_, candidateIndex) => candidateIndex !== index),
                    )
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            onClick={() =>
              setRules((current) => [
                ...current,
                {
                  uuid: null,
                  position: current.length,
                  criterion: "score-difference",
                  direction: "desc",
                  config: null,
                },
              ])
            }
          >
            <Plus />
            Adicionar critério
          </Button>
        </div>
        {rules.some((rule) => rule.criterion === "manual") ? (
          <div className="space-y-2 border-y py-4">
            <div>
              <h4 className="text-sm font-semibold">Ordem manual auditada</h4>
              <p className="text-xs text-muted-foreground">
                Use esta ordem apenas para resolver casos que os critérios objetivos não separam.
              </p>
            </div>
            {manualOrder.map((teamUuid, index) => {
              const team = standings?.rows.find((row) => row.team.uuid === teamUuid)?.team;
              return (
                <div key={teamUuid} className="flex items-center gap-3 border px-3 py-2">
                  <span className="w-6 text-center text-xs font-bold">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm">{team?.name ?? teamUuid}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Subir equipe"
                    disabled={index === 0}
                    onClick={() => setManualOrder((current) => moveItem(current, index, -1))}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Descer equipe"
                    disabled={index === manualOrder.length - 1}
                    onClick={() => setManualOrder((current) => moveItem(current, index, 1))}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : null}
        {message ? <p className="text-sm text-destructive">{message}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={busy || rules.length === 0} onClick={() => void submit()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Check />}
            Salvar critérios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoundRobinDialog({
  data,
  projection,
  stage,
  groups,
  open,
  onOpenChange,
  onProjection,
}: {
  data: FormatData;
  projection: FormatProjection;
  stage: FormatStage;
  groups: FormatProjection["groups"]["items"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjection: (projection: FormatProjection) => void;
}) {
  const previewRoundRobin = useServerFn(previewChampionshipRoundRobinFn);
  const generateRoundRobin = useServerFn(generateChampionshipRoundRobinFn);
  const [sameGroup, setSameGroup] = useState(2);
  const [crossGroup, setCrossGroup] = useState(0);
  const [assignRounds, setAssignRounds] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number | null>>({});
  const [preview, setPreview] = useState<ChampionshipRoundRobinPreviewData | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const groupPairs = useMemo(
    () =>
      groups.flatMap((left, leftIndex) =>
        groups.slice(leftIndex + 1).map((right) => ({
          key: `${left.uuid}:${right.uuid}`,
          left,
          right,
        })),
      ),
    [groups],
  );
  const pairOverrides = groupPairs.flatMap((pair) => {
    const meetings = overrides[pair.key];
    return meetings === null || meetings === undefined
      ? []
      : [
          {
            groupAId: pair.left.uuid,
            groupBId: pair.right.uuid,
            meetings,
          },
        ];
  });

  async function calculate() {
    setBusy(true);
    setMessage(null);
    const result = await previewRoundRobin({
      data: {
        championshipUuid: data.championship.uuid,
        stageUuid: stage.uuid,
        sameGroupMeetings: sameGroup,
        crossGroupMeetings: crossGroup,
        pairOverrides,
        assignCompetitionRounds: assignRounds,
      },
    });
    setBusy(false);
    if (result.ok) setPreview(result.data);
    else setMessage(result.message);
  }

  async function generate() {
    if (!preview || busy) return;
    setBusy(true);
    setMessage(null);
    const currentStage = projection.stages.items.find((item) => item.uuid === stage.uuid) ?? stage;
    const result = await generateRoundRobin({
      data: {
        championshipUuid: data.championship.uuid,
        stageUuid: stage.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(projection.championshipRevision),
        expectedStageRevision: numberValue(currentStage.revision),
        sameGroupMeetings: sameGroup,
        crossGroupMeetings: crossGroup,
        pairOverrides,
        assignCompetitionRounds: assignRounds,
      },
    });
    setBusy(false);
    if (result.ok) {
      onProjection(result.data);
      onOpenChange(false);
      setPreview(null);
    } else {
      setMessage(result.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerar partidas da tabela</DialogTitle>
          <DialogDescription>
            A prévia preserva partidas manuais e cria somente os encontros que ainda faltam.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Jogos no mesmo grupo"
            value={sameGroup}
            min={0}
            max={20}
            onChange={setSameGroup}
          />
          <NumberField
            label="Jogos entre grupos"
            value={crossGroup}
            min={0}
            max={20}
            onChange={setCrossGroup}
          />
        </div>
        {groupPairs.length > 0 ? (
          <div className="space-y-2">
            <Label>Exceções entre grupos</Label>
            <div className="divide-y border">
              {groupPairs.map((pair) => (
                <div
                  key={pair.key}
                  className="grid items-center gap-3 px-3 py-2 sm:grid-cols-[1fr_7rem]"
                >
                  <span className="truncate text-sm">
                    {pair.left.name} × {pair.right.name}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    max={20}
                    placeholder={`${crossGroup}`}
                    value={overrides[pair.key] ?? ""}
                    onChange={(event) =>
                      setOverrides((current) => ({
                        ...current,
                        [pair.key]:
                          event.target.value === ""
                            ? null
                            : clamp(Number(event.target.value), 0, 20),
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <label
          htmlFor="assign-existing-rounds"
          className="flex items-center justify-between gap-4 border px-4 py-3"
        >
          <span>
            <span className="block text-sm font-medium">Distribuir nos períodos existentes</span>
            <span className="block text-xs text-muted-foreground">
              Os jogos continuam sem horário exato até staff ou GMs agendarem.
            </span>
          </span>
          <Switch
            id="assign-existing-rounds"
            checked={assignRounds}
            onCheckedChange={setAssignRounds}
          />
        </label>
        {preview ? (
          <div className="grid overflow-hidden border sm:grid-cols-4">
            <Metric label="Desejadas" value={preview.desiredMatchCount} />
            <Metric label="Existentes" value={preview.existingMatchCount} />
            <Metric label="A criar" value={preview.missingMatchCount} accent />
            <Metric label="Excedentes" value={preview.excessMatchCount} />
          </div>
        ) : null}
        {preview?.pairings.truncated ? (
          <Alert>
            <Info />
            <AlertDescription>
              Exibindo 500 de {preview.pairings.totalCount} confrontos na prévia. A geração usa o
              plano completo.
            </AlertDescription>
          </Alert>
        ) : null}
        {preview && !preview.canGenerate ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>
              {preview.generationBlockedReason ??
                "Este plano é grande demais para ser gerado de uma só vez."}
            </AlertDescription>
          </Alert>
        ) : null}
        {message ? <p className="text-sm text-destructive">{message}</p> : null}
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={() => void calculate()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <RefreshCcw />}
            Atualizar prévia
          </Button>
          <Button
            disabled={!preview || !preview.canGenerate || preview.missingMatchCount === 0 || busy}
            onClick={() => void generate()}
          >
            <Sparkles />
            Gerar {preview?.missingMatchCount ?? 0} partidas
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ClassificationDialog({
  data,
  projection,
  standings,
  open,
  onOpenChange,
  onProjection,
  onApplied,
}: {
  data: FormatData;
  projection: FormatProjection;
  standings: ChampionshipStandingsData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjection: (projection: FormatProjection) => void;
  onApplied: (standings: ChampionshipStandingsData) => void;
}) {
  const apply = useServerFn(applyChampionshipClassificationFn);
  const getFormat = useServerFn(getChampionshipFormatFn);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (!standings || !standings.canApply || busy) return;
    setBusy(true);
    setMessage(null);
    const result = await apply({
      data: {
        championshipUuid: data.championship.uuid,
        stageUuid: standings.stage.uuid,
        groupUuid: standings.group.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(standings.championshipRevision),
        expectedStageRevision: numberValue(standings.stage.revision),
        confirmedImpactMatchUuids: standings.affectedMatches.map((match) => match.matchUuid),
      },
    });
    if (result.ok) {
      onApplied(result.data);
      const next = await getFormat({
        data: {
          championshipUuid: data.championship.uuid,
          limit: numberValue(projection.limit) || 500,
        },
      });
      onProjection(next);
      onOpenChange(false);
    } else {
      setMessage(result.message);
    }
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aplicar classificação agora</DialogTitle>
          <DialogDescription>
            A ordem é válida imediatamente. Confira todas as mudanças e partidas afetadas antes de
            confirmar.
          </DialogDescription>
        </DialogHeader>
        {standings ? (
          <div className="space-y-5">
            <div className="divide-y border">
              {standings.qualification.map((route) => (
                <div
                  key={route.routeUuid}
                  className="grid gap-2 px-4 py-3 sm:grid-cols-[4rem_1fr_1.2rem_1fr]"
                >
                  <span className="font-mono text-sm font-bold">{route.rank}º</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {route.previousTeam?.name ?? "Vazio"}
                  </span>
                  <span className="text-center text-muted-foreground">→</span>
                  <span
                    className={`truncate text-sm font-medium ${
                      route.blocked ? "text-amber-300" : ""
                    }`}
                  >
                    {route.nextTeam?.name ?? route.reason ?? "Sem equipe"}
                  </span>
                </div>
              ))}
            </div>
            {standings.affectedMatches.length > 0 ? (
              <div>
                <h4 className="text-sm font-semibold">Partidas que serão desvinculadas</h4>
                <p className="mb-2 text-xs text-muted-foreground">
                  Resultados e evidências incompatíveis serão invalidados; o horário agendado
                  permanece.
                </p>
                <div className="divide-y border">
                  {standings.affectedMatches.map((match) => (
                    <div key={match.matchUuid} className="flex items-center gap-3 px-4 py-3">
                      <span className="grid size-7 place-items-center border font-mono text-xs">
                        {match.depth}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">
                        {match.label}
                      </span>
                      {match.hadResult ? <Badge variant="outline">resultado</Badge> : null}
                      {match.hadEvidence ? <Badge variant="outline">registro</Badge> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert>
                <Check />
                <AlertDescription>Nenhuma partida já registrada será afetada.</AlertDescription>
              </Alert>
            )}
            {!standings.canApply ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>
                  Há uma vaga de classificação dentro de um empate não resolvido. Ajuste os
                  critérios ou a ordem manual antes de aplicar.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : null}
        {message ? <p className="text-sm text-destructive">{message}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Voltar
          </Button>
          <Button disabled={!standings?.canApply || busy} onClick={() => void submit()}>
            {busy ? <LoaderCircle className="animate-spin" /> : <Trophy />}
            Confirmar e aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StandingsSkeleton() {
  return (
    <div className="space-y-px border-y bg-border">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex h-16 items-center gap-4 bg-background px-6">
          <Skeleton className="size-7" />
          <Skeleton className="h-4 w-44" />
          <Skeleton className="ml-auto h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

function TeamSwatch({ colors }: { colors: string[] | null }) {
  const swatches = colors?.slice(0, 2) ?? [];

  return (
    <span className="flex size-7 shrink-0 overflow-hidden border">
      {swatches.length > 0 ? (
        swatches.map((color) => (
          <span key={color} className="h-full flex-1" style={{ backgroundColor: color }} />
        ))
      ) : (
        <span className="h-full w-full bg-muted" />
      )}
    </span>
  );
}

function NumberField({
  label,
  value,
  min = -100,
  max = 100,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number | string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background px-4 py-3">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent ? "text-cyan-300" : ""}`}>
        {value}
      </p>
    </div>
  );
}

const criterionOptions: Criterion[] = [
  "points",
  "wins",
  "score-difference",
  "score-for",
  "score-against",
  "head-to-head-points",
  "head-to-head-score-difference",
  "manual",
];

function criterionLabel(criterion: Criterion) {
  return {
    points: "Pontos",
    wins: "Vitórias",
    "score-difference": "Saldo de gols",
    "score-for": "Gols marcados",
    "score-against": "Gols sofridos",
    "head-to-head": "Confronto direto",
    "head-to-head-points": "Pontos no confronto direto",
    "head-to-head-score-difference": "Saldo no confronto direto",
    manual: "Ordem manual",
  }[criterion];
}

function scopeLabel(scope: "overall" | "head-to-head" | "manual") {
  if (scope === "head-to-head") return "mini-tabela";
  if (scope === "manual") return "decisão da staff";
  return "geral";
}

function qualificationIssue(route: ChampionshipStandingsData["qualification"][number]) {
  if (route.blocked) {
    return "Esta posição faz parte de um empate ainda não resolvido.";
  }
  return route.reason;
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target]!, next[index]!];
  return next;
}

function signed(value: number) {
  return value > 0 ? `+${value}` : String(value);
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}
