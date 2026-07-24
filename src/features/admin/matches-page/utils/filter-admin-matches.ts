type AdminMatchFilterItem = {
  id: string;
  status: string;
  kind: "single" | "composed";
};

export function filterAdminMatches<T extends AdminMatchFilterItem>(
  matches: T[],
  query: string,
): T[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return matches;
  }

  return matches.filter(
    (match) =>
      match.id.toLowerCase().includes(normalizedQuery) ||
      match.status.toLowerCase().includes(normalizedQuery) ||
      (match.kind === "single" ? "individual física" : "composta vínculo tempos").includes(
        normalizedQuery,
      ),
  );
}
