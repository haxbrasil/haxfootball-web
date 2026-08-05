import { Link } from "@tanstack/react-router";
import { ArrowLeft, Crown, Radio } from "lucide-react";
import { LeagueHeader } from "#/components/ds/league-header";
import { Badge } from "#/components/ui/badge";
import { DraftWorkspace } from "#/features/admin/championships/draft-workspace";
import type { PublicChampionshipDetail } from "#/server/api/championship-api";
import type { ApiAccountSession } from "#/server/auth/session";

export function ChampionshipDraftEventPage({
  data,
  session,
}: {
  data: PublicChampionshipDetail;
  session: ApiAccountSession | null;
}) {
  const draft = data.draft.draft;
  const live = draft?.state === "live";
  const recorded = draft?.mode === "recorded";

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
        eyebrow={data.championship.competitionType.name}
        title="Draft"
        description={
          live
            ? "Acompanhe cada escolha em tempo real."
            : recorded
              ? "Registro oficial das escolhas desta edição."
              : "Ordem, escolhas e elencos desta edição."
        }
        action={
          draft ? (
            <div className="flex min-w-48 items-center justify-end">
              <Badge
                variant="outline"
                className={
                  live
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
                    : "text-muted-foreground"
                }
              >
                {live ? <Radio className="size-3" /> : <Crown className="size-3" />}
                {live ? "Ao vivo" : recorded ? "Draft registrado" : "Draft concluído"}
              </Badge>
            </div>
          ) : null
        }
      />
      <DraftWorkspace data={data} session={session} mode="public" includeTrades={false} />
    </div>
  );
}
