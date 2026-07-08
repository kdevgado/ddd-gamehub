import { useState } from "react";
import TriviaRoom from "./TriviaRoom.jsx";

export default function App() {
  const [mode, setMode] = useState(null);

  if (mode === "online") {
    return (
      <Shell>
        <TriviaRoom onBack={() => setMode(null)} />
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="hero-panel mode-panel">
        <p className="eyebrow">Choose how to play</p>
        <h1>Game Hub</h1>
        <p className="lead">One phone on the couch, or a live room across everyone&apos;s screens.</p>

        <div className="mode-grid">
          <a className="mode-card pass-mode" href="/pass-the-phone.html">
            <span className="mode-art" aria-hidden="true">
              <img src="/images/mask.gif" alt="" />
              <img src="/images/werewolf.gif" alt="" />
              <img src="/images/bomb.gif" alt="" />
            </span>
            <span className="mode-copy">
              <small>One device</small>
              <strong>Pass the Phone</strong>
              <em>Imposter, Werewolf, Mafia, Spyfall, and Who&apos;s Got the Bomb.</em>
              <span className="mode-action">Open game deck</span>
            </span>
          </a>

          <button className="mode-card online-mode" type="button" onClick={() => setMode("online")}>
            <span className="mode-art single-art" aria-hidden="true">
              <img src="/icons/mafia/detective.png" alt="" />
            </span>
            <span className="mode-copy">
              <small>Multiple devices</small>
              <strong>Online Room Code</strong>
              <em>Create a room, invite friends, and play Trivia Party together live.</em>
              <span className="mode-action">Enter online mode</span>
            </span>
          </button>
        </div>
      </section>
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <main className="app-shell">
      <div className="classified-bg" />
      {children}
    </main>
  );
}
