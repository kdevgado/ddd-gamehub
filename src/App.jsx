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
    }, 520);
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
              <strong>DDD</strong>
              <small>Game Hub</small>
            </span>
          </div>
          <div className="hub-availability">
            <i aria-hidden="true" />
            Local + live play
          </div>
        </header>

        <div className="hub-hero">
          <div className="hub-heading hub-reveal" style={{ "--reveal-delay": "120ms" }}>
            <p className="hub-kicker"><span>Party system</span> / pick a portal</p>
            <h1 id="hub-title">
              <span>Choose your</span>
              <strong>kind of chaos.</strong>
            </h1>
            <p>Secret roles on one screen or a live room on every phone. Zero setup drama—just choose a side and start playing.</p>
            <div className="hub-meta" aria-label="Game Hub features">
              <span><strong>07</strong> games</span>
              <span><strong>02</strong> ways to play</span>
              <span><strong>∞</strong> rematches</span>
            </div>
          </div>

          <div className="hub-orbit hub-reveal" style={{ "--reveal-delay": "180ms" }} aria-hidden="true">
            <div className="hub-orbit-ring orbit-outer" />
            <div className="hub-orbit-ring orbit-inner" />
            <span className="hub-orbit-node node-one" />
            <span className="hub-orbit-node node-two" />
            <div className="hub-core">
              <small>Ready to</small>
              <strong>PLAY</strong>
              <i />
            </div>
          </div>
        </div>

        <div className="mode-grid hub-mode-grid">
          <a
            className="mode-card pass-mode hub-reveal"
            href="/pass-the-phone.html"
            onClick={(event) => launchGame(event, "pass")}
            style={{ "--reveal-delay": "240ms" }}
          >
            <span className="mode-art pass-visual" aria-hidden="true">
              <span className="mode-number">01</span>
              <span className="character-stack">
                <img src="/images/mask-transparent.gif" alt="" />
                <img src="/images/werewolf-transparent.gif" alt="" />
                <img src="/images/bomb-transparent.gif" alt="" />
              </span>
              <span className="visual-caption">Same room / one screen</span>
            </span>
            <span className="mode-copy">
              <small><i aria-hidden="true" /> One device</small>
              <strong>Pass the phone</strong>
              <em>Bluff, accuse, survive. Five fast party games built for everyone in the room.</em>
              <span className="mode-tags" aria-hidden="true">
                <i>5 games</i>
                <i>Secret roles</i>
              </span>
              <span className="mode-action">Browse the game deck <i aria-hidden="true">↗</i></span>
            </span>
          </a>

          <button
            className="mode-card online-mode hub-reveal"
            type="button"
            disabled={Boolean(launchMode)}
            onClick={(event) => launchGame(event, "online")}
            style={{ "--reveal-delay": "310ms" }}
          >
            <span className="mode-art online-visual" aria-hidden="true">
              <span className="mode-number">02</span>
              <span className="demo-card uno-demo"><b>+4</b><small>Wild</small></span>
              <span className="demo-card trivia-demo"><b>?</b><small>Trivia</small></span>
              <span className="room-signal"><i /><i /><i /></span>
              <span className="visual-caption">Any screen / one room</span>
            </span>
            <span className="mode-copy">
              <small><i aria-hidden="true" /> Multiple devices</small>
              <strong>Online room</strong>
              <em>Share a four-letter code and play synchronized UNO or Trivia from every phone.</em>
              <span className="mode-tags" aria-hidden="true">
                <i>Live rooms</i>
                <i>2–8 players</i>
              </span>
              <span className="mode-action">Create or join a room <i aria-hidden="true">↗</i></span>
            </span>
          </button>
        </div>

        <footer className="hub-footer hub-reveal" style={{ "--reveal-delay": "380ms" }}>
          <span>Built for game night</span>
          <i aria-hidden="true" />
          <span>No app download required</span>
        </footer>

        <div className={`hub-transition ${launchMode ? "active" : ""}`} aria-hidden="true">
          <span>{launchMode === "online" ? "Opening live rooms" : "Dealing the game deck"}</span>
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
