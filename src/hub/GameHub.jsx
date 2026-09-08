import { useEffect, useRef, useState } from "react";
import { FILTERS, GAMES } from "./games.js";
import GameArtwork from "./GameArtwork.jsx";
import HeroArtwork from "./HeroArtwork.jsx";
import HowToPlay from "./HowToPlay.jsx";
import Icon from "./Icons.jsx";
import useAtmosphere from "./useAtmosphere.js";

function GameCard({ game, onOpenRoom, spotlight }) {
  const Tag = game.mode === "online" ? "button" : "a";
  const action = game.mode === "online"
    ? { type: "button", onClick: () => onOpenRoom(game.id) }
    : { href: `/pass-the-phone.html?game=${game.id}` };
  return (
    <Tag className={`lounge-game ${game.featured ? "game-featured" : ""} ${spotlight ? "is-picked" : ""}`} {...action} aria-label={`Play ${game.name}`}>
      <div className="game-image">
        <GameArtwork game={game.id} />
        <span className="game-medium"><Icon name={game.mode === "online" ? "globe" : "phone"} size={13} />{game.mode === "online" ? "Online" : "Pass the phone"}</span>
        {game.featured && <span className="game-featured-label"><Icon name="star" size={12} /> The icebreaker</span>}
        <span className="game-launch"><Icon name="diagonal" size={21} /></span>
      </div>
      <div className="game-details">
        <span className="game-mode-text"><Icon name={game.mode === "online" ? "globe" : "phone"} size={14} />{game.mode === "online" ? "Online" : "One phone"}</span>
        <span className="game-category">{game.category}</span>
        <h3>{game.name}</h3>
        <p>{game.description}</p>
        <div className="game-specs"><span><Icon name="people" size={14} />{game.players}</span><span><Icon name="clock" size={13} />{game.time}</span></div>
      </div>
    </Tag>
  );
}

export default function GameHub({ onOpenRoom }) {
  const [filter, setFilter] = useState("all");
  const [picked, setPicked] = useState(null);
  const rootRef = useRef(null);
  const dialogRef = useRef(null);
  const shuffleRef = useRef(null);
  useAtmosphere(rootRef);
  const visibleGames = GAMES.filter((game) => filter === "all" || game.mode === filter);

  useEffect(() => {
    if (!picked) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      shuffleRef.current?.focus({ preventScroll: true });
    };
  }, [picked]);

  function surpriseMe() {
    const options = visibleGames.filter((game) => game.id !== picked?.id);
    setPicked(options[Math.floor(Math.random() * options.length)] || visibleGames[0]);
  }

  return (
    <div className="lounge" ref={rootRef}>
      <a className="lounge-skip" href="#collection">Skip to games</a>
      <header className="lounge-header lounge-width">
        <a className="lounge-brand" href="/" aria-label="DDD Game Hub home"><span className="lounge-monogram" aria-hidden="true"><i /><i /><i /></span><span>ddd<span className="brand-divider">/</span><span className="brand-caption">game hub</span></span></a>
        <nav className="lounge-nav" aria-label="Main navigation"><a className="nav-current" href="#collection">The collection</a><a href="#how-to-play">How to play</a></nav>
        <button className="lounge-join" type="button" onClick={() => onOpenRoom("uno", "join")}>Join a room <Icon name="diagonal" size={15} /></button>
      </header>

      <main>
        <section className="lounge-hero lounge-width" aria-labelledby="lounge-title">
          <div className="hero-copy">
            <p className="lounge-eyebrow"><span className="tiny-star">✳</span> A good night starts here</p>
            <h1 id="lounge-title">Good company.<br />Great games.<br /><span>A little chaos.</span></h1>
            <p className="hero-description">Put the everyday on pause. A collection of games<br className="desktop-break" /> for your favourite people and the moments in between.</p>
            <div className="hero-actions"><a className="lounge-button" href="#collection">Find your next game <Icon name="arrow" /></a><span className="hero-note">Free to play.<br />Easy to get carried away.</span></div>
            <div className="hero-footnote"><span className="status-dot" /> Seven games. Endless “one more round.”</div>
          </div>
          <HeroArtwork />
          <a className="hero-scroll" href="#collection"><Icon name="down" size={14} /><span>Scroll to play</span></a>
        </section>

        <div className="lounge-values"><div className="lounge-width"><span><Icon name="people" size={16} /> Good with your kind of people</span><i /><span><Icon name="phone" size={16} /> One phone or a whole room</span><i /><span><Icon name="star" size={16} /> Less setup. More stories.</span></div></div>

        <section className="lounge-collection lounge-width" id="collection" aria-labelledby="collection-title" data-reveal>
          <div className="collection-heading"><div><p className="lounge-eyebrow">The collection <span className="collection-count">07</span></p><h2 id="collection-title">Find your kind of fun<span>.</span></h2></div><p>Same couch or miles apart.<br />There’s a game for that.</p></div>
          <div className="collection-toolbar"><div className="collection-filters" role="group" aria-label="Filter games by play style">{FILTERS.map((item) => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}{item.id === "all" && <span>7</span>}</button>)}</div><button className="shuffle-button" type="button" aria-label="Surprise me" onClick={surpriseMe} ref={shuffleRef}><Icon name="shuffle" size={16} /><span>Surprise me</span></button></div>
          <p className="sr-only" role="status">{visibleGames.length} games shown</p>
          <div className={`lounge-grid ${filter === "online" ? "grid-online" : ""}`}>
            {visibleGames.map((game) => <GameCard game={game} key={game.id} onOpenRoom={onOpenRoom} />)}
          </div>
          <div className="collection-bottom"><span>A little friendly competition looks good on you.</span><span>Pick a game. Make a memory. <Icon name="star" size={14} /></span></div>
        </section>

        <HowToPlay onOpenRoom={onOpenRoom} />
      </main>

      <footer className="lounge-footer lounge-width"><a className="footer-wordmark" href="/">ddd<span> / game hub</span></a><span>Made for the moments between everything else.</span><a href="#lounge-title">Back to the good stuff <Icon name="diagonal" size={14} /></a></footer>

      {picked && <dialog className="pick-dialog" ref={dialogRef} aria-labelledby="pick-title" onCancel={() => setPicked(null)} onClick={(event) => { if (event.target === event.currentTarget) setPicked(null); }}><div className="pick-dialog-content"><button className="pick-close" type="button" aria-label="Close suggestion" onClick={() => setPicked(null)}><Icon name="close" /></button><p className="lounge-eyebrow"><Icon name="shuffle" size={15} /> Leave it to a little chance</p><h2 id="pick-title">Tonight’s pick.</h2><GameCard game={picked} onOpenRoom={onOpenRoom} spotlight /><button className="pick-again" type="button" onClick={surpriseMe}>One more roll <Icon name="shuffle" size={14} /></button></div></dialog>}
    </div>
  );
}
