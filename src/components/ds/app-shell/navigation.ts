type InternalNavigationItem = {
  label: string;
  to: "/" | "/admin" | "/matches" | "/pubs" | "/rooms";
};

type ExternalNavigationItem = {
  label: string;
  href: string;
};

export type NavigationItem = InternalNavigationItem | ExternalNavigationItem;

export const navigation = [
  { to: "/", label: "Início" },
  { to: "/pubs", label: "Pubs" },
  { to: "/matches", label: "Partidas" },
  { to: "/rooms", label: "Salas" },
  { href: "https://videos.bfl.haxbrasil.com/", label: "Vídeos" },
] satisfies NavigationItem[];

export const adminNavigationItem = { to: "/admin", label: "Admin" } satisfies NavigationItem;
