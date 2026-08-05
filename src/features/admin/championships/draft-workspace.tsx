import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Check,
  CircleAlert,
  ChevronDown,
  Clock3,
  ClipboardCheck,
  Crown,
  History,
  ListChecks,
  Play,
  Radio,
  RotateCcw,
  Search,
  Shield,
  Sparkles,
  TimerOff,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { EntityPicker } from "#/components/ds/forms/entity-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Progress } from "#/components/ui/progress";
import type { ApiAccountSession } from "#/server/auth/session";
import { hasApiPermission } from "#/server/auth/permissions";
import type {
  ChampionshipWorkspaceData,
  PublicChampionshipDetail,
} from "#/server/api/championship-api";
import { formatSalaryUnits } from "#/features/championships/salary-format";
import {
  acceptChampionshipTradeFn,
  cancelChampionshipTradeFn,
  cancelChampionshipDraftFn,
  configureChampionshipDraftFn,
  createChampionshipTradeFn,
  endChampionshipDraftFn,
  getChampionshipDraftFn,
  getChampionshipTradesFn,
  makeChampionshipDraftPickFn,
  previewChampionshipDraftCorrectionFn,
  rejectChampionshipTradeFn,
  reverseChampionshipDraftPickFn,
  startChampionshipDraftFn,
} from "#/server/api/championship-draft-functions";
import { updateChampionshipTradeWindowFn } from "#/server/api/championship-trade-functions";
import {
  activeTurn,
  countdownLabel,
  draftReadiness,
  eligibleTurns,
  filledTurns,
  numberValue,
  overdueTurns,
  participantSearch,
  projectedTeamCap,
  roundDirection,
  secondsUntil,
  teamCapPercent,
  tradeBalance,
  turnStateLabel,
  type Draft,
  type DraftParticipant,
  type DraftTurn,
  type TradeProjection,
} from "./draft-workspace-model";
import { RecordedDraftStudio, RecordedDraftView } from "./recorded-draft-studio";

type DraftData = Pick<
  ChampionshipWorkspaceData | PublicChampionshipDetail,
  "championship" | "teams" | "participants" | "salary" | "draft" | "trades"
>;

type TradeTeamOption = {
  uuid: string;
  name: string;
  roster: Array<{
    participantUuid: string;
    displayName: string;
    role: "gm" | "player";
  }>;
};

