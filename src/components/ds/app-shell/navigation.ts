import type { ProductFeatures } from "#/server/features";

type InternalNavigationItem = {
  label: string;
  to: "/" | "/admin" | "/championships" | "/matches" | "/pubs" | "/rooms";
};

type ExternalNavigationItem = {
  label: string;
  href: string;
};

export type NavigationItem = InternalNavigationItem | ExternalNavigationItem;

export function getNavigation(features: ProductFeatures): NavigationItem[] {
  return [
    { to: "/", label: "Início" },
    { to: "/pubs", label: "Pubs" },
    ...(features.championships
      ? ([{ to: "/championships", label: "Campeonatos" }] satisfies NavigationItem[])
      : []),
    { to: "/matches", label: "Partidas" },
    { to: "/rooms", label: "Salas" },
    { href: "https://videos.bfl.haxbrasil.com/", label: "Vídeos" },
  ];
}

export const adminNavigationItem = { to: "/admin", label: "Admin" } satisfies NavigationItem;
