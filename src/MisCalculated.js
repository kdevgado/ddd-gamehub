import { QUESTION_PAIRS, createRound, questionForPlayer, saveEstimate, resolveVote, rankEstimates } from "./miscalculatedGame.js";
import "./miscalculated.css";

export const MISCALCULATED_MODE = {
  name: "MisCalculated", mark: "MC", motif: "≈", type: "miscalculated",
  colorA: "#607985", colorB: "#C49339", duration: "5–10 min", difficulty: "Easy",
  minPlayers: 3, defaultTimer: 1, defaultTimerEnabled: false,
  defaultThreats: 1, threatOptions: [1, 2], twoThreatMin: 3,
  threatLabel: "Imposters", threatSingular: "imposter", threatPlural: "imposters",
  hasSecret: false,
  cardText: "Honest estimates. A different question. An imposter who has no idea.",
  playerLead: "Add at least three players. Everyone estimates honestly; even the imposters don't know who they are.",
  setupTitle: "Set up MisCalculated",
  setupLead: "Australian and Asian questions about dating, food, awkward mates and adult life. Guess real survey results, and choose how many imposters get a different question.",
  summary: "Flip your card privately, estimate with the slider, then hide and pass. After everyone answers, reveal the real question and explain your numbers. Agree on every imposter to win; a wrong guess means the imposters win. Finally, reveal the answer and see who was closest.",
};

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(text, onClick, className = "btn") {
  const node = element("button", className, text);
  node.type = "button";
  node.addEventListener("click", onClick);
  return node;
}

const formatNumber = (number) => number.toLocaleString("en-AU");

