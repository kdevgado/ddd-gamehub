import test from "node:test";
import assert from "node:assert/strict";
import { createStoryRotation, nightScenes, abilityScenes, dawnScene } from "../src/werewolfStory.js";

test("a basic night ends with recording the pack outcome, without waking the village", () => {
  const scenes = nightScenes(() => false, 1);
  assert.equal(scenes.length, 3);
  assert.match(scenes[0].read, /close your eyes/);
  assert.match(scenes[1].read, /Werewolves, open your eyes/);
  assert.equal(scenes.at(-1).controls, true);
  assert.ok(scenes.every((scene) => !/everyone.*open your eyes/i.test(scene.read)));
});

test("only relevant living roles get scenes and passive powers stay in private notes", () => {
  const living = new Set(["Seer", "Wise", "Survivor", "Hunter", "Little Girl", "Angel"]);
  const scenes = nightScenes((role) => living.has(role), 1);
  assert.equal(scenes.length, 4);
  assert.ok(scenes.some((scene) => /Seer, open/.test(scene.read)));
  assert.ok(scenes.every((scene) => !/Guardian/.test(scene.read)));
  assert.match(scenes[1].note, /Little Girl/);
  assert.match(scenes.at(-1).note, /Wise.*Survivor.*Hunter.*Angel/);
  const laterNight = nightScenes((role) => living.has(role), 2);
  assert.doesNotMatch(laterNight.at(-1).note, /Angel/);
});

test("manual powers explain their limitations privately and give explicit sleep cues", () => {
  const scenes = nightScenes(() => true, 1);
  for (const role of ["Guardian", "Black Werewolf", "Easter Bunny", "Seer"]) {
    const scene = scenes.find((item) => item.read.includes(`${role}, open`));
    assert.ok(scene, role);
    assert.match(scene.read, /close your eyes/);
    assert.match(scene.note, /Manual/);
    assert.doesNotMatch(scene.read, /app|track|Manual/);
  }
  assert.match(scenes.find((scene) => /Guardian, open/.test(scene.read)).note, /does not track/);
});

test("targeted abilities pair a controlled choice with a closing scene", () => {
  for (const type of ["cupid", "thief", "ripper", "pyromaniac", "blackCat", "hunter"]) {
    const scenes = abilityScenes(type, true);
    assert.equal(scenes.length, 2);
    assert.equal(scenes[0].controls, true);
    assert.ok(!scenes[1].controls);
    assert.match(scenes[1].read, /eyes closed|close your eyes/);
    assert.doesNotMatch(scenes.map((scene) => scene.read).join(" "), /Alice|Bob/);
  }
  assert.doesNotMatch(abilityScenes("hunter", false)[1].read, /eyes/);
});

test("dawn announces accumulated public deaths or a peaceful night", () => {
  assert.match(dawnScene([]).read, /Every villager has survived/);
  const scene = dawnScene(["Alice", "Bob"]);
  assert.match(scene.read, /Alice and Bob/);
  assert.match(scene.read, /open your eyes/);
  assert.doesNotMatch(scene.read, /Werewolf|Seer|Cupid/);
});

test("new nights exhaust the script set before repeating and do not repeat at cycle boundaries", () => {
  const rotation = createStoryRotation(undefined, () => 0.5);
  const scripts = Array.from({ length: 24 }, () => rotation.next());
  for (let cycle = 0; cycle < 3; cycle += 1) {
    assert.equal(new Set(scripts.slice(cycle * 8, cycle * 8 + 8).map((script) => script.opening)).size, 8);
  }
  for (let index = 1; index < scripts.length; index += 1) {
    assert.notEqual(scripts[index].opening, scripts[index - 1].opening);
  }
});

test("rotation continues across games and page reloads using saved history", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  const openings = Array.from({ length: 8 }, () => createStoryRotation(storage, () => 0.5).next().opening);
  assert.equal(new Set(openings).size, 8);
  assert.notEqual(createStoryRotation(storage, () => 0.5).next().opening, openings.at(-1));
});

test("unavailable or corrupt storage does not prevent narration", () => {
  const brokenStorage = { getItem() { throw Error("blocked"); }, setItem() { throw Error("full"); } };
  const rotation = createStoryRotation(brokenStorage);
  assert.notEqual(rotation.next().opening, rotation.next().opening);
  for (const saved of ["{", '{"remaining":[999],"last":0}', '{"remaining":[1,1],"last":0}']) {
    assert.ok(createStoryRotation({ getItem: () => saved }).next().opening);
  }
});

test("all dawn variants announce only the actual outcome and never assign a hidden cause", () => {
  const rotation = createStoryRotation();
  for (let index = 0; index < 8; index += 1) {
    const script = rotation.next();
    const loss = dawnScene(["Alice", "Bob"], script).read;
    const safe = dawnScene([], script).read;
    assert.match(loss, /Alice and Bob/);
    assert.doesNotMatch(loss, /Every villager has survived/);
    assert.match(safe, /Every villager has survived/);
    assert.doesNotMatch(safe, /Alice|Bob|did not survive/);
    assert.doesNotMatch(loss + safe, /\{names\}|Werewolf|Seer|Cupid|Guardian|Ripper/);
    assert.equal(dawnScene(["Alice", "Bob"], script).read, loss, "Reviewing dawn keeps its wording");
    assert.match(nightScenes(() => false, 2, script)[0].read, /Everyone, close your eyes/);
  }
});

test("first-night roles share one opening instead of restarting the story between roles", () => {
  const script = createStoryRotation().next();
  assert.ok(abilityScenes("cupid", true, script, true)[0].read.startsWith(script.opening));
  assert.ok(!abilityScenes("thief", true, script, false)[0].read.includes(script.opening));
  assert.ok(!nightScenes(() => false, 1, script, true)[0].read.includes(script.opening));
});
