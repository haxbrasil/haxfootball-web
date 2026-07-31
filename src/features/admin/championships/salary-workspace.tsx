import {
  useEffect,
  useId,
  useMemo,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { ChampionshipRosterMovePreview } from "@haxbrasil/haxfootball-api-sdk";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRightLeft,
  BadgeDollarSign,
  Check,
  CircleAlert,
  CircleDollarSign,
  History,
  LockKeyhole,
  MoveRight,
  Plus,
  Save,
  Search,
  ShieldAlert,
  UserRoundPlus,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "#/components/ui/alert";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Checkbox } from "#/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Progress } from "#/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Textarea } from "#/components/ui/textarea";
import type { ChampionshipWorkspaceData } from "#/server/api/championship-api";
import { formatSalaryUnits } from "#/features/championships/salary-format";
import {
  createChampionshipParticipantFn,
  executeChampionshipRosterMoveFn,
  freezeChampionshipPricesFn,
  getChampionshipSalaryWorkspacePageFn,
  previewChampionshipRosterMoveFn,
  searchChampionshipAccountsFn,
  transitionChampionshipRegistrationFn,
  updateChampionshipParticipantFn,
  upsertChampionshipPricesFn,
} from "#/server/api/championship-functions";
import {
  parsePastedSalaryValues,
  salaryCapPercentage,
  simulateSalarySwap,
} from "./salary-workspace-model";

type SalaryParticipant = ChampionshipWorkspaceData["salary"]["participants"]["items"][number];
type SalaryTeam = ChampionshipWorkspaceData["salary"]["teams"]["items"][number];
type RosterMoveRequest = {
  participant: SalaryParticipant;
  targetTeamId: string | null;
  role: "gm" | "player";
};

export function SalaryWorkspace({
  data,
  isAdmin,
}: {
  data: ChampionshipWorkspaceData;
  isAdmin: boolean;
}) {
  const [moveRequest, setMoveRequest] = useState<RosterMoveRequest | null>(null);
  const salary = data.salary;

  return (
    <div className="space-y-7">
      <SalaryWorkspaceHeading data={data} isAdmin={isAdmin} />

      {!salary.enabled ? (
        <Alert>
          <CircleDollarSign />
          <AlertTitle>Teto salarial desativado</AlertTitle>
          <AlertDescription>
            A edição ainda pode usar inscrições e montagem manual de elencos. Ative o teto nas
            regras antes da primeira movimentação de elenco para usar valores e projeções.
          </AlertDescription>
        </Alert>
      ) : null}

      <RegistrationBand data={data} isAdmin={isAdmin} />
      <ValuationGrid data={data} isAdmin={isAdmin} onMoveRequest={setMoveRequest} />
      <TeamCapComparison data={data} onMoveRequest={setMoveRequest} />
      <TradeSimulation data={data} />
      <RosterHistory data={data} />

      <RosterMoveDialog
        data={data}
        request={moveRequest}
        onOpenChange={(open) => {
          if (!open) setMoveRequest(null);
        }}
      />
    </div>
  );
}

