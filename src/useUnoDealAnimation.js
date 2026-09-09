import { useEffect, useLayoutEffect, useRef, useState } from "react";

const FLIGHT_MS = 520;
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// Clamp offscreen cards to the visible edge of a horizontally scrolling hand.
function destinationRect(element, container, isLocal) {
  const card = element.getBoundingClientRect();
  const bounds = container.getBoundingClientRect();
  const width = isLocal ? card.width : 32;
  const height = isLocal ? card.height : 46;
  const left = Math.max(8, bounds.left);
  const right = Math.min(window.innerWidth - 8, bounds.right);
  const centerX = Math.max(left + width / 2, Math.min(right - width / 2, card.left + card.width / 2));
  return { width, height, left: centerX - width / 2, top: card.top + (card.height - height) / 2 };
}

export default function useUnoDealAnimation(room, playerId) {
  const deckRef = useRef(null);
  const handRef = useRef(null);
  const opponentsRef = useRef(null);
  const previousRef = useRef(null);
  const sequenceRef = useRef(0);
  const autoScrollRef = useRef(null);
  const [flights, setFlights] = useState([]);

  useLayoutEffect(() => {
    const previous = previousRef.current;
    previousRef.current = { code: room.code, phase: room.phase, uno: room.uno, playerId };
    const sameRoom = previous?.code === room.code && previous?.playerId === playerId;
    const uno = room.uno;
    const previousUno = sameRoom && previous.phase === "uno" ? previous.uno : null;

    if (room.phase !== "uno" || !uno || window.matchMedia(REDUCED_MOTION).matches || document.hidden) {
      setFlights((current) => current.length ? [] : current);
      return;
    }

    const opening = uno.moveNumber === 0 && uno.lastAction?.type === "start"
      && (!previousUno || previousUno.moveNumber > 0);
    // A reconnect midway through a game must not replay the whole hand.
    if (!opening && !previousUno) {
      setFlights((current) => current.length ? [] : current);
      return;
    }

    const additions = uno.turnOrder.map((id) => {
      const known = new Set(opening ? [] : (previousUno.hands[id] || []).map((card) => card.id));
      return (uno.hands[id] || []).filter((card) => !known.has(card.id)).map((card) => ({ card, playerId: id }));
    });
    // Deal one card to each seat in turn, just as the game creates its hands.
    const arrivals = opening
      ? Array.from({ length: Math.max(0, ...additions.map((cards) => cards.length)) }, (_, index) => additions.flatMap((cards) => cards[index] ? [cards[index]] : [])).flat()
      : additions.flat();
    const source = deckRef.current?.getBoundingClientRect();
    const hand = handRef.current;
    if (!source?.width || !hand) return;

    const scrollToNewCards = !opening && arrivals.some((arrival) => arrival.playerId === playerId);
    if (scrollToNewCards) {
      hand.scrollTo({ left: hand.scrollWidth, behavior: "instant" });
      autoScrollRef.current = hand.scrollLeft;
    }

    const interval = opening ? Math.min(80, 1200 / Math.max(1, arrivals.length - 1)) : 120;
    const startedAt = Date.now();
    const nextFlights = arrivals.flatMap((arrival, index) => {
      const isLocal = arrival.playerId === playerId;
      const container = isLocal ? hand : opponentsRef.current;
      const destination = Array.from(container?.children || []).find((element) => isLocal
        ? element.dataset.cardId === arrival.card.id
        : element.dataset.playerId === arrival.playerId);
      if (!destination) return [];
      const target = destinationRect(destination, container, isLocal);
      const x = target.left + (target.width - source.width) / 2 - source.left;
      const y = target.top + (target.height - source.height) / 2 - source.top;
      const delay = (opening ? 100 : 60) + index * interval;
      return [{
        id: ++sequenceRef.current,
        cardId: arrival.card.id,
        card: isLocal ? arrival.card : null,
        playerId: arrival.playerId,
        opening,
        endsAt: startedAt + delay + FLIGHT_MS,
        style: {
          left: source.left,
          top: source.top,
          width: source.width,
          height: source.height,
          "--uno-deal-x": `${x}px`,
          "--uno-deal-y": `${y}px`,
          "--uno-deal-mid-x": `${x * 0.48}px`,
          "--uno-deal-mid-y": `${y * 0.44 - 48}px`,
          "--uno-deal-rotation": `${x >= 0 ? 9 : -9}deg`,
          "--uno-deal-scale-x": target.width / source.width,
          "--uno-deal-scale-y": target.height / source.height,
          "--uno-deal-duration": `${FLIGHT_MS}ms`,
          "--uno-deal-delay": `${delay}ms`
        }
      }];
    });

    setFlights((current) => {
      const remaining = opening || !sameRoom ? [] : current.filter((flight) =>
        !(scrollToNewCards && flight.playerId === playerId)
        && uno.hands[flight.playerId]?.some((card) => card.id === flight.cardId));
      return nextFlights.length || remaining.length !== current.length ? [...remaining, ...nextFlights] : current;
    });
  }, [room.code, room.phase, room.uno, playerId]);

  useEffect(() => {
    if (!flights.length) return undefined;
    // Also settle if an animationend event is lost (for example when a tab sleeps).
    const deadline = Math.max(...flights.map((flight) => flight.endsAt));
    const timeout = window.setTimeout(() => setFlights([]), Math.max(0, deadline - Date.now()) + 100);
    return () => window.clearTimeout(timeout);
  }, [flights]);

  useEffect(() => {
    const settle = () => setFlights((current) => current.length ? [] : current);
    const onScroll = (event) => {
      if (event.target === handRef.current && handRef.current.scrollLeft === autoScrollRef.current) {
        autoScrollRef.current = null;
        return;
      }
      settle();
    };
    const motion = window.matchMedia(REDUCED_MOTION);
    window.addEventListener("resize", settle);
    document.addEventListener("scroll", onScroll, true);
    document.addEventListener("visibilitychange", settle);
    motion.addEventListener("change", settle);
    return () => {
      window.removeEventListener("resize", settle);
      document.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("visibilitychange", settle);
      motion.removeEventListener("change", settle);
    };
  }, []);

  function finishFlight(id) {
    setFlights((current) => current.filter((flight) => flight.id !== id));
  }

  return { deckRef, handRef, opponentsRef, flights, finishFlight };
}
