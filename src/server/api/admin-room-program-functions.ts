import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const localizedValueInput = z.string().min(1);
const launchConfigValueInput = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const launchConfigFieldInput = z.object({
  key: z.string().min(1),
  label: localizedValueInput,
  category: z.enum(["room", "game", "diagnostics", "infrastructure"]),
  valueType: z.enum(["string", "number", "boolean"]),
  required: z.boolean(),
  defaultValue: launchConfigValueInput.optional(),
  secret: z.boolean(),
  envVar: z.string().min(1),
  description: localizedValueInput.optional(),
  enumValues: z.array(z.string().min(1)).optional(),
  minimum: z.number().optional(),
  maximum: z.number().optional(),
  requiredPermission: z.string().min(1).optional(),
});
const releaseSourceInput = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  assetPattern: z.string().min(1),
});
const installStrategyInput = z.enum(["none", "npm-ci", "npm-install"]);
const roomProgramInput = z.object({
  name: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  releaseSource: releaseSourceInput,
  launchConfigFields: z.array(launchConfigFieldInput),
  integrationMode: z.enum(["external", "integrated"]),
  haxballTokenEnvVar: z.string().min(1),
});
const updateRoomProgramInput = roomProgramInput.extend({
  id: z.string().min(1),
  title: z.string().min(1).nullable(),
  description: z.string().min(1).nullable(),
});
const createRoomProgramVersionInput = z.object({
  programId: z.string().min(1),
  version: z.string().min(1),
  artifact: z.object({
    releaseId: z.string().min(1),
    tagName: z.string().min(1),
    assetName: z.string().min(1),
    assetUrl: z.string().min(1),
    publishedAt: z.string().min(1),
    checksumSha256: z.string().length(64).optional(),
  }),
  entrypoint: z.string().min(1),
  installStrategy: installStrategyInput.optional(),
});
const discoverRoomProgramVersionsInput = z.object({
  programId: z.string().min(1),
  entrypoint: z.string().min(1),
  installStrategy: installStrategyInput.optional(),
});
const upsertAliasInput = z.object({
  programId: z.string().min(1),
  alias: z.string().min(1),
  version: z.string().min(1),
});
const uploadArtifactInput = z.object({
  programId: z.string().min(1),
  branch: z.string().min(1),
  sha: z.string().min(1),
  assetName: z.string().min(1),
  file: z.instanceof(File),
});

export const listAdminRoomProgramResourcesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const { listAdminRoomProgramResources } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-program:admin");

    return listAdminRoomProgramResources();
  },
);

export const createRoomProgramFn = createServerFn({ method: "POST" })
  .inputValidator(roomProgramInput.required({ name: true }))
  .handler(async ({ data }) => {
    const { createRoomProgram } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-program:admin");

    const program = await createRoomProgram(data as never);

    return program
      ? ({ ok: true, program } as const)
      : ({ ok: false, message: "Não foi possível criar o programa." } as const);
  });

export const updateRoomProgramFn = createServerFn({ method: "POST" })
  .inputValidator(updateRoomProgramInput)
  .handler(async ({ data }) => {
    const { updateRoomProgram } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-program:admin");

    const { id, ...body } = data;
    const program = await updateRoomProgram({ id, body: body as never });

    return program
      ? ({ ok: true, program } as const)
      : ({ ok: false, message: "Não foi possível salvar o programa." } as const);
  });

export const createRoomProgramVersionFn = createServerFn({ method: "POST" })
  .inputValidator(createRoomProgramVersionInput)
  .handler(async ({ data }) => {
    const { createRoomProgramVersion } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-program:admin");

    const { programId, ...body } = data;
    const version = await createRoomProgramVersion({ programId, body });

    return version
      ? ({ ok: true, version } as const)
      : ({ ok: false, message: "Não foi possível registrar a versão." } as const);
  });

export const discoverRoomProgramVersionsFn = createServerFn({ method: "POST" })
  .inputValidator(discoverRoomProgramVersionsInput)
  .handler(async ({ data }) => {
    const { discoverRoomProgramVersions } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-program:admin");

    const { programId, ...body } = data;
    const versions = await discoverRoomProgramVersions({ programId, body });

    return versions
      ? ({ ok: true, versions } as const)
      : ({ ok: false, message: "Não foi possível descobrir versões." } as const);
  });

export const upsertRoomProgramVersionAliasFn = createServerFn({ method: "POST" })
  .inputValidator(upsertAliasInput)
  .handler(async ({ data }) => {
    const { upsertRoomProgramVersionAlias } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-program:admin");

    const alias = await upsertRoomProgramVersionAlias({
      programId: data.programId,
      alias: data.alias,
      body: { version: data.version },
    });

    return alias
      ? ({ ok: true, alias } as const)
      : ({ ok: false, message: "Não foi possível salvar o alias." } as const);
  });

export const uploadRoomProgramArtifactFn = createServerFn({ method: "POST" })
  .inputValidator(uploadArtifactInput)
  .handler(async ({ data }) => {
    const { uploadRoomProgramArtifact } = await import("#/server/api/haxfootball");
    const { requireApiPermission } = await import("#/server/auth/session");

    await requireApiPermission("room-program:admin");

    const artifact = await uploadRoomProgramArtifact(data);

    return artifact
      ? ({ ok: true, artifact } as const)
      : ({ ok: false, message: "Não foi possível enviar o artefato." } as const);
  });
