import type { Account } from "@haxbrasil/haxfootball-api-sdk";

export function filterAccounts(accounts: Account[], query: string): Account[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return accounts;
  }

  return accounts.filter((account) =>
    [account.name, account.externalId, account.role.name, account.role.title].some((value) =>
      value.toLowerCase().includes(normalizedQuery),
    ),
  );
}
