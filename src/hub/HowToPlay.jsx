import { useState } from "react";
import { GAMES } from "./games.js";
import { GAME_GUIDES } from "./gameGuides.js";
import Icon from "./Icons.jsx";
import "./how-to-play.css";

export default function HowToPlay({ onOpenRoom }) {
  // Native disclosures retain the reader's choices after the initial layout.
  const [expandedOnLoad] = useState(() => !window.matchMedia("(max-width: 760px)").matches);
  return (
    <section className="lounge-how lounge-width" id="how-to-play" aria-labelledby="how-title">
      <div className="how-intro" data-scroll-reveal>
        <p className="lounge-eyebrow">Everyone’s invited</p>
        <h2 id="how-title">Less planning.<br /><span>More playing.</span></h2>
        <p>A few simple rules. A room full of possibilities.<br />Here’s everything you need for your first round.</p>
      </div>
      <div className="how-steps">
        <div data-scroll-reveal data-scroll-scene><span>01</span><div><h3>Find your people</h3><p>Gather around one phone, or meet in an online room from wherever you are.</p></div></div>
        <div data-scroll-reveal data-scroll-scene><span>02</span><div><h3>Follow your mood</h3><p>A quick icebreaker, a little bluffing, or a battle of wits. Pick what feels right.</p></div></div>
        <div data-scroll-reveal data-scroll-scene><span>03</span><div><h3>Make a night of it</h3><p>The game takes you through the setup. You bring the company. And maybe snacks.</p></div></div>
      </div>

      <div className="how-play-modes">
        <article className="how-mode-guide" data-scroll-reveal data-scroll-scene>
          <span className="how-mode-icon"><Icon name="phone" size={23} /></span>
          <p className="lounge-eyebrow">One screen. Same table.</p>
          <h3>Pass the phone</h3>
          <p>For Imposter, Werewolf, Mafia, Bomb, and Spyfall. You only need one device and a few people nearby.</p>
          <details className="how-mode-instructions" open={expandedOnLoad}>
            <summary>Setup instructions <span aria-hidden="true">+</span></summary>
            <ul>
              <li>Pick a game, add your players, and follow the setup. Bomb skips the names and gets straight to it.</li>
              <li>For hidden-role games, read your card privately, then hide it before passing the phone.</li>
              <li>Talk, bluff, and make decisions together. The screen guides the reveals, votes, and next rounds.</li>
            </ul>
          </details>
          <span className="how-mode-note"><span className="status-dot" /> Local games work offline once the app is installed or cached.</span>
        </article>
        <article className="how-mode-guide" data-scroll-reveal data-scroll-scene>
          <span className="how-mode-icon"><Icon name="globe" size={23} /></span>
          <p className="lounge-eyebrow">Your own screens. One room.</p>
          <h3>Play online together</h3>
          <p>For UNO and Trivia Party. Play from the same sofa or different places, with a device for each person.</p>
          <details className="how-mode-instructions" open={expandedOnLoad}>
            <summary>Setup instructions <span aria-hidden="true">+</span></summary>
            <ul>
              <li>The host picks an online game, enters a player name, and creates a room.</li>
              <li>Friends choose Join a room, enter their names, and use the host’s four-letter code.</li>
              <li>Wait until everyone appears in the lobby. The host starts the round when the group is ready.</li>
            </ul>
          </details>
          <span className="how-mode-note"><Icon name="globe" size={13} /> Keep an internet connection throughout the game.</span>
        </article>
      </div>

      <div className="how-game-guides">
        <div className="how-guide-intro" data-scroll-reveal>
          <p className="lounge-eyebrow">The short version</p>
          <h3>Meet your<br /><span>next game.</span></h3>
          <p>Open a game for the setup, the basics, and what it takes to win. Then jump straight in.</p>
          <div className="first-game-note"><Icon name="star" size={18} /><p>New to the group?<br /><strong>Start with Imposter or Bomb.</strong><br />A little icebreaker goes a long way.</p></div>
        </div>
        <div className="game-guide-list">
          {GAMES.map((game, index) => {
            const guide = GAME_GUIDES[game.id];
            return (
              <details className="game-guide" name="game-rules" key={game.id} open={expandedOnLoad && game.id === "imposter"} data-scroll-reveal>
                <summary>
                  <span className="guide-number">{String(index + 1).padStart(2, "0")}</span>
                  <span className="guide-heading"><strong>{game.name}</strong><span>{game.players} <i>·</i> {game.time}</span></span>
                  <span className="guide-toggle" aria-hidden="true">+</span>
                </summary>
                <div className="game-guide-content">
                  <p className="guide-intro">{guide.intro}</p>
                  <ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                  <div className="guide-goal"><span>The goal</span><p>{guide.goal}</p></div>
                  <p className="guide-tip"><strong>A little tip</strong> {guide.tip}</p>
                  {game.mode === "online" ? (
                    <button className="guide-play" type="button" onClick={() => onOpenRoom(game.id)}>Play {game.name} <Icon name="diagonal" size={15} /></button>
                  ) : (
                    <a className="guide-play" href={`/pass-the-phone.html?game=${game.id}`}>Play {game.name} <Icon name="diagonal" size={15} /></a>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </div>
      <p className="how-closing-note">The best house rule? Give everyone a chance to learn, keep it friendly, and play another round.</p>
    </section>
  );
}
