import type { Debt } from "./debts";

export type DebtGroup = { key: string; name: string; debts: Debt[] };

const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ").toLocaleLowerCase("id");

export function groupDebtsByPerson(debts: Debt[]): DebtGroup[] {
  const names = [...new Set(debts.map(debt => normalizeName(debt.counterpart_name)))].sort(
    (a, b) => a.length - b.length || a.localeCompare(b, "id"),
  );
  const groups = new Map<string, DebtGroup>();

  for (const debt of debts) {
    const normalized = normalizeName(debt.counterpart_name);
    const key = names.find(name => normalized === name || normalized.startsWith(`${name} `)) ?? normalized;
    const existing = groups.get(key);
    if (existing) {
      existing.debts.push(debt);
    } else {
      const matchingName = debts.find(item => normalizeName(item.counterpart_name) === key);
      groups.set(key, { key, name: matchingName?.counterpart_name.trim() ?? debt.counterpart_name.trim(), debts: [debt] });
    }
  }

  return [...groups.values()];
}