function SalaryWorkspaceHeading({
  data,
  isAdmin,
}: {
  data: ChampionshipWorkspaceData;
  isAdmin: boolean;
}) {
  const salary = data.salary;
  const locked = salary.priceState === "locked";

  return (
    <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">Participantes e teto salarial</h2>
          <Badge variant={locked ? "default" : "outline"}>
            {locked ? <LockKeyhole className="mr-1 size-3" /> : null}
            {salary.priceState === "disabled"
              ? "Sem teto"
              : locked
                ? "Valores congelados"
                : "Valores editáveis"}
          </Badge>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Inscrições, avaliação, composição de elencos e conformidade financeira em uma única
          operação revisionada.
        </p>
      </div>
      <div className="grid grid-cols-3 divide-x border bg-card/45 text-center">
        <Metric
          label="Inscritos"
          value={data.participants.items.filter(({ status }) => status === "active").length}
        />
        <Metric label="Teto" value={formatSalaryUnits(salary.capUnits, salary.displayLabel)} />
        <Metric
          label="Pendências"
          value={salary.validation.missingPriceCount}
          danger={numberValue(salary.validation.missingPriceCount) > 0}
        />
      </div>
      {!isAdmin ? (
        <span className="text-xs text-muted-foreground">Visualização operacional</span>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  danger = false,
}: {
  label: string;
  value: number | string;
  danger?: boolean;
}) {
  return (
    <div className="min-w-24 px-4 py-2">
      <div className="text-[11px] uppercase text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-semibold tabular-nums ${danger ? "text-amber-300" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function RegistrationBand({
  data,
  isAdmin,
}: {
  data: ChampionshipWorkspaceData;
  isAdmin: boolean;
}) {
  const transition = useServerFn(transitionChampionshipRegistrationFn);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const state = data.championship.registrationState;

  async function changeRegistration() {
    setBusy(true);
    setMessage(null);

    try {
      const result = await transition({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          operation: state === "open" ? "close" : "open",
          reason:
            state === "open"
              ? "Encerramento das inscrições pela área salarial"
              : "Abertura das inscrições pela área salarial",
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center">
        <div
          className={`grid size-10 shrink-0 place-items-center border ${
            state === "open"
              ? "border-primary/50 bg-primary/10 text-primary"
              : "text-muted-foreground"
          }`}
        >
          <UserRoundPlus className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">Inscrições</h3>
            <Badge variant="outline">
              {state === "open" ? "Abertas" : state === "closed" ? "Encerradas" : "Não abertas"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {state === "open"
              ? "Jogadores autenticados podem se inscrever pela página pública."
              : "A organização ainda pode incluir uma conta manualmente com justificativa."}
          </p>
          {message ? <p className="mt-2 text-xs text-red-300">{message}</p> : null}
        </div>
        {isAdmin ? (
          <div className="flex gap-2">
            <AccountRegistrationDialog data={data} />
            <Button variant="outline" disabled={busy} onClick={() => void changeRegistration()}>
              {state === "open" ? <LockKeyhole /> : <UserRoundPlus />}
              {state === "open" ? "Encerrar" : "Abrir inscrições"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AccountRegistrationDialog({ data }: { data: ChampionshipWorkspaceData }) {
  const createParticipant = useServerFn(createChampionshipParticipantFn);
  const searchAccounts = useServerFn(searchChampionshipAccountsFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState(data.accounts.items);
  const [query, setQuery] = useState("");
  const [selectedAccountUuid, setSelectedAccountUuid] = useState("");
  const [busy, setBusy] = useState(false);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const registered = new Set(
    data.participants.items.flatMap(({ identity }) =>
      identity.kind === "account" ? [identity.accountUuid] : [],
    ),
  );
  const availableAccounts = accounts.filter(({ uuid }) => !registered.has(uuid));

  useEffect(() => {
    if (!open) return;

    let active = true;
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      try {
        const result = await searchAccounts({
          data: { search: query.trim() || undefined, limit: 20 },
        });
        if (active) setAccounts(result.items);
      } catch (error) {
        if (active) setMessage(messageFor(error));
      } finally {
        if (active) setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [open, query, searchAccounts]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const accountUuid = selectedAccountUuid;

    if (!accountUuid) {
      setMessage("Selecione uma conta.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const rawPrice = String(form.get("priceUnits") ?? "").trim();
      const result = await createParticipant({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          accountUuid,
          status: "active",
          priceUnits: rawPrice ? Number(rawPrice) : undefined,
          reason: String(form.get("reason") ?? "").trim() || undefined,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      setQuery("");
      setSelectedAccountUuid("");
      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Incluir conta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Inscrição pela organização</DialogTitle>
          <DialogDescription>
            Use para correções, substituições e inscrições autorizadas fora da janela pública.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          {message ? <InlineError message={message} /> : null}
          <div className="space-y-2">
            <Label htmlFor="accountSearch">Conta</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="accountSearch"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setMessage(null);
                }}
                className="pl-9"
                placeholder="Digite o nome da conta"
                autoComplete="off"
              />
            </div>
            <div
              className="bfl-scrollbar max-h-56 overflow-y-auto border"
              role="radiogroup"
              aria-label="Contas encontradas"
              aria-busy={searching}
            >
              {searching ? (
                <p className="px-3 py-5 text-center text-sm text-muted-foreground">Buscando…</p>
              ) : availableAccounts.length > 0 ? (
                availableAccounts.map((account) => {
                  const selected = selectedAccountUuid === account.uuid;
                  return (
                    <label
                      key={account.uuid}
                      className={`flex w-full cursor-pointer items-center justify-between border-b px-3 py-2.5 text-left text-sm last:border-b-0 hover:bg-muted/60 has-focus-visible:ring-2 has-focus-visible:ring-ring ${
                        selected ? "bg-primary/10 text-foreground" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountUuid"
                        value={account.uuid}
                        aria-label={`Selecionar ${account.name}`}
                        checked={selected}
                        onChange={() => {
                          setSelectedAccountUuid(account.uuid);
                          setMessage(null);
                        }}
                        className="sr-only"
                      />
                      <span className="font-medium">{account.name}</span>
                      {selected ? <Check className="size-4 text-primary" /> : null}
                    </label>
                  );
                })
              ) : (
                <p className="px-3 py-5 text-center text-sm text-muted-foreground">
                  Nenhuma conta disponível encontrada.
                </p>
              )}
            </div>
          </div>
          {data.championship.priceState === "locked" ? (
            <div className="space-y-2">
              <Label htmlFor="latePrice">Valor congelado</Label>
              <Input id="latePrice" name="priceUnits" type="number" min={0} required />
              <p className="text-xs text-muted-foreground">
                Este é o único momento em que o valor desta inscrição tardia poderá ser definido.
              </p>
            </div>
          ) : null}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="registrationReason">Justificativa</Label>
              <span className="text-xs text-muted-foreground">Opcional</span>
            </div>
            <Textarea
              id="registrationReason"
              name="reason"
              placeholder="Adicione um motivo à auditoria, se necessário"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !selectedAccountUuid}>
              {busy ? "Incluindo…" : "Confirmar inscrição"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ValuationGrid({
  data,
  isAdmin,
  onMoveRequest,
}: {
  data: ChampionshipWorkspaceData;
  isAdmin: boolean;
  onMoveRequest: (request: RosterMoveRequest) => void;
}) {
  const savePrices = useServerFn(upsertChampionshipPricesFn);
  const loadPage = useServerFn(getChampionshipSalaryWorkspacePageFn);
  const router = useRouter();
  const [participants, setParticipants] = useState(data.salary.participants.items);
  const [nextCursor, setNextCursor] = useState(data.salary.participants.page.nextCursor);
  const [dirty, setDirty] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [missingOnly, setMissingOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const editable = isAdmin && data.salary.enabled && data.salary.priceState === "editable";

  useEffect(() => {
    setParticipants(data.salary.participants.items);
    setNextCursor(data.salary.participants.page.nextCursor);
    setDirty({});
  }, [data.salary.participants]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");

    return participants.filter((participant) => {
      const value = dirty[participant.uuid] ?? participant.priceUnits;

      return (
        (!normalized || participant.displayName.toLocaleLowerCase("pt-BR").includes(normalized)) &&
        (!missingOnly || value === null)
      );
    });
  }, [dirty, missingOnly, participants, query]);

  function updatePrice(participant: SalaryParticipant, rawValue: string) {
    if (!editable) return;
    const price = Number(rawValue);

    if (!Number.isInteger(price) || price < 0) return;
    setDirty((current) => ({ ...current, [participant.uuid]: price }));
  }

  function pastePrices(index: number, event: ClipboardEvent<HTMLInputElement>) {
    if (!editable) return;
    const values = parsePastedSalaryValues(event.clipboardData.getData("text"));

    if (values.length <= 1) return;
    event.preventDefault();
    setDirty((current) => {
      const next = { ...current };

      values.forEach((value, offset) => {
        const participant = visible[index + offset];
        if (participant) next[participant.uuid] = value;
      });

      return next;
    });
  }

  function movePriceFocus(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    document.querySelector<HTMLInputElement>(`[data-price-index="${index + 1}"]`)?.focus();
  }

  async function save() {
    const prices = Object.entries(dirty).map(([participantId, priceUnits]) => ({
      participantId,
      priceUnits,
    }));

    if (prices.length === 0) return;
    setBusy(true);
    setMessage(null);

    try {
      const result = await savePrices({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          prices,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);

    try {
      const page = await loadPage({
        data: {
          championshipUuid: data.championship.uuid,
          participantCursor: nextCursor,
          participantLimit: 100,
          teamLimit: 1,
        },
      });
      setParticipants((current) => [...current, ...page.participants.items]);
      setNextCursor(page.participants.page.nextCursor);
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex flex-col gap-3 border-b px-4 py-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="grid size-9 place-items-center rounded-md border text-primary">
            <BadgeDollarSign className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold">Tabela de avaliação</h3>
            <p className="text-xs text-muted-foreground">
              Cole uma coluna de valores ou navegue pelas células com Enter.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-52 pl-8"
              placeholder="Filtrar participante"
            />
          </div>
          <label
            htmlFor="missing-prices-only"
            className="flex h-9 items-center gap-2 border px-3 text-sm"
          >
            <Checkbox
              id="missing-prices-only"
              checked={missingOnly}
              onCheckedChange={(checked) => setMissingOnly(checked === true)}
            />
            Sem valor
          </label>
          {isAdmin ? <FreezePricesDialog data={data} /> : null}
          <Button disabled={!editable || Object.keys(dirty).length === 0 || busy} onClick={save}>
            <Save />
            Salvar {Object.keys(dirty).length || ""}
          </Button>
        </div>
      </div>

      {message ? <div className="border-b px-4 py-3 text-sm text-red-300">{message}</div> : null}
      {numberValue(data.salary.validation.missingPriceCount) > 0 ? (
        <div className="flex items-center gap-2 border-b bg-amber-400/5 px-4 py-2 text-xs text-amber-200">
          <CircleAlert className="size-4" />
          {data.salary.validation.missingPriceCount} participante(s) ativo(s) ainda sem valor.
        </div>
      ) : null}

      <div className="divide-y sm:hidden">
        {visible.map((participant, index) => {
          const currentValue = dirty[participant.uuid] ?? participant.priceUnits;

          return (
            <article key={participant.uuid} className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs tabular-nums text-muted-foreground">#{index + 1}</div>
                  <div className="truncate font-medium">{participant.displayName}</div>
                  <div className="text-xs text-muted-foreground">
                    {participant.membership?.role === "gm"
                      ? "GM"
                      : participant.membership
                        ? "Jogador"
                        : "Disponível"}
                  </div>
                </div>
                <ParticipantStatusControl data={data} participant={participant} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[11px] uppercase text-muted-foreground">Elenco atual</div>
                  <div className="mt-1 text-sm">
                    {participant.membership?.teamName ?? "Sem equipe"}
                  </div>
                </div>
                <label>
                  <span className="text-[11px] uppercase text-muted-foreground">
                    Valor ({data.salary.displayLabel})
                  </span>
                  <Input
                    data-price-index={index}
                    type="number"
                    min={0}
                    value={currentValue ?? ""}
                    disabled={!editable}
                    aria-label={`Valor de ${participant.displayName}`}
                    className={`mt-1 text-right tabular-nums ${
                      currentValue === null ? "border-amber-400/60" : ""
                    }`}
                    onChange={(event) => updatePrice(participant, event.target.value)}
                    onPaste={(event) => pastePrices(index, event)}
                    onKeyDown={(event) => movePriceFocus(index, event)}
                  />
                </label>
              </div>
              <div>
                <div className="mb-1 text-[11px] uppercase text-muted-foreground">
                  Nova alocação
                </div>
                <RosterTargetControl
                  participant={participant}
                  teams={data.salary.teams.items}
                  disabled={!isAdmin}
                  onRequest={onMoveRequest}
                />
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden max-h-[560px] overflow-auto sm:block">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Elenco</TableHead>
              <TableHead className="w-40 text-right">Valor ({data.salary.displayLabel})</TableHead>
              <TableHead className="w-64">Alocação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((participant, index) => {
              const currentValue = dirty[participant.uuid] ?? participant.priceUnits;

              return (
                <TableRow
                  key={participant.uuid}
                  draggable={isAdmin}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/championship-participant", participant.uuid);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <TableCell className="text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{participant.displayName}</div>
                    <div className="text-xs text-muted-foreground">
                      {participant.membership?.role === "gm"
                        ? "GM"
                        : participant.membership
                          ? "Jogador"
                          : "Disponível"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ParticipantStatusControl data={data} participant={participant} />
                  </TableCell>
                  <TableCell>
                    {participant.membership ? (
                      <span className="text-sm">{participant.membership.teamName}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sem equipe</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      data-price-index={index}
                      type="number"
                      min={0}
                      value={currentValue ?? ""}
                      disabled={!editable}
                      aria-label={`Valor de ${participant.displayName}`}
                      className={`ml-auto w-28 text-right tabular-nums ${
                        currentValue === null ? "border-amber-400/60" : ""
                      }`}
                      onChange={(event) => updatePrice(participant, event.target.value)}
                      onPaste={(event) => pastePrices(index, event)}
                      onKeyDown={(event) => movePriceFocus(index, event)}
                    />
                  </TableCell>
                  <TableCell>
                    <RosterTargetControl
                      participant={participant}
                      teams={data.salary.teams.items}
                      disabled={!isAdmin}
                      onRequest={onMoveRequest}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {nextCursor ? (
        <div className="flex justify-center border-t p-3">
          <Button variant="outline" disabled={loadingMore} onClick={() => void loadMore()}>
            {loadingMore ? "Carregando…" : "Carregar mais participantes"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function ParticipantStatusControl({
  data,
  participant,
}: {
  data: ChampionshipWorkspaceData;
  participant: SalaryParticipant;
}) {
  const updateStatus = useServerFn(updateChampionshipParticipantFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const result = await updateStatus({
        data: {
          championshipUuid: data.championship.uuid,
          participantUuid: participant.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          status: String(form.get("status")) as
            | "pending"
            | "active"
            | "withdrawn"
            | "ineligible"
            | "removed",
          reason: String(form.get("reason") ?? "").trim(),
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {statusLabel(participant.status)}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar situação de {participant.displayName}</DialogTitle>
          <DialogDescription>
            Participantes em um elenco devem ser removidos antes de ficarem inativos.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          {message ? <InlineError message={message} /> : null}
          <div className="space-y-2">
            <Label htmlFor={`status-${participant.uuid}`}>Situação</Label>
            <NativeSelect
              id={`status-${participant.uuid}`}
              name="status"
              defaultValue={participant.status}
            >
              <NativeSelectOption value="pending">Pendente</NativeSelectOption>
              <NativeSelectOption value="active">Ativo</NativeSelectOption>
              <NativeSelectOption value="withdrawn">Desistente</NativeSelectOption>
              <NativeSelectOption value="ineligible">Inapto</NativeSelectOption>
              <NativeSelectOption value="removed">Removido</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`status-reason-${participant.uuid}`}>Justificativa</Label>
            <Textarea id={`status-reason-${participant.uuid}`} name="reason" required />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy}>
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FreezePricesDialog({ data }: { data: ChampionshipWorkspaceData }) {
  const freeze = useServerFn(freezeChampionshipPricesFn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const validation = data.salary.validation;
  const frozen = data.salary.priceState === "locked";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const result = await freeze({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          reason: String(form.get("reason") ?? "").trim() || undefined,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      setOpen(false);
      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={frozen || !data.salary.enabled}>
          <LockKeyhole />
          {frozen ? "Congelados" : "Congelar"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Congelar valores da edição</DialogTitle>
          <DialogDescription>
            Depois desta ação, valores existentes não poderão ser alterados e toda movimentação
            passará pelo teto salarial.
          </DialogDescription>
        </DialogHeader>
        <div className="divide-y border text-sm">
          <ReadinessRow
            ok={data.championship.registrationState === "closed"}
            label="Inscrições encerradas"
          />
          <ReadinessRow
            ok={numberValue(validation.missingPriceCount) === 0}
            label={
              numberValue(validation.missingPriceCount) === 0
                ? "Todos os participantes possuem valor"
                : `${validation.missingPriceCount} participante(s) sem valor`
            }
          />
          <ReadinessRow ok={data.salary.teams.items.length > 0} label="Equipes configuradas" />
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {message ? <InlineError message={message} /> : null}
          <div className="space-y-2">
            <Label htmlFor="freezeReason">Nota de publicação</Label>
            <Textarea id="freezeReason" name="reason" placeholder="Opcional, fica na auditoria" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!validation.canFreeze || busy}>
              <LockKeyhole />
              Congelar e publicar valores
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReadinessRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      {ok ? (
        <Check className="size-4 text-emerald-300" />
      ) : (
        <CircleAlert className="size-4 text-amber-300" />
      )}
      <span>{label}</span>
    </div>
  );
}

function RosterTargetControl({
  participant,
  teams,
  disabled,
  onRequest,
}: {
  participant: SalaryParticipant;
  teams: SalaryTeam[];
  disabled: boolean;
  onRequest: (request: RosterMoveRequest) => void;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] gap-2 sm:flex">
      <NativeSelect
        className="w-full min-w-0 sm:min-w-32"
        value={participant.membership?.teamUuid ?? ""}
        disabled={disabled || participant.status !== "active"}
        aria-label={`Equipe de ${participant.displayName}`}
        onChange={(event) =>
          onRequest({
            participant,
            targetTeamId: event.target.value || null,
            role: participant.membership?.role ?? "player",
          })
        }
      >
        <NativeSelectOption value="">Sem equipe</NativeSelectOption>
        {teams.map((team) => (
          <NativeSelectOption key={team.uuid} value={team.uuid}>
            {team.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      {participant.membership ? (
        <NativeSelect
          className="w-full min-w-0 sm:min-w-28"
          value={participant.membership.role}
          disabled={disabled}
          aria-label={`Função de ${participant.displayName}`}
          onChange={(event) =>
            onRequest({
              participant,
              targetTeamId: participant.membership!.teamUuid,
              role: event.target.value as "gm" | "player",
            })
          }
        >
          <NativeSelectOption value="player">Jogador</NativeSelectOption>
          <NativeSelectOption value="gm">GM</NativeSelectOption>
        </NativeSelect>
      ) : null}
    </div>
  );
}

function TeamCapComparison({
  data,
  onMoveRequest,
}: {
  data: ChampionshipWorkspaceData;
  onMoveRequest: (request: RosterMoveRequest) => void;
}) {
  const participants = data.salary.participants.items;
  const unassigned = participants.filter(
    ({ membership, status }) => !membership && status === "active",
  );

  function dropOnTeam(teamUuid: string | null, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const participantUuid = event.dataTransfer.getData("text/championship-participant");
    const participant = participants.find(({ uuid }) => uuid === participantUuid);

    if (!participant) return;
    onMoveRequest({
      participant,
      targetTeamId: teamUuid,
      role: participant.membership?.role ?? "player",
    });
  }

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Comparação de equipes</h3>
          <p className="text-xs text-muted-foreground">
            Arraste participantes entre as colunas ou use os seletores da tabela.
          </p>
        </div>
        <Badge variant="outline">{data.salary.teams.items.length} equipes</Badge>
      </div>
      <div className="grid gap-3 sm:flex sm:snap-x sm:overflow-x-auto sm:pb-2">
        <RosterColumn
          title="Disponíveis"
          subtitle={`${unassigned.length} participante(s)`}
          participants={unassigned}
          onDrop={(event) => dropOnTeam(null, event)}
        />
        {data.salary.teams.items.map((team) => {
          const teamParticipants = participants.filter(
            ({ membership }) => membership?.teamUuid === team.uuid,
          );

          return (
            <div
              key={team.uuid}
              className={`w-full border bg-card/45 sm:w-72 sm:shrink-0 sm:snap-start ${
                team.overCap ? "border-red-400/60" : ""
              }`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => dropOnTeam(team.uuid, event)}
            >
              <div className="border-b p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{team.name}</div>
                    <div className="text-xs text-muted-foreground">
                      elenco r{team.rosterRevision} · {team.rosterSize} pessoas
                    </div>
                  </div>
                  {team.approvedOverCap ? (
                    <Badge variant="destructive" className="bg-red-800 text-white">
                      Exceção
                    </Badge>
                  ) : team.overCap ? (
                    <ShieldAlert className="size-5 text-red-300" />
                  ) : (
                    <Check className="size-5 text-emerald-300" />
                  )}
                </div>
                <Progress
                  aria-label={`Uso do teto salarial de ${team.name}`}
                  value={Math.min(100, salaryCapPercentage(team.usageUnits, data.salary.capUnits))}
                  className={`mt-3 ${team.overCap ? "[&_[data-slot=progress-indicator]]:bg-red-400" : ""}`}
                />
                <div className="mt-2 flex justify-between text-xs tabular-nums">
                  <span>
                    {formatSalaryUnits(team.usageUnits, data.salary.displayLabel)} /{" "}
                    {formatSalaryUnits(data.salary.capUnits, data.salary.displayLabel)}
                  </span>
                  <span
                    className={
                      numberValue(team.remainingUnits) < 0
                        ? "text-red-300"
                        : "text-muted-foreground"
                    }
                  >
                    {numberValue(team.remainingUnits) >= 0
                      ? `${team.remainingUnits} livres`
                      : `${-numberValue(team.remainingUnits)} acima`}
                  </span>
                </div>
              </div>
              <div className="min-h-32 divide-y">
                {teamParticipants.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">Solte um participante aqui.</p>
                ) : (
                  teamParticipants.map((participant) => (
                    <RosterPerson key={participant.uuid} participant={participant} />
                  ))
                )}
              </div>
              {team.activeException ? (
                <div className="border-t bg-red-400/5 px-4 py-3 text-xs">
                  <div className="font-medium text-red-200">Exceção aprovada</div>
                  <div className="mt-1 text-muted-foreground">
                    Expira na próxima alteração do elenco.
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RosterColumn({
  title,
  subtitle,
  participants,
  onDrop,
}: {
  title: string;
  subtitle: string;
  participants: SalaryParticipant[];
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
  return (
    <div
      className="w-full border bg-card/30 sm:w-72 sm:shrink-0 sm:snap-start"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <div className="border-b p-4">
        <div className="font-semibold">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="min-h-32 divide-y">
        {participants.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Nenhum participante nesta coluna.</p>
        ) : (
          participants.map((participant) => (
            <RosterPerson key={participant.uuid} participant={participant} />
          ))
        )}
      </div>
    </div>
  );
}

function RosterPerson({ participant }: { participant: SalaryParticipant }) {
  return (
    <div
      draggable
      className="flex cursor-grab items-center gap-3 px-4 py-3 active:cursor-grabbing"
      onDragStart={(event) => {
        event.dataTransfer.setData("text/championship-participant", participant.uuid);
        event.dataTransfer.effectAllowed = "move";
      }}
    >
      <div className="grid size-8 place-items-center border bg-background text-xs font-semibold">
        {participant.displayName.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{participant.displayName}</div>
        <div className="text-xs text-muted-foreground">
          {participant.membership?.role === "gm" ? "GM" : "Jogador"}
        </div>
      </div>
      <span className="text-xs tabular-nums">{participant.priceUnits ?? "—"}</span>
    </div>
  );
}

function RosterMoveDialog({
  data,
  request,
  onOpenChange,
}: {
  data: ChampionshipWorkspaceData;
  request: RosterMoveRequest | null;
  onOpenChange: (open: boolean) => void;
}) {
  const previewMove = useServerFn(previewChampionshipRosterMoveFn);
  const executeMove = useServerFn(executeChampionshipRosterMoveFn);
  const router = useRouter();
  const [preview, setPreview] = useState<ChampionshipRosterMovePreview>();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!request) {
      setPreview(undefined);
      setMessage(null);
      return;
    }

    setLoading(true);
    void previewMove({
      data: {
        championshipUuid: data.championship.uuid,
        participantId: request.participant.uuid,
        targetTeamId: request.targetTeamId,
        role: request.role,
      },
    })
      .then((result) => {
        if (result.ok) setPreview(result.data);
        else setMessage(result.message);
      })
      .catch((error) => setMessage(messageFor(error)))
      .finally(() => setLoading(false));
  }, [data.championship.uuid, previewMove, request]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!request || !preview) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setMessage(null);

    try {
      const result = await executeMove({
        data: {
          championshipUuid: data.championship.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: numberValue(data.championship.revision),
          participantId: request.participant.uuid,
          targetTeamId: request.targetTeamId,
          role: request.role,
          confirmCapException: preview.requiresCapException,
          reason: String(form.get("reason") ?? "").trim() || undefined,
        },
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      onOpenChange(false);
      await router.invalidate();
    } catch (error) {
      setMessage(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={request !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar movimentação de elenco</DialogTitle>
          <DialogDescription>
            O impacto abaixo é recalculado no servidor antes da confirmação transacional.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="grid min-h-40 place-items-center text-sm text-muted-foreground">
            Calculando impacto…
          </div>
        ) : preview ? (
          <form className="space-y-5" onSubmit={submit}>
            <div className="flex items-center gap-3 border-y px-3 py-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{preview.participant.displayName}</div>
                <div className="text-xs text-muted-foreground">
                  {formatSalaryUnits(preview.participant.priceUnits ?? 0, data.salary.displayLabel)}
                </div>
              </div>
              <div className="text-right text-sm">
                <div>{preview.source?.teamName ?? "Sem equipe"}</div>
                <MoveRight className="mx-auto my-1 size-4 text-muted-foreground" />
                <div>{preview.target?.teamName ?? "Sem equipe"}</div>
              </div>
            </div>

            <div className="divide-y border">
              {preview.affectedTeams.map((team) => (
                <div
                  key={team.teamUuid}
                  className="grid gap-3 px-3 py-3 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto]"
                >
                  <div>
                    <div className="font-medium">{team.teamName}</div>
                    <div className="text-xs text-muted-foreground">
                      elenco r{team.rosterRevision} → r{numberValue(team.rosterRevision) + 1}
                    </div>
                  </div>
                  <div className="tabular-nums">
                    {team.usageBeforeUnits} → {team.usageAfterUnits}
                  </div>
                  <Badge variant={team.overCapAfter ? "destructive" : "outline"}>
                    {team.overCapAfter ? "Acima do teto" : `${team.remainingAfterUnits} livres`}
                  </Badge>
                </div>
              ))}
            </div>

            {preview.requiresCapException ? (
              <Alert variant="destructive">
                <ShieldAlert />
                <AlertTitle>Exceção administrativa necessária</AlertTitle>
                <AlertDescription>
                  A equipe continuará marcada como não conforme. A aprovação expira na próxima
                  alteração do elenco.
                </AlertDescription>
              </Alert>
            ) : null}
            {preview.violations.filter(
              (violation) => violation !== "O teto salarial seria excedido.",
            ).length > 0 ? (
              <InlineError
                message={preview.violations
                  .filter((violation) => violation !== "O teto salarial seria excedido.")
                  .join(" ")}
              />
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="moveReason">
                {preview.requiresCapException ? "Justificativa da exceção" : "Nota da movimentação"}
              </Label>
              <Textarea
                id="moveReason"
                name="reason"
                required={preview.requiresCapException}
                placeholder="Fica registrada na auditoria"
              />
            </div>
            {message ? <InlineError message={message} /> : null}
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  busy ||
                  preview.violations.some(
                    (violation) => violation !== "O teto salarial seria excedido.",
                  )
                }
                variant={preview.requiresCapException ? "destructive" : "default"}
              >
                {preview.requiresCapException ? <ShieldAlert /> : <Check />}
                {busy
                  ? "Confirmando…"
                  : preview.requiresCapException
                    ? "Aprovar exceção e mover"
                    : "Confirmar movimentação"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <InlineError message={message ?? "Não foi possível calcular a movimentação."} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TradeSimulation({ data }: { data: ChampionshipWorkspaceData }) {
  const rostered = data.salary.participants.items.filter(({ membership }) => membership);
  const [firstUuid, setFirstUuid] = useState("");
  const [secondUuid, setSecondUuid] = useState("");
  const first = rostered.find(({ uuid }) => uuid === firstUuid);
  const second = rostered.find(({ uuid }) => uuid === secondUuid);
  const validPair =
    first?.membership &&
    second?.membership &&
    first.membership.teamUuid !== second.membership.teamUuid;
  const projections = validPair
    ? [
        simulateTeamAfterSwap(
          data.salary.teams.items,
          first.membership!.teamUuid,
          numberValue(first.priceUnits),
          numberValue(second.priceUnits),
          numberValue(data.salary.capUnits),
        ),
        simulateTeamAfterSwap(
          data.salary.teams.items,
          second.membership!.teamUuid,
          numberValue(second.priceUnits),
          numberValue(first.priceUnits),
          numberValue(data.salary.capUnits),
        ),
      ]
    : [];

  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <ArrowRightLeft className="size-5 text-cyan-300" />
        <div>
          <h3 className="font-semibold">Simulador de troca</h3>
          <p className="text-xs text-muted-foreground">
            Compare o impacto financeiro antes de abrir uma negociação.
          </p>
        </div>
      </div>
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-end">
        <ParticipantSelect
          label="Sai da primeira equipe"
          value={firstUuid}
          participants={rostered.filter(({ uuid }) => uuid !== secondUuid)}
          onChange={setFirstUuid}
        />
        <ArrowRightLeft className="mx-auto mb-2 size-5 text-muted-foreground" />
        <ParticipantSelect
          label="Sai da segunda equipe"
          value={secondUuid}
          participants={rostered.filter(({ uuid }) => uuid !== firstUuid)}
          onChange={setSecondUuid}
        />
      </div>
      {firstUuid && secondUuid && !validPair ? (
        <p className="border-t px-4 py-3 text-sm text-amber-200">
          Escolha participantes de equipes diferentes.
        </p>
      ) : null}
      {projections.length > 0 ? (
        <div className="grid border-t md:grid-cols-2 md:divide-x">
          {projections.map((projection) => (
            <div key={projection.team.uuid} className="flex items-center gap-4 px-4 py-4">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{projection.team.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatSalaryUnits(projection.team.usageUnits, data.salary.displayLabel)} →{" "}
                  {formatSalaryUnits(projection.usageAfter, data.salary.displayLabel)}
                </div>
              </div>
              <Badge variant={projection.overCap ? "destructive" : "outline"}>
                {projection.overCap ? "Excede o teto" : `${projection.remaining} livres`}
              </Badge>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ParticipantSelect({
  label,
  value,
  participants,
  onChange,
}: {
  label: string;
  value: string;
  participants: SalaryParticipant[];
  onChange: (value: string) => void;
}) {
  const selectId = useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId}>{label}</Label>
      <NativeSelect id={selectId} value={value} onChange={(event) => onChange(event.target.value)}>
        <NativeSelectOption value="">Selecione um participante</NativeSelectOption>
        {participants.map((participant) => (
          <NativeSelectOption key={participant.uuid} value={participant.uuid}>
            {participant.displayName} · {participant.membership?.teamName} ·{" "}
            {participant.priceUnits ?? 0}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function simulateTeamAfterSwap(
  teams: SalaryTeam[],
  teamUuid: string,
  outgoing: number,
  incoming: number,
  cap: number,
) {
  const team = teams.find(({ uuid }) => uuid === teamUuid)!;
  const simulation = simulateSalarySwap(team.usageUnits, outgoing, incoming, cap);

  return {
    team,
    ...simulation,
  };
}

function RosterHistory({ data }: { data: ChampionshipWorkspaceData }) {
  return (
    <section className="bfl-panel overflow-hidden rounded-xl border">
      <div className="flex items-center gap-3 border-b px-4 py-4">
        <History className="size-5 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">Histórico de elencos</h3>
          <p className="text-xs text-muted-foreground">
            Entradas encerradas permanecem consultáveis por revisão.
          </p>
        </div>
      </div>
      {data.rosterHistory.items.length === 0 ? (
        <p className="px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma movimentação registrada.
        </p>
      ) : (
        <>
          <div className="divide-y sm:hidden">
            {data.rosterHistory.items.map((membership) => (
              <article key={membership.uuid} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{membership.participant.displayName}</div>
                    <div className="text-sm text-muted-foreground">
                      {membership.team.name} · {membership.role === "gm" ? "GM" : "Jogador"}
                    </div>
                  </div>
                  <Badge variant="outline">{membership.endedAt ? "Encerrada" : "Ativa"}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="uppercase text-muted-foreground">Origem</div>
                    <div className="mt-1">{acquisitionLabel(membership.acquisitionSource)}</div>
                  </div>
                  <div>
                    <div className="uppercase text-muted-foreground">Revisões</div>
                    <div className="mt-1 tabular-nums">
                      {membership.effectiveFromRevision}
                      {membership.effectiveToRevision
                        ? `–${membership.effectiveToRevision}`
                        : "–atual"}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="hidden max-h-80 overflow-auto sm:block">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>Equipe</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Revisões</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rosterHistory.items.map((membership) => (
                  <TableRow key={membership.uuid}>
                    <TableCell className="font-medium">
                      {membership.participant.displayName}
                    </TableCell>
                    <TableCell>{membership.team.name}</TableCell>
                    <TableCell>{membership.role === "gm" ? "GM" : "Jogador"}</TableCell>
                    <TableCell>{acquisitionLabel(membership.acquisitionSource)}</TableCell>
                    <TableCell className="tabular-nums">
                      {membership.effectiveFromRevision}
                      {membership.effectiveToRevision
                        ? `–${membership.effectiveToRevision}`
                        : "–atual"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{membership.endedAt ? "Encerrada" : "Ativa"}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </section>
  );
}

function InlineError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 border border-red-400/40 bg-red-400/5 px-3 py-2 text-sm text-red-200">
      <CircleAlert className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function statusLabel(status: SalaryParticipant["status"]) {
  return {
    pending: "Pendente",
    active: "Ativo",
    withdrawn: "Desistente",
    ineligible: "Inapto",
    removed: "Removido",
  }[status];
}

function acquisitionLabel(
  source: ChampionshipWorkspaceData["rosterHistory"]["items"][number]["acquisitionSource"],
) {
  return {
    staff: "Organização",
    draft: "Draft",
    trade: "Troca",
    replacement: "Substituição",
    "historical-import": "Importação",
  }[source];
}

function messageFor(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a operação.";
}

function numberValue(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}
