import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/office-pricing.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
});
const {
  getOfficePriceList,
  getPackageDisplayName,
  repriceDayOrders,
  resolvePickupLocation,
} = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

function item(id, name, price, category = "main", is_active = true) {
  return { id, name, price, category, is_active };
}
const catalog = [
  item("regular", "Paket Mantap", 25000),
  item("hermina", "Paket Mantap Hermina", 22000),
  item("addon", "Tambah Nasi", 5000, "addon"),
  item("addon-hermina", "Tambah Nasi Hermina", 4000, "addon"),
  item("shared", "Telur", 6000, "addon"),
  item("inactive", "Paket Lama Hermina", 1000, "main", false),
];

test("Trinity and Gama Tower show regular prices without Hermina variants", () => {
  for (const location of ["Shopee Trinity", "Gama Tower"]) {
    assert.deepEqual(
      getOfficePriceList(catalog, location).map((entry) => entry.id),
      ["regular", "addon", "shared"],
    );
  }
  assert.deepEqual(getOfficePriceList(catalog, ""), []);
});

test("Hermina overrides matching packages and retains shared add-ons", () => {
  const entries = getOfficePriceList([...catalog].reverse(), "RS Hermina");
  assert.deepEqual(entries.map((entry) => entry.id).sort(), [
    "addon-hermina",
    "hermina",
    "shared",
  ]);
  assert.equal(entries.find((entry) => entry.id === "hermina").price, 22000);
  assert.equal(getPackageDisplayName("Paket Mantap Hermina"), "Paket Mantap");
  assert.equal(getPackageDisplayName("Paket Mantap (Hermina)"), "Paket Mantap");
});

test("switching offices replaces names and prices while retaining days and quantities", () => {
  const before = {
    "2026-10-12": [
      { name: "Paket Mantap", qty: 2, unit_price: 25000 },
      { name: "Tambah Nasi", qty: 1, unit_price: 5000 },
    ],
  };
  const hermina = repriceDayOrders(before, catalog, "Hermina");
  assert.deepEqual(hermina["2026-10-12"], [
    { name: "Paket Mantap Hermina", qty: 2, unit_price: 22000 },
    { name: "Tambah Nasi Hermina", qty: 1, unit_price: 4000 },
  ]);
  assert.deepEqual(repriceDayOrders(hermina, catalog, "Trinity"), before);
  assert.equal(before["2026-10-12"][0].unit_price, 25000);
});

test("unavailable packages do not carry over into another office", () => {
  const entries = [
    ...catalog,
    item("exclusive", "Paket Khusus Hermina", 30000),
  ];
  assert.deepEqual(
    repriceDayOrders(
      { day: [{ name: "Paket Khusus Hermina", qty: 1, unit_price: 30000 }] },
      entries,
      "Trinity",
    ),
    { day: [] },
  );
});

test("office links select only an active unambiguous pickup point", () => {
  const points = ["Shopee Trinity", "Gama Tower", "RS Hermina"];
  assert.equal(resolvePickupLocation("trinity", points), "Shopee Trinity");
  assert.equal(resolvePickupLocation("gama", points), "Gama Tower");
  assert.equal(resolvePickupLocation("hermina", points), "RS Hermina");
  assert.equal(resolvePickupLocation("unknown", points), "");
  assert.equal(
    resolvePickupLocation("hermina", ["Hermina A", "Hermina B"]),
    "",
  );
});

test("the Trinity screenshot catalog excludes every higher-priced Hermina variant", () => {
  const actualCatalog = [
    item("pas", "Porsi Pas", 20000),
    item("mantap", "Porsi Mantap", 25000),
    item("pas-hermina", "Porsi Pas - Hermina", 25000),
    item("kenyang", "Porsi Kenyang", 30000),
    item("mantap-hermina", "Porsi Mantap - Hermina", 30000),
    item("kenyang-hermina", "Porsi Kenyang - Hermina", 35000),
  ];
  const trinity = getOfficePriceList(actualCatalog, "Trinity - 18 Floor");
  assert.deepEqual(
    trinity.map(({ name, price }) => ({ name, price })),
    [
      { name: "Porsi Pas", price: 20000 },
      { name: "Porsi Mantap", price: 25000 },
      { name: "Porsi Kenyang", price: 30000 },
    ],
  );
  const hermina = repriceDayOrders(
    { day: [{ name: "Porsi Mantap", qty: 1, unit_price: 25000 }] },
    actualCatalog,
    "Hermina",
  );
  assert.deepEqual(hermina.day, [
    { name: "Porsi Mantap - Hermina", qty: 1, unit_price: 30000 },
  ]);
  assert.deepEqual(repriceDayOrders(hermina, actualCatalog, "Gama Tower").day, [
    { name: "Porsi Mantap", qty: 1, unit_price: 25000 },
  ]);
});
