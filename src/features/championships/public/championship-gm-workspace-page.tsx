import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowLeftRight, Crown, Shield, Users } from "lucide-react";
import { LeagueHeader } from "#/components/ds/league-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { DraftWorkspace } from "#/features/admin/championships/draft-workspace";
import type { PublicChampionshipDetail } from "#/server/api/championship-api";
import type { ApiAccountSession } from "#/server/auth/session";

export function ChampionshipGmWorkspacePage({
  data,
  session,
  generalManagerTeamIds,
}: {
  data: PublicChampionshipDetail;
  session: ApiAccountSession;
  generalManagerTeamIds: string[];
}) {
  const teams = data.teams.items.filter((team) => generalManagerTeamIds.includes(team.uuid));

  if (teams.length === 0) {
    return <GmAccessDenied data={data} />;
  }

  return (
    <div className="space-y-6 pb-10">
      <Link
        to="/championships/$slug"
        params={{ slug: data.championship.slug }}
        className="inline-flex items-center gap-2 px-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {data.championship.name}
      </Link>
      <LeagueHeader
        eyebrow="Área do General Manager"
        title={data.championship.name}
        description="Elenco, negociações e responsabilidades da sua equipe nesta edição."
        action={
          <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
            <Crown className="size-3" />
            General Manager
          </Badge>
        }
      />
      <section className="bfl-panel overflow-hidden rounded-xl border">
        <div className="border-b px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <h2 className="font-semibold">Meu elenco</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Acompanhe a composição atual das equipes sob sua responsabilidade.
          </p>
        </div>
        <div className="grid divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          {teams.map((team) => {
            const roster = data.participants.items
              .filter((participant) => participant.activeMembership?.team.uuid === team.uuid)
              .sort((left, right) => {
                const leftRole = left.activeMembership?.role === "gm" ? 0 : 1;
                const rightRole = right.activeMembership?.role === "gm" ? 0 : 1;

                return leftRole - rightRole || left.displayName.localeCompare(right.displayName);
              });

            return (
              <div key={team.uuid} className="min-w-0">
                <div className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{team.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {roster.length}{" "}
                      {roster.length === 1 ? "pessoa no elenco" : "pessoas no elenco"}
                    </p>
                  </div>
                  <Shield className="size-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="divide-y">
                  {roster.map((participant) => (
                    <div
                      key={participant.uuid}
                      className="flex items-center justify-between gap-3 px-5 py-3 sm:px-6"
                    >
                      <span className="truncate text-sm font-medium">
                        {participant.displayName}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {participant.activeMembership?.role === "gm"
                          ? "General Manager"
                          : "Jogador"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <section className="space-y-4">
        <div className="flex items-start gap-3 px-1">
          <ArrowLeftRight className="mt-0.5 size-5 text-primary" />
          <div>
            <h2 className="font-semibold">Trocas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Proponha, acompanhe e responda às negociações da sua equipe.
            </p>
          </div>
        </div>
        <DraftWorkspace data={data} session={session} mode="public" focus="trades" />
      </section>
    </div>
  );
}

function GmAccessDenied({ data }: { data: PublicChampionshipDetail }) {
  return (
    <div className="space-y-6 pb-10">
      <Link
        to="/championships/$slug"
        params={{ slug: data.championship.slug }}
        className="inline-flex items-center gap-2 px-1 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {data.championship.name}
      </Link>
      <section className="bfl-panel mx-auto max-w-2xl rounded-xl border px-6 py-14 text-center">
        <Crown className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Área do General Manager</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta área reúne as responsabilidades da equipe atribuída a cada General Manager.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/championships/$slug" params={{ slug: data.championship.slug }}>
            Voltar ao campeonato
          </Link>
        </Button>
      </section>
    </div>
  );
}
