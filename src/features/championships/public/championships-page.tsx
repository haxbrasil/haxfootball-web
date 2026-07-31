import type { ListChampionshipsResponse } from "@haxbrasil/haxfootball-api-sdk";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, History, Trophy } from "lucide-react";
import { Badge } from "#/components/ui/badge";
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
    <div className="space-y-8">
      <header className="relative overflow-hidden border-y bg-card/70 px-5 py-8 sm:px-8">
        <div className="absolute inset-y-0 left-0 w-1 bg-emerald-400" />
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-emerald-300">
              <Trophy className="size-4" />
              Competições oficiais
            </div>
            <h1 className="text-3xl font-semibold sm:text-4xl">Campeonatos</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
              Acompanhe edições em andamento, equipes, formatos, resultados e o arquivo competitivo
              da BFL.
            </p>
          </div>
          <div className="grid grid-cols-3 divide-x border bg-background/70">
            <Metric value={active.length} label="Em andamento" />
            <Metric value={upcoming.length} label="Em preparação" />
            <Metric value={archive.length} label="No arquivo" />
          </div>
        </div>
      </header>

      {championships.items.length === 0 ? (
        <div className="border-y bg-card/50 px-6 py-16 text-center">
          <Trophy className="mx-auto size-8 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Nenhum campeonato publicado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            As próximas competições aparecerão aqui quando forem anunciadas.
          </p>
        </div>
      ) : (
        <>
          <ChampionshipSection title="Agora" items={[...active, ...upcoming]} />
          <ChampionshipSection title="Arquivo" items={archive} archive />
        </>
      )}
    </div>
  );
}

function ChampionshipSection({
  title,
  items,
  archive = false,
}: {
  title: string;
  items: ListChampionshipsResponse["items"];
  archive?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2 px-1">
        {archive ? (
          <History className="size-4 text-muted-foreground" />
        ) : (
          <CalendarDays className="size-4 text-emerald-300" />
        )}
        <h2 className="text-sm font-semibold uppercase">{title}</h2>
      </div>
      <div className="divide-y border-y bg-card/60">
        {items.map((championship) => (
          <Link
            key={championship.uuid}
            to="/championships/$slug"
            params={{ slug: championship.slug }}
            className="group grid gap-4 px-5 py-5 transition-colors hover:bg-muted/40 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-7"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-lg font-semibold">{championship.name}</h3>
                {championship.editionLabel ? (
                  <span className="text-sm text-muted-foreground">{championship.editionLabel}</span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span>{championship.competitionType.name}</span>
                <span>{championshipDateRange(championship.startsAt, championship.endsAt)}</span>
                {cadenceLabel(championship.competitionType.cadence) ? (
                  <span>{cadenceLabel(championship.competitionType.cadence)}</span>
                ) : null}
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
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-24 px-4 py-3 text-center">
      <div className="text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
