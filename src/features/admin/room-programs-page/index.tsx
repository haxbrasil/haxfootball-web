import { useEffect, useMemo, useState, type FormEvent } from "react";
import type {
  RoomProgram,
  RoomProgramVersion,
  RoomProgramVersionArtifact,
} from "@haxbrasil/haxfootball-api-sdk";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PackageOpen, Plus, Save, Search, Upload } from "lucide-react";
import { EmptyState, PageHeader } from "#/components/ds/app-shell";
import { FormMessageAlert } from "#/components/ds/forms/form-message-alert";
import type { FormMessage } from "#/components/ds/forms/form-message";
import { NativeSelect, NativeSelectOption } from "#/components/ui/native-select";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "#/components/ui/card";
import { Checkbox } from "#/components/ui/checkbox";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "#/components/ui/tabs";
import { Textarea } from "#/components/ui/textarea";
import { compareVersionLabelsDescending } from "#/features/admin/utils/version-labels";
import { localizedTextLabel } from "#/lib/localization/localized-text";
import type { AdminRoomProgramResources, Page } from "#/server/api/haxfootball";
import {
  createRoomProgramFn,
  createRoomProgramVersionFn,
  discoverRoomProgramVersionsFn,
  updateRoomProgramFn,
  uploadRoomProgramArtifactFn,
  upsertRoomProgramVersionAliasFn,
} from "#/server/api/admin-room-program-functions";
import {
  editableLaunchField,
  newLaunchField,
  serializeLaunchFields,
  type EditableLaunchField,
} from "./utils/launch-fields";

type Alias = AdminRoomProgramResources["aliasesByProgramId"][string]["items"][number];
type RoomArtifact = {
  assetName: string;
  assetUrl: string;
  checksumSha256: string;
  storageKey: string;
};

export { serializeLaunchFields } from "./utils/launch-fields";

export function AdminRoomProgramsPage({ resources }: { resources: AdminRoomProgramResources }) {
  const [selectedProgramId, setSelectedProgramId] = useState(
    () => resources.roomPrograms.items[0]?.id ?? "",
  );
  const selectedProgram =
    resources.roomPrograms.items.find((program) => program.id === selectedProgramId) ??
    resources.roomPrograms.items[0] ??
    null;

  useEffect(() => {
    if (!selectedProgramId && resources.roomPrograms.items[0]) {
      setSelectedProgramId(resources.roomPrograms.items[0].id);
    }
  }, [resources.roomPrograms.items, selectedProgramId]);

  return (
    <>
      <PageHeader
        title="Programas de sala"
        description="Gerencie metadados, campos de lançamento, versões, aliases e artefatos."
      />

      <div className="grid items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <ProgramList
          programs={resources.roomPrograms.items}
          selectedProgramId={selectedProgram?.id ?? ""}
          onSelect={setSelectedProgramId}
        />

        {selectedProgram ? (
          <ProgramDetail
            key={selectedProgram.id}
            program={selectedProgram}
            versions={resources.versionsByProgramId[selectedProgram.id]?.items ?? []}
            aliases={resources.aliasesByProgramId[selectedProgram.id] ?? emptyPage<Alias>()}
          />
        ) : (
          <CreateProgramCard />
        )}
      </div>
    </>
  );
}

