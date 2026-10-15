// Each entry is a complete night/dawn pairing. Jokes never imply a role or cause of death.
const NIGHT_SCRIPTS = [
  {
    opening: "Night falls. The last door shuts. Somewhere outside, a dog starts barking, then stops. Everyone, close your eyes.",
    pack: "Something is moving between the houses.",
    hold: "A floorboard creaks. Then nothing. Everyone, keep your eyes closed.",
    dawn: "Morning. One door is still open. Nobody wants to be the first to look inside.",
    loss: "The village calls the roll. No answer from {names}. They did not survive the night.",
    safe: "You count once. Then again. Every villager has survived the night. For a moment, nobody quite believes it."
  },
  {
    opening: "The lights go out one by one. At the edge of the village, someone hears footsteps stop outside their window. Everyone, close your eyes.",
    pack: "The footsteps start again.",
    hold: "There is a noise outside. Nobody gets up to check. Keep your eyes closed.",
    dawn: "The bell rings for morning. You gather in the square. There should be more people here.",
    loss: "{names} will not be joining you. Their seats are empty. The village has questions. Nobody has a good answer.",
    safe: "Wait. Someone overslept. Everyone is here. Every villager has survived the night. Apparently the bell needs to be louder."
  },
  {
    opening: "Rain starts just after sunset. By midnight, it is loud enough to cover almost anything. Everyone, close your eyes.",
    pack: "Under the rain, a latch clicks open.",
    hold: "The rain keeps falling. Keep your eyes closed. We are not at morning yet.",
    dawn: "The rain stops. In the sudden quiet, someone screams.",
    loss: "You follow the sound. {names} did not make it through the night. Nobody speaks on the walk back.",
    safe: "A bad dream. Just a bad dream. You check every house. Every villager has survived the night."
  },
  {
    opening: "Nobody volunteers for the night watch. The meeting ends very quickly after that. Everyone, close your eyes.",
    pack: "The streets are empty. At least, they were a moment ago.",
    hold: "Somewhere, someone is definitely regretting not volunteering. Keep your eyes closed.",
    dawn: "Daylight. A crowd at the well. Someone asks if anyone has seen the others.",
    loss: "There is no easy way to say this. {names} did not survive. Someone suggests a village safety committee. Nobody looks reassured.",
    safe: "Every door opens. Every villager has survived the night. The night watch claims full credit, despite not existing."
  },
  {
    opening: "A candle burns in the last upstairs window. It goes out. Now the whole village is dark. Everyone, close your eyes.",
    pack: "A shadow stops beneath that window.",
    hold: "For a few seconds, even the wind stops. Keep your eyes closed.",
    dawn: "The sun comes up. You knock at each door. At one house, you knock again.",
    loss: "Still no answer. The search is over: {names} did not survive. The rest of you stand in the doorway, waiting for someone to say what happens next.",
    safe: "Then the door opens. Every villager has survived the night. You let out the breath you have been holding."
  },
  {
    opening: "The pub closes early. People walk home in pairs. One by one, they reach their doors. Everyone, close your eyes.",
    pack: "One set of footsteps takes a different route.",
    hold: "The village is quiet. Keep your eyes closed until I call morning.",
    dawn: "Breakfast is ready. The food goes cold while you wait for everyone to arrive.",
    loss: "{names} never arrive. A search confirms it: they did not survive the night. Their places at the table stay empty.",
    safe: "Finally, the last person walks in. Every villager has survived the night. Breakfast has not."
  },
  {
    opening: "You check the lock. Check it again. Put a chair against the door anyway. Everyone, close your eyes.",
    pack: "Outside, someone tests a handle.",
    hold: "The handle stops moving. Nobody knows whether that is better. Keep your eyes closed.",
    dawn: "Three knocks at the door. A neighbour tells you to come outside. Now.",
    loss: "The village has found {names}. They did not survive. Last night, you all heard something. Today, everyone says they heard nothing.",
    safe: "You search the village together. Every villager has survived the night. There are fresh marks on a door. Nobody wants to talk about those yet."
  },
  {
    opening: "Someone insists there is nothing to worry about. They still take the longest route home to avoid the woods. Everyone, close your eyes.",
    pack: "The road behind them is no longer empty.",
    hold: "A distant sound wakes nobody. Or nobody admits it. Keep your eyes closed.",
    dawn: "Morning arrives. You start counting faces. Then you stop.",
    loss: "The search is over. {names} did not survive the night. Yesterday you were all here. Today you have to carry on without them.",
    safe: "No. Count again. Every villager has survived the night. For once, being bad at counting is good news."
  }
];

