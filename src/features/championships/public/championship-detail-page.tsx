import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Crown,
  History,
  LayoutDashboard,
  ListOrdered,
  Medal,
  Radio,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { LeagueHeader } from "#/components/ds/league-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Progress } from "#/components/ui/progress";
import { Separator } from "#/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import type { PublicChampionshipDetail } from "#/server/api/championship-api";
import type { ApiAccountSession } from "#/server/auth/session";
import { FormatWorkspace } from "#/features/admin/championships/format-workspace";
import { ChampionshipArchiveWorkspace } from "#/features/admin/championships/archive-workspace";
import { ChampionshipMatchViewer } from "./championship-match-viewer";
import { ChampionshipSectionHeading } from "./championship-section-heading";
import { VisualizationDashboardView } from "#/features/visualizations/visualization-chart";
import {
  selfRegisterChampionshipFn,
  withdrawChampionshipRegistrationFn,
} from "#/server/api/championship-functions";
import {
  championshipLifecycleLabel,
  championshipLifecycleTone,
  matchFormatLabel,
  registrationLabel,
} from "../championship-labels";
import { formatSalaryUnits } from "../salary-format";
import { sortPublicChampionshipMatches } from "./championship-match-order";

export function ChampionshipDetailPage({
  data,
  session,
}: {
  data: PublicChampionshipDetail;
  session: ApiAccountSession | null;
}) {
  const { championship, teams, participants } = data;
  const salary = championship.rules.salary;
  const [section, setSection] = useState<PublicSection>("overview");
  const isGeneralManager =
    session !== null &&
    data.participants.items.some(
      (participant) =>
        participant.identity.kind === "account" &&
        participant.identity.accountUuid === session.account.uuid &&
        participant.activeMembership?.role === "gm",
    );
  const matches = useMemo(
    () => sortPublicChampionshipMatches(data.format.matches.items, data.format.stages.items),
    [data.format.matches.items, data.format.stages.items],
  );

  return (
    <div className="space-y-6 pb-10">
      <ChampionshipHero
        data={data}
        participantCount={participants.items.length}
        teamCount={teams.items.length}
        showGeneralManagerArea={isGeneralManager}
      />
      <ChampionshipNavigation
        section={section}
        onSelect={setSection}
        slug={championship.slug}
        showDraft={hasCompletedOrRecordedDraft(data)}
        showStatistics={data.visualizations.statistics.items.length > 0}
        showHonors={data.honors.items.length > 0 || Number(data.history.placements.totalCount) > 0}
      />

      {section === "overview" ? (
        <ChampionshipOverview data={data} session={session} matches={matches} />
      ) : null}
      {section === "bracket" ? (
        <section className="space-y-5">
          <ChampionshipSectionHeading
            icon={Swords}
            title="Chaves e classificação"
            detail="Acompanhe cada etapa, tabela e caminho até a decisão."
          />
          <FormatWorkspace
            data={data}
            mode="public"
            canNegotiateSchedule={
              session !== null &&
              data.selfRegistration?.status === "active" &&
              data.selfRegistration.activeMembership?.role === "gm"
            }
          />
        </section>
      ) : null}
      {section === "matches" ? (
        <ChampionshipMatchViewer championshipUuid={championship.uuid} matches={matches} />
      ) : null}
      {section === "rosters" ? <ChampionshipRosters data={data} /> : null}
      {section === "statistics" ? (
        <section className="space-y-5">
          <ChampionshipSectionHeading
            icon={BarChart3}
            title="Estatísticas"
            detail="Visualizações configuradas para acompanhar o desempenho da edição."
          />
          <VisualizationDashboardView items={data.visualizations.statistics.items} />
        </section>
      ) : null}
      {section === "honors" ? <ChampionshipArchiveWorkspace data={data} mode="public" /> : null}
      {section === "info" ? <ChampionshipInformation data={data} salary={salary} /> : null}
    </div>
  );
}

type PublicSection =
  | "overview"
  | "matches"
  | "bracket"
  | "rosters"
  | "statistics"
  | "honors"
  | "info";

