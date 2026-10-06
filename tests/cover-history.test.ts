import assert from "node:assert/strict";
import { test } from "node:test";
import { coverHistoryPaths, rememberCover } from "../src/lib/cover-history";

test("preserva a capa anterior ao trocar por foto ou cor",()=>{
  assert.deepEqual(rememberCover(["antiga"],"atual","nova"),["nova","atual","antiga"]);
  assert.deepEqual(rememberCover([],"atual"),["atual"]);
});
test("restaurar uma capa move para o início sem duplicar",()=>{
  assert.deepEqual(rememberCover(["nova","antiga"],"nova","antiga"),["antiga","nova"]);
});
test("ignora entradas inválidas do histórico",()=>{
  assert.deepEqual(coverHistoryPaths([null,3,"","foto","foto"]),["foto"]);
});