// A shuffled bag prevents repeats until every pairing has been used. Persist the bag
// across games/reloads, but keep the selected script in round state so reviews stay stable.
export function createStoryRotation(storage, random = Math.random) {
  const key = "werewolf-story-rotation-v1";
  let remaining = [];
  let last = -1;
  try {
    const saved = JSON.parse(storage?.getItem(key) || "null");
    if (saved && Array.isArray(saved.remaining) && new Set(saved.remaining).size === saved.remaining.length
      && saved.remaining.every((index) => Number.isInteger(index) && index >= 0 && index < NIGHT_SCRIPTS.length)
      && Number.isInteger(saved.last) && saved.last >= 0 && saved.last < NIGHT_SCRIPTS.length
      && !saved.remaining.includes(saved.last)) {
      remaining = saved.remaining;
      last = saved.last;
    }
  } catch { /* Storage is optional; the in-memory rotation still works. */ }
  return {
    next() {
      if (!remaining.length) {
        remaining = NIGHT_SCRIPTS.map((_, index) => index);
        for (let index = remaining.length - 1; index > 0; index -= 1) {
          const other = Math.floor(random() * (index + 1));
          [remaining[index], remaining[other]] = [remaining[other], remaining[index]];
        }
        if (remaining.at(-1) === last) [remaining[0], remaining[remaining.length - 1]] = [remaining.at(-1), remaining[0]];
      }
      last = remaining.pop();
      try { storage?.setItem(key, JSON.stringify({ remaining, last })); } catch { /* Continue without persistence. */ }
      return NIGHT_SCRIPTS[last];
    }
  };
}

