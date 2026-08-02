import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Award, Check, Crown, Ellipsis, Eye, Layers3, Plus, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "#/components/ds/app-shell/page-header";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Input } from "#/components/ui/input";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Textarea } from "#/components/ui/textarea";
import type {
  ChampionshipHonorCatalogData,
  ChampionshipHonorDefinitionData,
} from "#/server/api/championship-api";
import {
  archiveChampionshipHonorDefinitionFn,
  createChampionshipHonorDefinitionFn,
  publishChampionshipHonorDefinitionFn,
  updateChampionshipHonorDefinitionDraftFn,
} from "#/server/api/championship-honor-functions";

type RecipientType = ChampionshipHonorDefinitionData["draft"]["recipientTypes"][number];

export function HonorsPage({ data }: { data: ChampionshipHonorCatalogData }) {
  const router = useRouter();
  const publish = useServerFn(publishChampionshipHonorDefinitionFn);
  const archive = useServerFn(archiveChampionshipHonorDefinitionFn);
  const [kind, setKind] = useState<"all" | "title" | "award">("all");
  const [competitionTypeId, setCompetitionTypeId] = useState(
    data.competitionTypes.items[0]?.uuid ?? "",
  );
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<ChampionshipHonorDefinitionData | null | undefined>();
  const filtered = useMemo(
    () =>
      data.definitions.items.filter(
        (item) =>
          item.competitionType.uuid === competitionTypeId &&
          (kind === "all" || item.kind === kind) &&
          `${item.draft.name} ${item.slug}`.toLowerCase().includes(search.toLowerCase()),
      ),
    [competitionTypeId, data.definitions.items, kind, search],
  );

  async function publishDefinition(item: ChampionshipHonorDefinitionData) {
    const result = await publish({
      data: { definitionUuid: item.uuid, expectedRevision: Number(item.draft.revision) },
    });
    if (!result.ok) return toast.error(result.message);
    toast.success(
      result.data.published ? "Versão publicada." : "A versão publicada já está atualizada.",
    );
    await router.invalidate();
  }

  async function toggleArchive(item: ChampionshipHonorDefinitionData) {
    const result = await archive({
      data: {
        definitionUuid: item.uuid,
        expectedRevision: Number(item.revision),
        archived: item.state === "active",
      },
    });
    if (!result.ok) return toast.error(result.message);
    toast.success(item.state === "active" ? "Definição arquivada." : "Definição restaurada.");
    await router.invalidate();
  }

  return (
    <>
      <PageHeader
        title="Catálogo de títulos e prêmios"
        description="Defina as conquistas que podem entrar em disputa nas edições e preserve suas versões ao longo do tempo."
        action={
          <Button
            onClick={() => setEditing(null)}
            disabled={data.competitionTypes.items.length === 0}
          >
            <Plus /> Nova definição
          </Button>
        }
      />
      <section className="bfl-panel overflow-hidden rounded-lg border">
        <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
          <NativeSelect
            className="lg:w-64"
            value={competitionTypeId}
            aria-label="Tipo de campeonato"
            onChange={(event) => setCompetitionTypeId(event.target.value)}
          >
            {data.competitionTypes.items.map((type) => (
              <NativeSelectOption key={type.uuid} value={type.uuid}>
                {type.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input
            className="lg:max-w-md"
            placeholder="Buscar título ou prêmio"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <NativeSelect
            className="lg:ml-auto lg:w-52"
            value={kind}
            onChange={(event) => setKind(event.target.value as typeof kind)}
          >
            <NativeSelectOption value="all">Todas as categorias</NativeSelectOption>
            <NativeSelectOption value="title">Títulos</NativeSelectOption>
            <NativeSelectOption value="award">Prêmios</NativeSelectOption>
          </NativeSelect>
        </div>
        <div className="divide-y">
          {filtered.map((item) => {
            const Icon = item.kind === "title" ? Crown : Award;
            return (
              <article
                key={item.uuid}
                className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="flex min-w-0 items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-md border bg-muted/35 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{item.draft.name}</h2>
                      <Badge variant="secondary">{item.competitionType.name}</Badge>
                      <Badge variant="outline">{item.kind === "title" ? "Título" : "Prêmio"}</Badge>
                      {item.state === "archived" ? (
                        <Badge variant="secondary">Arquivado</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.draft.description ?? "Definição pronta para ser usada em uma edição."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <Layers3 className="size-3.5" /> {item.versions.length} versões
                      </span>
                      <span>
                        {recipientLabel(item.draft.recipientTypes)} · {recipientCountLabel(item)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 md:justify-end">
                  <Button variant="outline" onClick={() => setEditing(item)}>
                    <Eye /> Abrir
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label={`Ações de ${item.draft.name}`}
                      >
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => void publishDefinition(item)}>
                        <Send /> Publicar versão
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void toggleArchive(item)}>
                        <Check /> {item.state === "active" ? "Arquivar" : "Restaurar"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            );
          })}
          {filtered.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Sparkles className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 font-medium">
                {data.competitionTypes.items.length
                  ? "Comece pelo que será disputado"
                  : "Cadastre um tipo de campeonato"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.competitionTypes.items.length
                  ? "Crie um título ou prêmio reutilizável para anunciar em uma edição deste tipo."
                  : "Os títulos e prêmios são organizados pelo tipo de competição."}
              </p>
            </div>
          ) : null}
        </div>
      </section>
      {editing !== undefined ? (
        <DefinitionDialog
          definition={editing}
          competitionTypes={data.competitionTypes.items}
          defaultCompetitionTypeId={competitionTypeId}
          onClose={() => setEditing(undefined)}
          onDone={async () => {
            setEditing(undefined);
            await router.invalidate();
          }}
        />
      ) : null}
    </>
  );
}

function DefinitionDialog({
  definition,
  competitionTypes,
  defaultCompetitionTypeId,
  onClose,
  onDone,
}: {
  definition: ChampionshipHonorDefinitionData | null;
  competitionTypes: ChampionshipHonorCatalogData["competitionTypes"]["items"];
  defaultCompetitionTypeId: string;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const create = useServerFn(createChampionshipHonorDefinitionFn);
  const update = useServerFn(updateChampionshipHonorDefinitionDraftFn);
  const publish = useServerFn(publishChampionshipHonorDefinitionFn);
  const [busy, setBusy] = useState(false);
  const [kind, setKind] = useState<"title" | "award">(definition?.kind ?? "award");
  const [competitionTypeId, setCompetitionTypeId] = useState(
    definition?.competitionType.uuid ?? defaultCompetitionTypeId,
  );
  const [recipients, setRecipients] = useState<RecipientType[]>(
    definition?.draft.recipientTypes ?? ["participant"],
  );
  const [aggregate, setAggregate] = useState(definition?.draft.aggregateByIdentity ?? false);

  async function submit(event: FormEvent<HTMLFormElement>, publishAfterSave: boolean) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fields = {
      name: String(form.get("name") ?? "").trim(),
      description: nullableText(form.get("description")),
      recipientTypes: recipients,
      minimumRecipients: Number(form.get("minimumRecipients") ?? 1),
      maximumRecipients: Number(form.get("maximumRecipients") ?? 1),
      aggregateByIdentity: aggregate,
      presentation: {},
    };
    setBusy(true);
    try {
      const result = definition
        ? await update({
            data: {
              definitionUuid: definition.uuid,
              expectedRevision: Number(definition.draft.revision),
              ...fields,
            },
          })
        : await create({
            data: {
              ...fields,
              kind,
              competitionTypeId,
              slug: `${slugify(fields.name)}-${crypto.randomUUID().slice(0, 6)}`,
            },
          });
      if (!result.ok) return toast.error(result.message);
      if (publishAfterSave) {
        const publication = await publish({
          data: {
            definitionUuid: result.data.uuid,
            expectedRevision: Number(result.data.draft.revision),
          },
        });
        if (!publication.ok) return toast.error(publication.message);
        toast.success("Definição salva e publicada.");
      } else {
        toast.success("Rascunho salvo.");
      }
      await onDone();
    } catch (cause) {
      toast.error(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{definition ? "Editar definição" : "Nova definição"}</DialogTitle>
          <DialogDescription>
            Configure quem pode receber a conquista e como ela será preservada no histórico.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-5" onSubmit={(event) => void submit(event, false)}>
          {!definition ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Tipo de campeonato">
                <NativeSelect
                  value={competitionTypeId}
                  onChange={(event) => setCompetitionTypeId(event.target.value)}
                >
                  {competitionTypes.map((type) => (
                    <NativeSelectOption key={type.uuid} value={type.uuid}>
                      {type.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Categoria">
                <NativeSelect
                  value={kind}
                  onChange={(event) => setKind(event.target.value as typeof kind)}
                >
                  <NativeSelectOption value="title">Título</NativeSelectOption>
                  <NativeSelectOption value="award">Prêmio</NativeSelectOption>
                </NativeSelect>
              </Field>
            </div>
          ) : (
            <Field label="Tipo de campeonato">
              <Input value={definition.competitionType.name} disabled />
            </Field>
          )}
          <Field label="Nome público">
            <Input name="name" required defaultValue={definition?.draft.name ?? ""} />
          </Field>
          <Field label="Descrição">
            <Textarea
              name="description"
              rows={3}
              defaultValue={definition?.draft.description ?? ""}
            />
          </Field>
          <div>
            <div className="text-sm font-medium">Pode ser recebido por</div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {recipientOptions.map((option) => (
                <label
                  key={option.value}
                  htmlFor={`recipient-${option.value}`}
                  className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-3 hover:bg-muted/30"
                >
                  <input
                    id={`recipient-${option.value}`}
                    aria-label={option.label}
                    type="checkbox"
                    checked={recipients.includes(option.value)}
                    onChange={(event) =>
                      setRecipients((current) =>
                        event.target.checked
                          ? [...new Set([...current, option.value])]
                          : current.filter((value) => value !== option.value),
                      )
                    }
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Mínimo de vencedores">
              <Input
                name="minimumRecipients"
                type="number"
                min={0}
                max={128}
                defaultValue={definition?.draft.minimumRecipients ?? 1}
              />
            </Field>
            <Field label="Máximo de vencedores">
              <Input
                name="maximumRecipients"
                type="number"
                min={1}
                max={128}
                defaultValue={definition?.draft.maximumRecipients ?? 1}
              />
            </Field>
          </div>
          {recipients.some((value) => value === "team" || value === "team-identity") ? (
            <label
              htmlFor="aggregate-by-identity"
              className="flex items-start gap-3 rounded-md border p-4"
            >
              <input
                id="aggregate-by-identity"
                aria-label="Agregar por identidade de equipe"
                type="checkbox"
                checked={aggregate}
                onChange={(event) => setAggregate(event.target.checked)}
              />
              <span>
                <span className="block text-sm font-medium">Agregar por identidade de equipe</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Conquistas de equipes vinculadas somam ao histórico da mesma identidade.
                </span>
              </span>
            </label>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="outline" disabled={busy || recipients.length === 0}>
              Salvar rascunho
            </Button>
            <Button
              type="button"
              disabled={busy || recipients.length === 0}
              onClick={(event) => {
                const form = event.currentTarget.form;
                if (form?.reportValidity())
                  void submit(
                    { currentTarget: form, preventDefault() {} } as FormEvent<HTMLFormElement>,
                    true,
                  );
              }}
            >
              <Send /> Salvar e publicar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const recipientOptions: Array<{ value: RecipientType; label: string }> = [
  { value: "participant", label: "Participante da edição" },
  { value: "team", label: "Equipe da edição" },
  { value: "team-identity", label: "Identidade de equipe" },
  { value: "account", label: "Conta" },
  { value: "historical-player", label: "Jogador histórico" },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

function recipientLabel(types: RecipientType[]) {
  return types
    .map((type) => recipientOptions.find((option) => option.value === type)?.label)
    .join(", ");
}

function recipientCountLabel(item: ChampionshipHonorDefinitionData) {
  if (item.draft.minimumRecipients === item.draft.maximumRecipients)
    return `${item.draft.maximumRecipients} vencedor${item.draft.maximumRecipients === 1 ? "" : "es"}`;
  return `${item.draft.minimumRecipients}–${item.draft.maximumRecipients} vencedores`;
}

function slugify(value: string) {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "conquista"
  );
}

function nullableText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim() || null;
}

function errorMessage(cause: unknown) {
  return cause instanceof Error ? cause.message : "Não foi possível concluir a operação.";
}
