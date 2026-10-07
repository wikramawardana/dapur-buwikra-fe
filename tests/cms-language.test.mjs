import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const require = createRequire(import.meta.url);
async function loadModule(path) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ES2022,
    },
  });
  const resolved = outputText.replace(
    /from "(date-fns(?:\/locale)?)"/g,
    (_, name) => `from "${pathToFileURL(require.resolve(name)).href}"`,
  );
  return import(
    `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`
  );
}
const constants = await loadModule("../src/lib/constants.ts");
const weeks = await loadModule("../src/lib/week-utils.ts");
const dates = await loadModule("../src/lib/format.ts");
const { cmsErrorMessage } = await loadModule("../src/lib/cms-messages.ts");

test("translated labels retain canonical order and payment API values", () => {
  assert.deepEqual(
    constants.ORDER_STATUSES.map((item) => item.value),
    ["pending", "accepted", "rejected", "inprogress", "completed", "cancelled"],
  );
  assert.deepEqual(
    constants.PAYMENT_STATUSES.map((item) => item.value),
    ["paid", "partial", "unpaid"],
  );
  assert.equal(
    constants.ORDER_STATUSES.find((item) => item.value === "inprogress").label,
    "Diproses",
  );
  assert.equal(
    constants.PAYMENT_STATUSES.find((item) => item.value === "unpaid").label,
    "Belum lunas",
  );
});
test("weekday labels translate without changing stored and filtered day values", () => {
  assert.deepEqual(constants.DAYS_OF_WEEK, [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
  ]);
  for (const [stored, displayed] of [
    ["Monday", "Senin"],
    ["Wednesday", "Rabu"],
    ["Friday", "Jumat"],
  ]) {
    assert.equal(weeks.formatDayDisplay(stored), displayed);
    assert.equal(weeks.normalizeDayName(displayed), stored);
  }
  assert.deepEqual(weeks.getWeekRange(new Date(2026, 9, 7)), {
    dateFrom: "2026-10-05",
    dateTo: "2026-10-09",
  });
});
test("human dates use Indonesian month names while ISO date keys remain stable", () => {
  assert.equal(dates.formatDate("2026-10-07", "d MMMM yyyy"), "7 Oktober 2026");
  assert.equal(dates.formatDate("2026-10-07", "yyyy-MM-dd"), "2026-10-07");
  assert.equal(dates.formatDate("not-a-date"), "not-a-date");
});
test("roles display Indonesian names without mutating role identifiers", () => {
  assert.equal(constants.formatRoleDisplay("chef"), "Koki");
  assert.equal(constants.formatRoleDisplay("user"), "Pengguna");
  assert.equal(constants.formatRoleDisplay("admin"), "Admin");
});
test("upstream errors use helpful Indonesian messages", () => {
  assert.equal(
    cmsErrorMessage(
      new Error("Price list item not found"),
      "Gagal membuat pesanan",
    ),
    "Gagal membuat pesanan",
  );
  assert.equal(
    cmsErrorMessage(
      new Error("Pilih lokasi pengantaran"),
      "Gagal membuat pesanan",
    ),
    "Pilih lokasi pengantaran",
  );
  assert.equal(
    cmsErrorMessage({ status: 401 }, "Gagal membuat pesanan"),
    "Sesi Anda berakhir. Silakan masuk kembali.",
  );
  assert.equal(
    cmsErrorMessage({ status: 403 }, "Gagal membuat pesanan"),
    "Anda tidak memiliki izin untuk tindakan ini.",
  );
});
