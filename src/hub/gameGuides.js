// These guides describe this app's rules, including its local game variants.
export const GAME_GUIDES = {
  imposter: {
    intro: "A secret word, a few careful clues, and someone making it all up.",
    steps: [
      "Add at least three players, choose a word category, and set the number of imposters.",
      "Pass the phone so each person can read their card privately. Most players see the same word; imposters have to bluff.",
      "Take turns giving clues without saying the secret word. Listen for answers that don’t quite fit.",
      "Discuss your suspicions, select the players you suspect, and reveal the result.",
    ],
    goal: "The group tries to catch every imposter. An imposter who avoids suspicion escapes the round.",
    tip: "Start with one imposter and a familiar category. Turn on imposter hints for a gentler first round.",
  },
  uno: {
    intro: "Match the card. Change the colour. Try to keep your friendships intact.",
    steps: [
      "Create an UNO room and share its four-letter code. Once two to eight players have joined, the host starts the game.",
      "Everyone receives seven cards. On your turn, play a card matching the current colour or the top card’s number or symbol.",
      "Draw a card if you can’t play. If that new card is playable, play it or keep it and end your turn.",
      "Use Skip, Reverse, and draw cards to change the round. A Wild lets you choose the next colour.",
    ],
    goal: "Be the first player to empty your hand. The app highlights when someone has one card left.",
    tip: "In this version, +2 and +4 penalties apply immediately and skip the next player. Play +4 only when you have no card in the current colour.",
  },
  trivia: {
    intro: "A little knowledge helps. A confident guess sometimes does too.",
    steps: [
      "Create a Trivia Party room and have at least one friend join with the four-letter code.",
      "The host chooses the category, number of questions, and time allowed for each answer.",
      "Read each question on your own screen and choose an answer before the timer ends. Your first answer is locked in.",
      "Reveal the answer together, check the scores, and let the host move to the next question.",
    ],
    goal: "Each correct answer earns one point. Finish with the highest score on the leaderboard.",
    tip: "Try Mixed for a little of everything. Speed doesn’t add points, so use the time you have.",
  },
  werewolf: {
    intro: "A sleeping village, hidden werewolves, and stories that change by daylight.",
    steps: [
      "Add at least five players. Choose the number of werewolves and any extra roles you want in the village.",
      "Read each role privately, hide the card, and pass the phone. Follow the game-master script to guide the night.",
      "Resolve the night actions, then discuss who seems suspicious during the day.",
      "Vote to eliminate a living player, or choose no elimination. Follow the app into the next night until it announces a winner.",
    ],
    goal: "The village hunts every werewolf. Surviving werewolves win when at most one villager remains. Some special roles have their own victory conditions.",
    tip: "Keep the first round simple. Read each extra role’s description before adding it, and give everyone time to learn the night sequence.",
  },
  mafia: {
    intro: "The town has questions. The mafia has a very convincing explanation.",
    steps: [
      "Add at least five players, choose the number of mafia members, and deal everyone a private role.",
      "Follow the guided night actions. The mafia attacks, while the Doctor and Detective use their abilities.",
      "Bring the town together to compare stories and question suspicious alibis.",
      "Vote to eliminate a living suspect, reveal the outcome, and continue through the next night.",
    ],
    goal: "The town wins by finding every mafia member. The mafia wins if it survives with at most one town player left.",
    tip: "Keep roles private and follow the on-screen order. A quiet player isn’t automatically a guilty one.",
  },
  bomb: {
    intro: "Think of an answer. Pass the phone. Preferably in that order.",
    steps: [
      "Gather at least two people. Choose a category pack and fuse length; there’s no need to enter player names.",
      "Start the bomb and read the category on screen. The person holding the phone names something that fits.",
      "Once the group accepts the answer, pass the phone immediately. You don’t need to tap a button between answers.",
      "Keep answering and passing until the unpredictable fuse runs out. Use New fuse to start another round.",
    ],
    goal: "Avoid holding the phone when the bomb explodes. Whoever is holding it is caught that round.",
    tip: "Agree on what counts as a valid answer before starting, and pass the phone carefully even when the clock gets tense.",
  },
  spyfall: {
    intro: "Everyone knows where they are. One person is hoping nobody notices they don’t.",
    steps: [
      "Add at least three players, choose a location category, and set how many spies are undercover.",
      "Pass the phone for private reveals. Locals see the location and a cover role; spies see neither.",
      "Ask each other questions that make sense for the location, without naming it or making it too obvious.",
      "Compare the answers, select your suspected spies, and reveal who was blending in.",
    ],
    goal: "Locals try to identify every spy. Spies try to stay believable and escape the accusation.",
    tip: "Ask questions with a little room for interpretation. An answer that is too specific can give the location away.",
  },
};
