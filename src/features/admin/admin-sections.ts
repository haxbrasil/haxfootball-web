import { hasApiPermission } from "#/server/auth/permissions";
import type { ApiAccountSession } from "#/server/auth/session";

export type AdminSectionKey =
  | "championships"
  | "rooms"
  | "room-programs"
  | "modes-statistics"
  | "honors"
  | "matches"
  | "accounts"
  | "roles";

export type AdminSection = {
  key: AdminSectionKey;
  title: string;
  description: string;
  href:
    | "/admin/rooms"
    | "/admin/championships"
    | "/admin/room-programs"
    | "/admin/modes-statistics"
    | "/admin/honors"
    | "/admin/matches"
    | "/admin/accounts"
    | "/admin/roles";
  permissions: string[];
};

export const adminSections = [
  {
    key: "honors",
    title: "Títulos e prêmios",
    description: "Definir conquistas reutilizáveis e suas regras de atribuição.",
    href: "/admin/honors",
    permissions: ["honor-definition:admin"],
  },
  {
    key: "modes-statistics",
    title: "Modos e estatísticas",
    description: "Definir modos de jogo, métricas e visualizações públicas.",
    href: "/admin/modes-statistics",
    permissions: ["game-mode:admin", "event-schema:admin", "visualization:admin"],
  },
  {
    key: "rooms",
    title: "Salas",
    description: "Lançar salas, acompanhar salas abertas e consultar histórico.",
    href: "/admin/rooms",
    permissions: ["room-launch:operate"],
  },
  {
    key: "room-programs",
    title: "Programas de sala",
    description: "Gerenciar programas, campos de lançamento, versões e aliases.",
    href: "/admin/room-programs",
    permissions: ["room-program:admin"],
  },
  {
    key: "matches",
    title: "Partidas",
    description: "Consultar partidas e executar operações administrativas.",
    href: "/admin/matches",
    permissions: ["match:admin"],
  },
  {
    key: "championships",
    title: "Campeonatos",
    description: "Preparar edições, equipes, formatos e operação compartilhada.",
    href: "/admin/championships",
    permissions: ["championship:admin", "championship:operate"],
  },
  {
    key: "accounts",
    title: "Contas",
    description: "Consultar contas e trocar cargos.",
    href: "/admin/accounts",
    permissions: ["account:admin"],
  },
  {
    key: "roles",
    title: "Cargos",
    description: "Criar cargos e gerenciar permissões.",
    href: "/admin/roles",
    permissions: ["role:admin"],
  },
] satisfies AdminSection[];

export const implementedAdminPermissions = [
  ...new Set(adminSections.flatMap((section) => section.permissions)),
];

export function visibleAdminSections(session: ApiAccountSession | null | undefined) {
  if (!session) {
    return [];
  }

  return adminSections.filter((section) =>
    section.permissions.some((permission) => hasApiPermission(session, permission)),
  );
}

export function canAccessImplementedAdmin(session: ApiAccountSession | null | undefined) {
  return visibleAdminSections(session).length > 0;
}