function ChampionshipHero({
  data,
  participantCount,
  teamCount,
  showGeneralManagerArea,
}: {
  data: PublicChampionshipDetail;
  participantCount: number;
  teamCount: number;
  showGeneralManagerArea: boolean;
}) {
  const championship = data.championship;

  return (
    <>
      <Link
        to="/championships"
        className="inline-flex items-center gap-2 px-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Todos os campeonatos
      </Link>
      <LeagueHeader
        title={championship.name}
        eyebrow={championship.competitionType.name}
        description={championship.editionLabel ?? championship.description ?? undefined}
        action={
          <div className="flex min-w-56 flex-col items-start gap-3 border-l pl-5 sm:items-end">
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Badge
                variant="outline"
                className={championshipLifecycleTone(championship.lifecycle)}
              >
                {championshipLifecycleLabel(championship.lifecycle)}
              </Badge>
              {championship.historical ? (
                <Badge variant="secondary">
                  <History className="mr-1 size-3" />
                  Histórico
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground sm:justify-end">
              <HeroFact icon={Users} value={String(participantCount)} label="inscritos" />
              <HeroFact icon={Shield} value={String(teamCount)} label="equipes" />
            </div>
            {showGeneralManagerArea ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/championships/$slug/gm" params={{ slug: championship.slug }}>
                  <Crown />
                  Área do General Manager
                </Link>
              </Button>
            ) : null}
          </div>
        }
      />
    </>
  );
}

function ChampionshipNavigation({
  section,
  onSelect,
  slug,
  showDraft,
  showStatistics,
  showHonors,
}: {
  section: PublicSection;
  onSelect: (section: PublicSection) => void;
  slug: string;
  showDraft: boolean;
  showStatistics: boolean;
  showHonors: boolean;
}) {
  const items: Array<{ key: PublicSection; label: string; icon: typeof LayoutDashboard }> = [
    { key: "overview", label: "Visão geral", icon: LayoutDashboard },
    { key: "matches", label: "Jogos", icon: Swords },
    { key: "bracket", label: "Chaves e classificação", icon: Trophy },
    { key: "rosters", label: "Elencos", icon: Users },
    ...(showStatistics
      ? [{ key: "statistics" as const, label: "Estatísticas", icon: BarChart3 }]
      : []),
    ...(showHonors ? [{ key: "honors" as const, label: "Títulos e prêmios", icon: Medal }] : []),
    { key: "info", label: "Informações", icon: BookOpen },
  ];

  return (
    <nav
      className="bfl-panel bfl-scrollbar overflow-x-auto rounded-xl border"
      aria-label="Seções do campeonato"
    >
      <div className="flex min-w-max px-1">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`flex h-12 items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${
              section === key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
        {showDraft ? (
          <Link
            to="/championships/$slug/draft"
            params={{ slug }}
            className="flex h-12 items-center gap-2 border-b-2 border-transparent px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <Crown className="size-4" />
            Draft
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

function ChampionshipRosters({ data }: { data: PublicChampionshipDetail }) {
  const rosters = data.teams.items.map((team) => ({
    team,
    participants: data.participants.items
      .filter((participant) => participant.activeMembership?.team.uuid === team.uuid)
      .sort((left, right) => {
        const leftRole = left.activeMembership?.role === "gm" ? 0 : 1;
        const rightRole = right.activeMembership?.role === "gm" ? 0 : 1;

        return leftRole - rightRole || left.displayName.localeCompare(right.displayName, "pt-BR");
      }),
  }));

  return (
    <section className="space-y-5">
      <ChampionshipSectionHeading
        icon={Users}
        title="Elencos"
        detail="Acompanhe a composição atual de cada equipe da edição."
        action={<Badge variant="outline">{rosters.length} equipes</Badge>}
      />
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {rosters.map(({ team, participants }) => (
          <section key={team.uuid} className="bfl-panel min-w-0 overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between gap-4 border-b px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <TeamRosterMark colors={team.colors} />
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{team.name}</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {participants.length === 1
                      ? "1 pessoa no elenco"
                      : `${participants.length} pessoas no elenco`}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="shrink-0 tabular-nums">
                {participants.length}
              </Badge>
            </div>
            {participants.length > 0 ? (
              <ol className="divide-y">
                {participants.map((participant, index) => {
                  const generalManager = participant.activeMembership?.role === "gm";

                  return (
                    <li
                      key={participant.uuid}
                      className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3"
                    >
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid size-8 shrink-0 place-items-center border bg-background text-[11px] font-semibold">
                          {participant.displayName.slice(0, 2).toUpperCase()}
                        </span>
                        <span className="truncate text-sm font-medium">
                          {participant.displayName}
                        </span>
                      </div>
                      {generalManager ? (
                        <Badge
                          variant="outline"
                          className="border-primary/40 bg-primary/10 text-primary"
                        >
                          <Crown className="size-3" />
                          General Manager
                        </Badge>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                Elenco em formação.
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}

function TeamRosterMark({ colors }: { colors: string[] | null | undefined }) {
  return (
    <span
      className="size-10 shrink-0 border"
      style={{
        background:
          colors && colors.length > 1
            ? `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50%)`
            : (colors?.[0] ?? "#64748b"),
      }}
    />
  );
}

function ChampionshipOverview({
  data,
  session,
  matches,
}: {
  data: PublicChampionshipDetail;
  session: ApiAccountSession | null;
  matches: PublicChampionshipDetail["format"]["matches"]["items"];
}) {
  const activeStage =
    data.format.stages.items.find((stage) => stage.state === "active") ??
    data.format.stages.items.find((stage) =>
      matches.some((match) => match.stageUuid === stage.uuid && match.resultRevision === 0),
    ) ??
    data.format.stages.items.at(-1) ??
    null;
  const registrationIsActionable = canShowRegistrationPanel(data, session);

  return (
    <div className="space-y-6">
      {data.draft.draft?.state === "live" ? <LiveDraftBanner data={data} /> : null}
      <div
        className={
          registrationIsActionable
            ? "grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]"
            : undefined
        }
      >
        {activeStage ? (
          <FormatWorkspace
            data={data}
            mode="public"
            canNegotiateSchedule={false}
            stageUuid={activeStage.uuid}
            showQualificationDestinations={false}
          />
        ) : (
          <div className="bfl-panel grid min-h-64 place-items-center rounded-xl border px-6 text-center">
            <div>
              <Trophy className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 text-sm font-medium">A fase atual será publicada em breve.</p>
            </div>
          </div>
        )}
        {registrationIsActionable ? (
          <PublicRegistrationPanel data={data} session={session} />
        ) : null}
      </div>
      <ChampionshipPointsLeaderboard statistics={data.statistics} />
      <VisualizationDashboardView items={data.visualizations.overview.items} />
    </div>
  );
}

type ChampionshipPointsRow = {
  participantUuid: string | null;
  accountUuid: string | null;
  displayName: string;
  matchesPlayed: number;
  points: number;
};

function ChampionshipPointsLeaderboard({
  statistics,
}: {
  statistics: PublicChampionshipDetail["statistics"];
}) {
  const [open, setOpen] = useState(false);
  const metric = statistics.featuredMetrics.points;
  const rows = useMemo<ChampionshipPointsRow[]>(() => {
    if (!metric) return [];

    return statistics.players.items
      .flatMap((player) => {
        const points = player.metrics[metric.key];
        return typeof points === "number" && Number.isFinite(points) && points > 0
          ? [
              {
                participantUuid: player.participantUuid,
                accountUuid: player.accountUuid,
                displayName: player.displayName,
                matchesPlayed: Number(player.matchesPlayed),
                points,
              },
            ]
          : [];
      })
      .sort(
        (left, right) =>
          right.points - left.points || left.displayName.localeCompare(right.displayName),
      );
  }, [metric, statistics.players.items]);

  if (!metric || rows.length === 0) return null;

  const visibleRows = rows.slice(0, 10);
  const leaderPoints = visibleRows[0]?.points ?? 0;
  const hasMore = rows.length > visibleRows.length;
  const rankingCount = statistics.players.truncated
    ? `${rows.length} de ${statistics.players.totalCount}`
    : String(rows.length);

  return (
    <article className="bfl-panel relative overflow-hidden rounded-xl border border-accent/35 bg-[linear-gradient(145deg,color-mix(in_oklch,var(--accent)_14%,transparent),color-mix(in_oklch,var(--card)_96%,black)_42%,color-mix(in_oklch,var(--primary)_16%,transparent))] p-4 text-card-foreground shadow-[0_18px_58px_color-mix(in_oklch,black_34%,transparent)]">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,color-mix(in_oklch,var(--foreground)_7%,transparent)_1px,transparent_1px),linear-gradient(180deg,color-mix(in_oklch,var(--foreground)_5%,transparent)_1px,transparent_1px)] [background-size:68px_100%,100%_40px]" />
      <div className="relative mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-accent/45 bg-accent/18 text-accent shadow-xs">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-normal text-accent">
              Ranking
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal">Pontos</h2>
            <p className="mt-1 text-sm text-muted-foreground">Destaques da edição.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/35 bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            <Sparkles className="size-3.5" />
            {rankingCount}
          </span>
          {hasMore ? (
            <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
              <ListOrdered />
              Ver todos
            </Button>
          ) : null}
        </div>
      </div>
      <ol className="relative grid gap-3">
        {visibleRows.map((row, index) => (
          <ChampionshipPointsRowView
            key={row.participantUuid ?? row.accountUuid ?? `${row.displayName}-${index}`}
            row={row}
            rank={index + 1}
            leaderPoints={leaderPoints}
            precision={metric.precision}
          />
        ))}
      </ol>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="grid max-h-[min(88dvh,52rem)] w-[min(94vw,44rem)] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden border-accent/30 bg-[linear-gradient(145deg,color-mix(in_oklch,var(--accent)_11%,transparent),var(--background)_34%)] p-0 shadow-[0_28px_100px_color-mix(in_oklch,black_56%,transparent)]">
          <DialogHeader className="flex-row items-start gap-4 border-b border-accent/20 bg-card/60 px-6 py-6 pr-14 sm:px-8">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-accent/45 bg-accent/18 text-accent">
              <Trophy className="size-5" />
            </span>
            <span className="min-w-0">
              <DialogTitle className="text-2xl">Ranking de pontos</DialogTitle>
              <DialogDescription className="mt-1">
                {rankingCount} jogadores com pontuação na edição.
              </DialogDescription>
            </span>
          </DialogHeader>
          <ol className="bfl-scrollbar min-h-0 space-y-2 overflow-y-auto p-4 sm:p-5">
            {rows.map((row, index) => (
              <ChampionshipPointsRowView
                key={row.participantUuid ?? row.accountUuid ?? `${row.displayName}-${index}`}
                row={row}
                rank={index + 1}
                leaderPoints={rows[0]?.points ?? 0}
                precision={metric.precision}
              />
            ))}
          </ol>
        </DialogContent>
      </Dialog>
    </article>
  );
}

function ChampionshipPointsRowView({
  row,
  rank,
  leaderPoints,
  precision,
}: {
  row: ChampionshipPointsRow;
  rank: number;
  leaderPoints: number;
  precision: number | null;
}) {
  const ratio =
    leaderPoints > 0 ? Math.max(7, Math.min(100, (row.points / leaderPoints) * 100)) : 0;

  return (
    <li
      className={`relative overflow-hidden rounded-xl border p-3.5 transition ${
        rank === 1
          ? "border-accent/50 bg-[linear-gradient(135deg,color-mix(in_oklch,var(--accent)_20%,transparent),color-mix(in_oklch,var(--card)_94%,black)_48%,color-mix(in_oklch,var(--primary)_18%,transparent))] shadow-[0_18px_52px_color-mix(in_oklch,black_28%,transparent)]"
          : "border-border/70 bg-background/40 hover:border-accent/45 hover:bg-muted/45"
      }`}
    >
      {rank > 1 ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 bg-[linear-gradient(90deg,color-mix(in_oklch,var(--accent)_16%,transparent),transparent)]"
          style={{ width: `${ratio}%` }}
        />
      ) : null}
      <div className="relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        <span
          className={`grid size-9 place-items-center rounded-lg border text-sm font-semibold tabular-nums ${
            rank === 1
              ? "border-accent/50 bg-accent/20 text-accent"
              : "border-border/80 bg-muted/60 text-muted-foreground"
          }`}
        >
          {rank === 1 ? <Crown className="size-5" /> : rank}
        </span>
        <span className="min-w-0">
          <span
            className={`block truncate font-medium text-foreground ${rank === 1 ? "text-lg font-semibold" : ""}`}
          >
            {row.displayName}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {rank === 1
              ? `#1 na edição · ${row.matchesPlayed} ${row.matchesPlayed === 1 ? "partida" : "partidas"}`
              : `${row.matchesPlayed} ${row.matchesPlayed === 1 ? "partida" : "partidas"}`}
          </span>
        </span>
        <span className="text-right">
          <span
            className={`block font-semibold leading-none tabular-nums text-foreground ${rank === 1 ? "text-2xl" : "text-base"}`}
          >
            {formatChampionshipPoints(row.points, precision)}
          </span>
          <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-normal text-muted-foreground">
            Pontos
          </span>
        </span>
      </div>
    </li>
  );
}

