import { useEffect, useMemo, useState } from "react";
import type { MatchSummary, PhysicalMatch } from "@haxbrasil/haxfootball-api-sdk";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Layers3,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import { MatchCode } from "#/components/ds/match-code";
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
} from "#/components/ui/alert-dialog";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#/components/ui/select";
import {
  matchRoundLabel,
  scoreInCompositionOrientation,
  toMatchCompositionRounds,
  validateCompositionRoundDrafts,
  type CompositionRoundDraft,
} from "#/lib/matches/composition-rounds";
import { normalizeMatchIdInput } from "#/lib/matches/match-id";
import {
  findMatchCompositionCandidateFn,
  saveMatchCompositionFn,
} from "#/server/api/admin-match-functions";
import { useServerFn } from "@tanstack/react-start";

type SingleMatchSummary = Extract<MatchSummary, { kind: "single" }>;
type ComposedMatchSummary = Extract<MatchSummary, { kind: "composed" }>;
type CompositionTarget = SingleMatchSummary | ComposedMatchSummary | null;
type SelectedRound = {
  match: SingleMatchSummary | PhysicalMatch;
  kind: CompositionRoundDraft["kind"];
  orientation: CompositionRoundDraft["orientation"];
};

export function MatchCompositionDialog({
  open,
  target,
  candidates,
  onOpenChange,
  onSaved,
  onUnbind,
}: {
  open: boolean;
  target: CompositionTarget;
  candidates: SingleMatchSummary[];
  onOpenChange: (open: boolean) => void;
  onSaved: () => Promise<void>;
  onUnbind: (id: string) => Promise<{ ok: true; data?: unknown } | { ok: false; message: string }>;
}) {
  const findCandidate = useServerFn(findMatchCompositionCandidateFn);
  const saveComposition = useServerFn(saveMatchCompositionFn);
  const [selectedRounds, setSelectedRounds] = useState<SelectedRound[]>([]);
  const [searchId, setSearchId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [unbindError, setUnbindError] = useState<string | null>(null);
  const [unbindConfirmationOpen, setUnbindConfirmationOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const editingId = target?.kind === "composed" ? target.id : null;
  const selectedIds = useMemo(
    () => new Set(selectedRounds.map((round) => round.match.id)),
    [selectedRounds],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (target?.kind === "composed") {
      setSelectedRounds(
        target.rounds.map((round) => ({
          match: round.match,
          kind: round.kind,
          orientation: round.orientation,
        })),
      );
    } else if (target?.kind === "single") {
      setSelectedRounds([{ match: target, kind: "sequential", orientation: "aligned" }]);
    } else {
      setSelectedRounds([]);
    }

    setSearchId("");
    setMessage(null);
    setSaveError(null);
    setUnbindError(null);
    setUnbindConfirmationOpen(false);
  }, [open, target]);

  function addRound(match: SingleMatchSummary | PhysicalMatch) {
    if (selectedIds.has(match.id)) {
      setMessage("Essa partida já faz parte da composição.");
      return;
    }

    setMessage(null);
    setSelectedRounds((rounds) => [
      ...rounds,
      {
        match,
        kind: "sequential",
        orientation: rounds.length === 0 ? "aligned" : "auto",
      },
    ]);
  }

  async function searchCandidate() {
    setMessage(null);
    const normalizedSearchId = normalizeMatchIdInput(searchId);

    if (!/^[a-z2-9]{8}$/.test(normalizedSearchId)) {
      setMessage("Informe um ID físico válido de oito caracteres.");
      return;
    }

    setIsBusy(true);
    const candidate = await findCandidate({ data: { id: normalizedSearchId } });
    setIsBusy(false);

    if (!candidate) {
      setMessage("Partida física elegível não encontrada.");
      return;
    }

    addRound(candidate);
    setSearchId("");
  }

  function moveRound(index: number, direction: -1 | 1) {
    setSelectedRounds((rounds) => {
      const targetIndex = index + direction;

      if (targetIndex < 0 || targetIndex >= rounds.length) {
        return rounds;
      }

      const next = [...rounds];
      const [round] = next.splice(index, 1);

      if (!round) {
        return rounds;
      }

      next.splice(targetIndex, 0, round);
      return next.map((entry, roundIndex) => ({
        ...entry,
        orientation: roundIndex === 0 ? "aligned" : entry.orientation,
      }));
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

  function setRoundOrientation(index: number, orientation: CompositionRoundDraft["orientation"]) {
    setSelectedRounds((rounds) =>
      rounds.map((round, roundIndex) => (roundIndex === index ? { ...round, orientation } : round)),
    );
  }

  async function save() {
    const drafts = selectedRounds.map(({ match, kind, orientation }) => ({
      matchId: match.id,
      kind,
      orientation,
    }));
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
      setSaveError(result.message);
      return;
    }

    await onSaved();
    onOpenChange(false);
  }

  async function unbind() {
    if (!editingId) {
      return;
    }

    setIsBusy(true);
    const result = await onUnbind(editingId);
    setIsBusy(false);

    if (!result.ok) {
      setUnbindConfirmationOpen(false);
      setUnbindError(result.message);
      return;
    }

    setUnbindConfirmationOpen(false);
    onOpenChange(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Gerenciar vínculo" : "Vincular partidas"}</DialogTitle>
            <DialogDescription>
              Combine partidas físicas em tempos de uma única partida. A ordem abaixo define os
              tempos; somente o último pode ser uma prorrogação.
            </DialogDescription>
          </DialogHeader>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section className="grid gap-3" aria-labelledby="selected-rounds-title">
              <div>
                <h3 id="selected-rounds-title" className="font-semibold">
                  Tempos da partida
                </h3>
                <p className="text-sm text-muted-foreground">
                  Selecione pelo menos duas partidas físicas.
                </p>
              </div>

              {selectedRounds.length === 0 ? (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  Nenhuma partida selecionada.
                </p>
              ) : (
                selectedRounds.map((round, index) => {
                  const compositionScore = scoreInCompositionOrientation(
                    round.match.score,
                    round.orientation,
                  );

                  return (
                    <article
                      key={round.match.id}
                      className="overflow-hidden rounded-xl border bg-card shadow-xs"
                    >
                      <div className="grid gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
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
                          <span className="text-xs text-muted-foreground">Placar registrado</span>
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
                            aria-label={`Mover ${round.match.id} para cima`}
                            disabled={index === 0}
                            onClick={() => moveRound(index, -1)}
                          >
                            <ArrowUp className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Mover ${round.match.id} para baixo`}
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
                            aria-label={`Remover ${round.match.id}`}
                            onClick={() =>
                              setSelectedRounds((rounds) =>
                                rounds
                                  .filter((entry) => entry.match.id !== round.match.id)
                                  .map((entry, roundIndex) => ({
                                    ...entry,
                                    orientation: roundIndex === 0 ? "aligned" : entry.orientation,
                                  })),
                              )
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t bg-muted/20 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                        {index === 0 ? (
                          <div className="flex items-start gap-2">
                            <Layers3 className="mt-0.5 size-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Referência dos times</p>
                              <p className="text-xs text-muted-foreground">
                                Os lados deste tempo definem vermelho e azul na composição.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start gap-2">
                              {round.orientation === "auto" ? (
                                <Sparkles className="mt-0.5 size-4 text-primary" />
                              ) : (
                                <ArrowLeftRight className="mt-0.5 size-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="text-sm font-medium">Lados neste tempo</p>
                                <p className="text-xs text-muted-foreground">
                                  {round.orientation === "auto"
                                    ? "O sistema compara o placar e os jogadores."
                                    : round.orientation === "swapped"
                                      ? "Vermelho e azul representam os times opostos."
                                      : "Vermelho e azul representam os mesmos times."}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              {round.orientation === "swapped" && compositionScore ? (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>Na composição</span>
                                  <Scoreline
                                    red={compositionScore.red}
                                    blue={compositionScore.blue}
                                    compact
                                  />
                                </div>
                              ) : null}
                              <Select
                                value={round.orientation}
                                onValueChange={(value) =>
                                  setRoundOrientation(
                                    index,
                                    value as CompositionRoundDraft["orientation"],
                                  )
                                }
                              >
                                <SelectTrigger
                                  size="sm"
                                  className="w-full sm:w-52"
                                  aria-label={`Orientação dos times em ${round.match.id}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="auto">Detectar automaticamente</SelectItem>
                                  <SelectItem value="aligned">Lados mantidos</SelectItem>
                                  <SelectItem value="swapped">Lados invertidos</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })
              )}
            </section>

            <aside className="grid gap-4 rounded-lg border p-4">
              <div>
                <h3 className="font-semibold">Adicionar partida</h3>
                <p className="text-sm text-muted-foreground">
                  Escolha uma partida carregada ou informe seu ID exato.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  aria-label="ID da partida física"
                  placeholder="ID de 8 caracteres"
                  value={searchId}
                  onChange={(event) => setSearchId(normalizeMatchIdInput(event.target.value))}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label="Buscar partida física"
                  disabled={isBusy}
                  onClick={() => void searchCandidate()}
                >
                  <Search className="size-4" />
                </Button>
              </div>

              <div className="bfl-scrollbar grid max-h-64 gap-2 overflow-y-auto pr-1">
                {candidates.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between gap-2 rounded-md border p-2"
                  >
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <MatchCode id={match.id} />
                      <Scoreline red={match.score?.red} blue={match.score?.blue} compact />
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label={`Adicionar ${match.id}`}
                      disabled={selectedIds.has(match.id)}
                      onClick={() => addRound(match)}
                    >
                      <Plus className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {message ? <p className="text-sm text-destructive">{message}</p> : null}

          <DialogFooter className={editingId ? "sm:justify-between" : undefined}>
            {editingId ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={isBusy}
                onClick={() => setUnbindConfirmationOpen(true)}
              >
                <Undo2 className="size-4" />
                Desvincular
              </Button>
            ) : null}
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="button" disabled={isBusy} onClick={() => void save()}>
                <Layers3 className="size-4" />
                {editingId ? "Salvar vínculo" : "Criar vínculo"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={saveError !== null} onOpenChange={() => setSaveError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Não foi possível vincular as partidas</AlertDialogTitle>
            <AlertDialogDescription>{saveError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setSaveError(null)}>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unbindConfirmationOpen} onOpenChange={setUnbindConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular os tempos?</AlertDialogTitle>
            <AlertDialogDescription>
              A partida composta deixa de existir e as partidas físicas voltam à lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isBusy}
              onClick={() => void unbind()}
            >
              Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={unbindError !== null} onOpenChange={() => setUnbindError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Não foi possível desvincular as partidas</AlertDialogTitle>
            <AlertDialogDescription>{unbindError}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setUnbindError(null)}>Entendi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
