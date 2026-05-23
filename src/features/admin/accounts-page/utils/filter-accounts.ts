import type { Account } from "@haxbrasil/haxfootball-api-sdk";
import { localizedTextLabel } from "#/lib/localization/localized-text";

export function filterAccounts(accounts: Account[], query: string): Account[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return accounts;
  }

  return accounts.filter((account) =>
    [
      account.name,
      account.externalId,
      account.role.name,
      localizedTextLabel(account.role.title),
    ].some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}
