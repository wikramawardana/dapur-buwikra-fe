import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/lib/menu-generator-auth.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ES2022,
  },
});
const { authorizeMenuGenerator: authorize } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
test("admin and chef authenticated sessions may generate", () => {
  for (const role of ["admin", "chef"])
    assert.deepEqual(
      authorize(
        { user: { role }, session: { token: "valid-session" } },
        null,
        undefined,
      ),
      { authorized: true, token: "valid-session" },
    );
});
test("anonymous, regular users and tokenless sessions are denied", () => {
  for (const session of [
    null,
    { user: { role: "user" }, session: { token: "session" } },
    { user: { role: "admin" } },
  ])
    assert.equal(authorize(session, null, undefined).authorized, false);
});
test("only explicitly configured bot credentials are accepted", () => {
  assert.equal(authorize(null, "Bearer random", undefined).authorized, false);
  assert.equal(
    authorize(null, "Bearer random", "configured-secret").authorized,
    false,
  );
  assert.equal(
    authorize(null, "Bearer same-length-wrong", "configured-secret").authorized,
    false,
  );
  assert.equal(
    authorize(null, "Bearer configured-secret", "configured-secret").authorized,
    true,
  );
  assert.equal(
    authorize(null, "Bearer ", "configured-secret").authorized,
    false,
  );
});
test("GET and POST authorize before invoking paid AI parsing", () => {
  const route = readFileSync(
    new URL("../src/app/api/admin/menus/generate/route.ts", import.meta.url),
    "utf8",
  );
  for (const method of ["POST", "GET"]) {
    const handler = route
      .split(`export async function ${method}`)[1]
      .split("export async function")[0];
    assert.ok(
      handler.indexOf("if (!auth.authorized)") <
        handler.indexOf("await parseMenuTextWithAI"),
    );
    assert.ok(handler.includes("authorizeMenuGenerator("));
  }
});
