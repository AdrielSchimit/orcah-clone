import assert from "node:assert/strict";
import { test } from "node:test";
import { readHandoffToken, readSessionToken, safeAppPath, signHandoffToken, signSessionToken } from "../src/lib/session-token";
process.env.AUTH_SECRET = "synthetic-session-test-secret-do-not-use-in-production";
test("handoff cannot authenticate as a session", async () => {
  const token = await signHandoffToken(123);
  assert.equal(await readSessionToken(token), null);
  assert.equal((await readHandoffToken(token))?.userId, 123);
});
test("normal session cannot authenticate as handoff", async () => {
  const token = await signSessionToken(123, "empresa-teste");
  assert.equal(await readHandoffToken(token), null);
  assert.equal((await readSessionToken(token))?.userId, 123);
});
test("redirect restricts paths to painel and onboarding", () => {
  for (const path of ["//example.com", "/painel-externo", "/painel/../login", "/painel/%2e%2e/login", "/painel\\abc", "https://example.com"]) assert.equal(safeAppPath(path), "/painel");
  assert.equal(safeAppPath("/painel/orcamentos?filtro=aberto"), "/painel/orcamentos?filtro=aberto");
});
test("rejects tokens without exp, non-numeric ids and other algorithms", async () => {
  const { SignJWT } = await import("jose");
  const key = new TextEncoder().encode(process.env.AUTH_SECRET);
  const noExp = await new SignJWT({ userId: 123 }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().sign(key);
  await assert.rejects(readSessionToken(noExp));
  const stringId = await new SignJWT({ userId: "123" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(key);
  assert.equal(await readSessionToken(stringId), null);
  const zeroId = await new SignJWT({ userId: 0, purpose: "handoff" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1m").sign(key);
  assert.equal(await readHandoffToken(zeroId), null);
  const hs512 = await new SignJWT({ userId: 123 }).setProtectedHeader({ alg: "HS512" }).setIssuedAt().setExpirationTime("1h").sign(new Uint8Array(64).fill(7));
  await assert.rejects(readSessionToken(hs512));
});
