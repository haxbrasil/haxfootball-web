import { Activity } from "lucide-react";
import type { ListMatchesResponse } from "@haxbrasil/haxfootball-api-sdk";
import { PubOverviewMetric } from "./pub-overview-metric";

export function PubOverview({ matches }: { matches: ListMatchesResponse }) {
  const visibleMatches = matches.items.length;

  return (
    <section className="bfl-field-surface overflow-hidden rounded-xl border border-border/80 shadow-lg">
      <div className="grid gap-6 p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-primary">
            Sala pública
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-normal sm:text-5xl">Pubs</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Partidas e rankings da sala pública da comunidade.
          </p>
        </div>

        <div className="min-w-56">
          <PubOverviewMetric icon={Activity} label="Jogos" value={String(visibleMatches)} />
        </div>
      </div>
    </section>
  );
}
