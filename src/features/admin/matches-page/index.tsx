import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type {
  ListMatchesResponse,
  MatchSummary,
  PhysicalMatch,
} from "@haxbrasil/haxfootball-api-sdk";
import { ArrowDown, ArrowUp, Layers3, Plus, Search, Trash2, Undo2 } from "lucide-react";
import { PageHeader } from "#/components/ds/app-shell/page-header";
import { MatchCode } from "#/components/ds/match-code";
import { MatchStatusBadge } from "#/components/ds/match-status-badge";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { Input } from "#/components/ui/input";
import {
  findMatchCompositionCandidateFn,
  listAdminMatchesFn,
  saveMatchCompositionFn,
  unbindMatchCompositionFn,
} from "#/server/api/admin-match-functions";
import {
  matchRoundLabel,
  toMatchCompositionRounds,
  validateCompositionRoundDrafts,
  type CompositionRoundDraft,
} from "#/lib/matches/composition-rounds";

type SingleMatchSummary = Extract<MatchSummary, { kind: "single" }>;
type ComposedMatchSummary = Extract<MatchSummary, { kind: "composed" }>;
type SelectedRound = {
  match: SingleMatchSummary | PhysicalMatch;
  kind: CompositionRoundDraft["kind"];
};

export function AdminMatchesPage({ matches }: { matches: ListMatchesResponse }) {
  const router = useRouter();
  const listMatches = useServerFn(listAdminMatchesFn);
  const findCandidate = useServerFn(findMatchCompositionCandidateFn);
  const saveComposition = useServerFn(saveMatchCompositionFn);
  const unbindComposition = useServerFn(unbindMatchCompositionFn);
  const [items, setItems] = useState(matches.items);
  const [nextCursor, setNextCursor] = useState(matches.page.nextCursor);
  const [selectedRounds, setSelectedRounds] = useState<SelectedRound[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchId, setSearchId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const selectedIds = useMemo(
    () => new Set(selectedRounds.map((round) => round.match.id)),
    [selectedRounds],
  );
  const singleMatches = items.filter(
    (match): match is SingleMatchSummary => match.kind === "single",
  );
  const composedMatches = items.filter(
    (match): match is ComposedMatchSummary => match.kind === "composed",
  );

  useEffect(() => {
    setItems(matches.items);
    setNextCursor(matches.page.nextCursor);
  }, [matches]);

  async function searchCandidate() {
    setMessage(null);

    if (!/^[a-z2-9]{8}$/.test(searchId)) {
      setMessage("Informe um ID físico válido de oito caracteres.");
      return;
    }

    setIsBusy(true);
    const candidate = await findCandidate({ data: { id: searchId } });
    setIsBusy(false);

    if (!candidate) {
      setMessage("Partida física elegível não encontrada.");
      return;
    }

    addRound(candidate);
    setSearchId("");
  }

  function addRound(match: SingleMatchSummary | PhysicalMatch) {
    if (selectedIds.has(match.id)) {
      setMessage("Essa partida já foi selecionada.");
      return;
    }

    setMessage(null);
    setSelectedRounds((rounds) => [...rounds, { match, kind: "sequential" }]);
  }

  function editComposition(match: ComposedMatchSummary) {
    setEditingId(match.id);
    setSelectedRounds(
      match.rounds.map((round) => ({
        match: round.match,
        kind: round.kind,
      })),
    );
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function moveRound(index: number, direction: -1 | 1) {
    setSelectedRounds((rounds) => {
      const target = index + direction;

      if (target < 0 || target >= rounds.length) {
        return rounds;
      }

      const next = [...rounds];
      const [round] = next.splice(index, 1);

      if (!round) {
        return rounds;
      }

      next.splice(target, 0, round);
      return next;
    });
  }

  function toggleExtraTime(index: number) {
    setSelectedRounds((rounds) =>
      rounds.map((round, roundIndex) => ({
        ...round,
        kind: roundIndex === index && round.kind !== "extra-time" ? "extra-time" : "sequential",
      })),
    );
  }

  async function save() {
    const drafts = selectedRounds.map(({ match, kind }) => ({ matchId: match.id, kind }));
    const validationMessage = validateCompositionRoundDrafts(drafts);

    if (validationMessage) {
      setMessage(validationMessage);
      return;
    }

    setIsBusy(true);
    setMessage(null);
    const result = await saveComposition({
      data: {
        id: editingId ?? undefined,
        rounds: toMatchCompositionRounds(drafts),
      },
    });
    setIsBusy(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    resetEditor();
    await router.invalidate();
  }

  async function unbind(id: string) {
    setIsBusy(true);
    const result = await unbindComposition({ data: { id } });
    setIsBusy(false);

    if (!result.ok) {
      setMessage(result.message);
      return;
    }

    if (editingId === id) {
      resetEditor();
    }

    await router.invalidate();
  }

  async function loadMore() {
    if (!nextCursor) {
      return;
    }

    setIsBusy(true);
    const page = await listMatches({ data: { cursor: nextCursor, limit: matches.page.limit } });
    setItems((current) => [
      ...current,
      ...page.items.filter((match) => current.every((item) => item.id !== match.id)),
    ]);
    setNextCursor(page.page.nextCursor);
    setIsBusy(false);
  }

  function resetEditor() {
    setEditingId(null);
    setSelectedRounds([]);
    setMessage(null);
  }

  return (
    <>
      <PageHeader
        title="Partidas"
        description="Vincule partidas físicas como tempos de uma única partida."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Editar composição" : "Nova composição"}</CardTitle>
            <CardDescription>
              A ordem define os tempos. Somente o último item pode ser marcado como prorrogação.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="flex gap-2">
              <Input
                aria-label="ID da partida física"
                placeholder="ID da partida física"
                value={searchId}
                onChange={(event) => setSearchId(event.target.value.trim().toLowerCase())}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => void searchCandidate()}
              >
                <Search className="size-4" />
                Buscar
              </Button>
            </div>

            <div className="grid gap-3">
              {selectedRounds.length === 0 ? (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  Selecione pelo menos duas partidas na lista ou busque pelo ID.
                </p>
              ) : (
                selectedRounds.map((round, index) => (
                  <div
                    key={round.match.id}
                    className="grid gap-3 rounded-lg border bg-muted/25 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge variant="secondary">
                        {round.kind === "extra-time"
                          ? matchRoundLabel({ kind: "extra-time" })
                          : `${
                              selectedRounds
                                .slice(0, index + 1)
                                .filter((entry) => entry.kind === "sequential").length
                            }º tempo`}
                      </Badge>
                      <MatchCode id={round.match.id} />
                      <Scoreline
                        red={round.match.score?.red}
                        blue={round.match.score?.blue}
                        compact
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Mover tempo para cima"
                        disabled={index === 0}
                        onClick={() => moveRound(index, -1)}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Mover tempo para baixo"
                        disabled={index === selectedRounds.length - 1}
                        onClick={() => moveRound(index, 1)}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant={round.kind === "extra-time" ? "secondary" : "ghost"}
                        disabled={index !== selectedRounds.length - 1}
                        onClick={() => toggleExtraTime(index)}
                      >
                        Prorrogação
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        aria-label="Remover tempo"
                        onClick={() =>
                          setSelectedRounds((rounds) =>
                            rounds.filter((entry) => entry.match.id !== round.match.id),
                          )
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {message ? <p className="text-sm text-destructive">{message}</p> : null}

            <div className="flex flex-wrap justify-end gap-2">
              {editingId ? (
                <Button type="button" variant="ghost" onClick={resetEditor}>
                  Cancelar
                </Button>
              ) : null}
              <Button type="button" disabled={isBusy} onClick={() => void save()}>
                <Layers3 className="size-4" />
                {editingId ? "Salvar composição" : "Criar composição"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partidas físicas elegíveis</CardTitle>
            <CardDescription>
              Partidas já vinculadas deixam de aparecer como candidatas individuais.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {singleMatches.map((match) => (
              <div
                key={match.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <MatchCode id={match.id} />
                  <MatchStatusBadge value={match.status} />
                  <Scoreline red={match.score?.red} blue={match.score?.blue} compact />
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={selectedIds.has(match.id)}
                  onClick={() => addRound(match)}
                >
                  <Plus className="size-4" />
                  Adicionar
                </Button>
              </div>
            ))}
            {nextCursor ? (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={() => void loadMore()}
              >
                Carregar mais
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Partidas compostas</CardTitle>
          <CardDescription>Edite a ordem dos tempos ou desfaça o vínculo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {composedMatches.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma partida composta.</p>
          ) : (
            composedMatches.map((match) => (
              <div
                key={match.id}
                className="grid gap-3 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <MatchCode id={match.id} />
                  <Badge variant="secondary">{match.rounds.length} tempos</Badge>
                  <MatchStatusBadge value={match.status} />
                  <Scoreline red={match.score?.red} blue={match.score?.blue} compact />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => editComposition(match)}>
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button type="button" variant="outline">
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
                        <AlertDialogAction onClick={() => void unbind(match.id)}>
                          Desvincular
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </>
  );
}
