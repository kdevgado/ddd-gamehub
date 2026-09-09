import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js";
import useUnoDealAnimation from "./useUnoDealAnimation.js";
import plusFourCardArt from "../icons/Uno/plus_four.jpg";
import reverseIcon from "../icons/Uno/reverse.png";
import skipIcon from "../icons/Uno/skip.png";
import unoIcon from "../icons/Uno/Uno.png";
import wildCardArt from "../icons/Uno/wild_card.jpg";
import {
  UNO_COLORS,
  UNO_COLOR_LABELS,
  canPlayCard,
  cardAriaLabel,
  cardLabel,
  createUnoGame,
  drawCards,
  nextTurnIndex
} from "./unoGame.js";

const CARD_PLAY_ANIMATION_MS = 480;
const CARD_DRAG_THRESHOLD_PX = 8;
const CARD_DRAG_SETTLE_MS = 180;
const UNO_ACTION_SYMBOLS = {
  draw2: "+2",
  reverse: "\u21bb",
  skip: "\u2715",
  wild: "\u2726",
  wild4: "+4"
};
const UNO_CARD_ICONS = {
  reverse: reverseIcon,
  skip: skipIcon
};
const UNO_CARD_ART = {
  wild: wildCardArt,
  wild4: plusFourCardArt
};

function cardImpactType(card) {
  return UNO_ACTION_SYMBOLS[card?.value] ? card.value : "number";
}

function roomRef(code) {
  return doc(db, "rooms", code);
}

function playerName(room, playerId) {
  return room.players?.[playerId]?.name || "A player";
}

function actionCopy(room) {
  const action = room.uno?.lastAction;
  if (!action) return "The game is ready.";
  const name = playerName(room, action.playerId);
  if (action.type === "start") return `${name} goes first.`;
  if (action.type === "draw") return `${name} drew a card and can play it or end their turn.`;
  if (action.type === "draw-pass") return `${name} drew a card. Turn passed.`;
  if (action.type === "pass") return `${name} kept the drawn card.`;
  if (action.type === "win") return `${name} played their last card!`;
  if (action.type === "play") {
    const suffix = action.effect === "reverse"
      ? " Play direction reversed."
      : action.effect === "skip"
        ? " Next player skipped."
        : action.penalty
          ? ` ${action.penalty} cards dealt.`
          : "";
    return `${name} played ${action.card}.${suffix}`;
  }
  return "Game updated.";
}

