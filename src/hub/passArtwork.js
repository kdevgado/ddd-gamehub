import { gameArtworkMarkup } from "./artwork.js";

// Decorate after the page has built its buttons, without loading React.
export function decoratePassArtwork() {
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
}
