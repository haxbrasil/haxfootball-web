import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  CalendarClock,
  Check,
  CircleAlert,
  ClipboardCheck,
  History,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import { Dialog, DialogContent } from "#/components/ui/dialog";
import { EntityPicker, type EntityPickerOption } from "#/components/ds/forms/entity-picker";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Textarea } from "#/components/ui/textarea";
import type {
  ChampionshipWorkspaceData,
  PublicChampionshipDetail,
} from "#/server/api/championship-api";
import type { ChampionshipRecordedDraftPreview } from "@haxbrasil/haxfootball-api-sdk";
import { formatSalaryUnits } from "#/features/championships/salary-format";
import {
  previewChampionshipRecordedDraftFn,
  recordChampionshipDraftFn,
} from "#/server/api/championship-draft-functions";
import { numberValue, type Draft } from "./draft-workspace-model";
import {
  buildRecordedSlots,
  rebuildRecordedSlots,
  type RecordedSlot,
} from "./recorded-draft-studio-model";

type RecordedDraftData = Pick<
  ChampionshipWorkspaceData | PublicChampionshipDetail,
  "championship" | "teams" | "participants" | "salary"
>;

type StudioStep = 1 | 2 | 3;

const issueLabels: Record<string, string> = {
  "championship-state": "Edição indisponível para registro",
  "existing-draft": "Já existe um draft registrado nesta edição",
  "duplicate-sequence": "Escolha repetida",
  "duplicate-position": "Posição de rodada repetida",
  "round-out-of-range": "Rodada fora da estrutura",
  "position-out-of-range": "Posição fora da ordem das equipes",
  "team-out-of-range": "Equipe fora do draft",
  "selected-without-participant": "Escolha definida sem participante",
  "unresolved-with-participant": "A definir não pode conter participante",
  "duplicate-participant": "Participante escolhido mais de uma vez",
  "participant-unavailable": "Participante indisponível nesta edição",
  "participant-is-gm": "General Manager é definido no elenco",
  "participant-on-other-team": "Participante pertence a outra equipe",
  "same-team-membership": "Participante já estava nesta equipe",
  "prices-not-frozen": "Valores da edição ainda não estão congelados",
  "price-missing": "Participante sem valor definido",
  "sequence-gap": "A sequência tem uma lacuna",
  "cap-exception": "A equipe ultrapassará o teto salarial",
};

const resolutionLabels = {
  selected: "Participante definido",
  unresolved: "A definir",
  skipped: "Pular escolha",
} as const;

