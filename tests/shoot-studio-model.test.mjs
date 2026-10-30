import { test } from "node:test";
import assert from "node:assert/strict";
import {
  newProject,
  recommendedIds,
  addRecommendations,
  makeEditPlan,
  restoreProject,
  clampSeconds,
  PART_LIMIT,
} from "../src/prototype/register/shoot/studio-model.ts";
const media = (duration) => ({
  blob: new Blob(["fixture"]),
  duration,
  url: "blob:test",
  hasAudio: false,
});
test("front and rear seats are separate editable parts", () => {
  const p = newProject();
  assert.ok(p.parts.some((x) => x.id === "seat"));
  assert.ok(p.parts.some((x) => x.id === "rear-seat"));
  assert.equal(
    p.parts.reduce((n, x) => n + x.seconds, 0),
    27,
  );
});
test("EV recommendations do not invent engine/exhaust shots", () => {
  const ids = recommendedIds("electric");
  assert.ok(ids.includes("charge"));
  assert.ok(!ids.includes("engine"));
  assert.ok(!ids.includes("exhaust"));
});
test("recommendations preserve custom footage and disabled selection without duplicating", () => {
  const p = newProject();
  p.parts[0].media = media(10);
  p.parts[0].enabled = false;
  const custom = {
    ...p.parts[1],
    id: "custom-1",
    custom: true,
    label: "캠핑 공간",
  };
  const next = addRecommendations([...p.parts, custom], "family");
  assert.equal(next[0], p.parts[0]);
  assert.equal(next[0].enabled, false);
  assert.ok(next.includes(custom));
  assert.equal(new Set(next.map((x) => x.id)).size, next.length);
  assert.ok(next.some((x) => x.id === "trunk"));
});
test("empty and unrecorded parts cannot become fake clips", () => {
  assert.deepEqual(makeEditPlan(newProject().parts, 30), []);
});
test("trim starts, source length and disabled parts are respected", () => {
  const p = newProject();
  p.parts[0] = { ...p.parts[0], seconds: 10, start: 3, media: media(5) };
  p.parts[1] = { ...p.parts[1], enabled: false, media: media(8) };
  const plan = makeEditPlan(p.parts, 30);
  assert.equal(plan.length, 1);
  assert.equal(plan[0].start, 3);
  assert.equal(plan[0].seconds, 2);
});
test("long recordings are apportioned to exact target frames", () => {
  const p = newProject();
  p.parts.forEach((x) => {
    x.media = media(30);
    x.seconds = 20;
  });
  for (const budget of [15, 30, 45, 60]) {
    const plan = makeEditPlan(p.parts, budget);
    assert.equal(
      plan.reduce((n, x) => n + x.frames, 0),
      budget * 30,
    );
    assert.ok(plan.every((x) => x.frames > 0 && x.frames <= 600));
  }
});
test("short footage is never padded or looped to reach target", () => {
  const p = newProject();
  p.parts[0].media = media(2.5);
  assert.equal(makeEditPlan(p.parts, 60)[0].seconds, 2.5);
});
test("seconds are validated, and malformed stored projects fall back safely", () => {
  assert.equal(clampSeconds(-10), 1);
  assert.equal(clampSeconds(100), 60);
  assert.equal(clampSeconds(NaN), 4);
  assert.equal(restoreProject(null).version, 1);
  const p = newProject();
  p.parts = [
    ...p.parts,
    ...p.parts,
    ...Array.from({ length: 50 }, (_, i) => ({
      ...p.parts[0],
      id: `custom-${i}`,
    })),
  ];
  const r = restoreProject(p);
  assert.equal(r.parts.length, PART_LIMIT);
  assert.equal(new Set(r.parts.map((x) => x.id)).size, PART_LIMIT);
});
