import assert from "node:assert/strict";
import test from "node:test";
import { groupDebtsByPerson } from "../lib/debt-groups.ts";

const debt = (id, name, amount) => ({ id, counterpart_name: name, amount });

test("short name groups with its full name regardless of row order", () => {
  const groups = groupDebtsByPerson([
    debt("1", "Aero Jacques", 500000),
    debt("2", "Aero", 400000),
    debt("3", "Aero Smith", 200000),
  ]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, "Aero");
  assert.equal(groups[0].debts.length, 3);
  assert.equal(groups[0].debts.reduce((total, item) => total + item.amount, 0), 1100000);
});

test("different full names stay separate without an exact short name", () => {
  const groups = groupDebtsByPerson([
    debt("1", "Budi Santoso", 100000),
    debt("2", "Budi Hartono", 200000),
    debt("3", "Budiman", 300000),
  ]);
  assert.equal(groups.length, 3);
});
