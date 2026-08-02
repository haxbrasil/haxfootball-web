type InternalNavigationItem = {
  label: string;
  to: "/" | "/admin" | "/championships" | "/clips" | "/matches" | "/pubs" | "/rooms";
};

type ExternalNavigationItem = {
  label: string;
  href: string;
};

export type NavigationItem = InternalNavigationItem | ExternalNavigationItem;

export function getNavigation(): NavigationItem[] {
  return [
    { to: "/", label: "Início" },
    { to: "/pubs", label: "Pubs" },
    { to: "/championships", label: "Campeonatos" },
    { to: "/matches", label: "Partidas" },
    { to: "/clips", label: "Clipes" },
    { to: "/rooms", label: "Salas" },
    { href: "https://videos.bfl.haxbrasil.com/", label: "Vídeos" },
  ];
}

export const adminNavigationItem = { to: "/admin", label: "Admin" } satisfies NavigationItem;