function formatChampionshipPoints(value: number, precision: number | null) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: precision ?? 1,
    minimumFractionDigits: precision ?? 0,
  }).format(value);
}

function LiveDraftBanner({ data }: { data: PublicChampionshipDetail }) {
  const draft = data.draft.draft;
  const turn =
    draft?.turns.items.find((item) => item.state === "open") ??
    draft?.turns.items.find((item) => item.state === "overdue") ??
    null;

  return (
    <section className="overflow-hidden rounded-xl border border-emerald-400/35 bg-emerald-500/[0.08]">
      <div className="grid gap-5 px-5 py-5 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
            <Radio className="size-4" />
            Draft ao vivo
          </div>
          <h2 className="mt-2 text-xl font-semibold">
            As escolhas desta edição estão acontecendo agora
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {turn
              ? `${turn.team.name} está na escolha ${Number(turn.sequence)} da rodada ${Number(turn.round)}.`
              : "Acompanhe a ordem, as escolhas e os elencos em tempo real."}
          </p>
        </div>
        <Button asChild className="w-full md:w-auto">
          <Link to="/championships/$slug/draft" params={{ slug: data.championship.slug }}>
            Acompanhar draft
            <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function hasCompletedOrRecordedDraft(data: PublicChampionshipDetail) {
  const draft = data.draft.draft;
  return draft?.state === "completed" || draft?.mode === "recorded";
}

function ChampionshipInformation({
  data,
  salary,
}: {
  data: PublicChampionshipDetail;
  salary: PublicChampionshipDetail["championship"]["rules"]["salary"];
}) {
  const championship = data.championship;

  return (
    <div className="space-y-6">
      <ChampionshipSectionHeading
        icon={BookOpen}
        title="Informações"
        detail="Regras, configuração de elencos e parâmetros desta edição."
      />
      <section className="bfl-panel overflow-hidden rounded-xl border">
        {championship.description ? (
          <div className="px-5 py-5 sm:px-6">
            <h2 className="text-sm font-semibold">Sobre esta edição</h2>
            <p className="mt-2 max-w-4xl whitespace-pre-line text-sm leading-6 text-muted-foreground">
              {championship.description}
            </p>
          </div>
        ) : null}
        <div className={`grid ${championship.description ? "border-t" : ""} md:grid-cols-3`}>
          <RuleSummary
            icon={Trophy}
            title="Partidas"
            value={matchFormatLabel(championship.rules)}
            detail={
              championship.rules.match.switchSides
                ? "As equipes trocam de lado entre os tempos."
                : "Os lados permanecem fixos."
            }
          />
          <RuleSummary
            icon={Users}
            title="Elencos"
            value={`${championship.rules.roster.minimumSize}–${championship.rules.roster.maximumSize} jogadores`}
            detail="Limites configurados para esta edição."
          />
          <RuleSummary
            icon={CircleDollarSign}
            title="Teto salarial"
            value={
              salary.enabled
                ? formatSalaryUnits(salary.capUnits, salary.displayLabel)
                : "Não utilizado nesta edição"
            }
            detail={
              salary.enabled
                ? "Valores congelados quando a montagem dos elencos começa."
                : "A composição dos elencos não usa limite financeiro."
            }
          />
        </div>
      </section>
      {championship.rules.salary.enabled && data.salary.priceState === "locked" ? (
        <PublicSalarySection data={data} />
      ) : null}
    </div>
  );
}

function HeroFact({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Users;
  value: string;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <Icon className="size-3.5 text-primary" />
      <span className="font-semibold text-foreground">{value}</span>
      {label ? <span>{label}</span> : null}
    </span>
  );
}

function canShowRegistrationPanel(
  data: PublicChampionshipDetail,
  session: ApiAccountSession | null,
) {
  const registration = data.selfRegistration;
  const rostered =
    registration?.activeMembership !== null && registration?.activeMembership !== undefined;
  const draftState = data.draft.draft?.state;
  const draftBlocksWithdrawal = draftState === "live" || draftState === "completed";
  const canRegister = data.championship.registrationState === "open" && !registration;
  const canWithdraw =
    (registration?.status === "active" || registration?.status === "pending") &&
    !rostered &&
    !draftBlocksWithdrawal;

  return (!session && data.championship.registrationState === "open") || canRegister || canWithdraw;
}

function PublicRegistrationPanel({
  data,
  session,
}: {
  data: PublicChampionshipDetail;
  session: ApiAccountSession | null;
}) {
  const register = useServerFn(selfRegisterChampionshipFn);
  const withdraw = useServerFn(withdrawChampionshipRegistrationFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const championship = data.championship;
  const registration = data.selfRegistration;
  const canRegister = championship.registrationState === "open" && !registration;
  const rostered =
    registration?.activeMembership !== null && registration?.activeMembership !== undefined;
  const draftState = data.draft.draft?.state;
  const draftBlocksWithdrawal = draftState === "live" || draftState === "completed";
  const canWithdraw =
    (registration?.status === "active" || registration?.status === "pending") &&
    !rostered &&
    !draftBlocksWithdrawal;

  async function act(operation: "register" | "withdraw") {
    setBusy(true);
    setMessage(null);

    try {
      const result =
        operation === "register"
          ? await register({
              data: {
                championshipUuid: championship.uuid,
                commandUuid: crypto.randomUUID(),
                expectedRevision: Number(championship.revision),
              },
            })
          : await withdraw({
              data: {
                championshipUuid: championship.uuid,
                commandUuid: crypto.randomUUID(),
                expectedRevision: Number(championship.revision),
                reason: "Desistência solicitada pela página pública",
              },
            });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      await router.invalidate();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível atualizar a inscrição.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
        <div className="grid size-11 shrink-0 place-items-center border text-emerald-300">
          <UserRoundCheck className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Inscrição de jogadores</h2>
            <Badge variant="outline">{registrationLabel(championship.registrationState)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {registration
              ? rostered
                ? "Você já faz parte de uma equipe desta edição. Fale com a organização para qualquer alteração."
                : draftBlocksWithdrawal
                  ? "O draft desta edição já está em andamento ou foi concluído. Fale com a organização para qualquer alteração."
                  : `Sua inscrição está ${participantStatusLabel(registration.status).toLowerCase()}.`
              : championship.registrationState === "open"
                ? "Entre com sua conta e confirme sua participação."
                : "Não há inscrição pública disponível neste momento."}
          </p>
          {message ? (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
        </div>
        {!session && championship.registrationState === "open" ? (
          <Button asChild>
            <Link to="/account/login">Entrar para se inscrever</Link>
          </Button>
        ) : canRegister ? (
          <Button disabled={busy} onClick={() => void act("register")}>
            <UserRoundCheck />
            {busy ? "Confirmando…" : "Confirmar inscrição"}
          </Button>
        ) : canWithdraw ? (
          <Button variant="outline" disabled={busy} onClick={() => void act("withdraw")}>
            {busy ? "Atualizando…" : "Desistir da inscrição"}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

function PublicSalarySection({ data }: { data: PublicChampionshipDetail }) {
  const salary = data.salary;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-2">
            <CircleDollarSign className="size-4 text-emerald-300" />
            <h2 className="text-sm font-semibold uppercase">Teto salarial</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Valores oficiais congelados e composição atual dos elencos.
          </p>
        </div>
        <span className="text-sm font-semibold">
          {formatSalaryUnits(salary.capUnits, salary.displayLabel)}
        </span>
      </div>

      <div className="grid border-y bg-card/45 md:grid-cols-2 xl:grid-cols-3">
        {salary.teams.items.map((team) => (
          <div key={team.uuid} className="border-b p-5 md:border-r">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{team.name}</div>
                <div className="text-xs text-muted-foreground">{team.rosterSize} integrante(s)</div>
              </div>
              {team.approvedOverCap ? (
                <Badge variant="destructive">Exceção aprovada</Badge>
              ) : team.overCap ? (
                <Badge variant="destructive">Acima do teto</Badge>
              ) : (
                <Badge variant="outline">
                  {formatSalaryUnits(team.remainingUnits, salary.displayLabel)} livres
                </Badge>
              )}
            </div>
            <Progress
              value={Math.min(
                100,
                Number(salary.capUnits) > 0
                  ? (Number(team.usageUnits) / Number(salary.capUnits)) * 100
                  : 0,
              )}
              className={`mt-4 ${team.overCap ? "[&_[data-slot=progress-indicator]]:bg-red-400" : ""}`}
            />
            <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
              <span>{formatSalaryUnits(team.usageUnits, salary.displayLabel)} usados</span>
              <span>{formatSalaryUnits(salary.capUnits, salary.displayLabel)} de limite</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-hidden border-y bg-card/30">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.7fr)_6rem] border-b px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">
          <span>Participante</span>
          <span>Equipe</span>
          <span className="text-right">Valor</span>
        </div>
        {salary.participants.items.map((participant) => (
          <div
            key={participant.uuid}
            className="grid grid-cols-[minmax(0,1fr)_minmax(8rem,0.7fr)_6rem] items-center border-b px-4 py-3 text-sm"
          >
            <span className="truncate font-medium">{participant.displayName}</span>
            <span className="truncate text-muted-foreground">
              {participant.membership?.teamName ?? "Sem equipe"}
              {participant.membership?.role === "gm" ? " · General Manager" : ""}
            </span>
            <span className="text-right tabular-nums">
              {participant.priceUnits === null
                ? "—"
                : formatSalaryUnits(participant.priceUnits, salary.displayLabel)}
            </span>
          </div>
        ))}
        {salary.participants.page.nextCursor ? (
          <p className="px-4 py-3 text-center text-xs text-muted-foreground">
            Exibindo os primeiros {salary.participants.items.length} participantes.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function participantStatusLabel(
  status: PublicChampionshipDetail["selfRegistration"] extends infer _T
    ? "pending" | "active" | "withdrawn" | "ineligible" | "removed"
    : never,
) {
  return {
    pending: "Pendente",
    active: "Ativa",
    withdrawn: "Encerrada",
    ineligible: "Inapta",
    removed: "Removida",
  }[status];
}

function RuleSummary({
  icon: Icon,
  title,
  value,
  detail,
}: {
  icon: typeof Trophy;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="px-5 py-5 md:border-r">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
        <Icon className="size-4 text-amber-300" />
        {title}
      </div>
      <div className="mt-3 font-semibold">{value}</div>
      <Separator className="my-3" />
      <p className="text-xs leading-5 text-muted-foreground">{detail}</p>
    </div>
  );
}
