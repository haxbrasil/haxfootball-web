import { useMemo, useState } from "react";

export function useFilteredList<TItem>(
  items: TItem[],
  filter: (items: TItem[], query: string) => TItem[],
) {
  const [query, setQuery] = useState("");
  const filteredItems = useMemo(() => filter(items, query), [filter, items, query]);

  return { filteredItems, query, setQuery };
}
