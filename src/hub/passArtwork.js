import { gameArtworkMarkup } from "./artwork.js";

// The page builds its game buttons synchronously; this module decorates them
// after parsing without loading React or changing any game event handlers.
document.querySelectorAll(".game-card[data-game] .game-art").forEach((container) => {
  const game = container.closest("[data-game]").dataset.game;
  const markup = gameArtworkMarkup(game);
  if (!markup) return;
  const artwork = document.createElement("span");
  artwork.className = `game-artwork artwork-${game}`;
  artwork.setAttribute("aria-hidden", "true");
  artwork.innerHTML = markup;
  container.replaceChildren(artwork);
});
