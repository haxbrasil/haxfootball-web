import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { ListMatchesResponse, MatchSummary } from "@haxbrasil/haxfootball-api-sdk";
import { Eye, Layers3, Undo2 } from "lucide-react";
import { DataCard } from "#/components/ds/app-shell/data-card";
import { EmptyState } from "#/components/ds/app-shell/empty-state";
import { PageHeader } from "#/components/ds/app-shell/page-header";
import { SearchField } from "#/components/ds/forms/search-field";
import { MatchCode } from "#/components/ds/match-code";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
import { ResourceTable } from "#/components/ds/resource-table";
import { Scoreline } from "#/components/ds/scoreline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
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
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setItems(matches.items);
    setNextCursor(matches.page.nextCursor);
  }, [matches]);

  const singleMatches = items.filter(
    (match): match is SingleMatchSummary => match.kind === "single",
  );
  const composedMatches = items.filter(
    (match): match is ComposedMatchSummary => match.kind === "composed",
  );
  const filteredMatches = useMemo(() => filterAdminMatches(items, query), [items, query]);

  function openComposition(target: CompositionTarget) {
    setCompositionTarget(target);
    setMessage(null);
    setCompositionDialogOpen(true);
  }

  async function refreshMatches() {
    setCompositionTarget(null);
    await router.invalidate();
  }

  async function unbind(id: string) {
    setIsBusy(true);
    setMessage(null);
    const result = await unbindComposition({ data: { id } });
    setIsBusy(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    await router.invalidate();
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

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <DataCard title="Carregadas">
          <strong className="text-2xl tabular-nums">{items.length}</strong>
        </DataCard>
        <DataCard title="Individuais">
          <strong className="text-2xl tabular-nums">{singleMatches.length}</strong>
        </DataCard>
        <DataCard title="Compostas">
          <strong className="text-2xl tabular-nums">{composedMatches.length}</strong>
        </DataCard>
      </div>

      <SearchField
        id="matchSearch"
        label="Buscar nas partidas carregadas"
        value={query}
        onChange={setQuery}
        placeholder="ID, estado ou tipo"
      />

      {message ? <p className="mb-4 text-sm text-destructive">{message}</p> : null}

      {filteredMatches.length === 0 ? (
        <EmptyState title="Nenhuma partida encontrada" />
      ) : (
        <ResourceTable
          rows={filteredMatches}
          columns={[
            {
              key: "match",
              title: "Partida",
              cell: (match) => (
                <div className="flex flex-wrap items-center gap-2">
                  <MatchCode id={match.id} />
                  <Badge variant={match.kind === "composed" ? "secondary" : "outline"}>
                    {match.kind === "composed" ? "Composta" : "Individual"}
                  </Badge>
                </div>
              ),
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
              key: "rounds",
              title: "Tempos",
              cell: (match) =>
                match.kind === "composed" ? (
                  <span className="text-sm">{match.rounds.length}</span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
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
                  onUnbind={() => void unbind(match.id)}
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
      />
    </>
  );
}

function MatchActions({
  match,
  isBusy,
  onCompose,
  onUnbind,
}: {
  match: MatchSummary;
  isBusy: boolean;
  onCompose: () => void;
  onUnbind: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button asChild type="button" size="sm" variant="ghost">
        <Link to="/matches/$matchId" params={{ matchId: match.id }}>
          <Eye className="size-4" />
          Ver
        </Link>
      </Button>
      <Button type="button" size="sm" variant="outline" onClick={onCompose}>
        <Layers3 className="size-4" />
        {match.kind === "composed" ? "Gerenciar vínculo" : "Vincular"}
      </Button>
      {match.kind === "composed" ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" size="sm" variant="outline" disabled={isBusy}>
              <Undo2 className="size-4" />
              Desvincular
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desvincular os tempos?</AlertDialogTitle>
              <AlertDialogDescription>
                A partida composta deixa de existir e as partidas físicas voltam à lista.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={onUnbind}>Desvincular</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