// Story copy never contains hidden player identities. Private details stay in host notes.
export function nightScenes(hasRole, round, script = NIGHT_SCRIPTS[0], openingAlreadyRead = false) {
  const scenes = [{
    title: "The village falls asleep",
    read: openingAlreadyRead ? "Everyone, keep your eyes closed. The Werewolves will act next." : script.opening,
    action: "Everyone closes their eyes. Only open them when your role is called.",
    note: "Read only the ‘Read aloud’ text to the group. Teal instructions describe actions; amber notes are for you. Wait for each action before continuing."
  }];
  scenes.push({
    title: "The Werewolves hunt",
    read: `${script.pack} Werewolves, open your eyes. Silently agree on one player to attack. When I have seen your choice, close your eyes.`,
    action: "The pack silently points to one target. Acknowledge their choice without speaking a name.",
    note: hasRole("Little Girl")
      ? "The Little Girl may secretly peek during this scene. Do not call her name or ask her to wake. Remember the pack’s target; record the final outcome at the end of this guide."
      : "Remember the pack’s target. Record the final outcome at the end of this guide; keep everyone asleep."
  });
  if (hasRole("Black Werewolf")) scenes.push({
    title: "The Black Werewolf’s decision",
    read: "Black Werewolf, open your eyes. Silently signal whether you wish to use your infection. Make your choice, then close your eyes.",
    action: "The Black Werewolf may use their one infection instead of a kill.",
    note: "Manual rule: this app does not track infection, its use, or a converted player’s team. If you use it, keep a separate role and team record and adjudicate affected outcomes yourself. Do not record an infected player as killed."
  });
  if (hasRole("Seer")) scenes.push({
    title: "The Seer checks a role",
    read: "Seer, open your eyes. Point silently to one player whose role you wish to learn. Wait for my answer, then close your eyes.",
    action: "The Seer chooses one player. Silently show that player’s role only to the Seer.",
    note: "Manual action: open the private living role reference below to check the answer. The app does not record investigations. Never announce the answer aloud."
  });
  if (hasRole("Guardian")) scenes.push({
    title: "The Guardian chooses protection",
    read: "Guardian, open your eyes. Silently choose one player to protect tonight. Once I acknowledge your choice, close your eyes.",
    action: "The Guardian points to one player, different from the player protected last night.",
    note: "Manual rule: record protection yourself; the app does not track it. If it blocks the pack’s attack, choose ‘No one was killed by the pack’ at the final scene. Otherwise record the pack’s target. Other night abilities still follow."
  });
  if (hasRole("Easter Bunny")) scenes.push({
    title: "The Easter Bunny gives out eggs",
    read: "Easter Bunny, open your eyes. Choose two players to receive a gift. Once I acknowledge your choice, close your eyes.",
    action: "Choose two players who do not already have an egg.",
    note: "Manual rule: track eggs separately. The app does not track gifts or automatically award the Easter Bunny’s win. If every other living player has an egg while the Bunny lives, adjudicate that win yourself."
  });
  const reminders = [];
  if (hasRole("Wise")) reminders.push("Wise automatically survives their first pack attack; voting Wise out removes surviving villagers’ powers.");
  if (hasRole("Survivor")) reminders.push("The app automatically spends Survivor protection to prevent death, up to twice per game.");
  if (hasRole("Hunter")) reminders.push("If the pack kills Hunter, the app pauses for a final shot.");
  if (hasRole("Cupid")) reminders.push("The lovers remain bound even if Cupid dies; the app applies heartbreak deaths.");
  if (round === 1 && hasRole("Angel")) reminders.push("Angel wins if eliminated in the first village vote. The app handles this when the vote resolves.");
  scenes.push({
    title: "Record the pack’s outcome",
    read: script.hold,
    action: "Game master: select the pack’s target below, or choose no kill if a manual protection blocked it. Confirm to resolve the attack and continue to any remaining abilities.",
    note: ["Do not wake the village yet. Ripper, Pyromaniac, and Black Cat prompts follow when applicable. Only confirm once you have checked manual protection and infection.", ...reminders].join(" "),
    controls: true
  });
  return scenes;
}

const abilities = {
  cupid: ["Cupid", "choose two players to bind as lovers", "Point to two living players. The app records their bond."],
  thief: ["Thief", "choose one player whose role you will steal", "Point to another living player. The app changes both roles; privately communicate the new roles before continuing."],
  ripper: ["Ripper", "choose one player to attack", "Point to one other living player. Confirm the target to resolve the attack."],
  pyromaniac: ["Pyromaniac", "choose whether to oil two players or burn the players you oiled earlier", "Silently indicate oil or burn, then choose targets if oiling. The app tracks oil and resolves deaths."],
  blackCat: ["Black Cat", "choose one player to start the vote with two votes against them", "Point to one living player. They will begin the village vote with two votes against them."],
  hunter: ["Hunter", "choose one player for your final shot", "Choose one living player. Confirm the final shot before continuing."]
};

export function abilityScenes(type, night, script = NIGHT_SCRIPTS[0], openNight = true) {
  const [role, choice, action] = abilities[type];
  return [{
    title: `${role} acts`,
    read: type === "hunter"
      ? "Hunter, you have been eliminated. Choose one player for your final shot."
      : `${openNight && (type === "cupid" || type === "thief") ? `${script.opening} ` : ""}${role}, open your eyes. Silently ${choice}. Wait until I acknowledge your choice.`,
    action,
    note: `${night ? "Everyone else stays asleep." : "Pause the village discussion."} Use the controls below. The next scene unlocks when this action is resolved.`,
    controls: true
  }, {
    title: "The choice is complete",
    read: type === "hunter"
      ? (night ? "The shot is fired. Everyone, keep your eyes closed." : "The shot is fired. Give me a moment to confirm the result.")
      : `${role}, close your eyes. Everyone else, keep your eyes closed.`,
    action: "Wait for the player to finish before continuing.",
    note: type === "cupid" ? "Before continuing, silently tap both lovers so they know they were chosen. Have them open their eyes, recognise each other, then close their eyes again. Do not announce their names." : "Review the private result below, then use the continue button. Reviewing scenes does not repeat the action."
  }];
}

