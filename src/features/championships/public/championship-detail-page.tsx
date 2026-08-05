import { Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  CircleDollarSign,
  Crown,
  History,
  LayoutDashboard,
  Medal,
  Shield,
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
import type { PublicChampionshipDetail } from "#/server/api/championship-api";
import type { ApiAccountSession } from "#/server/auth/session";
import { DraftWorkspace } from "#/features/admin/championships/draft-workspace";
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
    (data.selfRegistration?.status === "active" &&
    data.selfRegistration.activeMembership?.role === "gm"
      ? true
      : data.participants.items.some(
          (participant) =>
            participant.identity.kind === "account" &&
            participant.identity.accountUuid === session.account.uuid &&
            participant.activeMembership?.role === "gm",
        ));
  const canAccessRosterAndTrades =
    isGeneralManager &&
    data.championship.tradeWindowState === "open" &&
    ["setup", "active"].includes(data.championship.lifecycle);
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
      />
      <ChampionshipNavigation
        section={section}
        onSelect={setSection}
        draft={data.draft.draft !== null || isGeneralManager}
        showRosterAndTrades={canAccessRosterAndTrades}
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
      {section === "draft" ? (
        <section className="space-y-5">
          <ChampionshipSectionHeading
            icon={Crown}
            title="Draft"
            detail="Acompanhe as escolhas e os elencos desta edição."
          />
          <DraftWorkspace data={data} session={session} mode="public" />
        </section>
      ) : null}
      {section === "roster-trades" && canAccessRosterAndTrades ? (
        <section className="space-y-5">
          <ChampionshipSectionHeading
            icon={ArrowLeftRight}
            title="Meu elenco e trocas"
            detail="Consulte o elenco da sua equipe, proponha trocas e responda às negociações em andamento."
          />
          <DraftWorkspace data={data} session={session} mode="public" focus="trades" />
        </section>
      ) : null}
      {section === "info" ? <ChampionshipInformation data={data} salary={salary} /> : null}
    </div>
  );
}

type PublicSection =
  | "overview"
  | "matches"
  | "bracket"
  | "statistics"
  | "draft"
  | "roster-trades"
  | "honors"
  | "info";

function ChampionshipHero({
  data,
  participantCount,
  teamCount,
}: {
  data: PublicChampionshipDetail;
  participantCount: number;
  teamCount: number;
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
          </div>
        }
      />
    </>
  );
}

function ChampionshipNavigation({
  section,
  onSelect,
  draft,
  showRosterAndTrades,
  showStatistics,
  showHonors,
}: {
  section: PublicSection;
  onSelect: (section: PublicSection) => void;
  draft: boolean;
  showRosterAndTrades: boolean;
  showStatistics: boolean;
  showHonors: boolean;
}) {
  const items: Array<{ key: PublicSection; label: string; icon: typeof LayoutDashboard }> = [
    { key: "overview", label: "Visão geral", icon: LayoutDashboard },
    { key: "matches", label: "Jogos", icon: Swords },
    { key: "bracket", label: "Chaves e classificação", icon: Trophy },
    ...(showStatistics
      ? [{ key: "statistics" as const, label: "Estatísticas", icon: BarChart3 }]
      : []),
    ...(showRosterAndTrades
      ? [{ key: "roster-trades" as const, label: "Meu elenco e trocas", icon: ArrowLeftRight }]
      : []),
    ...(draft ? [{ key: "draft" as const, label: "Draft", icon: Crown }] : []),
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
      </div>
    </nav>
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
      <VisualizationDashboardView items={data.visualizations.overview.items} />
    </div>
  );
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
