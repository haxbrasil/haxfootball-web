import type { ListChampionshipsResponse } from "@haxbrasil/haxfootball-api-sdk";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, History } from "lucide-react";
import { BroadcastPanel } from "#/components/ds/broadcast-panel";
import { LeagueHeader } from "#/components/ds/league-header";
import { EmptyLeagueState } from "#/components/ds/empty-league-state";
import { Badge } from "#/components/ui/badge";
import { Skeleton } from "#/components/ui/skeleton";
import {
  cadenceLabel,
  championshipDateRange,
  championshipLifecycleLabel,
  championshipLifecycleTone,
} from "../championship-labels";

export function ChampionshipsPage({ championships }: { championships: ListChampionshipsResponse }) {
  const active = championships.items.filter((item) => item.lifecycle === "active");
  const upcoming = championships.items.filter((item) => item.lifecycle === "setup");
  const archive = championships.items.filter((item) =>
    ["completed", "archived", "canceled"].includes(item.lifecycle),
  );

  return (
    <div className="space-y-6">
      <LeagueHeader
        title="Campeonatos"
        eyebrow={null}
        showBrand={false}
        description="Edições oficiais, equipes, formatos, resultados e o arquivo competitivo da BFL."
        action={
          <div className="grid grid-cols-3 divide-x overflow-hidden rounded-lg border bg-background/55">
            <Metric value={active.length} label="Em andamento" />
            <Metric value={upcoming.length} label="Em preparação" />
            <Metric value={archive.length} label="No arquivo" />
          </div>
        }
      />

      {championships.items.length === 0 ? (
        <EmptyLeagueState
          title="Nenhum campeonato publicado"
          body="As próximas competições aparecerão aqui quando forem anunciadas."
        />
      ) : (
        <>
          <ChampionshipSection
            eyebrow="Competições oficiais"
            title="Agora"
            items={[...active, ...upcoming]}
          />
          <ChampionshipSection eyebrow="Histórico" title="Arquivo" items={archive} archive />
        </>
      )}
    </div>
  );
}

export function ChampionshipsPageSkeleton() {
  return (
    <div className="space-y-6" aria-label="Carregando campeonatos">
      <section className="bfl-field-surface overflow-hidden rounded-xl border border-border/80 p-5 shadow-lg">
        <Skeleton className="h-9 w-56 max-w-full" />
        <Skeleton className="mt-3 h-4 w-[34rem] max-w-full" />
      </section>
      {[0, 1].map((section) => (
        <section key={section} className="bfl-panel overflow-hidden rounded-xl border">
          <div className="bfl-panel-header border-b px-4 py-3">
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="grid gap-3 p-4">
            {[0, 1, 2].map((row) => (
              <Skeleton key={row} className="h-20 w-full" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ChampionshipSection({
  eyebrow,
  title,
  items,
  archive = false,
}: {
  eyebrow: string;
  title: string;
  items: ListChampionshipsResponse["items"];
  archive?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <BroadcastPanel eyebrow={eyebrow} title={title}>
      <div className="grid gap-3">
        {items.map((championship) => (
          <Link
            key={championship.uuid}
            to="/championships/$slug"
            params={{ slug: championship.slug }}
            className="group grid gap-4 rounded-lg border bg-background/35 px-4 py-4 transition hover:border-primary/40 hover:bg-muted/35 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div className="flex min-w-0 gap-3">
              <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-md border bg-muted/35 text-primary">
                {archive ? <History className="size-4" /> : <CalendarDays className="size-4" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold">{championship.name}</h3>
                  {championship.editionLabel ? (
                    <span className="text-sm text-muted-foreground">
                      {championship.editionLabel}
                    </span>
                  ) : null}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span>{championship.competitionType.name}</span>
                  <span>{championshipDateRange(championship.startsAt, championship.endsAt)}</span>
                  {cadenceLabel(championship.competitionType.cadence) ? (
                    <span>{cadenceLabel(championship.competitionType.cadence)}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <Badge
                variant="outline"
                className={championshipLifecycleTone(championship.lifecycle)}
              >
                {championshipLifecycleLabel(championship.lifecycle)}
              </Badge>
              <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
            </div>
          </Link>
        ))}
      </div>
    </BroadcastPanel>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-20 px-3 py-2 text-center sm:min-w-24 sm:px-4">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