export function dawnScene(names, script = NIGHT_SCRIPTS[0]) {
  return {
    title: "Dawn breaks",
    read: `${script.dawn} Everyone still in the game, open your eyes. ${names.length ? script.loss.replace("{names}", names.join(" and ")) : script.safe} Take a look around. Who do you trust now?`,
    action: "Eliminated players remain silent. Living players discuss who may be a Werewolf.",
    note: "Pause after the opening line. Let the room go quiet before announcing the outcome. All night abilities have finished. Keep surviving players’ roles and choices private."
  };
}

export const discussionScene = {
  title: "Time to talk",
  read: "Talk it through. Who do you suspect, and why? Give everyone a chance to answer.",
  action: "Let living players discuss, then move to the village vote.",
  note: "Guide the conversation without revealing your private knowledge. Eliminated players listen silently."
};

export const votingScene = {
  title: "The village decides",
  read: "Time to vote. Who do you think is a Werewolf? Make your choice.",
  action: "Collect the living players’ votes. Select the chosen player below, or choose ‘No one is voted’ if the village makes no elimination.",
  note: "Resolve ties with your group’s agreed rule before recording the result. Confirm only after the group has decided; any Black Cat votes are described below."
};

// Rendering is intentionally separate from game resolution: navigation cannot apply effects.
export function createStoryGuide(container, scenes, { controls, blocked = () => false, onLast = () => {} } = {}) {
  let position = 0;
  const content = document.createElement("div");
  const progress = document.createElement("p");
  progress.className = "story-progress";
  const heading = document.createElement("h3");
  heading.tabIndex = -1;
  const blocks = document.createElement("div");
  blocks.className = "story-blocks";
  content.append(progress, heading, blocks);
  const slot = document.createElement("div");
  const navigation = document.createElement("div");
  navigation.className = "button-row story-navigation";
  const back = document.createElement("button");
  back.type = "button";
  back.className = "btn secondary";
  back.textContent = "Back";
  const next = document.createElement("button");
  next.type = "button";
  next.className = "btn";
  next.textContent = "Next scene";
  navigation.append(back, next);
  container.replaceChildren(content, slot, navigation);
  container.classList.add("werewolf-story");
  if (controls) slot.append(controls);

  function render(focus = false) {
    const scene = scenes[position];
    progress.textContent = `Scene ${position + 1} of ${scenes.length}`;
    progress.setAttribute("role", "status");
    heading.textContent = scene.title;
    blocks.replaceChildren();
    for (const [key, label] of [["read", "Read aloud"], ["action", "Role action"], ["note", "Game master only"]]) {
      if (!scene[key]) continue;
      const block = document.createElement("div");
      block.className = `story-block story-${key}`;
      const kicker = document.createElement("strong");
      kicker.className = "story-label";
      kicker.textContent = label;
      const copy = document.createElement("p");
      copy.textContent = scene[key];
      block.append(kicker, copy);
      blocks.append(block);
    }
    slot.hidden = !(scene.controls || (controls && !blocked() && position === scenes.length - 1));
    back.disabled = position === 0;
    next.hidden = position === scenes.length - 1;
    next.disabled = Boolean(scene.controls && blocked());
    navigation.hidden = scenes.length === 1;
    onLast(position === scenes.length - 1);
    if (focus) heading.focus({ preventScroll: true });
  }
  back.addEventListener("click", () => { if (position > 0) { position -= 1; render(true); } });
  next.addEventListener("click", () => {
    if (position < scenes.length - 1 && !(scenes[position].controls && blocked())) {
      position += 1;
      render(true);
    }
  });
  render();
  return { refresh: () => render(), get position() { return position; } };
}
