import test from "node:test";
import assert from "node:assert/strict";
import { QUESTION_PAIRS, createRound, questionForPlayer, saveEstimate, resolveVote, rankEstimates } from "../src/miscalculatedGame.js";

const players = ["Alice", "Bob", "Charlie"];
// Keep rule expectations independent of edits to the party question pack.
const pair = { unit: "%", max: 100, questions: [
  { text: "First survey question", answer: 40 },
  { text: "Different survey question", answer: 80 },
] };
const makeRound = (count = 1) => createRound(players, count, pair, () => 0);
function answeredRound(count = 1) {
  const round = makeRound(count);
  round.players.forEach((_, index) => saveEstimate(round, index, 20 + index));
  return round;
}

test("requires at least three players and a valid mixture of roles", () => {
  assert.throws(() => createRound(players.slice(0, 2), 1, pair), /three/);
  for (const count of [0, -1, 1.5, 3, 4, NaN]) assert.throws(() => makeRound(count), /imposter/);
  assert.equal(makeRound(2).imposterIndexes.size, 2);
});

test("every player receives exactly the question assigned to their hidden role", () => {
  for (const count of [1, 2]) {
    const round = makeRound(count);
    assert.equal(round.imposterIndexes.size, count);
    const privateQuestions = players.map((_, index) => questionForPlayer(round, index));
    assert.equal(privateQuestions.filter((text) => text === round.realQuestion.text).length, players.length - count);
    assert.equal(privateQuestions.filter((text) => text === round.otherQuestion.text).length, count);
    assert.ok(privateQuestions.every((text) => !/imposter|real question/i.test(text)));
    assert.deepEqual(round.estimates, [null, null, null]);
  }
});

test("either question can be real without changing the slider or exposing an answer", () => {
  const first = makeRound();
  const second = createRound(players, 1, pair, () => 0.99);
  assert.notEqual(first.realQuestion.text, second.realQuestion.text);
  assert.equal(first.realQuestion.text, second.otherQuestion.text);
  assert.deepEqual(first.scale, second.scale);
  assert.equal(typeof questionForPlayer(first, 0), "string");
});

test("accepts slider endpoints, including zero, and locks each player's first estimate", () => {
  const round = makeRound();
  assert.equal(saveEstimate(round, 0, 0), true);
  assert.equal(saveEstimate(round, 0, 50), false);
  assert.equal(round.estimates[0], 0);
  for (const value of [-1, pair.max + 1, 2.5, NaN, Infinity, "100"]) assert.equal(saveEstimate(round, 1, value), false);
  assert.equal(saveEstimate(round, -1, 1), false);
  assert.equal(saveEstimate(round, 3, 1), false);
  assert.equal(saveEstimate(round, 1, pair.max), true);
});

test("vote and ranking cannot finish until everyone has answered", () => {
  const round = makeRound();
  assert.throws(() => resolveVote(round, round.imposterIndexes), /Everyone/);
  assert.throws(() => rankEstimates(round), /Everyone/);
});

test("group wins only for the exact set of imposters; incomplete votes cannot resolve", () => {
  for (const count of [1, 2]) {
    const round = answeredRound(count);
    const imposters = [...round.imposterIndexes];
    const regular = players.findIndex((_, index) => !round.imposterIndexes.has(index));
    assert.equal(resolveVote(round, imposters), true);
    assert.equal(resolveVote(round, [regular, ...imposters.slice(1)]), false);
    assert.throws(() => resolveVote(round, []), /suspect/);
    assert.throws(() => resolveVote(round, [0, 1, 2]), /suspect/);
    assert.throws(() => resolveVote(round, [-1, ...imposters.slice(1)]), /suspect/);
    if (count === 2) assert.throws(() => resolveVote(round, [imposters[0]]), /suspect/);
  }
});

test("ranking uses the real answer, includes imposters, and recognises equal-distance ties", () => {
  const round = makeRound();
  const imposter = [...round.imposterIndexes][0];
  const regulars = players.map((_, index) => index).filter((index) => index !== imposter);
  saveEstimate(round, imposter, round.realQuestion.answer - 10);
  saveEstimate(round, regulars[0], round.realQuestion.answer + 10);
  saveEstimate(round, regulars[1], round.otherQuestion.answer);
  const ranked = rankEstimates(round);
  assert.deepEqual(ranked.map((entry) => entry.distance), [10, 10, 40]);
  assert.equal(ranked.filter((entry) => entry.closest).length, 2);
  assert.ok(ranked.some((entry) => entry.isImposter && entry.closest));
  assert.equal(resolveVote(round, regulars.slice(0, 1)), false);
});

test("perfect estimates tie and a new round has no previous answers", () => {
  const round = makeRound();
  players.forEach((_, index) => saveEstimate(round, index, round.realQuestion.answer));
  assert.ok(rankEstimates(round).every((entry) => entry.closest && entry.distance === 0));
  assert.deepEqual(makeRound().estimates, [null, null, null]);
  assert.deepEqual(players, ["Alice", "Bob", "Charlie"]);
});

test("every party survey question has a distinct partner, a source and a reachable percentage", () => {
  assert.equal(new Set(QUESTION_PAIRS.map((entry) => entry.id)).size, QUESTION_PAIRS.length);
  const texts = QUESTION_PAIRS.flatMap((entry) => entry.questions.map((question) => question.text));
  assert.equal(new Set(texts).size, texts.length);
  for (const entry of QUESTION_PAIRS) {
    assert.equal(entry.unit, "%");
    assert.equal(entry.max, 100);
    assert.equal(entry.questions.length, 2);
    assert.notEqual(entry.questions[0].text, entry.questions[1].text);
    for (const question of entry.questions) {
      assert.ok(Number.isInteger(question.answer));
      assert.ok(question.answer >= 0 && question.answer <= entry.max);
      assert.ok(question.explanation.length > 0);
      assert.ok(question.source.label.length > 0);
      assert.equal(new URL(question.source.url).protocol, "https:");
    }
  }
});
