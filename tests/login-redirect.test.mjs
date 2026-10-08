import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/login-redirect.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022 },
});
const { safeLoginRedirect } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);

test("login preserves internal destinations, queries and anchors", () => {
  for (const path of [
    "/dashboard",
    "/admin/menus",
    "/order/2026-10-12?pickup=trinity#menu",
    "/orders?q=Bu%20Wikra",
  ]) {
    assert.equal(safeLoginRedirect(path), path);
  }
});

test("external, malformed and looping login destinations fall back safely", () => {
  for (const path of [
    null,
    "",
    "https://example.com",
    "//example.com",
    "/\\example.com",
    "/\n/example.com",
    "/\t/example.com",
    "javascript:alert(1)",
    "/login?callbackUrl=/login",
  ]) {
    assert.equal(safeLoginRedirect(path), "/dashboard");
  }
});