export function createMisCalculated({ root, showScreen, playSound, onPlayAgain, onChangeGame, onNewPlayers }) {
  let round = null;
  let remainingPairs = [];
  let lastPairId = null;
  let playerIndex = 0;
  let phase = "handoff";
  let selected = new Set();
  let groupWins = false;

  function numberWithUnit(value) {
    if (round.scale.unit === "%") return `${formatNumber(value)}%`;
    return round.scale.unit === "total" ? formatNumber(value) : `${formatNumber(value)} ${round.scale.unit}`;
  }

  function sourceLink(question) {
    const link = element("a", "mc-source", `Source: ${question.source.label}`);
    link.href = question.source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  }

  function heading(kicker, title, lead) {
    const header = element("div", "stack center");
    header.append(element("p", "eyebrow", kicker), element("h2", "", title));
    if (lead) header.append(element("p", "lead", lead));
    return header;
  }

  function transition(nextPhase) {
    phase = nextPhase;
    render();
    playSound("tap");
  }

  function questionPanel(label, text) {
    const panel = element("div", "mc-question-card stack center");
    panel.append(element("p", "eyebrow", label), element("h3", "mc-question", text));
    return panel;
  }

  function estimatesList() {
    const list = element("ul", "mc-estimates");
    round.players.forEach((name, index) => {
      const row = element("li", "mc-estimate-row");
      row.append(element("span", "mc-player", name), element("strong", "mc-number", numberWithUnit(round.estimates[index])));
      list.append(row);
    });
    return list;
  }

  function renderHandoff(content) {
    content.append(heading(`MisCalculated · ${playerIndex + 1} of ${round.players.length}`, `Pass to ${round.players[playerIndex]}`, "Only this player should see the next card."));
    const card = element("div", "mc-question-card mc-card-back stack center");
    card.append(element("span", "mc-card-mark", "≈"), element("h3", "", "Your private question"), element("p", "hint", "Keep your question and estimate to yourself. Everyone should estimate honestly."));
    content.append(card, button("Flip my card", () => transition("estimate")));
  }

  function renderEstimate(content) {
    content.append(heading(`MisCalculated · ${playerIndex + 1} of ${round.players.length}`, round.players[playerIndex], "Guess the survey result. Go with your gut and keep your question private."));
    const card = questionPanel("Your question", questionForPlayer(round, playerIndex));
    card.classList.add("mc-card-flip");
    const controls = element("div", "mc-slider-panel stack center");
    const label = element("label", "eyebrow", "Your estimate");
    label.htmlFor = "mcEstimate";
    const output = element("output", "mc-estimate-value");
    output.htmlFor = "mcEstimate";
    output.setAttribute("aria-live", "off");
    const slider = element("input", "mc-slider");
    slider.type = "range";
    slider.id = "mcEstimate";
    slider.min = round.scale.min;
    slider.max = round.scale.max;
    slider.step = round.scale.step;
    slider.value = 0;
    slider.setAttribute("aria-describedby", "mcSliderHint");
    const range = element("div", "mc-range-labels");
    range.append(element("span", "", numberWithUnit(round.scale.min)), element("span", "", numberWithUnit(round.scale.max)));
    const adjustment = element("div", "mc-adjustment");
    function adjust(amount) {
      slider.value = Math.min(round.scale.max, Math.max(round.scale.min, Number(slider.value) + amount));
      updateValue();
    }
    const decrease = button("−", () => adjust(-1), "mc-step");
    const increase = button("+", () => adjust(1), "mc-step");
    decrease.setAttribute("aria-label", "Decrease estimate by 1");
    increase.setAttribute("aria-label", "Increase estimate by 1");
    adjustment.append(decrease, output, increase);
    function updateValue() {
      const value = Number(slider.value);
      output.value = numberWithUnit(value);
      slider.setAttribute("aria-valuetext", numberWithUnit(value));
      decrease.disabled = value === round.scale.min;
      increase.disabled = value === round.scale.max;
    }
    slider.addEventListener("input", updateValue);
    updateValue();
    const hint = element("p", "hint", "50% means half the people surveyed. Slide to your best guess; use − or + to fine-tune it.");
    hint.id = "mcSliderHint";
    controls.append(label, adjustment, slider, range, hint);
    content.append(card, controls, button("Lock estimate & hide", () => {
      if (phase !== "estimate" || !saveEstimate(round, playerIndex, Number(slider.value))) return;
      playerIndex += 1;
      // Replacing the entire card removes private text and resets the slider
      // before another player can see the phone.
      transition(playerIndex === round.players.length ? "ready" : "handoff");
    }));
  }

  function renderDiscussion(content) {
    content.append(heading("The real question", "Explain your number", "Take turns explaining your estimate. Whose number doesn't fit? Who's talking their way out?"));
    content.append(questionPanel("Everyone was meant to answer", round.realQuestion.text), estimatesList());
    content.append(element("p", "hint", "Your numbers are locked. Give everyone a chance to explain before agreeing on your suspects."));
    content.append(button("Choose the group's suspects", () => transition("vote")));
  }

  function renderVote(content) {
    const count = round.imposterIndexes.size;
    content.append(heading("Group vote", "Who got a different question?", `Discuss until you agree. Select exactly ${count} ${count === 1 ? "suspect" : "suspects"}. The group must catch every imposter to win.`));
    content.append(questionPanel("The real question", round.realQuestion.text));
    const list = element("div", "vote-list");
    const status = element("p", "hint");
    status.setAttribute("role", "status");
    const reveal = button("Confirm group vote", () => {
      if (phase !== "vote" || selected.size !== count) return;
      groupWins = resolveVote(round, selected);
      transition("verdict");
    }, "btn danger");
    const voteButtons = [];
    function updateSelection() {
      status.textContent = `${selected.size} of ${count} suspects selected. Confirm only when the group agrees.`;
      reveal.disabled = selected.size !== count;
      voteButtons.forEach((node, index) => {
        node.classList.toggle("selected", selected.has(index));
        node.setAttribute("aria-pressed", String(selected.has(index)));
        node.disabled = !selected.has(index) && selected.size === count;
      });
    }
    round.players.forEach((name, index) => {
      const node = button("", () => {
        if (selected.has(index)) selected.delete(index);
        else if (selected.size < count) selected.add(index);
        updateSelection();
        playSound("tap");
      }, "vote-btn");
      node.append(element("span", "", name), element("span", "", numberWithUnit(round.estimates[index])));
      voteButtons.push(node);
      list.append(node);
    });
    updateSelection();
    content.append(list, status, reveal, button("Back to discussion", () => transition("discussion"), "btn secondary"));
  }

  function renderVerdict(content) {
    content.append(heading("The truth", groupWins ? "The group wins!" : "The imposters win!", groupWins ? "You found everyone who had a different question." : "At least one imposter escaped the group's guess."));
    const names = [...round.imposterIndexes].map((index) => round.players[index]).join(", ");
    content.append(questionPanel(round.imposterIndexes.size === 1 ? "The imposter" : "The imposters", names));
    content.append(element("p", "hint", `The group accused: ${[...selected].map((index) => round.players[index]).join(", ")}.`));
    content.append(questionPanel("Their different question", round.otherQuestion.text));
    content.append(element("p", "hint", "They were estimating honestly too. Now see who came closest to the real answer."));
    content.append(button("Reveal the correct answer", () => transition("answer")));
  }

  function renderAnswer(content) {
    content.append(heading("The survey says…", "Who was actually closest?"), questionPanel("The real question", round.realQuestion.text));
    const answer = element("div", "mc-answer stack center");
    answer.append(element("strong", "mc-estimate-value", numberWithUnit(round.realQuestion.answer)), element("p", "hint", round.realQuestion.explanation));
    answer.append(sourceLink(round.realQuestion));
    content.append(answer);
    content.append(element("p", "hint", "The answer is what people said in that survey, at that time. Closest to that result gets bragging rights."));
    const ranked = rankEstimates(round);
    const closest = ranked.filter((entry) => entry.closest);
    content.append(element("p", "mc-closest", `${closest.length > 1 ? "Tied closest" : "Closest"}: ${closest.map((entry) => entry.name).join(", ")}.`));
    const list = element("ol", "mc-estimates");
    ranked.forEach((entry) => {
      const row = element("li", `mc-estimate-row${entry.closest ? " mc-is-closest" : ""}`);
      const player = element("div", "mc-player");
      player.append(element("strong", "", entry.name), element("span", "mc-role-label", `${entry.isImposter ? "Imposter" : "Regular player"}${entry.closest ? " · Closest" : ""}`));
      const score = element("div", "mc-score");
      score.append(element("strong", "mc-number", numberWithUnit(entry.estimate)), element("span", "mc-role-label", entry.distance === 0 ? "Exactly right!" : `${formatNumber(entry.distance)} percentage ${entry.distance === 1 ? "point" : "points"} away`));
      row.append(player, score);
      list.append(row);
    });
    content.append(list);
    if (closest.some((entry) => entry.isImposter)) content.append(element("p", "hint", "An imposter was closest without even knowing the real question!"));
    content.append(element("p", "hint", `Imposter question: ${round.otherQuestion.text} Answer: ${numberWithUnit(round.otherQuestion.answer)}. ${round.otherQuestion.explanation}`));
    content.append(sourceLink(round.otherQuestion));
    content.append(element("p", "hint", groupWins ? "The group won the vote." : "The imposters won the vote."));
    content.append(button("Play again", onPlayAgain), button("Choose another game", onChangeGame, "small-link"), button("Start over with new players", onNewPlayers, "small-link"));
  }

  function render() {
    const content = element("div", "stack mc-content");
    if (phase === "handoff") renderHandoff(content);
    else if (phase === "estimate") renderEstimate(content);
    else if (phase === "ready") {
      content.append(heading("All estimates locked", "Bring everyone together", "Put the phone where everyone can see it. It's time to find out which question you were meant to answer."), button("Reveal the real question", () => transition("discussion")));
    } else if (phase === "discussion") renderDiscussion(content);
    else if (phase === "vote") renderVote(content);
    else if (phase === "verdict") renderVerdict(content);
    else if (phase === "answer") renderAnswer(content);
    root.replaceChildren(content);
    showScreen("miscalculated");
  }

  return {
    start(players, imposterCount) {
      if (!remainingPairs.length) remainingPairs = [...QUESTION_PAIRS];
      const options = remainingPairs.filter((pair) => pair.id !== lastPairId);
      const pair = options[Math.floor(Math.random() * options.length)];
      remainingPairs = remainingPairs.filter((candidate) => candidate.id !== pair.id);
      lastPairId = pair.id;
      round = createRound(players, imposterCount, pair);
      playerIndex = 0;
      selected = new Set();
      groupWins = false;
      transition("handoff");
    },
    clear() {
      round = null;
      selected.clear();
      root.replaceChildren();
    },
  };
}
