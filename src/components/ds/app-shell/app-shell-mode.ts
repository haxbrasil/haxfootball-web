export function isChampionshipEditorPath(pathname: string) {
  return /^\/admin\/championships\/[^/]+\/?$/.test(pathname);
}