export default function UnoRoom({ room, playerId, players, isHost, error, setError }) {
  const [busy, setBusy] = useState(false);
  const [wildCardId, setWildCardId] = useState(null);
  const [playingCard, setPlayingCard] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [impactMove, setImpactMove] = useState(null);
  const discardRef = useRef(null);
  const dragGestureRef = useRef(null);
  const dragCleanupTimeoutRef = useRef(null);
  const suppressCardClickRef = useRef(false);
  const previousMoveRef = useRef(room.uno?.moveNumber);
  const moveNumber = room.uno?.moveNumber;
  const lastActionType = room.uno?.lastAction?.type;
  const { deckRef, handRef, opponentsRef, flights, finishFlight } = useUnoDealAnimation(room, playerId);
  const dealing = flights.some((flight) => flight.opening);
  const incomingCardIds = new Set(flights.filter((flight) => flight.playerId === playerId).map((flight) => flight.cardId));
  const receiving = dealing || incomingCardIds.size > 0;

  function visibleCardCount(id) {
    return Math.max(0, (room.uno?.hands?.[id]?.length || 0) - flights.filter((flight) => flight.playerId === id).length);
  }

  useEffect(() => {
    const previousMove = previousMoveRef.current;
    previousMoveRef.current = moveNumber;

    if (previousMove === undefined || previousMove === moveNumber || !["play", "win"].includes(lastActionType)) {
      return undefined;
    }

    setImpactMove(moveNumber);
    const timeout = window.setTimeout(() => {
      setImpactMove((currentMove) => currentMove === moveNumber ? null : currentMove);
    }, 720);

    return () => window.clearTimeout(timeout);
  }, [lastActionType, moveNumber]);

  useEffect(() => () => {
    if (dragCleanupTimeoutRef.current) window.clearTimeout(dragCleanupTimeoutRef.current);
  }, []);

  function pointIsOverDiscard(clientX, clientY) {
    const bounds = discardRef.current?.getBoundingClientRect();
    if (!bounds) return false;
    const tolerance = 14;
    return clientX >= bounds.left - tolerance
      && clientX <= bounds.right + tolerance
      && clientY >= bounds.top - tolerance
      && clientY <= bounds.bottom + tolerance;
  }

  function dragVisual(gesture, clientX, clientY, phase = "dragging") {
    return {
      card: gesture.card,
      overDiscard: pointIsOverDiscard(clientX, clientY),
      phase,
      style: {
        top: clientY - gesture.offsetY,
        left: clientX - gesture.offsetX,
        width: gesture.sourceRect.width,
        height: gesture.sourceRect.height
      }
    };
  }

  function scheduleDragCleanup(callback) {
    if (dragCleanupTimeoutRef.current) window.clearTimeout(dragCleanupTimeoutRef.current);
    dragCleanupTimeoutRef.current = window.setTimeout(() => {
      dragCleanupTimeoutRef.current = null;
      callback();
    }, CARD_DRAG_SETTLE_MS);
  }

  function startCardDrag(event, card) {
    if (busy || receiving || (event.pointerType === "mouse" && event.button !== 0)) return;
    const sourceRect = event.currentTarget.getBoundingClientRect();
    dragGestureRef.current = {
      card,
      dragging: false,
      offsetX: event.clientX - sourceRect.left,
      offsetY: event.clientY - sourceRect.top,
      pointerId: event.pointerId,
      sourceRect,
      startX: event.clientX,
      startY: event.clientY
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveCardDrag(event) {
    const gesture = dragGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (!gesture.dragging) {
      const distance = Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY);
      if (distance < CARD_DRAG_THRESHOLD_PX) return;
      gesture.dragging = true;
      suppressCardClickRef.current = true;
    }

    event.preventDefault();
    setDraggedCard(dragVisual(gesture, event.clientX, event.clientY));
  }

  function finishCardDrag(event, cancelled = false) {
    const gesture = dragGestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    dragGestureRef.current = null;

    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!gesture.dragging) return;

    event.preventDefault();
    window.setTimeout(() => {
      suppressCardClickRef.current = false;
    }, 0);

    const currentVisual = dragVisual(gesture, event.clientX, event.clientY);
    if (cancelled || !currentVisual.overDiscard) {
      setDraggedCard({
        ...currentVisual,
        overDiscard: false,
        phase: "returning",
        style: {
          ...currentVisual.style,
          top: gesture.sourceRect.top,
          left: gesture.sourceRect.left
        }
      });
      scheduleDragCleanup(() => setDraggedCard(null));
      return;
    }

    const discardBounds = discardRef.current.getBoundingClientRect();
    setDraggedCard({
      ...currentVisual,
      phase: "settling",
      style: {
        ...currentVisual.style,
        top: discardBounds.top + (discardBounds.height - gesture.sourceRect.height) / 2,
        left: discardBounds.left + (discardBounds.width - gesture.sourceRect.width) / 2
      }
    });

    if (gesture.card.color === "wild") {
      scheduleDragCleanup(() => {
        setDraggedCard(null);
        setWildCardId(gesture.card.id);
      });
      return;
    }

    void playCard(gesture.card.id, null, false).finally(() => setDraggedCard(null));
  }

  function handleCardClick(card) {
    if (suppressCardClickRef.current || receiving) return;
    if (card.color === "wild") setWildCardId(card.id);
    else void playCard(card.id);
  }

  async function animateCardToDiscard(cardId) {
    if (typeof document === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const card = room.uno?.hands?.[playerId]?.find((handCard) => handCard.id === cardId);
    const source = document.querySelector(`.uno-hand [data-card-id="${cardId}"]`);
    const destination = discardRef.current?.querySelector(".uno-card");
    if (!card || !source || !destination) return;

    const sourceRect = source.getBoundingClientRect();
    const destinationRect = destination.getBoundingClientRect();
    const travelX = destinationRect.left + (destinationRect.width - sourceRect.width) / 2 - sourceRect.left;
    const travelY = destinationRect.top + (destinationRect.height - sourceRect.height) / 2 - sourceRect.top;
    const arcHeight = Math.min(130, Math.max(72, Math.abs(travelX) * 0.18 + 72));
    const destinationScale = destinationRect.width / sourceRect.width;

    setPlayingCard({
      card,
      id: `${card.id}-${Date.now()}`,
      style: {
        top: sourceRect.top,
        left: sourceRect.left,
        width: sourceRect.width,
        height: sourceRect.height,
        "--uno-flight-x": `${travelX}px`,
        "--uno-flight-y": `${travelY}px`,
        "--uno-flight-mid-x": `${travelX * 0.5}px`,
        "--uno-flight-mid-y": `${travelY * 0.46 - arcHeight}px`,
        "--uno-flight-rotation": `${travelX >= 0 ? 13 : -13}deg`,
        "--uno-flight-scale": destinationScale.toFixed(3)
      }
    });

    await new Promise((resolve) => window.setTimeout(resolve, CARD_PLAY_ANIMATION_MS));
  }

  async function startGame() {
    if (!isHost || busy) return;
    if (players.length < 2) return setError("UNO needs at least 2 players.");
    if (players.length > 8) return setError("UNO supports up to 8 players in one room.");

    setBusy(true);
    setError("");
    try {
      await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(roomRef(room.code));
        if (!snapshot.exists()) throw new Error("Room closed.");
        const latestRoom = snapshot.data();
        if (latestRoom.hostId !== playerId || latestRoom.phase !== "lobby") throw new Error("The lobby changed.");
        const latestPlayers = Object.values(latestRoom.players || {}).sort((a, b) => a.joinedAt - b.joinedAt);
        if (latestPlayers.length < 2 || latestPlayers.length > 8) throw new Error("UNO needs 2 to 8 players.");

        transaction.update(roomRef(room.code), {
          phase: "uno",
          uno: createUnoGame(latestPlayers.map((player) => player.id)),
          updatedAt: serverTimestamp()
        });
      });
    } catch (transactionError) {
      setError(transactionError.message || "Could not start UNO.");
    } finally {
      setBusy(false);
    }
  }

  async function playCard(cardId, chosenColor = null, animate = true) {
    if (busy || receiving) return;
    setBusy(true);
    setError("");
    try {
      if (chosenColor) setWildCardId(null);
      if (animate) await animateCardToDiscard(cardId);
      await runTransaction(db, async (transaction) => {
        const reference = roomRef(room.code);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists()) throw new Error("Room closed.");
        const latestRoom = snapshot.data();
        if (latestRoom.phase !== "uno" || !latestRoom.uno) throw new Error("The game has ended.");

        const uno = structuredClone(latestRoom.uno);
        const currentPlayerId = uno.turnOrder[uno.turnIndex];
        if (currentPlayerId !== playerId) throw new Error("It is not your turn.");

        const hand = uno.hands[playerId] || [];
        const cardIndex = hand.findIndex((card) => card.id === cardId);
        if (cardIndex < 0) throw new Error("That card is no longer in your hand.");
        const card = hand[cardIndex];
        const topCard = uno.discardPile[uno.discardPile.length - 1];
        if (uno.drawnCardId && uno.drawnCardId !== card.id) throw new Error("You can only play the card you just drew.");
        if (!canPlayCard(card, topCard, uno.activeColor, hand)) throw new Error("That card cannot be played now.");
        if (card.color === "wild" && !UNO_COLORS.includes(chosenColor)) throw new Error("Choose a color for the wild card.");

        hand.splice(cardIndex, 1);
        uno.discardPile.push(card);
        uno.activeColor = card.color === "wild" ? chosenColor : card.color;
        uno.drawnCardId = null;
        uno.moveNumber += 1;
        uno.unoPlayerId = hand.length === 1 ? playerId : null;

        if (hand.length === 0) {
          uno.winnerId = playerId;
          uno.lastAction = { type: "win", playerId, card: cardAriaLabel(card) };
          transaction.update(reference, {
            phase: "uno-finished",
            uno,
            updatedAt: serverTimestamp()
          });
          return;
        }

        let direction = uno.direction;
        let steps = 1;
        let penalty = 0;

        if (card.value === "reverse") {
          direction *= -1;
          steps = uno.turnOrder.length === 2 ? 2 : 1;
        } else if (card.value === "skip") {
          steps = 2;
        } else if (card.value === "draw2" || card.value === "wild4") {
          penalty = card.value === "draw2" ? 2 : 4;
          const penalizedIndex = nextTurnIndex(uno.turnOrder, uno.turnIndex, direction);
          drawCards(uno, uno.turnOrder[penalizedIndex], penalty);
          steps = 2;
        }

        uno.direction = direction;
        uno.turnIndex = nextTurnIndex(uno.turnOrder, uno.turnIndex, direction, steps);
        uno.lastAction = {
          type: "play",
          playerId,
          card: cardAriaLabel(card),
          penalty,
          ...(["reverse", "skip"].includes(card.value) ? { effect: card.value } : {})
        };

        transaction.update(reference, { uno, updatedAt: serverTimestamp() });
      });
      setWildCardId(null);
    } catch (transactionError) {
      setError(transactionError.message || "Could not play that card.");
    } finally {
      setPlayingCard(null);
      setBusy(false);
    }
  }

  async function drawOne() {
    if (busy || receiving) return;
    setBusy(true);
    setError("");
    try {
      await runTransaction(db, async (transaction) => {
        const reference = roomRef(room.code);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists()) throw new Error("Room closed.");
        const latestRoom = snapshot.data();
        if (latestRoom.phase !== "uno" || !latestRoom.uno) throw new Error("The game has ended.");

        const uno = structuredClone(latestRoom.uno);
        if (uno.turnOrder[uno.turnIndex] !== playerId) throw new Error("It is not your turn.");
        if (uno.drawnCardId) throw new Error("Play the drawn card or end your turn.");

        const [card] = drawCards(uno, playerId, 1);
        if (!card) {
          uno.turnIndex = nextTurnIndex(uno.turnOrder, uno.turnIndex, uno.direction);
          uno.lastAction = { type: "draw-pass", playerId };
        } else {
          const topCard = uno.discardPile[uno.discardPile.length - 1];
          const hand = uno.hands[playerId];
          if (canPlayCard(card, topCard, uno.activeColor, hand)) {
            uno.drawnCardId = card.id;
            uno.lastAction = { type: "draw", playerId };
          } else {
            uno.turnIndex = nextTurnIndex(uno.turnOrder, uno.turnIndex, uno.direction);
            uno.lastAction = { type: "draw-pass", playerId };
          }
        }
        uno.moveNumber += 1;
        transaction.update(reference, { uno, updatedAt: serverTimestamp() });
      });
    } catch (transactionError) {
      setError(transactionError.message || "Could not draw a card.");
    } finally {
      setBusy(false);
    }
  }

  async function endTurn() {
    if (busy || receiving) return;
    setBusy(true);
    setError("");
    try {
      await runTransaction(db, async (transaction) => {
        const reference = roomRef(room.code);
        const snapshot = await transaction.get(reference);
        const latestRoom = snapshot.data();
        const uno = structuredClone(latestRoom.uno);
        if (latestRoom.phase !== "uno" || uno.turnOrder[uno.turnIndex] !== playerId || !uno.drawnCardId) {
          throw new Error("There is no drawn card to keep.");
        }
        uno.drawnCardId = null;
        uno.turnIndex = nextTurnIndex(uno.turnOrder, uno.turnIndex, uno.direction);
        uno.moveNumber += 1;
        uno.lastAction = { type: "pass", playerId };
        transaction.update(reference, { uno, updatedAt: serverTimestamp() });
      });
    } catch (transactionError) {
      setError(transactionError.message || "Could not end your turn.");
    } finally {
      setBusy(false);
    }
  }

  async function playAgain() {
    if (!isHost || busy) return;
    setBusy(true);
    setError("");
    try {
      await runTransaction(db, async (transaction) => {
        const reference = roomRef(room.code);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists() || snapshot.data().hostId !== playerId) throw new Error("Only the host can reset the game.");
        transaction.update(reference, { phase: "lobby", uno: null, updatedAt: serverTimestamp() });
      });
    } catch (transactionError) {
      setError(transactionError.message || "Could not reset UNO.");
    } finally {
      setBusy(false);
    }
  }

  if (room.phase === "lobby") {
    return <UnoLobby players={players} isHost={isHost} busy={busy} error={error} onStart={startGame} />;
  }

  if (room.phase === "uno-finished") {
    return (
      <section className="mission-panel final-panel uno-final">
        <div className="burst" />
        <p className="eyebrow">UNO champion</p>
        <img className="uno-logo" src={unoIcon} alt="" />
        <h2>{playerName(room, room.uno?.winnerId)}</h2>
        <p className="winner-copy">Played every card first and wins the room.</p>
        {isHost
          ? <button className="primary-btn" type="button" disabled={busy} onClick={playAgain}>Play again</button>
          : <p className="waiting-copy">Waiting for the host to set up another game.</p>}
        {error && <p className="alert">{error}</p>}
      </section>
    );
  }

  const uno = room.uno;
  if (!uno) return null;
  const hand = uno.hands?.[playerId] || [];
  const topCard = uno.discardPile[uno.discardPile.length - 1];
  const currentPlayerId = uno.turnOrder[uno.turnIndex];
  const isMyTurn = currentPlayerId === playerId;
  const chosenWildCard = hand.find((card) => card.id === wildCardId);
  const discardIsLanding = impactMove === uno.moveNumber;
  const discardIsDropTarget = draggedCard?.phase === "dragging";
  const impactType = cardImpactType(topCard);

  return (
    <>
      <section className="mission-panel uno-table">
      <div className="uno-status-row">
        <div>
          <span className="uno-direction" aria-label={uno.direction === 1 ? "Clockwise" : "Counter-clockwise"}>
            {uno.direction === 1 ? "↻" : "↺"}
          </span>
          <span className={`uno-color-chip ${uno.activeColor}`}>{UNO_COLOR_LABELS[uno.activeColor]}</span>
        </div>
        <strong>{isMyTurn ? "Your turn" : `${playerName(room, currentPlayerId)}’s turn`}</strong>
      </div>

      <div className="uno-opponents" aria-label="Other players" ref={opponentsRef}>
        {uno.turnOrder.filter((id) => id !== playerId).map((id) => (
          <div className={`uno-opponent ${id === currentPlayerId ? "active" : ""}`} data-player-id={id} key={id}>
            <span>{playerName(room, id).slice(0, 2).toUpperCase()}</span>
            <strong>{playerName(room, id)}</strong>
            <em>{visibleCardCount(id)} cards</em>
            {uno.hands?.[id]?.length === 1 && <b>UNO!</b>}
          </div>
        ))}
      </div>

      <p className="uno-action-copy" aria-live="polite">{actionCopy(room)}</p>

      <div className="uno-center">
        <button className="uno-deck" type="button" aria-label={`Draw a card. ${uno.drawPile.length} cards left.`} ref={deckRef} disabled={!isMyTurn || Boolean(uno.drawnCardId) || busy || receiving} onClick={drawOne}>
          <img className="uno-deck-logo" src={unoIcon} alt="" />
          <small>{uno.drawPile.length} left</small>
        </button>
        <div
          aria-label="Discard pile. Drop a playable card here."
          className={`uno-discard ${discardIsLanding ? "is-landing" : ""} ${discardIsDropTarget ? "is-drop-target" : ""} ${draggedCard?.overDiscard ? "is-drag-over" : ""}`}
          ref={discardRef}
        >
          <UnoCard card={topCard} className={discardIsLanding ? "just-played" : ""} large />
          {discardIsLanding && (
            <span
              aria-hidden="true"
              className={`uno-card-impact ${topCard.color} ${impactType}`}
              key={`${impactMove}-${topCard.id}`}
            >
              {UNO_ACTION_SYMBOLS[topCard.value] || ""}
            </span>
          )}
        </div>
      </div>

      <div className="uno-hand-heading">
        <div>
          <h3>Your hand</h3>
          <span>{dealing ? `${visibleCardCount(playerId)} / ${hand.length}` : visibleCardCount(playerId)} cards</span>
        </div>
        {hand.length === 1 && <strong>UNO!</strong>}
        {isMyTurn && uno.drawnCardId && (
          <button className="secondary-btn uno-pass-btn" type="button" disabled={busy || receiving} onClick={endTurn}>Keep card</button>
        )}
      </div>

      <div className="uno-hand" ref={handRef} aria-busy={receiving}>
        {hand.map((card) => {
          const playable = isMyTurn
            && (!uno.drawnCardId || uno.drawnCardId === card.id)
            && canPlayCard(card, topCard, uno.activeColor, hand);
          return (
            <UnoCard
              card={card}
              ariaHidden={incomingCardIds.has(card.id)}
              className={incomingCardIds.has(card.id) ? "is-receiving" : ""}
              disabled={!playable || busy || receiving}
              drawn={uno.drawnCardId === card.id}
              key={card.id}
              onClick={() => handleCardClick(card)}
              onPointerCancel={(event) => finishCardDrag(event, true)}
              onPointerDown={(event) => startCardDrag(event, card)}
              onPointerMove={moveCardDrag}
              onPointerUp={finishCardDrag}
              playing={playingCard?.card.id === card.id}
              dragging={draggedCard?.card.id === card.id}
              playable={playable}
            />
          );
        })}
      </div>
      {!isMyTurn && <p className="waiting-copy">Watch the discard pile while you wait for your turn.</p>}
      {isMyTurn && !uno.drawnCardId && <p className="waiting-copy">Tap a matching card or drag it onto the discard pile. You can also play a wild or draw one card.</p>}
      {error && <p className="alert">{error}</p>}

      {chosenWildCard && (
        <div className="uno-color-modal" role="dialog" aria-modal="true" aria-labelledby="wild-color-title">
          <div>
            <p className="eyebrow">Wild card</p>
            <h2 id="wild-color-title">Choose a color</h2>
            <div className="uno-color-grid">
              {UNO_COLORS.map((color) => (
                <button className={color} type="button" disabled={busy} key={color} onClick={() => playCard(chosenWildCard.id, color)}>
                  {UNO_COLOR_LABELS[color]}
                </button>
              ))}
            </div>
            <button className="ghost-btn" type="button" disabled={busy} onClick={() => setWildCardId(null)}>Cancel</button>
          </div>
        </div>
      )}
      </section>
      {flights.length > 0 && createPortal(
        <div className="uno-deal-layer" aria-hidden="true">
          {flights.map((flight) => (
            <div
              className={`uno-deal-flight ${flight.card ? "to-hand" : "to-opponent"}`}
              key={flight.id}
              style={flight.style}
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) finishFlight(flight.id);
              }}
            >
              <div className="uno-deal-turn">
                <div className="uno-deal-back"><img src={unoIcon} alt="" /></div>
                {flight.card && <UnoCard ariaHidden card={flight.card} className="uno-deal-front" />}
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
      {playingCard && typeof document !== "undefined" && createPortal(
        <UnoCard
          ariaHidden
          card={playingCard.card}
          className="uno-card-flight"
          key={playingCard.id}
          style={playingCard.style}
        />,
        document.body
      )}
      {draggedCard && typeof document !== "undefined" && createPortal(
        <UnoCard
          ariaHidden
          card={draggedCard.card}
          className={`uno-card-dragging is-${draggedCard.phase} ${draggedCard.overDiscard ? "is-over-discard" : ""}`}
          style={draggedCard.style}
        />,
        document.body
      )}
    </>
  );
}

function UnoLobby({ players, isHost, busy, error, onStart }) {
  return (
    <section className="mission-panel uno-lobby">
      <p className="eyebrow">UNO lobby</p>
      <img className="uno-logo" src={unoIcon} alt="" />
      <h2>Players connected</h2>
      <div className="agent-list">
        {players.map((player, index) => (
          <article className="agent-card" key={player.id} style={{ animationDelay: `${index * 70}ms` }}>
            <span>{player.name.slice(0, 2).toUpperCase()}</span>
            <strong>{player.name}</strong>
            {player.isHost && <em>Room host</em>}
          </article>
        ))}
      </div>
      <div className="uno-rules">
        <h3>Quick rules</h3>
        <p>Match the active color or symbol. Action cards skip, reverse, and make the next player draw. Choose any color with a Wild. First player with no cards wins.</p>
        <span>2–8 players · 7 cards each · Full 108-card deck</span>
      </div>
      {isHost
        ? <button className="primary-btn" type="button" disabled={busy} onClick={onStart}>{busy ? "Shuffling…" : "Deal the cards"}</button>
        : <p className="waiting-copy">Waiting for the host to deal.</p>}
      {error && <p className="alert">{error}</p>}
    </section>
  );
}

function UnoCard({
  ariaHidden = false,
  card,
  className = "",
  disabled = true,
  dragging = false,
  drawn = false,
  large = false,
  onClick,
  onPointerCancel,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  playable = false,
  playing = false,
  style
}) {
  const Component = onClick ? "button" : "div";
  const cardArt = UNO_CARD_ART[card.value];
  return (
    <Component
      aria-hidden={ariaHidden || undefined}
      aria-label={ariaHidden ? undefined : cardAriaLabel(card)}
      className={`uno-card ${card.color} ${cardArt ? "has-art" : ""} ${large ? "large" : ""} ${playable ? "playable" : ""} ${drawn ? "drawn" : ""} ${playing ? "is-playing" : ""} ${dragging ? "is-dragging" : ""} ${className}`}
      data-card-id={card.id}
      disabled={onClick ? disabled : undefined}
      onClick={onClick}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={style}
      type={onClick ? "button" : undefined}
    >
      {cardArt
        ? <img className="uno-card-art" src={cardArt} alt="" />
        : (
          <>
            <small><UnoCardMark card={card} /></small>
            <span><UnoCardMark card={card} /></span>
            <small><UnoCardMark card={card} /></small>
          </>
        )}
    </Component>
  );
}

function UnoCardMark({ card }) {
  const icon = UNO_CARD_ICONS[card.value];
  return icon
    ? <img className={`uno-card-action-icon ${card.value}`} src={icon} alt="" />
    : cardLabel(card);
}
