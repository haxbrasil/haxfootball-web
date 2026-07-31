import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Check,
  Database,
  FileSearch,
  Link2,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
  Unlink,
  Upload,
} from "lucide-react";
import { Alert, AlertDescription } from "#/components/ui/alert";
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
import { Label } from "#/components/ui/label";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#/components/ui/table";
import { Textarea } from "#/components/ui/textarea";
import type {
  ChampionshipHistoricalImportBatchData,
  ChampionshipWorkspaceData,
} from "#/server/api/championship-api";
import {
  applyChampionshipHistoricalImportFn,
  linkChampionshipHistoricalPlayerFn,
  previewChampionshipHistoricalImportFn,
  rollbackChampionshipHistoricalImportFn,
} from "#/server/api/championship-functions";

const entityTypes = [
  ["team-identity", "Identidade de equipe"],
  ["team", "Equipe"],
  ["historical-player", "Jogador histórico"],
  ["participant", "Participante"],
  ["roster-membership", "Vínculo de elenco"],
  ["stage", "Etapa"],
  ["match", "Jogo"],
  ["statistic", "Estatística"],
  ["placement", "Colocação"],
  ["award", "Prêmio"],
  ["record", "Recorde"],
  ["unknown", "Valor preservado"],
] as const;

const canonicalFields = [
  "sourceKey",
  "name",
  "slug",
  "abbreviation",
  "colors",
  "identityKey",
  "seed",
  "displayOrder",
  "displayName",
  "displayLabel",
  "aliases",
  "notes",
  "accountUuid",
  "historicalPlayerKey",
  "status",
  "registeredAt",
  "teamKey",
  "participantKey",
  "role",
  "priceUnits",
  "effectiveToRevision",
  "startedAt",
  "endedAt",
  "engine",
  "stageKey",
  "label",
  "sideATeamKey",
  "sideBTeamKey",
  "sideAScore",
  "sideBScore",
  "sideAOutcome",
  "sideBOutcome",
  "playedAt",
  "bracket",
  "note",
  "matchKey",
  "metricKey",
  "numericValue",
  "textValue",
  "rank",
  "kind",
  "targetType",
  "targetKey",
  "awardedAt",
  "relatedEntityType",
  "relatedEntityUuid",
  "field",
  "rawValue",
] as const;

type EntityType = (typeof entityTypes)[number][0];
type MappingRow = { id: string; target: string; source: string };
type HistoricalImportWorkspaceData = Pick<
  ChampionshipWorkspaceData,
  "championship" | "participants"
> & {
  accounts?: ChampionshipWorkspaceData["accounts"];
  historicalImports?: ChampionshipWorkspaceData["historicalImports"];
};

