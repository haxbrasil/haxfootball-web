import { useCallback, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  Check,
  CircleAlert,
  Clock3,
  RefreshCw,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
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
import type {
  ChampionshipMetricMappingsData,
  ChampionshipStatisticsData,
  ChampionshipWorkspaceData,
} from "#/server/api/championship-api";
import {
  getChampionshipStatisticsFn,
  listChampionshipMetricMappingsFn,
  replaceChampionshipMetricMappingsFn,
} from "#/server/api/championship-match-functions";
import {
  humanizeMetricKey,
  metricMappingDrafts,
  playerMetricColumns,
  statisticValueLabel,
  validateMetricMappingDrafts,
  type MetricMappingDraft,
} from "./statistics-workspace-model";

export function StatisticsWorkspace({
  data,
  mode,
  initialStatistics,
  initialMappings,
}: {
  data: Pick<ChampionshipWorkspaceData, "championship">;
  mode: "admin" | "public";
  initialStatistics?: ChampionshipStatisticsData;
  initialMappings?: ChampionshipMetricMappingsData;
}) {
  const getStatistics = useServerFn(getChampionshipStatisticsFn);
  const getMappings = useServerFn(listChampionshipMetricMappingsFn);
  const [statistics, setStatistics] = useState(initialStatistics ?? null);
  const [mappings, setMappings] = useState(initialMappings ?? null);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">(
    initialStatistics ? "ready" : "idle",
  );
  const [message, setMessage] = useState<string | null>(null);
  const [view, setView] = useState<"teams" | "players">("teams");
  const [mappingOpen, setMappingOpen] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    setMessage(null);

    try {
      const [nextStatistics, nextMappings] = await Promise.all([
        getStatistics({
          data: { championshipUuid: data.championship.uuid, limit: 200, offset: 0 },
        }),
        mode === "admin"
          ? getMappings({
              data: { championshipUuid: data.championship.uuid, limit: 500, offset: 0 },
            })
          : Promise.resolve(null),
      ]);
      setStatistics(nextStatistics);
      if (nextMappings) setMappings(nextMappings);
      setState("ready");
    } catch (cause) {
      setMessage(errorMessage(cause));
      setState("error");
    }
  }, [data.championship.uuid, getMappings, getStatistics, mode]);

  useEffect(() => {
    if (!initialStatistics && state === "idle") void load();
  }, [initialStatistics, load, state]);

  if (state === "loading" && !statistics) return <StatisticsSkeleton />;

  if (state === "error" && !statistics) {
    return (
      <Alert variant="destructive">
        <CircleAlert />
        <AlertDescription>{message}</AlertDescription>
      </Alert>
    );
  }

  if (!statistics) return null;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Estatísticas oficiais</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Somente resultados atuais; correções recalculam esta projeção.
          </p>
        </div>
        <div className="flex gap-2">
          {mode === "admin" && mappings ? (
            <Button variant="outline" onClick={() => setMappingOpen(true)}>
              <Settings2 />
              Compatibilidade de métricas
            </Button>
          ) : null}
          {mode === "admin" ? (
            <Button variant="ghost" size="icon" title="Atualizar estatísticas" onClick={load}>
              <RefreshCw className={state === "loading" ? "animate-spin" : ""} />
            </Button>
          ) : null}
        </div>
      </header>

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <StatisticsSummary statistics={statistics} />

      <div className="flex w-fit border p-1">
        <Button
          size="sm"
          variant={view === "teams" ? "secondary" : "ghost"}
          onClick={() => setView("teams")}
        >
          <Shield />
          Equipes
        </Button>
        <Button
          size="sm"
          variant={view === "players" ? "secondary" : "ghost"}
          onClick={() => setView("players")}
        >
          <Users />
          Jogadores
        </Button>
      </div>

      {statistics.teams.items.length === 0 && statistics.players.items.length === 0 ? (
        <div className="bfl-panel rounded-xl border px-6 py-16 text-center">
          <BarChart3 className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-4 text-sm font-medium">Ainda não há resultados oficiais</p>
          <p className="mt-1 text-xs text-muted-foreground">
            A tabela será formada assim que o primeiro jogo for registrado.
          </p>
        </div>
      ) : view === "teams" ? (
        <TeamStatisticsTable statistics={statistics} />
      ) : (
        <PlayerStatisticsTable statistics={statistics} mappings={mappings} />
      )}

      {mode === "admin" && mappings ? (
        <MetricMappingsDialog
          open={mappingOpen}
          onOpenChange={setMappingOpen}
          championshipUuid={data.championship.uuid}
          championshipRevision={Number(data.championship.revision)}
          statistics={statistics}
          mappings={mappings}
          onMappings={(next) => {
            setMappings(next);
            setMappingOpen(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

function StatisticsSummary({ statistics }: { statistics: ChampionshipStatisticsData }) {
  const settled = statistics.teams.items.reduce(
    (highest, team) => Math.max(highest, Number(team.played)),
    0,
  );
  const minutes = statistics.players.items.reduce(
    (total, player) => total + player.playingTimeSeconds,
    0,
  );

  return (
    <section className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-4">
      <SummaryDatum label="Equipes" value={statistics.teams.totalCount} icon={Shield} />
      <SummaryDatum label="Jogadores" value={statistics.players.totalCount} icon={Users} />
      <SummaryDatum label="Jogos por equipe" value={settled} icon={BarChart3} />
      <SummaryDatum
        label="Tempo atribuído"
        value={statisticValueLabel(minutes, "duration")}
        icon={Clock3}
      />
    </section>
  );
}

function SummaryDatum({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Shield;
}) {
  return (
    <div className="bg-background px-4 py-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function TeamStatisticsTable({ statistics }: { statistics: ChampionshipStatisticsData }) {
  return (
    <div className="bfl-panel overflow-x-auto rounded-xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Equipe</TableHead>
            <TableHead className="text-right">J</TableHead>
            <TableHead className="text-right">V</TableHead>
            <TableHead className="text-right">E</TableHead>
            <TableHead className="text-right">D</TableHead>
            <TableHead className="text-right">PF</TableHead>
            <TableHead className="text-right">PS</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statistics.teams.items.map((row) => (
            <TableRow key={row.team?.uuid ?? "unknown"}>
              <TableCell className="font-semibold">
                {row.team?.name ?? "Equipe histórica"}
              </TableCell>
              {[row.played, row.wins, row.draws, row.losses, row.pointsFor, row.pointsAgainst].map(
                (value, index) => (
                  <TableCell key={index} className="text-right font-mono tabular-nums">
                    {value}
                  </TableCell>
                ),
              )}
              <TableCell
                className={`text-right font-mono font-semibold tabular-nums ${
                  Number(row.differential) > 0
                    ? "text-emerald-300"
                    : Number(row.differential) < 0
                      ? "text-red-300"
                      : ""
                }`}
              >
                {Number(row.differential) > 0 ? "+" : ""}
                {row.differential}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {statistics.teams.truncated ? <PartialNotice /> : null}
    </div>
  );
}

function PlayerStatisticsTable({
  statistics,
  mappings,
}: {
  statistics: ChampionshipStatisticsData;
  mappings: ChampionshipMetricMappingsData | null;
}) {
  const columns = playerMetricColumns(statistics);
  const mappingByKey = new Map(
    mappings?.items.map((mapping) => [mapping.canonicalMetricKey, mapping]) ?? [],
  );
  const separatedCount = statistics.players.items.filter(
    (player) => player.sourceSeparatedMetrics.length > 0,
  ).length;

  return (
    <div>
      {separatedCount ? (
        <Alert className="mb-4 border-amber-400/30">
          <CircleAlert className="text-amber-300" />
          <AlertDescription>
            {separatedCount} jogador(es) têm métricas de programas incompatíveis exibidas por
            origem.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="bfl-panel overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jogador</TableHead>
              <TableHead className="text-right">Jogos</TableHead>
              <TableHead className="text-right">Tempo</TableHead>
              {columns.map((column) => (
                <TableHead key={column} className="text-right">
                  {mappingByKey.get(column)?.displayLabel ?? humanizeMetricKey(column)}
                </TableHead>
              ))}
              {separatedCount ? <TableHead>Por origem</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {statistics.players.items.map((player) => (
              <TableRow
                key={player.participantUuid ?? `${player.displayName}:${player.accountUuid}`}
              >
                <TableCell>
                  <div className="font-semibold">{player.displayName}</div>
                  {!player.accountUuid ? (
                    <Badge variant="outline" className="mt-1">
                      Histórico
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="text-right font-mono">{player.matchesPlayed}</TableCell>
                <TableCell className="text-right font-mono">
                  {statisticValueLabel(player.playingTimeSeconds, "duration")}
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column} className="text-right font-mono tabular-nums">
                    {statisticValueLabel(
                      player.metrics[column] ?? 0,
                      mappingByKey.get(column)?.valueKind ?? "number",
                    )}
                  </TableCell>
                ))}
                {separatedCount ? (
                  <TableCell>
                    {player.sourceSeparatedMetrics.map((source) => (
                      <div
                        key={`${source.eventSchema}:${source.program}`}
                        className="mb-1 whitespace-nowrap text-[11px] last:mb-0"
                      >
                        <span className="text-amber-300">{source.eventSchema ?? "Sem schema"}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {source.program ?? "programa desconhecido"} ·{" "}
                          {Object.entries(source.metrics)
                            .map(([key, value]) => `${humanizeMetricKey(key)} ${value}`)
                            .join(", ")}
                        </span>
                      </div>
                    ))}
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {statistics.players.truncated ? <PartialNotice /> : null}
      </div>
    </div>
  );
}

function MetricMappingsDialog({
  open,
  onOpenChange,
  championshipUuid,
  championshipRevision,
  statistics,
  mappings,
  onMappings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  championshipUuid: string;
  championshipRevision: number;
  statistics: ChampionshipStatisticsData;
  mappings: ChampionshipMetricMappingsData;
  onMappings: (mappings: ChampionshipMetricMappingsData) => void;
}) {
  const replace = useServerFn(replaceChampionshipMetricMappingsFn);
  const [drafts, setDrafts] = useState(() => metricMappingDrafts(statistics, mappings));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const issues = useMemo(() => validateMetricMappingDrafts(drafts), [drafts]);

  useEffect(() => setDrafts(metricMappingDrafts(statistics, mappings)), [mappings, statistics]);

  function update(sourceKey: string, patch: Partial<MetricMappingDraft>) {
    setDrafts((current) =>
      current.map((draft) => (draft.sourceKey === sourceKey ? { ...draft, ...patch } : draft)),
    );
  }

  async function save() {
    if (issues.length) return;
    setBusy(true);
    setMessage(null);
    const result = await replace({
      data: {
        championshipUuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: championshipRevision,
        mappings: drafts
          .filter((draft) => draft.enabled)
          .map((draft) => ({
            eventSchemaId: draft.eventSchemaId,
            eventSchemaVersion: draft.eventSchemaVersion,
            sourceMetricKey: draft.sourceMetricKey,
            canonicalMetricKey: draft.canonicalMetricKey.trim(),
            displayLabel: draft.displayLabel.trim(),
            valueKind: draft.valueKind,
            aggregation: draft.aggregation,
          })),
      },
    });
    setBusy(false);

    if (result.ok) onMappings(result.data);
    else setMessage(result.message);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-hidden sm:max-w-6xl">
        <DialogHeader>
          <DialogTitle>Compatibilidade de métricas</DialogTitle>
          <DialogDescription>
            Una métricas equivalentes de programas diferentes. Origens não marcadas continuam
            separadas.
          </DialogDescription>
        </DialogHeader>
        {message ? (
          <Alert variant="destructive">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <div className="overflow-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Usar</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Chave canônica</TableHead>
                <TableHead>Nome público</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Agregação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drafts.map((draft) => (
                <TableRow key={draft.sourceKey} className={!draft.enabled ? "opacity-60" : ""}>
                  <TableCell>
                    <Checkbox
                      aria-label={`Mapear ${draft.sourceMetricKey}`}
                      checked={draft.enabled}
                      onCheckedChange={(value) =>
                        update(draft.sourceKey, { enabled: value === true })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{draft.sourceMetricKey}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {draft.eventSchemaName}@{draft.eventSchemaVersion}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Chave canônica de ${draft.sourceMetricKey}`}
                      value={draft.canonicalMetricKey}
                      disabled={!draft.enabled}
                      onChange={(event) =>
                        update(draft.sourceKey, { canonicalMetricKey: event.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      aria-label={`Nome público de ${draft.sourceMetricKey}`}
                      value={draft.displayLabel}
                      disabled={!draft.enabled}
                      onChange={(event) =>
                        update(draft.sourceKey, { displayLabel: event.target.value })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <NativeSelect
                      value={draft.valueKind}
                      disabled={!draft.enabled}
                      onChange={(event) =>
                        update(draft.sourceKey, {
                          valueKind: event.target.value as MetricMappingDraft["valueKind"],
                        })
                      }
                    >
                      <NativeSelectOption value="integer">Inteiro</NativeSelectOption>
                      <NativeSelectOption value="number">Número</NativeSelectOption>
                      <NativeSelectOption value="duration">Duração</NativeSelectOption>
                      <NativeSelectOption value="percentage">Percentual</NativeSelectOption>
                    </NativeSelect>
                  </TableCell>
                  <TableCell>
                    <NativeSelect
                      value={draft.aggregation}
                      disabled={!draft.enabled}
                      onChange={(event) =>
                        update(draft.sourceKey, {
                          aggregation: event.target.value as MetricMappingDraft["aggregation"],
                        })
                      }
                    >
                      <NativeSelectOption value="sum">Soma</NativeSelectOption>
                      <NativeSelectOption value="average">Média</NativeSelectOption>
                      <NativeSelectOption value="maximum">Máximo</NativeSelectOption>
                      <NativeSelectOption value="minimum">Mínimo</NativeSelectOption>
                    </NativeSelect>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {!drafts.length ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Nenhuma métrica de programa foi observada nos resultados atuais.
            </p>
          ) : null}
        </div>
        {statistics.metricSources.truncated || mappings.truncated ? <PartialNotice /> : null}
        {issues.length ? (
          <div className="space-y-1 text-xs text-amber-300">
            {issues.map((issue) => (
              <p key={issue}>• {issue}</p>
            ))}
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={busy || issues.length > 0} onClick={save}>
            <Check />
            {busy ? "Salvando" : `Salvar ${drafts.filter((draft) => draft.enabled).length} mapas`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartialNotice() {
  return (
    <p className="border-t px-4 py-2 text-center text-xs text-amber-300">
      Exibição parcial. Use paginação para consultar os demais registros.
    </p>
  );
}

function StatisticsSkeleton() {
  return (
    <div className="space-y-5" aria-label="Carregando estatísticas">
      <Skeleton className="h-12 w-80" />
      <div className="grid gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Não foi possível carregar as estatísticas.";
}