export function DraftWorkspace({
  data,
  session,
  mode,
  poll = true,
  focus = "all",
  includeTrades = mode === "admin",
}: {
  data: DraftData;
  session: ApiAccountSession | null;
  mode: "admin" | "public";
  poll?: boolean;
  focus?: "all" | "trades";
  includeTrades?: boolean;
}) {
  const [projection, setProjection] = useState(data.draft);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const fetchDraft = useServerFn(getChampionshipDraftFn);
  const cancelDraft = useServerFn(cancelChampionshipDraftFn);
  const router = useRouter();
  const draft = projection.draft;
  const draftState = draft?.state;
  const draftServerTime = draft?.serverTime;
  const canCancel =
    mode === "admin" && session !== null && hasApiPermission(session, "championship:admin");

  useEffect(() => setProjection(data.draft), [data.draft]);

  useEffect(() => {
    if (!draftServerTime || draftState !== "live") {
      return;
    }

    const offset = new Date(draftServerTime).getTime() - Date.now();
    const timer = window.setInterval(() => setNowMs(Date.now() + offset), 250);

    return () => window.clearInterval(timer);
  }, [draftServerTime, draftState]);

  useEffect(() => {
    if (!poll || draftState !== "live") {
      return;
    }

    const timer = window.setInterval(() => {
      void fetchDraft({
        data: {
          championshipUuid: data.championship.uuid,
          turnLimit: 100,
          participantLimit: 100,
        },
      })
        .then(setProjection)
        .catch(() => undefined);
    }, 1_500);

    return () => window.clearInterval(timer);
  }, [data.championship.uuid, draftState, fetchDraft, poll]);

  if (!draft) {
    return mode === "admin" ? (
      <AdminDraftWorkspace
        data={data}
        draft={null}
        session={session}
        nowMs={nowMs}
        canCancel={canCancel}
        onCancel={() => setCancelOpen(true)}
        onProjection={setProjection}
      />
    ) : (
      <DraftEmptyState />
    );
  }

  const completedPicks = filledTurns(draft).length;
  const activeDraft = draft;

  async function confirmCancellation() {
    setCancelBusy(true);
    try {
      const result = await cancelDraft({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(activeDraft.championshipRevision),
          expectedDraftRevision: numberValue(activeDraft.revision),
          reason: "Draft cancelado pela organização",
        },
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      setProjection(result.data);
      setCancelOpen(false);
      toast.success("Draft cancelado.");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível cancelar o draft.");
    } finally {
      setCancelBusy(false);
    }
  }

  const publicWorkspace =
    focus === "trades" ? (
      <TradeDesk data={data} draft={draft} mode={mode} session={session} />
    ) : draft.mode === "recorded" ? (
      <RecordedDraftView draft={draft} />
    ) : (
      <div className="space-y-5">
        <DraftStatusBand data={data} draft={draft} nowMs={nowMs} mode={mode} session={session} />
        <DraftBoard data={data} draft={draft} nowMs={nowMs} mode={mode} />
        <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_350px]">
          <PlayerPool
            data={data}
            draft={draft}
            session={session}
            mode={mode}
            onProjection={setProjection}
          />
          <DraftFeed
            data={data}
            draft={draft}
            mode={mode}
            canCancel={canCancel}
            onCancel={() => setCancelOpen(true)}
            onProjection={setProjection}
          />
        </div>
        {includeTrades ? (
          <TradeDesk data={data} draft={draft} mode={mode} session={session} />
        ) : null}
      </div>
    );

  return (
    <>
      {mode === "admin" ? (
        <AdminDraftWorkspace
          data={data}
          draft={draft}
          session={session}
          nowMs={nowMs}
          canCancel={canCancel}
          onCancel={() => setCancelOpen(true)}
          onProjection={setProjection}
        />
      ) : (
        publicWorkspace
      )}
      <Dialog open={cancelOpen} onOpenChange={(open) => !cancelBusy && setCancelOpen(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar draft?</DialogTitle>
            <DialogDescription>
              O draft deixa de aparecer nesta edição. A configuração e o histórico permanecem na
              auditoria, e você poderá criar outro draft depois.
            </DialogDescription>
          </DialogHeader>
          <div className="border-y py-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Escolhas realizadas</span>
              <span className="font-semibold tabular-nums">{completedPicks}</span>
            </div>
            {completedPicks > 0 ? (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>
                  Corrija as {completedPicks} escolhas na linha do tempo antes de cancelar. Assim,
                  nenhum jogador permanece no elenco por causa de um draft cancelado.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={cancelBusy} onClick={() => setCancelOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              disabled={cancelBusy || completedPicks > 0}
              onClick={() => void confirmCancellation()}
            >
              <Trash2 />
              {cancelBusy ? "Cancelando…" : "Cancelar draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminDraftWorkspace({
  data,
  draft,
  session,
  nowMs,
  canCancel,
  onCancel,
  onProjection,
}: {
  data: DraftData;
  draft: Draft | null;
  session: ApiAccountSession | null;
  nowMs: number;
  canCancel: boolean;
  onCancel: () => void;
  onProjection: (draft: DraftData["draft"]) => void;
}) {
  const isSetup = draft === null || draft.state === "setup";
  const [recordedStudioOpen, setRecordedStudioOpen] = useState(false);

  return (
    <>
      <div className="space-y-4">
        <AdminDraftHeader
          data={data}
          draft={draft}
          canManageTrades={
            session !== null &&
            (hasApiPermission(session, "championship:admin") ||
              hasApiPermission(session, "championship:operate"))
          }
          onRecord={() => setRecordedStudioOpen(true)}
        />
        {isSetup ? (
          <DraftSetup
            data={data}
            draft={draft}
            adminView
            canCancel={canCancel}
            onCancel={onCancel}
          />
        ) : draft?.mode === "recorded" ? (
          <RecordedDraftView draft={draft} adminView />
        ) : (
          <>
            {draft.state === "live" ? <AdminDraftControlStrip draft={draft} nowMs={nowMs} /> : null}
            <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_330px]">
              <div className="min-w-0 space-y-4">
                <DraftBoard data={data} draft={draft} nowMs={nowMs} mode="admin" adminView />
                {draft.state === "live" ? (
                  <PlayerPool
                    data={data}
                    draft={draft}
                    session={session}
                    mode="admin"
                    adminView
                    onProjection={onProjection}
                  />
                ) : null}
              </div>
              <AdminDraftMonitor draft={draft} nowMs={nowMs} />
            </div>
            <DraftFeed
              data={data}
              draft={draft}
              mode="admin"
              adminView
              canCancel={canCancel}
              onCancel={onCancel}
              onProjection={onProjection}
            />
            <TradeDesk data={data} draft={draft} mode="admin" session={session} adminView />
          </>
        )}
      </div>
      <RecordedDraftStudio
        open={recordedStudioOpen}
        onOpenChange={setRecordedStudioOpen}
        data={data}
        draft={draft}
      />
    </>
  );
}

function AdminDraftHeader({
  data,
  draft,
  canManageTrades,
  onRecord,
}: {
  data: DraftData;
  draft: Draft | null;
  canManageTrades: boolean;
  onRecord: () => void;
}) {
  const completed = draft ? filledTurns(draft).length : 0;
  const total = draft?.turns.items.length ?? 0;
  const available = draft?.availableParticipants.items.length ?? 0;
  const teamCount = draft?.teams.length ?? data.teams.items.length;
  const stateLabel = draft ? draftStateLabel(draft.state) : "Ainda não configurado";
  const canRecord = draft === null || draft.state === "setup";

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-5 border-b px-4 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <ClipboardCheck className="size-4 text-primary" />
            Operação do draft
            <Badge variant="outline" className="normal-case tracking-normal">
              {stateLabel}
            </Badge>
            {draft?.state === "live" ? (
              <Badge className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200">
                <Radio className="size-3" />
                Sincronização ativa
              </Badge>
            ) : null}
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Gestão do draft</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Configure a ordem, acompanhe escolhas em tempo real e mantenha correções, elencos e
            trocas sob controle da organização.
          </p>
        </div>
        <div className="flex w-full flex-wrap items-start justify-end gap-3 lg:w-auto">
          <TradeWindowControl data={data} canManage={canManageTrades} />
          {canRecord ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  Ações
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onSelect={onRecord}>
                  <History />
                  Registrar draft realizado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        <AdminDraftMetric
          label="Escolhas registradas"
          value={draft ? String(completed) + "/" + String(total) : "—"}
        />
        <AdminDraftMetric label="Equipes" value={String(teamCount)} />
        <AdminDraftMetric
          label="Participantes disponíveis"
          value={draft ? String(available) : "—"}
        />
        <AdminDraftMetric label="Rodadas" value={draft ? String(numberValue(draft.rounds)) : "—"} />
      </div>
    </section>
  );
}

function TradeWindowControl({ data, canManage }: { data: DraftData; canManage: boolean }) {
  const updateWindow = useServerFn(updateChampionshipTradeWindowFn);
  const router = useRouter();
  const [dialogState, setDialogState] = useState<"open" | "closed" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const isOpen =
    data.championship.tradeWindowState === "open" &&
    ["setup", "active"].includes(data.championship.lifecycle);
  const canToggle = canManage && ["setup", "active"].includes(data.championship.lifecycle);
  const pendingCount = data.trades.items.filter((trade) => trade.state === "proposed").length;

  async function confirm() {
    if (!dialogState) {
      return;
    }

    setBusy(true);
    try {
      const result = await updateWindow({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          state: dialogState,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
      });

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success(
        dialogState === "closed" ? "Janela de trocas encerrada." : "Janela de trocas reaberta.",
      );
      setDialogState(null);
      setReason("");
      await router.invalidate();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Não foi possível atualizar a janela de trocas.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={
            isOpen ? "border-emerald-500/50 text-emerald-300" : "border-amber-500/50 text-amber-200"
          }
        >
          <ArrowLeftRight className="size-3" />
          {isOpen ? "Janela de trocas aberta" : "Janela de trocas encerrada"}
        </Badge>
        {canToggle ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                Ações
                <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem onSelect={() => setDialogState(isOpen ? "closed" : "open")}>
                {isOpen ? <TimerOff /> : <Play />}
                {isOpen ? "Encerrar janela de trocas" : "Reabrir janela de trocas"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
      <Dialog
        open={dialogState !== null}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setDialogState(null);
            setReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {dialogState === "closed" ? "Encerrar janela de trocas" : "Reabrir janela de trocas"}
            </DialogTitle>
            <DialogDescription>
              {dialogState === "closed"
                ? "A edição continuará ativa, enquanto a organização controla quando novas negociações podem avançar."
                : "As equipes poderão voltar a propor e aceitar trocas nesta edição."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 border-y py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Estado atual
                </div>
                <div className="mt-1 font-medium">
                  {isOpen ? "Janela aberta" : "Janela encerrada"}
                </div>
              </div>
              <div className="rounded-lg border px-3 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  Propostas em andamento
                </div>
                <div className="mt-1 font-medium tabular-nums">{pendingCount}</div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade-window-reason">Nota da organização</Label>
              <Input
                id="trade-window-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Opcional · início da fase eliminatória"
                disabled={busy}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setDialogState(null)}
            >
              Voltar
            </Button>
            <Button type="button" disabled={busy} onClick={() => void confirm()}>
              {dialogState === "closed" ? <TimerOff /> : <Play />}
              {busy
                ? "Atualizando…"
                : dialogState === "closed"
                  ? "Encerrar janela"
                  : "Reabrir janela"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AdminDraftMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 sm:px-5">
      <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function AdminDraftControlStrip({ draft, nowMs }: { draft: Draft; nowMs: number }) {
  const turn = activeTurn(draft);
  const overdue = overdueTurns(draft);
  const eligible = eligibleTurns(draft);
  const remaining = secondsUntil(turn?.deadlineAt, nowMs);

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border border-primary/30">
      <div className="grid gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
            <ListChecks className="size-4" />
            Turno em operação
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h3 className="text-lg font-semibold">
              {turn ? turn.team.name : "Aguardando a próxima escolha"}
            </h3>
            {turn ? (
              <span className="text-sm text-muted-foreground">
                Rodada {numberValue(turn.round)} · escolha #{numberValue(turn.sequence)} ·{" "}
                {roundDirection(numberValue(turn.round)) === "forward" ? "ida" : "volta"}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {turn
              ? turn.state === "overdue"
                ? "O prazo terminou; a equipe ainda pode concluir esta escolha."
                : "Registre a escolha no painel de participantes disponíveis."
              : "O draft atualiza a fila assim que uma escolha é confirmada."}
          </p>
        </div>
        <div className="grid grid-cols-3 divide-x border-y py-2 text-center sm:border-y-0 sm:py-0 lg:min-w-[360px]">
          <div className="px-3">
            <div className="text-xs text-muted-foreground">Prazo</div>
            <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
              {countdownLabel(remaining)}
            </div>
          </div>
          <div className="px-3">
            <div className="text-xs text-muted-foreground">Elegíveis</div>
            <div className="mt-1 text-lg font-semibold tabular-nums">{eligible.length}</div>
          </div>
          <div className="px-3">
            <div className="text-xs text-muted-foreground">Atrasadas</div>
            <div
              className={
                overdue.length
                  ? "mt-1 text-lg font-semibold tabular-nums text-amber-200"
                  : "mt-1 text-lg font-semibold tabular-nums"
              }
            >
              {overdue.length}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdminDraftMonitor({ draft, nowMs }: { draft: Draft; nowMs: number }) {
  const turn = activeTurn(draft);
  const overdue = overdueTurns(draft);
  const recent = filledTurns(draft).slice(0, 6);
  const remaining = secondsUntil(turn?.deadlineAt, nowMs);

  return (
    <aside className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" />
            <h3 className="font-semibold">Monitor operacional</h3>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Estado da fila, prazos e escolhas recentes.
          </p>
        </div>
        <Badge variant="outline">{draftStateLabel(draft.state)}</Badge>
      </div>
      <div className="px-4 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          Próxima operação
        </div>
        {turn ? (
          <div className="mt-2">
            <div className="text-lg font-semibold">{turn.team.name}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Escolha #{numberValue(turn.sequence)} · {countdownLabel(remaining)}
            </div>
            <div className="mt-3 border-l-2 border-primary/60 pl-3 text-sm text-muted-foreground">
              A escolha continua disponível após o prazo.
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {draft.state === "completed"
              ? "Todas as escolhas foram encerradas."
              : draft.state === "canceled"
                ? "Este draft foi cancelado; o histórico permanece disponível para consulta."
                : "A fila será aberta quando o draft começar."}
          </p>
        )}
      </div>
      <div className="grid grid-cols-2 divide-x border-y">
        <AdminDraftMetric label="Turnos atrasados" value={String(overdue.length)} />
        <AdminDraftMetric label="Escolhas concluídas" value={String(filledTurns(draft).length)} />
      </div>
      <div className="border-b px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Atenção operacional
          </div>
          {overdue.length ? (
            <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-200">
              {overdue.length} pendente{overdue.length === 1 ? "" : "s"}
            </Badge>
          ) : null}
        </div>
        {overdue.length ? (
          <div className="mt-3 space-y-2">
            {overdue.slice(0, 4).map((item) => (
              <div key={item.uuid} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{item.team.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-amber-200">
                  #{numberValue(item.sequence)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Nenhum prazo exige atenção agora.</p>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 px-4 py-4">
          <History className="size-4 text-muted-foreground" />
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Últimas escolhas
          </div>
        </div>
        {recent.length ? (
          <div className="divide-y border-t">
            {recent.slice(0, 5).map((item) => (
              <div key={item.uuid} className="flex items-center gap-3 px-4 py-3">
                <span className="grid size-7 shrink-0 place-items-center border text-xs font-semibold tabular-nums">
                  {numberValue(item.sequence)}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">
                    {item.selectedParticipant?.displayName ?? "Participante"}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">{item.team.name}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="border-t px-4 py-6 text-sm text-muted-foreground">
            O histórico aparecerá aqui quando a primeira escolha for registrada.
          </p>
        )}
      </div>
    </aside>
  );
}

function DraftSetup({
  data,
  draft,
  adminView = false,
  canCancel = false,
  onCancel,
  onProjection,
}: {
  data: DraftData;
  draft: Draft | null;
  adminView?: boolean;
  canCancel?: boolean;
  onCancel?: () => void;
  onProjection?: (draft: DraftData["draft"]) => void;
}) {
  const configure = useServerFn(configureChampionshipDraftFn);
  const start = useServerFn(startChampionshipDraftFn);
  const router = useRouter();
  const [teamIds, setTeamIds] = useState(
    draft
      ? [...draft.teams]
          .sort((left, right) => numberValue(left.position) - numberValue(right.position))
          .map((team) => team.uuid)
      : data.teams.items.map((team) => team.uuid),
  );
  const [rounds, setRounds] = useState(draft ? numberValue(draft.rounds) : 4);
  const [countdown, setCountdown] = useState(
    draft
      ? numberValue(draft.countdownSeconds)
      : numberValue(data.championship.rules.draft.countdownSeconds),
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const readiness = draftReadiness(
    draft,
    data.championship.registrationState,
    data.championship.rules.salary.enabled,
    data.championship.priceState === "locked",
  );
  const configuredTeamIds = draft
    ? [...draft.teams]
        .sort((left, right) => numberValue(left.position) - numberValue(right.position))
        .map((team) => team.uuid)
    : [];
  const configurationChanged =
    draft === null ||
    rounds !== numberValue(draft.rounds) ||
    countdown !== numberValue(draft.countdownSeconds) ||
    teamIds.length !== configuredTeamIds.length ||
    teamIds.some((teamId, index) => teamId !== configuredTeamIds[index]);

  function move(index: number, offset: -1 | 1) {
    const target = index + offset;

    if (target < 0 || target >= teamIds.length) {
      return;
    }

    setTeamIds((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function persistConfiguration() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await configure({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          teamIds,
          rounds,
          countdownSeconds: countdown,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return null;
      }

      onProjection?.(result.data);
      return result.data;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Não foi possível salvar a configuração.",
      );
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const result = await persistConfiguration();

    if (!result) {
      return;
    }

    setDialogOpen(false);
    toast.success(draft ? "Configuração do draft salva." : "Draft criado.");
    await router.invalidate();
  }

  async function begin() {
    if (!draft) {
      await save();
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      let expectedRevision = numberValue(data.championship.revision);
      let expectedDraftRevision = numberValue(draft.revision);

      if (configurationChanged) {
        const configured = await configure({
          data: {
            championshipUuid: data.championship.uuid,
            commandUuid: crypto.randomUUID(),
            expectedRevision,
            teamIds,
            rounds,
            countdownSeconds: countdown,
          },
        });

        if (!configured.ok) {
          setMessage(configured.message);
          return;
        }

        onProjection?.(configured.data);
        const configuredDraft = configured.data.draft;
        if (!configuredDraft) {
          setMessage(
            "A configuração foi salva, mas o draft ainda não está disponível para iniciar.",
          );
          return;
        }
        expectedRevision = numberValue(configuredDraft.championshipRevision);
        expectedDraftRevision = numberValue(configuredDraft.revision);
      }

      const result = await start({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision,
          expectedDraftRevision,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      onProjection?.(result.data);
      setDialogOpen(false);
      toast.success("Draft iniciado.");
      await router.invalidate();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível iniciar o draft.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="grid gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_310px] sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-semibold">
              {adminView ? "Configuração operacional" : "Preparação do draft"}
            </h2>
            <Badge variant="outline">Serpentina</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {adminView
              ? "Defina a ordem das equipes, o número de rodadas e o prazo de cada escolha antes de abrir a operação."
              : "Defina a prioridade inicial. A direção alterna automaticamente a cada rodada."}
          </p>
          <div className="mt-4 divide-y border-y">
            {teamIds.map((teamId, index) => {
              const team = data.teams.items.find((item) => item.uuid === teamId);

              return (
                <div key={teamId} className="flex min-h-12 items-center gap-3 px-2">
                  <span className="w-7 text-center text-sm font-semibold tabular-nums">
                    {index + 1}
                  </span>
                  <TeamSwatch colors={team?.colors} />
                  <span className="min-w-0 flex-1 truncate text-sm">{team?.name ?? teamId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Mover equipe para cima"
                    disabled={index === 0 || busy}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Mover equipe para baixo"
                    disabled={index === teamIds.length - 1 || busy}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-4 border-l-0 lg:border-l lg:pl-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Parâmetros de abertura
            </div>
            <div className="mt-3 grid grid-cols-2 divide-x border-y py-3">
              <div className="pr-4">
                <div className="text-xs text-muted-foreground">Rodadas</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {draft ? numberValue(draft.rounds) : "—"}
                </div>
              </div>
              <div className="pl-4">
                <div className="text-xs text-muted-foreground">Prazo por escolha</div>
                <div className="mt-1 text-lg font-semibold tabular-nums">
                  {draft ? String(numberValue(draft.countdownSeconds)) + " s" : "—"}
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Ajuste os parâmetros e confira as condições no painel de início.
            </p>
          </div>
          <div className="space-y-2">
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => {
                setMessage(null);
                setDialogOpen(true);
              }}
            >
              <Play />
              {draft ? "Configurar e iniciar" : "Configurar draft ao vivo"}
            </Button>
          </div>
          {draft && canCancel ? (
            <Button
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/15 hover:text-destructive"
              disabled={busy}
              onClick={onCancel}
            >
              <Trash2 />
              Cancelar draft
            </Button>
          ) : null}
        </div>
      </div>
      <Dialog open={dialogOpen} onOpenChange={(open) => !busy && setDialogOpen(open)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{draft ? "Iniciar operação do draft" : "Configurar draft"}</DialogTitle>
            <DialogDescription>
              Defina o ritmo da operação e confirme as condições antes de abrir a fila de escolhas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 border-y py-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="draft-rounds">Rodadas</Label>
              <Input
                id="draft-rounds"
                type="number"
                min={1}
                max={100}
                value={rounds}
                onChange={(event) => setRounds(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="draft-countdown">Prazo por escolha (segundos)</Label>
              <Input
                id="draft-countdown"
                type="number"
                min={0}
                max={3_600}
                value={countdown}
                onChange={(event) => setCountdown(Number(event.target.value))}
              />
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Condições de início
            </div>
            <div className="divide-y border-y">
              {readiness.checks.map((check) => (
                <div key={check.key} className="flex items-center gap-3 py-3 text-sm">
                  {check.ready ? (
                    <Check className="size-4 shrink-0 text-emerald-300" />
                  ) : (
                    <CircleAlert className="size-4 shrink-0 text-amber-300" />
                  )}
                  <span className={check.ready ? "" : "text-muted-foreground"}>{check.label}</span>
                </div>
              ))}
            </div>
          </div>
          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" disabled={busy} onClick={() => setDialogOpen(false)}>
              Voltar
            </Button>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              {draft ? (
                <Button variant="outline" disabled={busy} onClick={() => void save()}>
                  Salvar configuração
                </Button>
              ) : null}
              <Button
                disabled={busy || (draft !== null && !readiness.ready)}
                onClick={() => void begin()}
              >
                <Play />
                {busy ? "Processando…" : draft ? "Iniciar operação" : "Criar draft"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DraftStatusBand({
  data,
  draft,
  nowMs,
  mode,
  session,
}: {
  data: DraftData;
  draft: Draft;
  nowMs: number;
  mode: "admin" | "public";
  session: ApiAccountSession | null;
}) {
  const turn = activeTurn(draft);
  const overdue = overdueTurns(draft);
  const remaining = secondsUntil(turn?.deadlineAt, nowMs);

  return (
    <section className="overflow-hidden rounded-xl border bg-foreground text-background">
      <div className="grid min-h-36 gap-5 px-5 py-6 md:grid-cols-[1fr_auto] md:items-center sm:px-7">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase">
            <span>{draft.state === "live" ? "Draft ao vivo" : draftStateLabel(draft.state)}</span>
            {overdue.length ? (
              <Badge variant="destructive" className="bg-red-700 text-white">
                {overdue.length} escolhas atrasadas
              </Badge>
            ) : null}
          </div>
          {turn ? (
            <>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
                <h2 className="text-3xl font-semibold">{turn.team.name}</h2>
                <span className="text-sm opacity-70">
                  rodada {numberValue(turn.round)} · escolha {numberValue(turn.sequence)}
                </span>
              </div>
              <p className="mt-2 text-sm opacity-70">
                {roundDirection(numberValue(turn.round)) === "forward"
                  ? "Ordem de ida"
                  : "Ordem de volta"}{" "}
                na serpentina
              </p>
            </>
          ) : (
            <h2 className="mt-2 text-2xl font-semibold">
              {draft.state === "completed" ? "Draft encerrado" : "Aguardando início"}
            </h2>
          )}
        </div>
        <div className="min-w-44 border-l border-background/25 pl-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase opacity-70">
            {remaining === null ? <TimerOff className="size-4" /> : <Clock3 className="size-4" />}
            Tempo da escolha
          </div>
          <div className="mt-1 font-mono text-4xl font-semibold tabular-nums">
            {countdownLabel(remaining)}
          </div>
          <div className="mt-1 text-xs opacity-65">
            {session
              ? eligibleTurns(draft).length
                ? "Você pode escolher agora"
                : "Acompanhando em tempo real"
              : mode === "public"
                ? "Atualização automática"
                : data.championship.name}
          </div>
        </div>
      </div>
    </section>
  );
}

function DraftBoard({
  data,
  draft,
  nowMs,
  mode,
  adminView = false,
}: {
  data: DraftData;
  draft: Draft;
  nowMs: number;
  mode: "admin" | "public";
  adminView?: boolean;
}) {
  const capUnits = numberValue(data.championship.rules.salary.capUnits);
  const teams = [...draft.teams].sort(
    (left, right) => numberValue(left.position) - numberValue(right.position),
  );
  const rounds = [...new Set(draft.turns.items.map((turn) => numberValue(turn.round)))].sort(
    (left, right) => left - right,
  );
  const turnByRoundAndTeam = new Map(
    draft.turns.items.map((turn) => [`${turn.round}:${turn.team.uuid}`, turn]),
  );
  const completed = filledTurns(draft).length;
  const isLive = draft.state === "live";

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <Crown className="size-4 text-primary" />
            <h3 className="font-semibold">{adminView ? "Grade operacional" : "Quadro do draft"}</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {adminView
              ? "Confira a ordem, o estado de cada turno e o impacto atual no elenco de cada equipe."
              : "Uma coluna por equipe e uma linha por rodada. A ordem serpentina fica visível o tempo todo."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {completed} de {draft.turns.items.length} escolhas
          </Badge>
          {draft.turns.page.nextCursor ? (
            <Badge variant="outline">Mostrando rodadas recentes</Badge>
          ) : null}
        </div>
      </div>
      <div className="bfl-scrollbar overflow-x-auto">
        <div
          className="grid min-w-max"
          style={{ gridTemplateColumns: `repeat(${teams.length}, minmax(208px, 1fr))` }}
        >
          {teams.map((team, index) => {
            const gm = team.roster.find((member) => member.role === "gm");

            return (
              <div
                key={team.uuid}
                className={`min-w-52 border-b px-4 py-4 ${index ? "border-l" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <TeamSwatch colors={team.colors} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{team.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {gm ? `General Manager: ${gm.displayName}` : "Sem General Manager"}
                    </div>
                  </div>
                </div>
                {capUnits > 0 ? (
                  <>
                    <Progress
                      className="mt-3 h-1.5"
                      value={teamCapPercent(team, capUnits)}
                      aria-label={`Uso do teto de ${team.name}`}
                    />
                    <div
                      className={`mt-1 text-xs tabular-nums ${team.overCap ? "text-red-300" : "text-muted-foreground"}`}
                    >
                      {formatSalaryUnits(
                        numberValue(team.usageUnits),
                        data.championship.rules.salary.displayLabel,
                      )}{" "}
                      usados ·{" "}
                      {formatSalaryUnits(
                        numberValue(team.remainingUnits),
                        data.championship.rules.salary.displayLabel,
                      )}{" "}
                      livres
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-xs text-muted-foreground">
                    {numberValue(team.rosterSize)} no elenco
                  </div>
                )}
              </div>
            );
          })}
          {rounds.map((round) =>
            teams.map((team, index) => {
              const turn = turnByRoundAndTeam.get(`${round}:${team.uuid}`);
              const canPick = turn ? draft.actor.eligibleTurnIds.includes(turn.uuid) : false;
              const tone =
                turn?.state === "overdue"
                  ? "border-amber-500/50 bg-amber-500/5"
                  : turn?.state === "open"
                    ? "border-primary/60 bg-primary/5"
                    : "";

              return (
                <div
                  key={`${round}:${team.uuid}`}
                  className={`min-h-28 border-b px-4 py-3 ${index ? "border-l" : ""} ${tone}`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase text-muted-foreground">
                    <span>Rodada {round}</span>
                    {turn ? <span>#{numberValue(turn.sequence)}</span> : null}
                  </div>
                  {turn?.selectedParticipant ? (
                    <>
                      <div className="mt-3 truncate text-sm font-semibold">
                        {turn.selectedParticipant.displayName}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {turn.priceUnitsSnapshot === null
                          ? "Escolha confirmada"
                          : formatSalaryUnits(
                              numberValue(turn.priceUnitsSnapshot),
                              data.championship.rules.salary.displayLabel,
                            )}
                      </div>
                    </>
                  ) : turn ? (
                    <>
                      <div className="mt-3 text-sm font-medium">{turnStateLabel(turn.state)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {turn.state === "open" && turn.deadlineAt
                          ? countdownLabel(secondsUntil(turn.deadlineAt, nowMs))
                          : turn.state === "overdue"
                            ? "A escolha continua disponível"
                            : "Aguardando as escolhas anteriores"}
                      </div>
                      {isLive && canPick ? (
                        <Badge className="mt-3" variant="secondary">
                          {adminView
                            ? "Ação disponível"
                            : mode === "admin"
                              ? "Escolha disponível"
                              : "Sua escolha"}
                        </Badge>
                      ) : null}
                    </>
                  ) : (
                    <div className="mt-3 text-sm text-muted-foreground">Sem escolha</div>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
      <div className="border-t px-4 py-3 text-xs text-muted-foreground sm:px-6">
        {adminView
          ? isLive
            ? "A grade é atualizada automaticamente. Use o histórico abaixo para revisar uma escolha."
            : "A ordem e as escolhas confirmadas permanecem registradas para a organização."
          : isLive
            ? "Atualiza automaticamente enquanto o draft está ao vivo."
            : "A ordem e as escolhas confirmadas permanecem registradas neste quadro."}
      </div>
    </section>
  );
}

function PlayerPool({
  data,
  draft,
  mode,
  adminView = false,
  onProjection,
}: {
  data: DraftData;
  draft: Draft;
  session: ApiAccountSession | null;
  mode: "admin" | "public";
  adminView?: boolean;
  onProjection: (draft: DraftData["draft"]) => void;
}) {
  const pick = useServerFn(makeChampionshipDraftPickFn);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingPick, setPendingPick] = useState<DraftParticipant | null>(null);
  const available = useMemo(
    () => participantSearch(draft.availableParticipants.items, query),
    [draft.availableParticipants.items, query],
  );
  const eligible = eligibleTurns(draft);
  const targetTurn = eligible[0] ?? null;
  const targetTeam = targetTurn
    ? draft.teams.find((team) => team.uuid === targetTurn.team.uuid)
    : null;
  const capUnits = numberValue(data.championship.rules.salary.capUnits);

  async function choose(participant: DraftParticipant) {
    if (!targetTurn) {
      return;
    }
    setBusyId(participant.uuid);
    setMessage(null);
    const result = await pick({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft?.championshipRevision ?? data.championship.revision),
        expectedDraftRevision: numberValue(draft.revision),
        participantId: participant.uuid,
        teamId: targetTurn.team.uuid,
      },
    });
    setBusyId(null);
    if (!result.ok) {
      setMessage(
        result.code === "CONFLICT"
          ? "Outra escolha venceu esta disputa. O quadro foi atualizado."
          : result.message,
      );
      return;
    }
    onProjection(result.data);
    setPendingPick(null);
    toast.success(`${participant.displayName} foi escolhido.`);
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-end sm:px-5">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <UserPlus className="size-4 text-primary" />
            <h3 className="font-semibold">
              {adminView ? "Registro de escolha" : "Mesa de escolha"}
            </h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {targetTurn && targetTeam
              ? (adminView ? "Registrar para" : mode === "admin" ? "Escolha para" : "Sua vez: ") +
                targetTeam.name +
                " · rodada " +
                numberValue(targetTurn.round) +
                " · escolha #" +
                numberValue(targetTurn.sequence)
              : adminView
                ? "Selecione um participante e registre a próxima escolha da fila."
                : "Acompanhe as opções que continuam disponíveis."}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label={adminView ? "Buscar participante para registrar" : "Buscar jogador"}
            placeholder={adminView ? "Buscar participante" : "Buscar jogador"}
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>
      {targetTeam && targetTurn ? (
        <div className="border-b bg-muted/25 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{targetTeam.name}</span>
            <span>{numberValue(targetTeam.rosterSize)} no elenco</span>
            {capUnits > 0 ? (
              <span className={targetTeam.overCap ? "text-red-300" : ""}>
                {formatSalaryUnits(
                  numberValue(targetTeam.remainingUnits),
                  data.championship.rules.salary.displayLabel,
                )}{" "}
                livres
              </span>
            ) : null}
            {targetTurn.state === "overdue" ? (
              <span className="text-amber-300">Escolha atrasada, mas ainda válida</span>
            ) : null}
          </div>
        </div>
      ) : null}
      {message ? (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {available.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Nenhum jogador disponível corresponde à busca.
        </div>
      ) : (
        <div className="max-h-[560px] divide-y overflow-y-auto">
          {available.map((participant) => {
            const projection = targetTeam
              ? projectedTeamCap(targetTeam, participant, capUnits)
              : null;
            const cannotPick = !targetTurn || Boolean(projection?.overCap);

            return (
              <div
                key={participant.uuid}
                className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-2 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{participant.displayName}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span>
                      {participant.priceUnits === null
                        ? "Sem valor"
                        : formatSalaryUnits(
                            numberValue(participant.priceUnits),
                            data.championship.rules.salary.displayLabel,
                          )}
                    </span>
                    {projection && targetTeam ? (
                      <span className={projection.overCap ? "text-red-300" : ""}>
                        {targetTeam.name}: {projection.remainingUnits} restantes
                      </span>
                    ) : null}
                  </div>
                </div>
                {eligible.length ? (
                  <Button
                    size="sm"
                    variant={cannotPick ? "outline" : "default"}
                    disabled={cannotPick || busyId !== null}
                    onClick={() => setPendingPick(participant)}
                  >
                    <UserPlus />
                    {busyId === participant.uuid
                      ? adminView
                        ? "Registrando…"
                        : "Escolhendo…"
                      : adminView
                        ? "Registrar escolha"
                        : "Escolher"}
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground">Disponível</span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <Dialog open={pendingPick !== null} onOpenChange={(open) => !open && setPendingPick(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adminView ? "Registrar escolha para a equipe" : "Confirmar escolha"}
            </DialogTitle>
            <DialogDescription>
              {adminView
                ? "Confirme o participante, a equipe e o turno. O registro atualizará a grade operacional imediatamente."
                : "A escolha entra no quadro ao vivo imediatamente e não pode ser alterada sem uma correção da organização."}
            </DialogDescription>
          </DialogHeader>
          {pendingPick && targetTurn && targetTeam ? (
            <div className="space-y-3 border-y py-4 text-sm">
              <ImpactRow label="Jogador" value={pendingPick.displayName} />
              <ImpactRow label="Equipe" value={targetTeam.name} />
              <ImpactRow
                label="Escolha"
                value={`Rodada ${numberValue(targetTurn.round)} · #${numberValue(targetTurn.sequence)}`}
              />
              {capUnits > 0 ? (
                <ImpactRow
                  label="Teto após a escolha"
                  value={`${formatSalaryUnits(projectedTeamCap(targetTeam, pendingPick, capUnits).usageUnits, data.championship.rules.salary.displayLabel)} usados · ${formatSalaryUnits(projectedTeamCap(targetTeam, pendingPick, capUnits).remainingUnits, data.championship.rules.salary.displayLabel)} livres`}
                />
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              disabled={busyId !== null}
              onClick={() => setPendingPick(null)}
            >
              Voltar
            </Button>
            <Button
              disabled={!pendingPick || busyId !== null}
              onClick={() => pendingPick && void choose(pendingPick)}
            >
              <Check />
              {busyId ? "Confirmando…" : adminView ? "Registrar escolha" : "Confirmar escolha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function DraftFeed({
  data,
  draft,
  mode,
  adminView = false,
  canCancel,
  onCancel,
  onProjection,
}: {
  data: DraftData;
  draft: Draft;
  mode: "admin" | "public";
  adminView?: boolean;
  canCancel: boolean;
  onCancel: () => void;
  onProjection: (draft: DraftData["draft"]) => void;
}) {
  const preview = useServerFn(previewChampionshipDraftCorrectionFn);
  const reverse = useServerFn(reverseChampionshipDraftPickFn);
  const end = useServerFn(endChampionshipDraftFn);
  const [selected, setSelected] = useState<DraftTurn | null>(null);
  const [impact, setImpact] = useState<Awaited<ReturnType<typeof preview>> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const feed = filledTurns(draft);

  async function inspect(turn: DraftTurn) {
    setSelected(turn);
    setImpact(null);
    setImpact(
      await preview({
        data: { championshipUuid: data.championship.uuid, turnUuid: turn.uuid },
      }),
    );
  }

  async function confirmReverse() {
    if (!selected || !impact) {
      return;
    }
    setBusy(true);
    const result = await reverse({
      data: {
        championshipUuid: data.championship.uuid,
        turnUuid: selected.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft?.championshipRevision ?? data.championship.revision),
        expectedDraftRevision: numberValue(draft.revision),
        reason: "Correção confirmada após visualização do impacto",
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onProjection(result.data);
    setSelected(null);
  }

  async function finish() {
    setBusy(true);
    const result = await end({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft?.championshipRevision ?? data.championship.revision),
        expectedDraftRevision: numberValue(draft.revision),
        reason: "Encerrado pela organização",
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    onProjection(result.data);
  }

  return (
    <aside className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">
            {adminView ? "Histórico e correções" : "Linha do tempo"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {adminView
              ? "Revise escolhas, reabra um turno e acompanhe o registro operacional."
              : "Escolhas mais recentes primeiro"}
          </p>
        </div>
        <History className="size-4 text-muted-foreground" />
      </div>
      {message ? (
        <Alert variant="destructive" className="m-3">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="max-h-[540px] divide-y overflow-y-auto">
        {feed.length ? (
          feed.map((turn) => (
            <div key={turn.uuid} className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5 grid size-7 shrink-0 place-items-center border text-xs font-semibold">
                {numberValue(turn.sequence)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {turn.selectedParticipant?.displayName}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {turn.team.name} · rodada {numberValue(turn.round)}
                </div>
              </div>
              {mode === "admin" ? (
                <Button
                  variant="ghost"
                  size="icon"
                  title={adminView ? "Revisar impacto da escolha" : "Revisar e corrigir escolha"}
                  onClick={() => void inspect(turn)}
                >
                  <RotateCcw />
                </Button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {adminView
              ? "O histórico aparecerá aqui quando a primeira escolha for registrada."
              : "A primeira escolha aparecerá aqui."}
          </div>
        )}
      </div>
      {mode === "admin" && draft.state === "live" ? (
        <div className="grid gap-2 border-t p-3">
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => void finish()}
          >
            <Check />
            Encerrar draft
          </Button>
          {canCancel ? (
            <Button
              variant="outline"
              className="w-full border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/15 hover:text-destructive"
              disabled={busy}
              onClick={onCancel}
            >
              <Trash2 />
              Cancelar draft
            </Button>
          ) : null}
        </div>
      ) : null}
      <Dialog open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adminView ? "Revisar escolha do registro" : "Corrigir escolha"}
            </DialogTitle>
            <DialogDescription>
              {adminView
                ? "Confira o impacto no elenco e na fila antes de reabrir esta escolha."
                : "A escolha será reaberta imediatamente. Confira todo o impacto antes de confirmar."}
            </DialogDescription>
          </DialogHeader>
          {!impact ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Calculando impacto…
            </div>
          ) : (
            <div className="space-y-3 border-y py-4 text-sm">
              <ImpactRow label="Jogador" value={impact.participant?.displayName ?? "Sem jogador"} />
              <ImpactRow label="Equipe" value={impact.team.name} />
              <ImpactRow
                label="Teto após correção"
                value={`${numberValue(impact.team.usageAfterUnits)} usados · ${numberValue(
                  impact.team.remainingAfterUnits,
                )} restantes`}
              />
              <ImpactRow label="Nova situação" value={turnStateLabel(impact.reopenedState)} />
              {impact.reasons.map((reason) => (
                <Alert key={reason}>
                  <AlertDescription>{reason}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy || !impact?.canReverse}
              onClick={() => void confirmReverse()}
            >
              <RotateCcw />
              Reabrir escolha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function TradeDesk({
  data,
  draft,
  mode,
  session,
  adminView = false,
}: {
  data: DraftData;
  draft: Draft | null;
  mode: "admin" | "public";
  session: ApiAccountSession | null;
  adminView?: boolean;
}) {
  const createTrade = useServerFn(createChampionshipTradeFn);
  const accept = useServerFn(acceptChampionshipTradeFn);
  const reject = useServerFn(rejectChampionshipTradeFn);
  const cancel = useServerFn(cancelChampionshipTradeFn);
  const getTrades = useServerFn(getChampionshipTradesFn);
  const router = useRouter();
  const tradeTeams = useMemo<TradeTeamOption[]>(() => {
    if (draft) {
      return draft.teams.map((team) => ({
        uuid: team.uuid,
        name: team.name,
        roster: team.roster.map((member) => ({
          participantUuid: member.participantUuid,
          displayName: member.displayName,
          role: member.role,
        })),
      }));
    }

    return data.teams.items.map((team) => ({
      uuid: team.uuid,
      name: team.name,
      roster: data.participants.items.flatMap((participant) => {
        const membership = participant.activeMembership;
        if (!membership || membership.team.uuid !== team.uuid) {
          return [];
        }

        return [
          {
            participantUuid: participant.uuid,
            displayName: participant.displayName,
            role: membership.role,
          },
        ];
      }),
    }));
  }, [data.participants.items, data.teams.items, draft]);
  const gmTeamIds = useMemo(() => {
    if (draft) {
      return draft.actor.gmTeamIds;
    }

    if (!session) {
      return [];
    }

    return data.participants.items.flatMap((participant) => {
      if (
        participant.identity.kind !== "account" ||
        participant.identity.accountUuid !== session.account.uuid ||
        participant.activeMembership?.role !== "gm"
      ) {
        return [];
      }

      return [participant.activeMembership.team.uuid];
    });
  }, [data.participants.items, draft, session]);
  const proposingTeams =
    mode === "public" ? tradeTeams.filter((team) => gmTeamIds.includes(team.uuid)) : tradeTeams;
  const [fromTeamId, setFromTeamId] = useState(() => proposingTeams[0]?.uuid ?? "");
  const [toTeamId, setToTeamId] = useState(() => tradeTeams[1]?.uuid ?? "");
  const [fromPlayerId, setFromPlayerId] = useState("");
  const [toPlayerId, setToPlayerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [trades, setTrades] = useState(data.trades);
  const tradeWindowOpen =
    data.championship.tradeWindowState === "open" &&
    ["setup", "active"].includes(data.championship.lifecycle);

  useEffect(() => {
    if (!proposingTeams.some((team) => team.uuid === fromTeamId)) {
      setFromTeamId(proposingTeams[0]?.uuid ?? "");
      setFromPlayerId("");
    }
    if (!tradeTeams.some((team) => team.uuid === toTeamId) || toTeamId === fromTeamId) {
      setToTeamId(tradeTeams.find((team) => team.uuid !== fromTeamId)?.uuid ?? "");
      setToPlayerId("");
    }
  }, [fromTeamId, proposingTeams, toTeamId, tradeTeams]);

  useEffect(() => {
    setTrades(data.trades);
  }, [data.trades]);

  useEffect(() => {
    if (mode !== "public") {
      return;
    }

    void getTrades({
      data: {
        championshipUuid: data.championship.uuid,
        visibility: "involved",
        limit: 50,
      },
    })
      .then(setTrades)
      .catch(() => undefined);
  }, [data.championship.uuid, getTrades, mode]);

  async function refreshTrades() {
    if (mode !== "public") {
      return;
    }

    setTrades(
      await getTrades({
        data: {
          championshipUuid: data.championship.uuid,
          visibility: "involved",
          limit: 50,
        },
      }),
    );
  }

  async function propose() {
    if (!tradeWindowOpen) {
      setMessage("A janela de trocas está encerrada pela organização.");
      return;
    }

    if (!fromPlayerId || !toPlayerId) {
      setMessage("Selecione um jogador de cada equipe.");
      return;
    }
    setBusy(true);
    const result = await createTrade({
      data: {
        championshipUuid: data.championship.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft?.championshipRevision ?? data.championship.revision),
        proposingTeamId: fromTeamId,
        receivingTeamId: toTeamId,
        proposingParticipantIds: [fromPlayerId],
        receivingParticipantIds: [toPlayerId],
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await refreshTrades();
    await router.invalidate();
  }

  async function decide(trade: TradeProjection, action: "accept" | "reject" | "cancel") {
    setBusy(true);
    const fn = action === "accept" ? accept : action === "reject" ? reject : cancel;
    const result = await fn({
      data: {
        championshipUuid: data.championship.uuid,
        tradeUuid: trade.uuid,
        commandUuid: crypto.randomUUID(),
        expectedRevision: numberValue(draft?.championshipRevision ?? data.championship.revision),
        expectedTradeRevision: numberValue(trade.revision),
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    await refreshTrades();
    await router.invalidate();
  }

  const canTrade = mode === "admin" || gmTeamIds.length > 0;

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="size-4 text-primary" />
            <h3 className="font-semibold">
              {adminView ? "Operação de trocas" : "Central de trocas"}
            </h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {adminView
              ? "Acompanhe propostas, decisões e impacto no elenco antes da confirmação."
              : "Valores congelados e impacto no teto são revalidados na confirmação."}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Badge
            variant="outline"
            className={
              tradeWindowOpen
                ? "border-emerald-500/50 text-emerald-300"
                : "border-amber-500/50 text-amber-200"
            }
          >
            {tradeWindowOpen ? "Janela aberta" : "Janela encerrada"}
          </Badge>
          <Badge variant="outline">{trades.items.length} negociações visíveis</Badge>
        </div>
      </div>
      {canTrade ? (
        tradeWindowOpen ? (
          <div className="grid gap-3 border-b px-4 py-4 lg:grid-cols-[1fr_1fr_auto] sm:px-6">
            <TradeSide
              label="Equipe que propõe"
              teamId={fromTeamId}
              playerId={fromPlayerId}
              teams={proposingTeams}
              onTeam={setFromTeamId}
              onPlayer={setFromPlayerId}
            />
            <TradeSide
              label="Equipe que recebe"
              teamId={toTeamId}
              playerId={toPlayerId}
              teams={tradeTeams.filter((team) => team.uuid !== fromTeamId)}
              onTeam={setToTeamId}
              onPlayer={setToPlayerId}
            />
            <Button className="self-end" disabled={busy} onClick={() => void propose()}>
              <ArrowLeftRight />
              Propor troca
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 border-b px-4 py-4 text-sm text-muted-foreground sm:px-6">
            <TimerOff className="size-4 text-amber-300" />
            A organização encerrou a janela. As propostas existentes continuam disponíveis no
            histórico.
          </div>
        )
      ) : null}
      {message ? (
        <Alert variant="destructive" className="m-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="divide-y">
        {trades.items.length ? (
          trades.items.map((trade) => {
            const balance = tradeBalance(trade);

            return (
              <div
                key={trade.uuid}
                className="grid gap-4 px-4 py-4 lg:grid-cols-[1fr_auto_1fr_auto] lg:items-center sm:px-6"
              >
                <TradeTeam
                  name={trade.proposingTeam.name}
                  players={trade.items.filter(
                    (item) => item.fromTeamUuid === trade.proposingTeam.uuid,
                  )}
                  value={balance.proposing}
                />
                <ArrowLeftRight className="hidden size-4 text-muted-foreground lg:block" />
                <TradeTeam
                  name={trade.receivingTeam.name}
                  players={trade.items.filter(
                    (item) => item.fromTeamUuid === trade.receivingTeam.uuid,
                  )}
                  value={balance.receiving}
                />
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Badge
                    variant="outline"
                    className={
                      trade.state === "accepted"
                        ? "border-emerald-500/50 text-emerald-300"
                        : trade.state === "proposed"
                          ? "border-amber-500/50 text-amber-200"
                          : ""
                    }
                  >
                    {tradeStateLabel(trade.state)}
                  </Badge>
                  {trade.actorActions.canAccept && tradeWindowOpen ? (
                    <Button size="sm" disabled={busy} onClick={() => void decide(trade, "accept")}>
                      <Check />
                      Aceitar
                    </Button>
                  ) : null}
                  {trade.actorActions.canReject ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Recusar troca"
                      disabled={busy}
                      onClick={() => void decide(trade, "reject")}
                    >
                      <X />
                    </Button>
                  ) : null}
                  {trade.actorActions.canCancel ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Cancelar proposta"
                      disabled={busy}
                      onClick={() => void decide(trade, "cancel")}
                    >
                      <X />
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            {adminView
              ? "Nenhuma negociação foi registrada nesta edição."
              : "Nenhuma troca concluída ou aguardando sua equipe."}
          </div>
        )}
      </div>
    </section>
  );
}

function TradeSide({
  label,
  teamId,
  playerId,
  teams,
  onTeam,
  onPlayer,
}: {
  label: string;
  teamId: string;
  playerId: string;
  teams: TradeTeamOption[];
  onTeam: (value: string) => void;
  onPlayer: (value: string) => void;
}) {
  const team = teams.find((item) => item.uuid === teamId);
  const teamSelectId = useId();
  const playerSelectId = useId();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label htmlFor={teamSelectId}>{label}</Label>
        <NativeSelect
          id={teamSelectId}
          value={teamId}
          onChange={(event) => {
            onTeam(event.target.value);
            onPlayer("");
          }}
        >
          {teams.map((item) => (
            <NativeSelectOption key={item.uuid} value={item.uuid}>
              {item.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={playerSelectId}>Jogador</Label>
        <EntityPicker
          id={playerSelectId}
          value={playerId}
          onValueChange={onPlayer}
          ariaLabel={`Jogador de ${team?.name ?? label}`}
          placeholder="Selecionar jogador"
          searchPlaceholder="Buscar jogador da equipe…"
          emptyLabel="Nenhum jogador elegível nesta equipe."
          options={
            team?.roster
              .filter((member) => member.role === "player")
              .map((member) => ({
                value: member.participantUuid,
                label: member.displayName,
              })) ?? []
          }
        />
      </div>
    </div>
  );
}

function TradeTeam({
  name,
  players,
  value,
}: {
  name: string;
  players: TradeProjection["items"];
  value: number;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <Shield className="size-4 text-muted-foreground" />
        <span className="truncate text-sm font-semibold">{name}</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{value}</span>
      </div>
      <div className="mt-1 truncate text-xs text-muted-foreground">
        {players.map((item) => item.participant.displayName).join(", ")}
      </div>
    </div>
  );
}

function DraftEmptyState() {
  return (
    <div className="bfl-panel rounded-xl border px-6 py-16 text-center">
      <Crown className="mx-auto size-7 text-muted-foreground" />
      <h2 className="mt-3 font-semibold">Draft ainda não configurado</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A ordem pública aparecerá aqui quando a organização preparar o evento.
      </p>
    </div>
  );
}

function TeamSwatch({ colors }: { colors: string[] | null | undefined }) {
  return (
    <span
      className="size-7 shrink-0 border"
      style={{
        background:
          colors && colors.length > 1
            ? `linear-gradient(135deg, ${colors[0]} 0 50%, ${colors[1]} 50%)`
            : (colors?.[0] ?? "#64748b"),
      }}
    />
  );
}

function ImpactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function draftStateLabel(state: Draft["state"]) {
  return {
    setup: "Em preparação",
    live: "Ao vivo",
    completed: "Encerrado",
    canceled: "Cancelado",
  }[state];
}

function tradeStateLabel(state: TradeProjection["state"]) {
  return {
    proposed: "Aguardando",
    accepted: "Aceita",
    rejected: "Recusada",
    canceled: "Cancelada",
    expired: "Expirada",
  }[state];
}
