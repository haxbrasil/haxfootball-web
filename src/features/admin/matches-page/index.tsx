import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { ListMatchesResponse, MatchSummary } from "@haxbrasil/haxfootball-api-sdk";
import { Eye, Layers3 } from "lucide-react";
import { EmptyState } from "#/components/ds/app-shell/empty-state";
import { PageHeader } from "#/components/ds/app-shell/page-header";
import { SearchField } from "#/components/ds/forms/search-field";
import { MatchCode } from "#/components/ds/match-code";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import { ResourceTable } from "#/components/ds/resource-table";
import { Scoreline } from "#/components/ds/scoreline";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { summarizeCompositionRounds } from "#/lib/matches/composition-rounds";
import { listAdminMatchesFn, unbindMatchCompositionFn } from "#/server/api/admin-match-functions";
import { MatchCompositionDialog } from "./components/match-composition-dialog";
import { filterAdminMatches } from "./utils/filter-admin-matches";

type SingleMatchSummary = Extract<MatchSummary, { kind: "single" }>;
type ComposedMatchSummary = Extract<MatchSummary, { kind: "composed" }>;
type CompositionTarget = SingleMatchSummary | ComposedMatchSummary | null;

export function AdminMatchesPage({ matches }: { matches: ListMatchesResponse }) {
  const router = useRouter();
  const listMatches = useServerFn(listAdminMatchesFn);
  const unbindComposition = useServerFn(unbindMatchCompositionFn);
  const [items, setItems] = useState(matches.items);
  const [nextCursor, setNextCursor] = useState(matches.page.nextCursor);
  const [query, setQuery] = useState("");
  const [compositionTarget, setCompositionTarget] = useState<CompositionTarget>(null);
  const [compositionDialogOpen, setCompositionDialogOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setItems(matches.items);
    setNextCursor(matches.page.nextCursor);
  }, [matches]);

  const singleMatches = items.filter(
    (match): match is SingleMatchSummary => match.kind === "single",
  );
  const filteredMatches = useMemo(() => filterAdminMatches(items, query), [items, query]);

  function openComposition(target: CompositionTarget) {
    setCompositionTarget(target);
    setCompositionDialogOpen(true);
  }

  async function refreshMatches() {
    setCompositionTarget(null);
    await router.invalidate();
  }

  async function unbind(id: string) {
    setIsBusy(true);
    const result = await unbindComposition({ data: { id } });
    setIsBusy(false);

    if (!result.ok) {
      return result;
    }

    await router.invalidate();
    return result;
  }

  async function loadMore() {
    if (!nextCursor) {
      return;
    }

    setIsBusy(true);
    const page = await listMatches({
      data: { cursor: nextCursor, limit: matches.page.limit },
    });
    setItems((current) => [
      ...current,
      ...page.items.filter((match) => current.every((item) => item.id !== match.id)),
    ]);
    setNextCursor(page.page.nextCursor);
    setIsBusy(false);
  }

  return (
    <>
      <PageHeader
        title="Partidas"
        description="Consulte partidas e execute operações administrativas."
        action={
          <Button type="button" onClick={() => openComposition(null)}>
            <Layers3 className="size-4" />
            Vincular partidas
          </Button>
        }
      />

      <SearchField
        id="matchSearch"
        label="Buscar nas partidas carregadas"
        value={query}
        onChange={setQuery}
        placeholder="ID, estado ou tipo"
      />

      {filteredMatches.length === 0 ? (
        <EmptyState title="Nenhuma partida encontrada" />
      ) : (
        <ResourceTable
          rows={filteredMatches}
          columns={[
            {
              key: "match",
              title: "Partida",
              cell: (match) => <MatchIdentityCell match={match} />,
            },
            {
              key: "status",
              title: "Estado",
              cell: (match) => <MatchStatusBadge value={match.status} />,
            },
            {
              key: "score",
              title: "Placar",
              cell: (match) => (
                <Scoreline red={match.score?.red} blue={match.score?.blue} compact />
              ),
            },
            {
              key: "actions",
              title: "Ações",
              cell: (match) => (
                <MatchActions
                  match={match}
                  isBusy={isBusy}
                  onCompose={() => openComposition(match)}
                />
              ),
            },
          ]}
        />
      )}

      {nextCursor ? (
        <div className="mt-4 flex justify-center">
          <Button type="button" variant="outline" disabled={isBusy} onClick={() => void loadMore()}>
            Carregar mais partidas
          </Button>
        </div>
      ) : null}

      <MatchCompositionDialog
        open={compositionDialogOpen}
        target={compositionTarget}
        candidates={singleMatches}
        onOpenChange={setCompositionDialogOpen}
        onSaved={refreshMatches}
        onUnbind={unbind}
      />
    </>
  );
}

function MatchIdentityCell({ match }: { match: MatchSummary }) {
  if (match.kind === "single") {
    return <MatchCode id={match.id} />;
  }

  const { sequentialRoundCount, hasExtraTime } = summarizeCompositionRounds(match.rounds);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <MatchCode id={match.id} />
      <Badge variant="outline" className="bg-muted/40 text-muted-foreground">
        {sequentialRoundCount} {sequentialRoundCount === 1 ? "tempo" : "tempos"}
      </Badge>
      {hasExtraTime ? (
        <Badge variant="outline" className="bg-muted/40 text-muted-foreground">
          Prorrogação
        </Badge>
      ) : null}
    </div>
  );
}

function MatchActions({
  match,
  isBusy,
  onCompose,
}: {
  match: MatchSummary;
  isBusy: boolean;
  onCompose: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={onCompose}>
        <Layers3 className="size-4" />
        {match.kind === "composed" ? "Gerenciar vínculo" : "Vincular"}
      </Button>
      <Button asChild type="button" size="sm" variant="ghost">
        <Link to="/matches/$matchId" params={{ matchId: match.id }}>
          <Eye className="size-4" />
          Ver
        </Link>
      </Button>
    </div>
  );
}