export function RecordedDraftStudio({
  open,
  onOpenChange,
  data,
  draft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: RecordedDraftData;
  draft: Draft | null;
}) {
  const router = useRouter();
  const previewRecorded = useServerFn(previewChampionshipRecordedDraftFn);
  const recordDraft = useServerFn(recordChampionshipDraftFn);
  const initialTeamIds = useMemo(
    () =>
      draft
        ? [...draft.teams]
            .sort((left, right) => numberValue(left.position) - numberValue(right.position))
            .map((team) => team.uuid)
        : data.teams.items.map((team) => team.uuid),
    [data.teams.items, draft],
  );
  const initialRounds = Math.max(
    1,
    draft?.rounds
      ? numberValue(draft.rounds)
      : numberValue(data.championship.rules.draft.rounds) || 1,
  );
  const [step, setStep] = useState<StudioStep>(1);
  const [teamIds, setTeamIds] = useState(initialTeamIds);
  const [rounds, setRounds] = useState(initialRounds);
  const [occurredAt, setOccurredAt] = useState("");
  const [recordedNote, setRecordedNote] = useState("");
  const [slots, setSlots] = useState<RecordedSlot[]>(() =>
    buildRecordedSlots(initialTeamIds, initialRounds, draft),
  );
  const [preview, setPreview] = useState<ChampionshipRecordedDraftPreview | null>(null);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCapException, setConfirmCapException] = useState(false);
  const [exceptionReason, setExceptionReason] = useState("");

  useEffect(() => {
    if (!open) return;

    const nextTeamIds = initialTeamIds;
    setStep(1);
    setTeamIds(nextTeamIds);
    setRounds(initialRounds);
    setOccurredAt("");
    setRecordedNote("");
    setSlots(buildRecordedSlots(nextTeamIds, initialRounds, draft));
    setPreview(null);
    setPreviewKey(null);
    setError(null);
    setConfirmCapException(false);
    setExceptionReason("");
  }, [draft, initialRounds, initialTeamIds, open]);

  const definitionKey = useMemo(
    () =>
      JSON.stringify({
        teamIds,
        rounds,
        occurredAt: occurredAt || undefined,
        recordedNote: recordedNote.trim() || undefined,
        slots,
      }),
    [occurredAt, recordedNote, rounds, slots, teamIds],
  );
  const teamById = useMemo(
    () => new Map(data.teams.items.map((team) => [team.uuid, team])),
    [data.teams.items],
  );
  const participantById = useMemo(
    () => new Map(data.participants.items.map((participant) => [participant.uuid, participant])),
    [data.participants.items],
  );
  const salaryById = useMemo(
    () =>
      new Map(data.salary.participants.items.map((participant) => [participant.uuid, participant])),
    [data.salary.participants.items],
  );
  const selectedParticipantIds = useMemo(
    () =>
      new Set(
        slots
          .filter((slot) => slot.resolution === "selected" && slot.participantId)
          .map((slot) => slot.participantId),
      ),
    [slots],
  );
  const participantOptions = useMemo<EntityPickerOption[]>(
    () =>
      data.participants.items
        .filter((participant) => participant.status !== "removed")
        .map((participant) => {
          const price = salaryById.get(participant.uuid)?.priceUnits;
          const membership = participant.activeMembership;
          const detail = [
            membership?.team.name ?? "Disponível para alocação",
            price === null || price === undefined
              ? "Valor a definir"
              : formatSalaryUnits(numberValue(price), data.salary.displayLabel),
          ].join(" · ");

          return {
            value: participant.uuid,
            label: participant.displayName,
            detail,
            searchTerms: [
              membership?.team.name ?? "",
              participant.identity.kind === "account"
                ? participant.identity.name
                : participant.identity.displayName,
            ],
          };
        }),
    [data.participants.items, data.salary.displayLabel, salaryById],
  );

  function moveTeam(index: number, offset: -1 | 1) {
    const target = index + offset;
    if (target < 0 || target >= teamIds.length) return;

    const nextTeamIds = [...teamIds];
    [nextTeamIds[index], nextTeamIds[target]] = [nextTeamIds[target], nextTeamIds[index]];
    setTeamIds(nextTeamIds);
    setSlots((current) => rebuildRecordedSlots(nextTeamIds, rounds, current));
    setPreview(null);
    setPreviewKey(null);
  }

  function changeRounds(value: number) {
    const nextRounds = Math.min(100, Math.max(1, Number.isFinite(value) ? value : 1));
    setRounds(nextRounds);
    setSlots((current) => rebuildRecordedSlots(teamIds, nextRounds, current));
    setPreview(null);
    setPreviewKey(null);
  }

  function updateSlot(sequence: number, update: Partial<RecordedSlot>) {
    setSlots((current) =>
      current.map((slot) => {
        if (slot.sequence !== sequence) return slot;
        const next = { ...slot, ...update };
        if (next.resolution !== "selected") next.participantId = null;
        return next;
      }),
    );
    setPreview(null);
    setPreviewKey(null);
  }

  function definitionInput() {
    return {
      teamIds,
      rounds,
      ...(occurredAt ? { occurredAt: new Date(occurredAt).toISOString() } : {}),
      ...(recordedNote.trim() ? { recordedNote: recordedNote.trim() } : {}),
      slots,
    };
  }

  async function requestPreview() {
    setPreviewLoading(true);
    setError(null);
    try {
      const result = await previewRecorded({
        data: {
          championshipUuid: data.championship.uuid,
          expectedRevision: numberValue(data.championship.revision),
          ...definitionInput(),
        },
      });
      setPreview(result);
      setPreviewKey(definitionKey);
      return result;
    } catch (reason) {
      const message =
        reason instanceof Error ? reason.message : "Não foi possível revisar o draft.";
      setError(message);
      setPreview(null);
      setPreviewKey(null);
      return null;
    } finally {
      setPreviewLoading(false);
    }
  }

  async function continueToReview() {
    const result = await requestPreview();
    if (result) setStep(3);
  }

  async function submit() {
    const currentPreview = previewKey === definitionKey ? preview : await requestPreview();
    if (!currentPreview) return;
    if (!currentPreview.valid) {
      setStep(3);
      toast.error("Revise os pontos marcados antes de registrar o draft.");
      return;
    }
    if (currentPreview.requiresCapException && (!confirmCapException || !exceptionReason.trim())) {
      setStep(3);
      setError("Confirme a exceção e registre o motivo para continuar.");
      return;
    }

    setRecording(true);
    setError(null);
    try {
      const result = await recordDraft({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          previewHash: currentPreview.previewHash,
          ...(currentPreview.requiresCapException ? { confirmCapException: true } : {}),
          ...(exceptionReason.trim() ? { reason: exceptionReason.trim() } : {}),
          ...definitionInput(),
        },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      toast.success("Draft realizado registrado.");
      onOpenChange(false);
      await router.invalidate();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível registrar o draft.");
    } finally {
      setRecording(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !recording && onOpenChange(next)}>
      <DialogContent className="!flex max-h-[calc(100vh-2rem)] w-[min(96vw,1220px)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:!max-w-none">
        <div className="shrink-0 border-b bg-muted/15 px-5 py-5 pr-16 sm:px-7 sm:pr-16">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <History className="size-4 text-primary" />
                Registro histórico
                <Badge variant="outline" className="normal-case tracking-normal">
                  Draft realizado
                </Badge>
              </div>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Registrar draft já realizado
              </h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Reconstitua a ordem e as escolhas de um draft que aconteceu fora da plataforma. O
                registro preserva lacunas, escolhas puladas e o impacto de cada equipe.
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 text-right text-xs text-muted-foreground md:flex">
              <CalendarClock className="size-4" />
              {occurredAt ? formatDate(occurredAt) : "Data opcional"}
            </div>
          </div>
          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <StepButton
              active={step === 1}
              complete={step > 1}
              onClick={() => setStep(1)}
              step="01"
              label="Estrutura"
              description="Equipes e rodadas"
            />
            <StepButton
              active={step === 2}
              complete={step > 2}
              onClick={() => setStep(2)}
              step="02"
              label="Escolhas"
              description="Grade serpentina"
            />
            <StepButton
              active={step === 3}
              complete={false}
              onClick={() => step > 1 && void continueToReview()}
              step="03"
              label="Revisão"
              description="Validação e impacto"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          {step === 1 ? (
            <StructureStep
              data={data}
              teamIds={teamIds}
              rounds={rounds}
              occurredAt={occurredAt}
              recordedNote={recordedNote}
              onMoveTeam={moveTeam}
              onRoundsChange={changeRounds}
              onOccurredAtChange={setOccurredAt}
              onRecordedNoteChange={setRecordedNote}
            />
          ) : null}
          {step === 2 ? (
            <ChoicesStep
              teamIds={teamIds}
              rounds={rounds}
              slots={slots}
              teamById={teamById}
              participantOptions={participantOptions}
              selectedParticipantIds={selectedParticipantIds}
              participantById={participantById}
              onUpdateSlot={updateSlot}
            />
          ) : null}
          {step === 3 ? (
            <ReviewStep
              data={data}
              preview={preview}
              previewLoading={previewLoading}
              confirmCapException={confirmCapException}
              exceptionReason={exceptionReason}
              onConfirmCapException={setConfirmCapException}
              onExceptionReasonChange={setExceptionReason}
              onRefresh={() => void requestPreview()}
            />
          ) : null}
          {error ? (
            <Alert variant="destructive" className="mt-6">
              <CircleAlert />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t bg-muted/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <Button variant="outline" disabled={recording} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {step > 1 ? (
              <Button
                variant="outline"
                disabled={recording || previewLoading}
                onClick={() => setStep((current) => (current - 1) as StudioStep)}
              >
                <ArrowLeft />
                Voltar
              </Button>
            ) : null}
            {step === 1 ? (
              <Button onClick={() => setStep(2)} disabled={teamIds.length < 2 || rounds < 1}>
                Continuar
                <ArrowRight />
              </Button>
            ) : null}
            {step === 2 ? (
              <Button onClick={() => void continueToReview()} disabled={previewLoading}>
                {previewLoading ? "Revisando…" : "Revisar registro"}
                {!previewLoading ? <ArrowRight /> : null}
              </Button>
            ) : null}
            {step === 3 ? (
              <Button
                onClick={() => void submit()}
                disabled={recording || previewLoading || !preview?.valid}
              >
                <ShieldCheck />
                {recording ? "Registrando…" : "Registrar draft"}
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function RecordedDraftView({
  draft,
  adminView = false,
}: {
  draft: Draft;
  adminView?: boolean;
}) {
  const teams = [...draft.teams].sort(
    (left, right) => numberValue(left.position) - numberValue(right.position),
  );
  const rounds = [...new Set(draft.turns.items.map((turn) => numberValue(turn.round)))].sort(
    (left, right) => left - right,
  );
  const turnByKey = new Map(
    draft.turns.items.map((turn) => [`${numberValue(turn.round)}:${turn.team.uuid}`, turn]),
  );

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-4 border-b px-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <History className="size-4 text-primary" />
            {adminView ? "Registro administrativo" : "Histórico do draft"}
            <Badge variant="outline" className="normal-case tracking-normal">
              Draft realizado
            </Badge>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Escolhas registradas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {draft.occurredAt
              ? `Realizado em ${formatDate(draft.occurredAt)}.`
              : "A ordem e as escolhas foram registradas pela organização."}
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x border-y text-center sm:min-w-[330px] sm:border-y-0 sm:border-l sm:border-r-0 sm:py-1">
          <ReadOnlyMetric
            label="Definidas"
            value={String(draft.turns.items.filter((turn) => turn.state === "filled").length)}
          />
          <ReadOnlyMetric label="Rodadas" value={String(numberValue(draft.rounds))} />
          <ReadOnlyMetric label="Equipes" value={String(teams.length)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div
            className="grid border-b bg-muted/20"
            style={{ gridTemplateColumns: `150px repeat(${teams.length}, minmax(160px, 1fr))` }}
          >
            <div className="border-r px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Rodada
            </div>
            {teams.map((team, index) => (
              <div key={team.uuid} className="border-r px-3 py-3 last:border-r-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Equipe {index + 1}
                </div>
                <div className="mt-1 truncate text-sm font-semibold">{team.name}</div>
              </div>
            ))}
          </div>
          {rounds.map((round) => (
            <div
              key={round}
              className="grid border-b last:border-b-0"
              style={{ gridTemplateColumns: `150px repeat(${teams.length}, minmax(160px, 1fr))` }}
            >
              <div className="border-r px-4 py-4">
                <div className="text-sm font-semibold">Rodada {round}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {round % 2 === 0 ? "Volta" : "Ida"}
                </div>
              </div>
              {teams.map((team) => {
                const turn = turnByKey.get(`${round}:${team.uuid}`);
                return (
                  <div key={team.uuid} className="border-r p-3 last:border-r-0">
                    {turn?.state === "filled" && turn.selectedParticipant ? (
                      <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                        <div className="text-sm font-semibold">
                          {turn.selectedParticipant.displayName}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Escolha #{numberValue(turn.sequence)}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                        {turn?.recordedResolution === "skipped" ? "Escolha pulada" : "A definir"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="border-t px-4 py-4 text-sm text-muted-foreground sm:px-6">
        {adminView
          ? "Este registro é a referência administrativa para a composição dos elencos."
          : "Registro histórico da composição dos elencos desta edição."}
      </div>
    </section>
  );
}

function StructureStep({
  data,
  teamIds,
  rounds,
  occurredAt,
  recordedNote,
  onMoveTeam,
  onRoundsChange,
  onOccurredAtChange,
  onRecordedNoteChange,
}: {
  data: RecordedDraftData;
  teamIds: string[];
  rounds: number;
  occurredAt: string;
  recordedNote: string;
  onMoveTeam: (index: number, offset: -1 | 1) => void;
  onRoundsChange: (value: number) => void;
  onOccurredAtChange: (value: string) => void;
  onRecordedNoteChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0">
        <StudioSectionHeader
          icon={<Sparkles className="size-4 text-primary" />}
          title="Estrutura do draft"
          description="Confirme a ordem das equipes e quantas rodadas aconteceram. A grade será montada automaticamente em serpentina."
        />
        <div className="mt-5 overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3">
            <div>
              <div className="text-sm font-semibold">Ordem das equipes</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                A primeira equipe começa a rodada de ida.
              </div>
            </div>
            <Badge variant="outline">{teamIds.length} equipes</Badge>
          </div>
          <div className="divide-y">
            {teamIds.map((teamId, index) => {
              const team = data.teams.items.find((item) => item.uuid === teamId);
              return (
                <div key={teamId} className="flex min-h-14 items-center gap-3 px-4 py-2">
                  <span className="grid size-7 shrink-0 place-items-center rounded-md border text-xs font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <TeamMark colors={team?.colors} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {team?.name ?? teamId}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Mover equipe para cima"
                    disabled={index === 0}
                    onClick={() => onMoveTeam(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Mover equipe para baixo"
                    disabled={index === teamIds.length - 1}
                    onClick={() => onMoveTeam(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="recorded-draft-rounds">Rodadas</Label>
            <Input
              id="recorded-draft-rounds"
              type="number"
              min={1}
              max={100}
              value={rounds}
              onChange={(event) => onRoundsChange(Number(event.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Escolhas não realizadas podem ficar como “A definir” ou “Pular escolha”.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recorded-draft-date">Quando aconteceu</Label>
            <Input
              id="recorded-draft-date"
              type="datetime-local"
              value={occurredAt}
              onChange={(event) => onOccurredAtChange(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Ajuda a situar o registro no histórico da edição.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="recorded-draft-note">Nota do registro</Label>
          <Textarea
            id="recorded-draft-note"
            value={recordedNote}
            onChange={(event) => onRecordedNoteChange(event.target.value)}
            placeholder="Contexto sobre onde o draft aconteceu, ajustes ou fontes da organização"
            maxLength={4_000}
          />
          <div className="text-right text-xs tabular-nums text-muted-foreground">
            {recordedNote.length}/4.000
          </div>
        </div>
        <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
          <div className="flex gap-3">
            <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <div className="text-sm font-semibold">Uma grade pronta para revisão</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Na próxima etapa, cada célula representa uma escolha. Você pode preencher somente o
                que é conhecido e deixar o restante para depois.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChoicesStep({
  teamIds,
  rounds,
  slots,
  teamById,
  participantOptions,
  selectedParticipantIds,
  participantById,
  onUpdateSlot,
}: {
  teamIds: string[];
  rounds: number;
  slots: RecordedSlot[];
  teamById: Map<string, RecordedDraftData["teams"]["items"][number]>;
  participantOptions: EntityPickerOption[];
  selectedParticipantIds: Set<string | null>;
  participantById: Map<string, RecordedDraftData["participants"]["items"][number]>;
  onUpdateSlot: (sequence: number, update: Partial<RecordedSlot>) => void;
}) {
  const slotByKey = useMemo(
    () => new Map(slots.map((slot) => [`${slot.round}:${slot.teamId}`, slot])),
    [slots],
  );
  const filledCount = slots.filter((slot) => slot.resolution === "selected").length;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <StudioSectionHeader
          icon={<ClipboardCheck className="size-4 text-primary" />}
          title="Grade de escolhas"
          description="Selecione o participante em cada célula. A busca aceita nome, conta e equipe atual."
        />
        <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="outline">
            {filledCount}/{slots.length} definidas
          </Badge>
          <Badge variant="outline">
            {rounds} {rounds === 1 ? "rodada" : "rodadas"}
          </Badge>
        </div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-lg border bg-background">
        <div className="min-w-[940px]">
          <div
            className="grid border-b bg-muted/20"
            style={{ gridTemplateColumns: `150px repeat(${teamIds.length}, minmax(190px, 1fr))` }}
          >
            <div className="sticky left-0 z-10 border-r px-3 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Rodada
            </div>
            {teamIds.map((teamId, index) => {
              const team = teamById.get(teamId);
              return (
                <div key={teamId} className="border-r px-3 py-3 last:border-r-0">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    Equipe {index + 1}
                  </div>
                  <div className="mt-1 truncate text-sm font-semibold">{team?.name ?? teamId}</div>
                </div>
              );
            })}
          </div>
          {Array.from({ length: rounds }, (_, index) => index + 1).map((round) => (
            <div
              key={round}
              className="grid border-b last:border-b-0"
              style={{ gridTemplateColumns: `150px repeat(${teamIds.length}, minmax(190px, 1fr))` }}
            >
              <div className="sticky left-0 z-10 border-r bg-background px-3 py-4">
                <div className="text-sm font-semibold">Rodada {round}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {round % 2 === 0 ? "Volta" : "Ida"}
                </div>
              </div>
              {teamIds.map((teamId) => {
                const slot = slotByKey.get(`${round}:${teamId}`);
                if (!slot) return <div key={teamId} className="border-r p-2 last:border-r-0" />;
                return (
                  <RecordedSlotCell
                    key={slot.sequence}
                    slot={slot}
                    participantOptions={participantOptions}
                    selectedParticipantIds={selectedParticipantIds}
                    participantById={participantById}
                    onUpdate={onUpdateSlot}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-primary" />
          Participante definido
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber-400" />A definir
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="size-2 rounded-full bg-muted-foreground" />
          Pular escolha
        </span>
      </div>
    </div>
  );
}

function RecordedSlotCell({
  slot,
  participantOptions,
  selectedParticipantIds,
  participantById,
  onUpdate,
}: {
  slot: RecordedSlot;
  participantOptions: EntityPickerOption[];
  selectedParticipantIds: Set<string | null>;
  participantById: Map<string, RecordedDraftData["participants"]["items"][number]>;
  onUpdate: (sequence: number, update: Partial<RecordedSlot>) => void;
}) {
  const selectedParticipant = slot.participantId ? participantById.get(slot.participantId) : null;
  const options = participantOptions.map((option) => ({
    ...option,
    disabled: selectedParticipantIds.has(option.value) && option.value !== slot.participantId,
  }));

  return (
    <div className="min-w-0 border-r p-2 last:border-r-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
          Escolha #{slot.sequence}
        </span>
        <span
          className={
            slot.resolution === "selected"
              ? "size-2 rounded-full bg-primary"
              : slot.resolution === "unresolved"
                ? "size-2 rounded-full bg-amber-400"
                : "size-2 rounded-full bg-muted-foreground"
          }
        />
      </div>
      <select
        aria-label={`Estado da escolha ${slot.sequence}`}
        value={slot.resolution}
        onChange={(event) =>
          onUpdate(slot.sequence, { resolution: event.target.value as RecordedSlot["resolution"] })
        }
        className="mb-2 h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <option value="selected">{resolutionLabels.selected}</option>
        <option value="unresolved">{resolutionLabels.unresolved}</option>
        <option value="skipped">{resolutionLabels.skipped}</option>
      </select>
      {slot.resolution === "selected" ? (
        <EntityPicker
          value={slot.participantId ?? ""}
          onValueChange={(value) =>
            onUpdate(slot.sequence, {
              participantId: value || null,
              resolution: value ? "selected" : "unresolved",
            })
          }
          options={options}
          ariaLabel={`Participante da escolha ${slot.sequence}`}
          placeholder="Selecionar pessoa"
          searchPlaceholder="Buscar participante…"
          emptyLabel="Nenhum participante corresponde à busca."
          className="h-9 text-xs"
        />
      ) : (
        <div className="flex min-h-9 items-center rounded-md border border-dashed px-2 text-xs text-muted-foreground">
          {slot.resolution === "unresolved" ? "A definir" : "Escolha pulada"}
        </div>
      )}
      {selectedParticipant ? (
        <div className="mt-2 truncate text-[11px] text-muted-foreground">
          {selectedParticipant.activeMembership?.team.name ?? "Participante"}
        </div>
      ) : null}
    </div>
  );
}

function ReviewStep({
  data,
  preview,
  previewLoading,
  confirmCapException,
  exceptionReason,
  onConfirmCapException,
  onExceptionReasonChange,
  onRefresh,
}: {
  data: RecordedDraftData;
  preview: ChampionshipRecordedDraftPreview | null;
  previewLoading: boolean;
  confirmCapException: boolean;
  exceptionReason: string;
  onConfirmCapException: (value: boolean) => void;
  onExceptionReasonChange: (value: string) => void;
  onRefresh: () => void;
}) {
  if (previewLoading) {
    return (
      <div className="grid min-h-72 place-items-center text-center">
        <RotateCcw className="size-6 animate-spin text-primary" />
        <div className="mt-3 text-sm text-muted-foreground">
          Revisando a sequência, participantes e impacto nas equipes…
        </div>
      </div>
    );
  }
  if (!preview) {
    return (
      <div className="grid min-h-72 place-items-center text-center">
        <CircleAlert className="size-7 text-amber-300" />
        <div className="mt-3 font-medium">A revisão ainda não foi executada.</div>
        <Button className="mt-4" variant="outline" onClick={onRefresh}>
          Revisar agora
        </Button>
      </div>
    );
  }
  const errors = preview.issues.filter((issue) => issue.severity === "error");
  const warnings = preview.issues.filter((issue) => issue.severity === "warning");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <StudioSectionHeader
          icon={<ShieldCheck className="size-4 text-primary" />}
          title="Revisão antes do registro"
          description="Esta visão mostra exatamente o que será gravado. Os avisos ficam auditáveis na edição."
        />
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RotateCcw />
          Atualizar revisão
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        <ReviewMetric
          label="Estado"
          value={preview.valid ? "Pronto" : "Ajustes necessários"}
          tone={preview.valid ? "good" : "bad"}
        />
        <ReviewMetric label="Definidas" value={String(numberValue(preview.selectedCount))} />
        <ReviewMetric label="A definir" value={String(numberValue(preview.unresolvedCount))} />
        <ReviewMetric label="Puladas" value={String(numberValue(preview.skippedCount))} />
      </div>
      {errors.length ? <IssueList title="Ajustes necessários" issues={errors} /> : null}
      {warnings.length ? (
        <IssueList title="Pontos para confirmar" issues={warnings} warning />
      ) : null}
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Impacto por equipe</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Valores e teto são calculados com a configuração atual da edição.
            </p>
          </div>
          <Badge variant="outline">
            {data.salary.enabled ? data.salary.displayLabel : "Sem teto salarial"}
          </Badge>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {preview.teams.map((team) => (
            <TeamImpact
              key={team.uuid}
              team={team}
              salaryEnabled={data.salary.enabled}
              capUnits={numberValue(data.salary.capUnits)}
              displayLabel={data.salary.displayLabel}
            />
          ))}
        </div>
      </div>
      {preview.requiresCapException ? (
        <div className="rounded-lg border border-amber-400/35 bg-amber-400/5 p-4">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <div className="font-semibold">Confirmação de teto necessária</div>
              <p className="mt-1 text-sm text-muted-foreground">
                A organização pode registrar a exceção com um motivo. A edição permanecerá
                identificada como acima do teto até uma nova movimentação.
              </p>
              <label
                htmlFor="recorded-draft-cap-exception"
                className="mt-4 flex items-start gap-3 text-sm"
              >
                <Checkbox
                  id="recorded-draft-cap-exception"
                  checked={confirmCapException}
                  onCheckedChange={(checked) => onConfirmCapException(checked === true)}
                />
                <span>Confirmo o registro da exceção administrativa para esta operação.</span>
              </label>
              <div className="mt-3 space-y-2">
                <Label htmlFor="recorded-draft-exception-reason">Motivo da exceção</Label>
                <Textarea
                  id="recorded-draft-exception-reason"
                  value={exceptionReason}
                  onChange={(event) => onExceptionReasonChange(event.target.value)}
                  placeholder="Explique por que o registro histórico exige esta exceção"
                  maxLength={1_000}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function IssueList({
  title,
  issues,
  warning = false,
}: {
  title: string;
  issues: ChampionshipRecordedDraftPreview["issues"];
  warning?: boolean;
}) {
  return (
    <div
      className={
        warning
          ? "rounded-lg border border-amber-400/35"
          : "rounded-lg border border-destructive/35"
      }
    >
      <div className="border-b px-4 py-3 font-semibold">{title}</div>
      <div className="divide-y">
        {issues.map((issue, index) => (
          <div
            key={`${issue.code}-${issue.sequence ?? "all"}-${index}`}
            className="flex gap-3 px-4 py-3 text-sm"
          >
            <CircleAlert
              className={
                warning
                  ? "mt-0.5 size-4 shrink-0 text-amber-300"
                  : "mt-0.5 size-4 shrink-0 text-destructive"
              }
            />
            <div>
              <div className="font-medium">{issueLabels[issue.code] ?? "Revisão da escolha"}</div>
              <div className="mt-0.5 text-muted-foreground">
                {issue.message}
                {issue.sequence ? ` · escolha #${numberValue(issue.sequence)}` : ""}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamImpact({
  team,
  salaryEnabled,
  capUnits,
  displayLabel,
}: {
  team: ChampionshipRecordedDraftPreview["teams"][number];
  salaryEnabled: boolean;
  capUnits: number;
  displayLabel: string;
}) {
  const usage = numberValue(team.usageAfterUnits);
  const before = numberValue(team.usageBeforeUnits);
  const remaining = numberValue(team.remainingAfterUnits);
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{team.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            {numberValue(team.selectedCount)}{" "}
            {numberValue(team.selectedCount) === 1 ? "escolha" : "escolhas"} ·{" "}
            {salaryEnabled ? `${formatSalaryUnits(before, displayLabel)} antes` : "teto desativado"}
          </div>
        </div>
        {team.overCapAfter ? (
          <Badge className="border-amber-400/40 bg-amber-400/10 text-amber-200">
            Acima do teto
          </Badge>
        ) : (
          <Check className="size-4 text-emerald-300" />
        )}
      </div>
      {salaryEnabled ? (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Projeção</span>
            <span>{formatSalaryUnits(usage, displayLabel)}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={team.overCapAfter ? "h-full bg-amber-400" : "h-full bg-primary"}
              style={{
                width: `${Math.min(100, Math.max(0, (usage / Math.max(1, capUnits)) * 100))}%`,
              }}
            />
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {remaining >= 0
              ? `${formatSalaryUnits(remaining, displayLabel)} livres`
              : `${formatSalaryUnits(Math.abs(remaining), displayLabel)} acima do teto`}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StepButton({
  active,
  complete,
  onClick,
  step,
  label,
  description,
}: {
  active: boolean;
  complete: boolean;
  onClick: () => void;
  step: string;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${active ? "border-primary bg-primary/10" : complete ? "border-emerald-400/35 bg-emerald-400/5" : "border-border bg-background hover:bg-muted/50"}`}
    >
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${active ? "bg-primary text-primary-foreground" : complete ? "bg-emerald-400/15 text-emerald-200" : "bg-muted text-muted-foreground"}`}
      >
        {complete ? <Check className="size-4" /> : step}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

function StudioSectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ReviewMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-1 text-lg font-semibold ${tone === "good" ? "text-emerald-200" : tone === "bad" ? "text-amber-200" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function ReadOnlyMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function TeamMark({ colors }: { colors: string[] | null | undefined }) {
  return (
    <span
      className="size-7 shrink-0 rounded-md border"
      style={{
        background:
          colors && colors.length > 1
            ? `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50%)`
            : (colors?.[0] ?? "#64748b"),
      }}
    />
  );
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}