export function HistoricalImportWorkspace({ data }: { data: HistoricalImportWorkspaceData }) {
  const previewImport = useServerFn(previewChampionshipHistoricalImportFn);
  const applyImport = useServerFn(applyChampionshipHistoricalImportFn);
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [format, setFormat] = useState<"csv" | "json">("csv");
  const [sourceName, setSourceName] = useState("");
  const [source, setSource] = useState("");
  const [entityTypeColumn, setEntityTypeColumn] = useState("");
  const [defaultEntityType, setDefaultEntityType] = useState<EntityType | "">("");
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [preview, setPreview] = useState<ChampionshipHistoricalImportBatchData | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<"preview" | "apply" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rollbackBatch, setRollbackBatch] = useState<ChampionshipHistoricalImportBatchData | null>(
    null,
  );
  const columns = useMemo(() => detectColumns(format, source), [format, source]);
  const imports = data.historicalImports ?? {
    items: [],
    page: { limit: 20, nextCursor: null },
  };

  async function selectFile(file: File) {
    const nextFormat = file.name.toLowerCase().endsWith(".json") ? "json" : "csv";
    setFormat(nextFormat);
    setSourceName(file.name);
    setSource(await file.text());
    setPreview(null);
    setMappings([]);
    setMessage(null);
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void selectFile(file);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void selectFile(file);
  }

  async function runPreview() {
    setBusy("preview");
    setMessage(null);
    try {
      const result = await previewImport({
        data: {
          championshipUuid: data.championship.uuid,
          format,
          sourceName: sourceName || `importacao.${format}`,
          source,
          mapping: {
            entityTypeColumn: entityTypeColumn || null,
            defaultEntityType: defaultEntityType || null,
            fieldMap: Object.fromEntries(
              mappings
                .filter((mapping) => mapping.target && mapping.source)
                .map((mapping) => [mapping.target, mapping.source]),
            ),
          },
        },
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setPreview(result.data);
    } catch (cause) {
      setMessage(errorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  async function runApply() {
    if (!preview) return;
    setBusy("apply");
    setMessage(null);
    try {
      const result = await applyImport({
        data: {
          championshipUuid: data.championship.uuid,
          batchUuid: preview.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(data.championship.revision),
          reason,
        },
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setPreview(result.data);
      setReason("");
      setMessage(
        `${result.data.appliedCount} linhas aplicadas; ${result.data.errorCount} com erro.`,
      );
      await router.invalidate();
    } catch (cause) {
      setMessage(errorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="border-y">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-card/25 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center border bg-background">
            <Database className="size-4 text-cyan-300" />
          </span>
          <div>
            <h3 className="text-sm font-semibold">Reconstrução histórica</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Importações versionadas e reversíveis
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{imports.items.length} lotes recentes</span>
          {imports.page.nextCursor ? <Badge variant="outline">mais lotes disponíveis</Badge> : null}
        </div>
      </header>

      <div className="grid items-start xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <div className="min-w-0 border-b xl:border-r xl:border-b-0">
          <div
            className="m-4 grid min-h-36 place-items-center border border-dashed bg-muted/10 px-6 py-8 text-center sm:m-6"
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
          >
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              aria-label="Arquivo histórico"
              accept=".csv,.json,text/csv,application/json"
              onChange={onFileChange}
            />
            <div>
              <Upload className="mx-auto size-6 text-muted-foreground" />
              <div className="mt-3 text-sm font-medium">{sourceName || "CSV ou JSON"}</div>
              {source ? (
                <div className="mt-1 text-xs text-muted-foreground">
                  {source.length.toLocaleString("pt-BR")} caracteres · {columns.length} colunas
                </div>
              ) : null}
              <Button
                className="mt-4"
                size="sm"
                variant="outline"
                onClick={() => fileInput.current?.click()}
              >
                <Upload />
                Selecionar arquivo
              </Button>
            </div>
          </div>

          {source ? (
            <div className="space-y-5 border-t px-4 py-5 sm:px-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label="Formato">
                  <NativeSelect
                    value={format}
                    onChange={(event) => setFormat(event.target.value as "csv" | "json")}
                  >
                    <NativeSelectOption value="csv">CSV</NativeSelectOption>
                    <NativeSelectOption value="json">JSON</NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field label="Coluna de tipo">
                  <NativeSelect
                    value={entityTypeColumn}
                    onChange={(event) => setEntityTypeColumn(event.target.value)}
                  >
                    <NativeSelectOption value="">Nenhuma</NativeSelectOption>
                    {columns.map((column) => (
                      <NativeSelectOption key={column} value={column}>
                        {column}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field label="Tipo padrão">
                  <NativeSelect
                    value={defaultEntityType}
                    onChange={(event) =>
                      setDefaultEntityType(event.target.value as EntityType | "")
                    }
                  >
                    <NativeSelectOption value="">Detectar por linha</NativeSelectOption>
                    {entityTypes.map(([value, label]) => (
                      <NativeSelectOption key={value} value={value}>
                        {label}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </div>

              <div className="border">
                <div className="flex items-center justify-between gap-3 border-b px-3 py-2">
                  <div>
                    <div className="text-xs font-semibold">Mapeamento de campos</div>
                    <div className="text-[11px] text-muted-foreground">
                      Colunas com nomes canônicos não precisam de mapeamento
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setMappings((current) => [
                        ...current,
                        {
                          id: crypto.randomUUID(),
                          target: "",
                          source: "",
                        },
                      ])
                    }
                  >
                    <Plus />
                    Campo
                  </Button>
                </div>
                {mappings.length ? (
                  <div className="divide-y">
                    {mappings.map((mapping) => (
                      <div
                        key={mapping.id}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px] gap-2 p-3"
                      >
                        <NativeSelect
                          aria-label="Campo de destino"
                          value={mapping.target}
                          onChange={(event) =>
                            setMappings((current) =>
                              current.map((item) =>
                                item.id === mapping.id
                                  ? { ...item, target: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        >
                          <NativeSelectOption value="">Destino</NativeSelectOption>
                          {canonicalFields.map((field) => (
                            <NativeSelectOption key={field} value={field}>
                              {field}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        <NativeSelect
                          aria-label="Coluna de origem"
                          value={mapping.source}
                          onChange={(event) =>
                            setMappings((current) =>
                              current.map((item) =>
                                item.id === mapping.id
                                  ? { ...item, source: event.target.value }
                                  : item,
                              ),
                            )
                          }
                        >
                          <NativeSelectOption value="">Origem</NativeSelectOption>
                          {columns.map((column) => (
                            <NativeSelectOption key={column} value={column}>
                              {column}
                            </NativeSelectOption>
                          ))}
                        </NativeSelect>
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Remover mapeamento"
                          onClick={() =>
                            setMappings((current) =>
                              current.filter((item) => item.id !== mapping.id),
                            )
                          }
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-5 text-xs text-muted-foreground">
                    Mapeamento automático por nome de coluna.
                  </div>
                )}
              </div>

              <Button
                disabled={busy !== null || !source || (!entityTypeColumn && !defaultEntityType)}
                onClick={runPreview}
              >
                {busy === "preview" ? <Loader2 className="animate-spin" /> : <FileSearch />}
                Revisar importação
              </Button>
            </div>
          ) : null}

          {preview ? (
            <ImportPreview batch={preview} />
          ) : (
            <div className="border-t px-6 py-10 text-center text-sm text-muted-foreground">
              Nenhuma prévia aberta.
            </div>
          )}

          {preview?.state === "previewed" ? (
            <div className="space-y-3 border-t bg-card/20 p-4 sm:p-6">
              <Field label="Motivo da importação">
                <Textarea
                  rows={2}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ex.: reconstrução da edição de 2019"
                />
              </Field>
              <Button
                className="w-full sm:w-auto"
                disabled={
                  busy !== null ||
                  reason.trim().length < 3 ||
                  Number(preview.validCount) + Number(preview.warningCount) === 0
                }
                onClick={runApply}
              >
                {busy === "apply" ? <Loader2 className="animate-spin" /> : <Check />}
                Aplicar linhas válidas
              </Button>
            </div>
          ) : null}

          {message ? (
            <div className="border-t p-4 sm:px-6">
              <Alert>
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            </div>
          ) : null}
        </div>

        <div className="min-w-0">
          <BatchTimeline
            batches={imports.items}
            onSelect={setPreview}
            onRollback={setRollbackBatch}
          />
          <HistoricalIdentityLinks data={data} />
        </div>
      </div>

      <RollbackDialog
        batch={rollbackBatch}
        championship={data.championship}
        rollback={rollbackChampionshipHistoricalImportFn}
        onOpenChange={(open) => {
          if (!open) setRollbackBatch(null);
        }}
      />
    </section>
  );
}

function ImportPreview({ batch }: { batch: ChampionshipHistoricalImportBatchData }) {
  return (
    <div className="border-t">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <div className="text-sm font-semibold">{batch.sourceName}</div>
          <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
            {batch.sourceSha256.slice(0, 16)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <CountBadge tone="valid" value={batch.validCount} label="válidas" />
          <CountBadge tone="warning" value={batch.warningCount} label="avisos" />
          <CountBadge tone="invalid" value={batch.invalidCount} label="erros" />
        </div>
      </div>
      <div className="max-h-[420px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-14">Linha</TableHead>
              <TableHead className="w-40">Tipo</TableHead>
              <TableHead>Chave e dados</TableHead>
              <TableHead className="w-52">Validação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batch.rows.items.map((row) => {
              const normalized = asRecord(row.normalized);
              const values = asRecord(normalized.values);
              return (
                <TableRow key={Number(row.rowNumber)}>
                  <TableCell className="align-top font-mono text-xs">{row.rowNumber}</TableCell>
                  <TableCell className="align-top">
                    <Badge variant="outline">{entityTypeLabel(row.entityType)}</Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="font-mono text-xs">{row.sourceKey ?? "sem chave"}</div>
                    <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                      {compactValues(values)}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    <RowState state={row.state} />
                    {row.messages.length ? (
                      <div className="mt-1 space-y-1 text-[11px] text-muted-foreground">
                        {row.messages.map((entry, index) => (
                          <div key={`${entry}:${index}`}>{entry}</div>
                        ))}
                      </div>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {batch.rows.truncated ? (
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          Exibindo {batch.rows.items.length} de {batch.rows.totalCount} linhas.
        </div>
      ) : null}
    </div>
  );
}

function BatchTimeline({
  batches,
  onSelect,
  onRollback,
}: {
  batches: ChampionshipHistoricalImportBatchData[];
  onSelect: (batch: ChampionshipHistoricalImportBatchData) => void;
  onRollback: (batch: ChampionshipHistoricalImportBatchData) => void;
}) {
  return (
    <div>
      <div className="border-b px-4 py-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">Lotes</h4>
      </div>
      {batches.length ? (
        <div className="divide-y">
          {batches.map((batch) => (
            <div key={batch.uuid} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelect(batch)}
                >
                  <div className="truncate text-sm font-medium">{batch.sourceName}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <BatchState state={batch.state} />
                    <span>{batch.rowCount} linhas</span>
                    <span>{formatDate(batch.createdAt)}</span>
                  </div>
                </button>
                {batch.state === "applied" ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Reverter lote"
                    onClick={() => onRollback(batch)}
                  >
                    <RotateCcw />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          Nenhum lote registrado.
        </div>
      )}
    </div>
  );
}

function HistoricalIdentityLinks({ data }: { data: HistoricalImportWorkspaceData }) {
  const historical = data.participants.items.filter(
    (participant) => participant.identity.kind === "historical",
  );

  return (
    <div className="border-t">
      <div className="border-b px-4 py-3">
        <h4 className="text-xs font-semibold uppercase text-muted-foreground">
          Identidades históricas
        </h4>
      </div>
      {historical.length ? (
        <div className="divide-y">
          {historical.map((participant) =>
            participant.identity.kind === "historical" ? (
              <HistoricalIdentityRow
                key={participant.uuid}
                championship={data.championship}
                identity={participant.identity}
                accounts={data.accounts?.items ?? []}
              />
            ) : null,
          )}
        </div>
      ) : (
        <div className="px-4 py-8 text-center text-xs text-muted-foreground">
          Nenhuma identidade histórica nesta edição.
        </div>
      )}
    </div>
  );
}

function HistoricalIdentityRow({
  championship,
  identity,
  accounts,
}: {
  championship: ChampionshipWorkspaceData["championship"];
  identity: Extract<
    ChampionshipWorkspaceData["participants"]["items"][number]["identity"],
    { kind: "historical" }
  >;
  accounts: ChampionshipWorkspaceData["accounts"]["items"];
}) {
  const link = useServerFn(linkChampionshipHistoricalPlayerFn);
  const router = useRouter();
  const currentAccountUuid = identity.linkedAccount?.accountUuid ?? null;
  const [accountUuid, setAccountUuid] = useState(currentAccountUuid ?? "");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(nextAccountUuid: string | null) {
    setBusy(true);
    setMessage(null);
    try {
      const result = await link({
        data: {
          championshipUuid: championship.uuid,
          historicalPlayerUuid: identity.historicalIdentityUuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(championship.revision),
          accountUuid: nextAccountUuid,
          expectedLinkedAccountUuid: currentAccountUuid,
          reason,
        },
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setReason("");
      await router.invalidate();
    } catch (cause) {
      setMessage(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{identity.displayName}</div>
          <div className="truncate text-[11px] text-muted-foreground">
            {identity.linkedAccount
              ? `Ligado a ${identity.linkedAccount.name}`
              : "Sem conta vinculada"}
          </div>
        </div>
        {identity.linkedAccount ? (
          <Badge variant="outline" className="border-emerald-400/35 text-emerald-300">
            <Link2 />
            vinculada
          </Badge>
        ) : null}
      </div>
      <NativeSelect
        aria-label={`Conta para ${identity.displayName}`}
        value={accountUuid}
        onChange={(event) => setAccountUuid(event.target.value)}
      >
        <NativeSelectOption value="">Selecionar conta</NativeSelectOption>
        {accounts.map((account) => (
          <NativeSelectOption key={account.uuid} value={account.uuid}>
            {account.name}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <Input
        aria-label={`Motivo do vínculo de ${identity.displayName}`}
        placeholder="Motivo do vínculo"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={
            busy || reason.trim().length < 3 || !accountUuid || accountUuid === currentAccountUuid
          }
          onClick={() => submit(accountUuid)}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Link2 />}
          Vincular
        </Button>
        {currentAccountUuid ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy || reason.trim().length < 3}
            onClick={() => submit(null)}
          >
            <Unlink />
            Desvincular
          </Button>
        ) : null}
      </div>
      {message ? <div className="text-xs text-red-300">{message}</div> : null}
    </div>
  );
}

function RollbackDialog({
  batch,
  championship,
  rollback,
  onOpenChange,
}: {
  batch: ChampionshipHistoricalImportBatchData | null;
  championship: ChampionshipWorkspaceData["championship"];
  rollback: typeof rollbackChampionshipHistoricalImportFn;
  onOpenChange: (open: boolean) => void;
}) {
  const runRollback = useServerFn(rollback);
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (!batch) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await runRollback({
        data: {
          championshipUuid: championship.uuid,
          batchUuid: batch.uuid,
          commandUuid: crypto.randomUUID(),
          expectedRevision: Number(championship.revision),
          reason,
        },
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      onOpenChange(false);
      setReason("");
      await router.invalidate();
    } catch (cause) {
      setMessage(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={batch !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reverter importação</DialogTitle>
          <DialogDescription>
            {batch ? `${batch.appliedCount} linhas aplicadas de ${batch.sourceName}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <Alert>
          <AlertTriangle />
          <AlertDescription>
            Apenas registros criados por este lote serão removidos. Registros reaproveitados
            permanecem intactos.
          </AlertDescription>
        </Alert>
        <div>
          <Label htmlFor="rollback-reason">Motivo da reversão</Label>
          <Textarea
            id="rollback-reason"
            className="mt-2"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>
        {message ? (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={busy || reason.trim().length < 3}
            onClick={submit}
          >
            {busy ? <Loader2 className="animate-spin" /> : <RotateCcw />}
            Reverter lote
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CountBadge({
  tone,
  value,
  label,
}: {
  tone: "valid" | "warning" | "invalid";
  value: string | number;
  label: string;
}) {
  return (
    <Badge
      variant="outline"
      className={
        tone === "valid"
          ? "border-emerald-400/35 text-emerald-300"
          : tone === "warning"
            ? "border-amber-400/35 text-amber-300"
            : "border-red-400/35 text-red-300"
      }
    >
      {value} {label}
    </Badge>
  );
}

function RowState({ state }: { state: string }) {
  const label =
    state === "valid"
      ? "Válida"
      : state === "warning"
        ? "Aviso"
        : state === "applied"
          ? "Aplicada"
          : state === "rolled-back"
            ? "Revertida"
            : "Erro";
  return (
    <span
      className={
        state === "valid" || state === "applied"
          ? "text-xs font-medium text-emerald-300"
          : state === "warning"
            ? "text-xs font-medium text-amber-300"
            : state === "rolled-back"
              ? "text-xs font-medium text-muted-foreground"
              : "text-xs font-medium text-red-300"
      }
    >
      {label}
    </span>
  );
}

function BatchState({ state }: { state: string }) {
  const label =
    state === "previewed"
      ? "prévia"
      : state === "applied"
        ? "aplicada"
        : state === "rolled-back"
          ? "revertida"
          : state === "applying"
            ? "aplicando"
            : "falhou";
  return <span className="font-medium">{label}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function detectColumns(format: "csv" | "json", source: string): string[] {
  if (!source.trim()) return [];
  try {
    if (format === "json") {
      const parsed = JSON.parse(source) as unknown;
      const rows = Array.isArray(parsed)
        ? parsed
        : isRecord(parsed) && Array.isArray(parsed.rows)
          ? parsed.rows
          : [];
      return [
        ...new Set(
          rows
            .filter(isRecord)
            .slice(0, 100)
            .flatMap((row) => Object.keys(row)),
        ),
      ];
    }
    return parseCsvHeader(source);
  } catch {
    return [];
  }
}

function parseCsvHeader(source: string) {
  const columns: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    if (character === '"') {
      if (quoted && source[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (!quoted && character === ",") {
      columns.push(value.trim().replace(/^\uFEFF/, ""));
      value = "";
    } else if (!quoted && (character === "\n" || character === "\r")) {
      columns.push(value.trim().replace(/^\uFEFF/, ""));
      break;
    } else {
      value += character;
    }
  }
  if (columns.length === 0 || value) {
    columns.push(value.trim().replace(/^\uFEFF/, ""));
  }
  return columns.filter(Boolean);
}

function compactValues(values: Record<string, unknown>) {
  return Object.entries(values)
    .filter(([, value]) => value !== "" && value !== null && value !== undefined)
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

function entityTypeLabel(value: string | null) {
  return entityTypes.find(([type]) => type === value)?.[1] ?? value ?? "inválido";
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function errorMessage(value: unknown): string {
  return value instanceof Error ? value.message : "Não foi possível concluir a operação.";
}
