export { QUESTION_PAIRS } from "./miscalculatedQuestions.js";

export function createRound(players, imposterCount, pair, random = Math.random) {
  if (players.length < 3) throw new Error("MisCalculated needs at least three players.");
  if (!Number.isInteger(imposterCount) || imposterCount < 1 || imposterCount >= players.length) {
    throw new Error("Choose at least one imposter and leave at least one regular player.");
  }
  const indexes = players.map((_, index) => index);
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }
  const realIndex = Math.floor(random() * 2);
  return {
    players: [...players],
    imposterIndexes: new Set(indexes.slice(0, imposterCount)),
    realQuestion: pair.questions[realIndex],
    otherQuestion: pair.questions[1 - realIndex],
    scale: { min: 0, max: pair.max, step: 1, unit: pair.unit },
    estimates: players.map(() => null),
  };
}

export function questionForPlayer(round, index) {
  return (round.imposterIndexes.has(index) ? round.otherQuestion : round.realQuestion).text;
}

export function saveEstimate(round, index, value) {
  if (!Number.isInteger(index) || index < 0 || index >= round.players.length) return false;
  if (round.estimates[index] !== null || !Number.isInteger(value)) return false;
  if (value < round.scale.min || value > round.scale.max) return false;
  round.estimates[index] = value;
  return true;
}

export function resolveVote(round, suspects) {
  const selected = new Set(suspects);
  if (round.estimates.some((estimate) => estimate === null)) throw new Error("Everyone must estimate first.");
  if (selected.size !== round.imposterIndexes.size || [...selected].some((index) => !Number.isInteger(index) || index < 0 || index >= round.players.length)) {
    throw new Error("Agree on one suspect for each imposter before revealing the result.");
  }
  return [...selected].every((index) => round.imposterIndexes.has(index));
}

export function rankEstimates(round) {
  if (round.estimates.some((estimate) => estimate === null)) throw new Error("Everyone must estimate first.");
  const ranked = round.players.map((name, index) => ({
    name, index, estimate: round.estimates[index],
    distance: Math.abs(round.estimates[index] - round.realQuestion.answer),
    isImposter: round.imposterIndexes.has(index),
  })).sort((a, b) => a.distance - b.distance || a.index - b.index);
  return ranked.map((entry) => ({ ...entry, closest: entry.distance === ranked[0].distance }));
}
