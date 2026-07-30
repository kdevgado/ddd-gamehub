import { useState } from "react";
import TriviaRoom from "./TriviaRoom.jsx";

export default function App() {
  const [mode, setMode] = useState(null);
  const [launchMode, setLaunchMode] = useState(null);

  function launchGame(event, destination) {
    event?.preventDefault();
    if (launchMode) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      if (destination === "online") setMode("online");
      else window.location.assign("/pass-the-phone.html");
      return;
    }

    setLaunchMode(destination);
    window.setTimeout(() => {
      if (destination === "online") {
        setMode("online");
        setLaunchMode(null);
      } else {
        window.location.assign("/pass-the-phone.html");
      }
    }, 360);
  }

  if (mode === "online") {
    return (
      <Shell>
        <TriviaRoom onBack={() => setMode(null)} />
      </Shell>
    );
  }

  return (
    <Shell>
      <section className={`hub-home ${launchMode ? "is-launching" : ""}`} aria-labelledby="hub-title">
        <header className="hub-header hub-reveal" style={{ "--reveal-delay": "40ms" }}>
          <div className="hub-brand" aria-label="DDD Game Hub">
            <span className="hub-brand-mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span>
              <strong>DDD Game Hub</strong>
              <small>Pick a game and gather around</small>
            </span>
          </div>
          <div className="hub-availability">
            <span aria-hidden="true">07</span>
            Games in the cabinet
          </div>
        </header>

        <div className="hub-hero">
          <div className="hub-heading hub-reveal" style={{ "--reveal-delay": "110ms" }}>
            <p className="hub-kicker"><span>Tonight’s collection</span> Cabinet no. 07</p>
            <h1 id="hub-title">
              <span>Pull up a chair.</span>
              <strong>Pick your game.</strong>
            </h1>
            <p>A hand-picked shelf of quick party games, hidden roles, cards, and trivia—ready whenever your table is.</p>
            <div className="hub-meta" aria-label="Game Hub features">
              <span><strong>2–12</strong> players</span>
              <span><strong>3–20</strong> minutes</span>
              <span><strong>2</strong> ways to play</span>
            </div>
          </div>

          <div className="cabinet-stamp hub-reveal" style={{ "--reveal-delay": "170ms" }} aria-hidden="true">
            <span className="cabinet-stamp-ring">
              <small>The game</small>
              <strong>Cabinet</strong>
              <i>DDD</i>
            </span>
            <div className="cabinet-token-row">
              <b>●</b>
              <b>◆</b>
              <b>▲</b>
            </div>
          </div>
        </div>

        <div className="mode-grid hub-mode-grid">
          <a
            className="mode-card pass-mode hub-reveal"
            href="/pass-the-phone.html"
            onClick={(event) => launchGame(event, "pass")}
            style={{ "--reveal-delay": "230ms" }}
          >
            <span className="mode-art pass-visual" aria-hidden="true">
              <span className="mode-number">Shelf 01</span>
              <span className="game-box-emblem">
                <i className="mask-eye" />
                <b>?</b>
                <span className="counter-row"><em /><em /><em /></span>
              </span>
              <span className="visual-caption">One screen · same table</span>
            </span>
            <span className="mode-copy">
              <small><i aria-hidden="true" /> Pass-the-phone collection</small>
              <strong>Pass the phone</strong>
              <em>Deal private roles, bluff convincingly, and pass one screen around the table.</em>
              <span className="mode-facts">
                <i>2–12 players</i>
                <i>3–10 min</i>
              </span>
              <span className="mode-tags">
                <i>Imposter</i>
                <i>Werewolf</i>
                <i>Mafia</i>
                <i>Bomb</i>
                <i>Spyfall</i>
              </span>
              <span className="mode-action">Open this game box <i aria-hidden="true">→</i></span>
            </span>
          </a>

          <button
            className="mode-card online-mode hub-reveal"
            type="button"
            disabled={Boolean(launchMode)}
            onClick={(event) => launchGame(event, "online")}
            style={{ "--reveal-delay": "300ms" }}
          >
            <span className="mode-art online-visual" aria-hidden="true">
              <span className="mode-number">Shelf 02</span>
              <span className="demo-card uno-demo"><b>7</b><small>Wild hand</small></span>
              <span className="demo-card trivia-demo"><b>?</b><small>Trivia</small></span>
              <span className="room-signal"><i /><i /><i /></span>
              <span className="visual-caption">Many screens · one room</span>
            </span>
            <span className="mode-copy">
              <small><i aria-hidden="true" /> Live room collection</small>
              <strong>Online room</strong>
              <em>Share a four-letter code, then play a synchronized round from every phone.</em>
              <span className="mode-facts">
                <i>2–8 players</i>
                <i>5–20 min</i>
              </span>
              <span className="mode-tags">
                <i>UNO</i>
                <i>Trivia Party</i>
              </span>
              <span className="mode-action">Create or join a room <i aria-hidden="true">→</i></span>
            </span>
          </button>
        </div>

        <footer className="hub-footer hub-reveal" style={{ "--reveal-delay": "370ms" }}>
          <span>Made for game night</span>
          <i aria-hidden="true" />
          <span>No rulebook required</span>
          <i aria-hidden="true" />
          <span>Phone and tablet friendly</span>
        </footer>

        <div className={`hub-transition ${launchMode ? "active" : ""}`} aria-hidden="true">
          <span>{launchMode === "online" ? "Opening live rooms" : "Taking the box from the shelf"}</span>
          <i />
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="app-shell">
      <div className="classified-bg" aria-hidden="true" />
      {children}
    </main>
  );
}
