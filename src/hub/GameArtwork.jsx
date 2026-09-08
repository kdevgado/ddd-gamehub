import { gameArtworkMarkup } from "./artwork.js";

export default function GameArtwork({ game }) {
  return (
    <div
      className={`game-artwork artwork-${game}`}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: gameArtworkMarkup(game) }}
    />
  );
}
