import { Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  Crown,
  GitBranch,
  History,
  Shield,
  TimerReset,
  Trophy,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Progress } from "#/components/ui/progress";
import { Separator } from "#/components/ui/separator";
import type { PublicChampionshipDetail } from "#/server/api/championship-api";
import type { ApiAccountSession } from "#/server/auth/session";
import { DraftWorkspace } from "#/features/admin/championships/draft-workspace";
import { FormatWorkspace } from "#/features/admin/championships/format-workspace";
import { StatisticsWorkspace } from "#/features/admin/championships/statistics-workspace";
import { ChampionshipArchiveWorkspace } from "#/features/admin/championships/archive-workspace";
import {
  selfRegisterChampionshipFn,
  withdrawChampionshipRegistrationFn,
} from "#/server/api/championship-functions";
import {
  championshipDateRange,
  championshipLifecycleLabel,
  championshipLifecycleTone,
  matchFormatLabel,
  registrationLabel,
} from "../championship-labels";

export function ChampionshipDetailPage({
  data,
  session,
}: {
  data: PublicChampionshipDetail;
  session: ApiAccountSession | null;
}) {
  const { championship, teams, participants } = data;
  const salary = championship.rules.salary;

  return (
    <div className="space-y-7">
      <header className="border-y bg-card/70">
        <div className="flex">
          <div className="w-1 shrink-0 bg-emerald-400" />
          <div className="min-w-0 flex-1 px-5 py-7 sm:px-8">
            <Link
              to="/championships"
              className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Campeonatos
            </Link>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{championship.competitionType.name}</Badge>
                  {championship.historical ? (
                    <Badge variant="secondary">
                      <History className="mr-1 size-3" />
                      Histórico
                    </Badge>
                  ) : null}
                </div>
                <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">{championship.name}</h1>
                {championship.editionLabel ? (
                  <p className="mt-1 text-base text-muted-foreground">
                    {championship.editionLabel}
                  </p>
                ) : null}
              </div>
              <Badge
                variant="outline"
                className={`w-fit px-3 py-1.5 ${championshipLifecycleTone(championship.lifecycle)}`}
              >
                {championshipLifecycleLabel(championship.lifecycle)}
              </Badge>
            </div>
            <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
              <Fact icon={CalendarDays} label="Período">
                {championshipDateRange(championship.startsAt, championship.endsAt)}
              </Fact>
              <Fact icon={Users} label="Participantes">
                {participants.items.length} inscritos
              </Fact>
              <Fact icon={Shield} label="Equipes">
                {teams.items.length} confirmadas
              </Fact>
              <Fact icon={TimerReset} label="Formato da partida">
                {matchFormatLabel(championship.rules)}
              </Fact>
            </div>
          </div>
        </div>
      </header>

      {championship.description ? (
        <section className="max-w-4xl px-1">
          <h2 className="text-sm font-semibold uppercase">Sobre esta edição</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">
            {championship.description}
          </p>
        </section>
      ) : null}

      <PublicRegistrationPanel data={data} session={session} />

      {data.draft.draft ? (
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <Crown className="size-4 text-emerald-300" />
            <h2 className="text-sm font-semibold uppercase">Draft</h2>
            {data.draft.draft.state === "live" ? (
              <Badge variant="outline" className="border-red-500/50 text-red-300">
                Ao vivo
              </Badge>
            ) : null}
          </div>
          <DraftWorkspace data={data} session={session} mode="public" />
        </section>
      ) : null}

      {data.format.stages.items.length ? (
        <section>
          <div className="mb-3 flex items-center gap-2 px-1">
            <GitBranch className="size-4 text-emerald-300" />
            <h2 className="text-sm font-semibold uppercase">Formato e partidas</h2>
          </div>
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

      {data.statistics.teams.items.length || data.statistics.players.items.length ? (
        <section>
          <StatisticsWorkspace data={data} mode="public" initialStatistics={data.statistics} />
        </section>
      ) : null}

      {data.history.placements.totalCount || data.history.awards.totalCount ? (
        <section>
          <ChampionshipArchiveWorkspace data={data} mode="public" />
        </section>
      ) : null}

      <section>
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-emerald-300" />
            <h2 className="text-sm font-semibold uppercase">Equipes</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {registrationLabel(championship.registrationState)}
          </span>
        </div>
        {teams.items.length === 0 ? (
          <div className="border-y bg-card/50 px-6 py-12 text-center text-sm text-muted-foreground">
            As equipes ainda não foram publicadas.
          </div>
        ) : (
          <div className="grid border-y bg-card/60 sm:grid-cols-2 xl:grid-cols-3">
            {teams.items.map((team, index) => (
              <div
                key={team.uuid}
                className={`flex min-h-24 items-center gap-4 px-5 py-4 ${
                  index > 0 ? "border-t sm:border-t-0" : ""
                } sm:border-r sm:border-b`}
              >
                <TeamMark
                  abbreviation={team.abbreviation ?? team.name.slice(0, 3)}
                  colors={team.colors}
                />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{team.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {team.teamIdentity
                      ? `Identidade ${team.teamIdentity.name}`
                      : "Equipe desta edição"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid border-y bg-card/50 md:grid-cols-3">
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
              ? `${salary.capUnits} ${salary.displayLabel}`
              : "Não utilizado nesta edição"
          }
          detail={
            salary.enabled
              ? "Valores são congelados quando a montagem dos elencos começa."
              : "A composição dos elencos não usa limite financeiro."
          }
        />
      </section>

      {salary.enabled && data.salary.priceState === "locked" ? (
        <PublicSalarySection data={data} />
      ) : null}
    </div>
  );
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
  const canWithdraw = registration?.status === "active" || registration?.status === "pending";

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
    <section className="border-y bg-card/45">
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
              ? `Sua inscrição está ${participantStatusLabel(registration.status).toLowerCase()}.`
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
          {salary.capUnits} {salary.displayLabel}
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
                <Badge variant="outline">{team.remainingUnits} livres</Badge>
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
              <span>{team.usageUnits} usados</span>
              <span>{salary.capUnits} de limite</span>
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
              {participant.membership?.role === "gm" ? " · GM" : ""}
            </span>
            <span className="text-right tabular-nums">
              {participant.priceUnits ?? "—"} {salary.displayLabel}
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

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof CalendarDays;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-l-2 border-border pl-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-emerald-300" />
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate font-medium">{children}</div>
      </div>
    </div>
  );
}

function TeamMark({ abbreviation, colors }: { abbreviation: string; colors: string[] | null }) {
  const primary = colors?.[0] ?? "#34d399";
  const secondary = colors?.[1] ?? "#0f172a";

  return (
    <div
      className="grid size-12 shrink-0 place-items-center border text-xs font-black uppercase text-white shadow-inner"
      style={{
        background: `linear-gradient(135deg, ${primary} 0 50%, ${secondary} 50% 100%)`,
      }}
    >
      <span className="drop-shadow">{abbreviation.slice(0, 3)}</span>
    </div>
  );
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
