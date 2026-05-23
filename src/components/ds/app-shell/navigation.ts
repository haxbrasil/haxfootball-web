export type NavigationItem = {
  label: string;
  to: "/" | "/admin" | "/matches" | "/pubs" | "/rooms";
};

export const navigation = [
  { to: "/", label: "Início" },
  { to: "/pubs", label: "Pubs" },
  { to: "/matches", label: "Partidas" },
  { to: "/rooms", label: "Salas" },
] satisfies NavigationItem[];

export const adminNavigationItem = { to: "/admin", label: "Admin" } satisfies NavigationItem;
