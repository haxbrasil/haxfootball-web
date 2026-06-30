import { hasApiPermission } from "#/server/auth/permissions";
import type { ApiAccountSession } from "#/server/auth/session";

export type AdminSectionKey = "rooms" | "accounts" | "roles";

export type AdminSection = {
  key: AdminSectionKey;
  title: string;
  description: string;
  href: "/admin/rooms" | "/admin/accounts" | "/admin/roles";
  permission: string;
};

export const adminSections = [
  {
    key: "rooms",
    title: "Salas",
    description: "Lançar salas, acompanhar salas abertas e consultar histórico.",
    href: "/admin/rooms",
    permission: "room-launch:operate",
  },
  {
    key: "accounts",
    title: "Contas",
    description: "Consultar contas e trocar cargos.",
    href: "/admin/accounts",
    permission: "account:admin",
  },
  {
    key: "roles",
    title: "Cargos",
    description: "Criar cargos e gerenciar permissões.",
    href: "/admin/roles",
    permission: "role:admin",
  },
] satisfies AdminSection[];

export const implementedAdminPermissions = adminSections.map((section) => section.permission);

export function visibleAdminSections(session: ApiAccountSession | null | undefined) {
  if (!session) {
    return [];
  }

  return adminSections.filter((section) => hasApiPermission(session, section.permission));
}

export function canAccessImplementedAdmin(session: ApiAccountSession | null | undefined) {
  return visibleAdminSections(session).length > 0;
}