function ProgramList({
  programs,
  selectedProgramId,
  onSelect,
}: {
  programs: RoomProgram[];
  selectedProgramId: string;
  onSelect: (programId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const filteredPrograms = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return programs;

    return programs.filter((program) =>
      [
        program.name,
        optionalLocalizedLabel(program.title),
        optionalLocalizedLabel(program.description),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [programs, query]);

  return (
    <div className="grid gap-4">
      <CreateProgramCard />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PackageOpen className="size-4" />
            Programas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2">
            <Label htmlFor="programSearch" className="sr-only">
              Buscar programa
            </Label>
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="programSearch"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pl-9"
                placeholder="Buscar programa"
              />
            </div>
          </div>

          <div className="grid gap-2">
            {filteredPrograms.length === 0 ? (
              <EmptyState title="Nenhum programa encontrado" />
            ) : (
              filteredPrograms.map((program) => (
                <button
                  key={program.id}
                  type="button"
                  aria-label={`Abrir programa ${program.name}`}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    program.id === selectedProgramId
                      ? "border-primary bg-primary/5"
                      : "bg-background hover:bg-muted/60"
                  }`}
                  onClick={() => onSelect(program.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {optionalLocalizedLabel(program.title) || program.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{program.name}</div>
                    </div>
                    <Badge variant="secondary">{program.integrationMode}</Badge>
                  </div>
                </button>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProgramDetail({
  program,
  versions,
  aliases,
}: {
  program: RoomProgram;
  versions: RoomProgramVersion[];
  aliases: Page<Alias>;
}) {
  const [uploadedArtifact, setUploadedArtifact] = useState<RoomArtifact | null>(null);
  const sortedVersions = useMemo(
    () =>
      [...versions].sort((left, right) =>
        compareVersionLabelsDescending(left.version, right.version),
      ),
    [versions],
  );

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold">
            {optionalLocalizedLabel(program.title) || program.name}
          </h2>
          <p className="text-sm text-muted-foreground">{program.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{program.integrationMode}</Badge>
          <Badge variant="secondary">{versions.length} versões</Badge>
          <Badge variant="secondary">{aliases.items.length} aliases</Badge>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Dados</TabsTrigger>
          <TabsTrigger value="fields">Campos</TabsTrigger>
          <TabsTrigger value="versions">Versões</TabsTrigger>
          <TabsTrigger value="aliases">Aliases</TabsTrigger>
          <TabsTrigger value="artifacts">Artefatos</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <ProgramDetailsForm program={program} />
        </TabsContent>
        <TabsContent value="fields">
          <LaunchFieldsForm program={program} />
        </TabsContent>
        <TabsContent value="versions">
          <VersionsPanel
            program={program}
            versions={sortedVersions}
            uploadedArtifact={uploadedArtifact}
          />
        </TabsContent>
        <TabsContent value="aliases">
          <AliasesPanel program={program} versions={sortedVersions} aliases={aliases.items} />
        </TabsContent>
        <TabsContent value="artifacts">
          <ArtifactsPanel program={program} onUploaded={setUploadedArtifact} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateProgramCard() {
  const router = useRouter();
  const createProgram = useServerFn(createRoomProgramFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = await createProgram({
      data: {
        name: textValue(formData, "name"),
        title: optionalTextValue(formData, "title"),
        description: optionalTextValue(formData, "description"),
        releaseSource: releaseSourceFromForm(formData),
        launchConfigFields: [],
        integrationMode: textValue(formData, "integrationMode") as "external" | "integrated",
        haxballTokenEnvVar: textValue(formData, "haxballTokenEnvVar"),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });
      return;
    }

    form.reset();
    setMessage({ kind: "success", text: "Programa criado." });
    await router.invalidate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="size-4" />
          Novo programa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <TextInput id="newProgramName" name="name" label="Identificador" required />
          <TextInput id="newProgramTitle" name="title" label="Título" />
          <TextareaInput id="newProgramDescription" name="description" label="Descrição" />
          <ReleaseSourceFields prefix="new" />
          <SelectInput
            id="newProgramIntegrationMode"
            name="integrationMode"
            label="Integração"
            defaultValue="integrated"
            options={["integrated", "external"]}
          />
          <TextInput
            id="newProgramTokenEnv"
            name="haxballTokenEnvVar"
            label="Variável do token HaxBall"
            defaultValue="ROOM_TOKEN"
            required
          />

          <Button disabled={isSubmitting} type="submit">
            Criar programa
          </Button>
          {message ? <FormMessageAlert message={message} /> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function ProgramDetailsForm({ program }: { program: RoomProgram }) {
  const router = useRouter();
  const updateProgram = useServerFn(updateRoomProgramFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await updateProgram({
      data: {
        id: program.id,
        title: optionalTextValue(formData, "title") ?? null,
        description: optionalTextValue(formData, "description") ?? null,
        releaseSource: releaseSourceFromForm(formData),
        launchConfigFields: serializeExistingFields(program),
        integrationMode: textValue(formData, "integrationMode") as "external" | "integrated",
        haxballTokenEnvVar: textValue(formData, "haxballTokenEnvVar"),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });
      return;
    }

    setMessage({ kind: "success", text: "Programa salvo." });
    await router.invalidate();
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form className="space-y-4" onSubmit={submit}>
          <TextInput id="programName" label="Identificador" value={program.name} disabled />
          <TextInput
            id="programTitle"
            name="title"
            label="Título"
            defaultValue={optionalLocalizedLabel(program.title)}
          />
          <TextareaInput
            id="programDescription"
            name="description"
            label="Descrição"
            defaultValue={optionalLocalizedLabel(program.description)}
          />
          <ReleaseSourceFields prefix="program" source={program.releaseSource} />
          <SelectInput
            id="programIntegrationMode"
            name="integrationMode"
            label="Integração"
            defaultValue={program.integrationMode}
            options={["integrated", "external"]}
          />
          <TextInput
            id="programTokenEnv"
            name="haxballTokenEnvVar"
            label="Variável do token HaxBall"
            defaultValue={program.haxballTokenEnvVar}
            required
          />

          <Button disabled={isSubmitting} type="submit">
            <Save className="size-4" />
            Salvar dados
          </Button>
          {message ? <FormMessageAlert message={message} /> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function LaunchFieldsForm({ program }: { program: RoomProgram }) {
  const router = useRouter();
  const updateProgram = useServerFn(updateRoomProgramFn);
  const [fields, setFields] = useState(() => program.launchConfigFields.map(editableLaunchField));
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(index: number, patch: Partial<EditableLaunchField>) {
    setFields((current) =>
      current.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)),
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const serialized = serializeLaunchFields(fields);

    if (serialized.errors.length) {
      setMessage({ kind: "error", text: serialized.errors[0] ?? "Campos inválidos." });
      return;
    }

    setIsSubmitting(true);

    const result = await updateProgram({
      data: {
        id: program.id,
        title: program.title ? optionalLocalizedLabel(program.title) : null,
        description: program.description ? optionalLocalizedLabel(program.description) : null,
        releaseSource: program.releaseSource,
        launchConfigFields: serialized.fields,
        integrationMode: program.integrationMode,
        haxballTokenEnvVar: program.haxballTokenEnvVar,
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });
      return;
    }

    setMessage({ kind: "success", text: "Campos salvos." });
    await router.invalidate();
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <form className="space-y-4" onSubmit={submit}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-medium">Campos de lançamento</h3>
              <p className="text-sm text-muted-foreground">
                Esses campos definem o formulário de lançamento e as variáveis de ambiente.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFields([...fields, newLaunchField()])}
            >
              <Plus className="size-4" />
              Adicionar campo
            </Button>
          </div>

          <div className="grid gap-4">
            {fields.map((field, index) => (
              <LaunchFieldEditor
                key={index}
                field={field}
                index={index}
                onChange={(patch) => updateField(index, patch)}
                onRemove={() =>
                  setFields(fields.filter((_field, fieldIndex) => fieldIndex !== index))
                }
                onMove={(direction) => {
                  const next = [...fields];
                  const targetIndex = index + direction;

                  if (targetIndex < 0 || targetIndex >= fields.length) return;

                  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
                  setFields(next);
                }}
              />
            ))}
          </div>

          <Button disabled={isSubmitting} type="submit">
            <Save className="size-4" />
            Salvar campos
          </Button>
          {message ? <FormMessageAlert message={message} /> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function LaunchFieldEditor({
  field,
  index,
  onChange,
  onRemove,
  onMove,
}: {
  field: EditableLaunchField;
  index: number;
  onChange: (patch: Partial<EditableLaunchField>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}) {
  return (
    <fieldset className="rounded-lg border p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <legend className="text-sm font-medium">Campo {index + 1}</legend>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => onMove(-1)}>
            Subir
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onMove(1)}>
            Descer
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            Remover
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ControlledTextInput
          label="Chave"
          value={field.key}
          onChange={(key) => onChange({ key })}
        />
        <ControlledTextInput
          label="Label i18n"
          value={field.label}
          onChange={(label) => onChange({ label })}
        />
        <ControlledTextInput
          label="Env var"
          value={field.envVar}
          onChange={(envVar) => onChange({ envVar })}
        />
        <ControlledSelect
          label="Categoria"
          value={field.category}
          options={["room", "game", "diagnostics", "infrastructure"]}
          onChange={(category) =>
            onChange({ category: category as EditableLaunchField["category"] })
          }
        />
        <ControlledSelect
          label="Tipo"
          value={field.valueType}
          options={["string", "number", "boolean"]}
          onChange={(valueType) =>
            onChange({ valueType: valueType as EditableLaunchField["valueType"] })
          }
        />
        <ControlledTextInput
          label="Permissão exigida"
          value={field.requiredPermission}
          onChange={(requiredPermission) => onChange({ requiredPermission })}
        />
        <ControlledTextInput
          label="Descrição i18n"
          value={field.description}
          onChange={(description) => onChange({ description })}
        />
        <ControlledTextInput
          label="Mínimo"
          value={field.minimum}
          onChange={(minimum) => onChange({ minimum })}
        />
        <ControlledTextInput
          label="Máximo"
          value={field.maximum}
          onChange={(maximum) => onChange({ maximum })}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
        <ControlledTextarea
          label="Enum values"
          value={field.enumValues}
          onChange={(enumValues) => onChange({ enumValues })}
          placeholder="Um valor por linha"
        />
        <div className="grid gap-3">
          <CheckboxRow
            label="Obrigatório"
            checked={field.required}
            onChange={(required) => onChange({ required })}
          />
          <CheckboxRow
            label="Secreto"
            checked={field.secret}
            onChange={(secret) => onChange({ secret })}
          />
          <CheckboxRow
            label="Usar default"
            checked={field.defaultEnabled}
            onChange={(defaultEnabled) => onChange({ defaultEnabled })}
          />
          {field.defaultEnabled ? (
            <ControlledTextInput
              label="Default"
              value={field.defaultValue}
              onChange={(defaultValue) => onChange({ defaultValue })}
              placeholder={field.valueType === "boolean" ? "true ou false" : undefined}
            />
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}

function VersionsPanel({
  program,
  versions,
  uploadedArtifact,
}: {
  program: RoomProgram;
  versions: RoomProgramVersion[];
  uploadedArtifact: RoomArtifact | null;
}) {
  return (
    <div className="grid gap-4">
      <CreateVersionForm program={program} uploadedArtifact={uploadedArtifact} />
      <DiscoverVersionsForm program={program} />
      <Card>
        <CardContent className="overflow-x-auto pt-6">
          {versions.length === 0 ? (
            <EmptyState title="Nenhuma versão registrada" />
          ) : (
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  <th className="py-2">Versão</th>
                  <th>Entrypoint</th>
                  <th>Instalação</th>
                  <th>Artefato</th>
                  <th>Checksum</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((version) => (
                  <tr key={version.id} className="border-b last:border-0">
                    <td className="py-2 font-medium">{version.version}</td>
                    <td>{version.entrypoint}</td>
                    <td>{version.installStrategy}</td>
                    <td>{version.artifact.assetName}</td>
                    <td className="font-mono text-xs">{version.artifact.checksumSha256 ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CreateVersionForm({
  program,
  uploadedArtifact,
}: {
  program: RoomProgram;
  uploadedArtifact: RoomArtifact | null;
}) {
  const router = useRouter();
  const createVersion = useServerFn(createRoomProgramVersionFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const artifact = uploadedArtifact;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await createVersion({
      data: {
        programId: program.id,
        version: textValue(formData, "version"),
        artifact: versionArtifactFromForm(formData),
        entrypoint: textValue(formData, "entrypoint"),
        installStrategy: optionalInstallStrategy(formData),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });
      return;
    }

    setMessage({ kind: "success", text: "Versão registrada." });
    await router.invalidate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Registrar versão</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={submit}
          key={artifact?.assetUrl ?? "empty"}
        >
          <TextInput id="version" name="version" label="Versão" required />
          <TextInput
            id="entrypoint"
            name="entrypoint"
            label="Entrypoint"
            defaultValue="dist/environments/room-server.js"
            required
          />
          <TextInput id="releaseId" name="releaseId" label="Release ID" defaultValue="" required />
          <TextInput id="tagName" name="tagName" label="Tag" defaultValue="" required />
          <TextInput
            id="assetName"
            name="assetName"
            label="Asset name"
            defaultValue={artifact?.assetName ?? ""}
            required
          />
          <TextInput
            id="assetUrl"
            name="assetUrl"
            label="Asset URL"
            defaultValue={artifact?.assetUrl ?? ""}
            required
          />
          <TextInput
            id="publishedAt"
            name="publishedAt"
            label="Publicado em"
            defaultValue={new Date().toISOString()}
            required
          />
          <TextInput
            id="checksumSha256"
            name="checksumSha256"
            label="Checksum SHA-256"
            defaultValue={artifact?.checksumSha256 ?? ""}
          />
          <SelectInput
            id="installStrategy"
            name="installStrategy"
            label="Instalação"
            defaultValue="npm-install"
            options={["none", "npm-ci", "npm-install"]}
          />
          <div className="flex items-end">
            <Button disabled={isSubmitting} type="submit">
              Registrar versão
            </Button>
          </div>
          {message ? (
            <div className="md:col-span-2">
              <FormMessageAlert message={message} />
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function DiscoverVersionsForm({ program }: { program: RoomProgram }) {
  const router = useRouter();
  const discoverVersions = useServerFn(discoverRoomProgramVersionsFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await discoverVersions({
      data: {
        programId: program.id,
        entrypoint: textValue(formData, "entrypoint"),
        installStrategy: optionalInstallStrategy(formData),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });
      return;
    }

    setMessage({ kind: "success", text: `${result.versions.length} versões descobertas.` });
    await router.invalidate();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Descobrir releases</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]" onSubmit={submit}>
          <TextInput
            id="discoverEntrypoint"
            name="entrypoint"
            label="Entrypoint"
            defaultValue="dist/environments/room-server.js"
            required
          />
          <SelectInput
            id="discoverInstallStrategy"
            name="installStrategy"
            label="Instalação"
            defaultValue="npm-install"
            options={["none", "npm-ci", "npm-install"]}
          />
          <div className="flex items-end">
            <Button disabled={isSubmitting} type="submit">
              Descobrir
            </Button>
          </div>
          {message ? (
            <div className="md:col-span-3">
              <FormMessageAlert message={message} />
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function AliasesPanel({
  program,
  versions,
  aliases,
}: {
  program: RoomProgram;
  versions: RoomProgramVersion[];
  aliases: Alias[];
}) {
  const router = useRouter();
  const upsertAlias = useServerFn(upsertRoomProgramVersionAliasFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const result = await upsertAlias({
      data: {
        programId: program.id,
        alias: textValue(formData, "alias"),
        version: textValue(formData, "version"),
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });
      return;
    }

    setMessage({ kind: "success", text: "Alias salvo." });
    await router.invalidate();
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Salvar alias</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={submit}>
            <TextInput id="alias" name="alias" label="Alias" required />
            <SelectInput
              id="aliasVersion"
              name="version"
              label="Versão"
              defaultValue={versions[0]?.version ?? ""}
              options={versions.map((version) => version.version)}
            />
            <div className="flex items-end">
              <Button disabled={isSubmitting || versions.length === 0} type="submit">
                Salvar alias
              </Button>
            </div>
            {message ? (
              <div className="md:col-span-3">
                <FormMessageAlert message={message} />
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {aliases.length === 0 ? (
            <EmptyState title="Nenhum alias registrado" />
          ) : (
            <div className="grid gap-2">
              {aliases.map((alias) => (
                <div
                  key={alias.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <span className="font-medium">{alias.alias}</span>
                  <span className="text-sm text-muted-foreground">{alias.version.version}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ArtifactsPanel({
  program,
  onUploaded,
}: {
  program: RoomProgram;
  onUploaded: (artifact: RoomArtifact) => void;
}) {
  const uploadArtifact = useServerFn(uploadRoomProgramArtifactFn);
  const [message, setMessage] = useState<FormMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [artifact, setArtifact] = useState<RoomArtifact | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setIsSubmitting(false);
      setMessage({ kind: "error", text: "Selecione um arquivo .tgz." });
      return;
    }

    const result = await uploadArtifact({
      data: {
        programId: program.id,
        branch: textValue(formData, "branch"),
        sha: textValue(formData, "sha"),
        assetName: textValue(formData, "assetName"),
        file,
      },
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setMessage({ kind: "error", text: result.message });
      return;
    }

    setArtifact(result.artifact);
    onUploaded(result.artifact);
    setMessage({ kind: "success", text: "Artefato enviado." });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="size-4" />
          Upload de artefato
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <TextInput id="artifactBranch" name="branch" label="Branch" required />
          <TextInput id="artifactSha" name="sha" label="SHA" required />
          <TextInput id="artifactAssetName" name="assetName" label="Asset name" required />
          <div className="grid gap-2">
            <Label htmlFor="artifactFile">Arquivo .tgz</Label>
            <Input
              id="artifactFile"
              name="file"
              type="file"
              accept=".tgz,application/gzip"
              required
            />
          </div>
          <div className="flex items-end">
            <Button disabled={isSubmitting} type="submit">
              Enviar artefato
            </Button>
          </div>
          {message ? (
            <div className="md:col-span-2">
              <FormMessageAlert message={message} />
            </div>
          ) : null}
        </form>

        {artifact ? (
          <div className="mt-4 rounded-md border p-3 text-sm">
            <div className="font-medium">{artifact.assetName}</div>
            <div className="break-all text-muted-foreground">{artifact.assetUrl}</div>
            <div className="mt-2 font-mono text-xs">{artifact.checksumSha256}</div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TextInput({
  id,
  name,
  label,
  defaultValue,
  value,
  disabled,
  required,
}: {
  id: string;
  name?: string;
  label: string;
  defaultValue?: string;
  value?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        defaultValue={defaultValue}
        value={value}
        disabled={disabled}
        required={required}
      />
    </div>
  );
}

function TextareaInput({
  id,
  name,
  label,
  defaultValue,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} name={name} defaultValue={defaultValue} />
    </div>
  );
}

function SelectInput({
  id,
  name,
  label,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  options: string[];
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <NativeSelect id={id} name={name} defaultValue={defaultValue} required>
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {option}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function ControlledTextInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ControlledTextarea({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Textarea
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function ControlledSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <NativeSelect value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <NativeSelectOption key={option} value={option}>
            {option}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  );
}

function CheckboxRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-9 items-center gap-3 text-sm">
      <Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />
      {label}
    </label>
  );
}

function ReleaseSourceFields({
  prefix,
  source,
}: {
  prefix: string;
  source?: RoomProgram["releaseSource"];
}) {
  return (
    <div className="grid gap-4">
      <TextInput
        id={`${prefix}ReleaseOwner`}
        name="releaseOwner"
        label="GitHub owner"
        defaultValue={source?.owner}
        required
      />
      <TextInput
        id={`${prefix}ReleaseRepo`}
        name="releaseRepo"
        label="GitHub repo"
        defaultValue={source?.repo}
        required
      />
      <TextInput
        id={`${prefix}AssetPattern`}
        name="assetPattern"
        label="Asset pattern"
        defaultValue={source?.assetPattern}
        required
      />
    </div>
  );
}

function serializeExistingFields(program: RoomProgram) {
  const result = serializeLaunchFields(program.launchConfigFields.map(editableLaunchField));

  return result.fields;
}

function releaseSourceFromForm(formData: FormData) {
  return {
    owner: textValue(formData, "releaseOwner"),
    repo: textValue(formData, "releaseRepo"),
    assetPattern: textValue(formData, "assetPattern"),
  };
}

function versionArtifactFromForm(formData: FormData): RoomProgramVersionArtifact {
  const checksumSha256 = optionalTextValue(formData, "checksumSha256");

  return {
    releaseId: textValue(formData, "releaseId"),
    tagName: textValue(formData, "tagName"),
    assetName: textValue(formData, "assetName"),
    assetUrl: textValue(formData, "assetUrl"),
    publishedAt: textValue(formData, "publishedAt"),
    ...(checksumSha256 ? { checksumSha256 } : {}),
  };
}

function optionalInstallStrategy(formData: FormData) {
  const value = optionalTextValue(formData, "installStrategy");

  return value ? (value as "none" | "npm-ci" | "npm-install") : undefined;
}

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalTextValue(formData: FormData, key: string) {
  const value = textValue(formData, key);

  return value || undefined;
}

function optionalLocalizedLabel(value: Parameters<typeof localizedTextLabel>[0] | null) {
  return value ? localizedTextLabel(value) : "";
}

function emptyPage<T>(): Page<T> {
  return { items: [], page: { limit: 100, nextCursor: null } };
}
