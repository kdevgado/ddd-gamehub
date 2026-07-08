import { useEffect, useMemo, useRef, useState } from "react";
import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc
} from "firebase/firestore";
import { db, ensureAnonymousUser } from "./firebase.js";

const ROOM_LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ";

const QUESTIONS = [
  { id: "g1", category: "General", prompt: "What is the capital of Australia?", choices: ["Sydney", "Canberra", "Melbourne", "Perth"], answer: "Canberra" },
  { id: "g2", category: "General", prompt: "Which is the largest planet in our solar system?", choices: ["Earth", "Saturn", "Jupiter", "Neptune"], answer: "Jupiter" },
  { id: "g3", category: "General", prompt: "How many continents are there?", choices: ["5", "6", "7", "8"], answer: "7" },
  { id: "g4", category: "General", prompt: "What is the chemical formula for water?", choices: ["CO2", "O2", "H2O", "NaCl"], answer: "H2O" },
  { id: "g5", category: "General", prompt: "How many minutes are in two hours?", choices: ["90", "100", "120", "140"], answer: "120" },
  { id: "m1", category: "Movies", prompt: "Which studio created Toy Story?", choices: ["DreamWorks", "Pixar", "Ghibli", "Sony"], answer: "Pixar" },
  { id: "m2", category: "Movies", prompt: "Wakanda is the home of which hero?", choices: ["Thor", "Black Panther", "Superman", "Aquaman"], answer: "Black Panther" },
  { id: "m3", category: "Movies", prompt: "Who is Elsa's sister in Frozen?", choices: ["Anna", "Moana", "Ariel", "Mulan"], answer: "Anna" },
  { id: "m4", category: "Movies", prompt: "Who directed Titanic?", choices: ["Steven Spielberg", "James Cameron", "Peter Jackson", "Christopher Nolan"], answer: "James Cameron" },
  { id: "m5", category: "Movies", prompt: "What kind of character is Shrek?", choices: ["Knight", "Ogre", "Wizard", "Pirate"], answer: "Ogre" },
  { id: "f1", category: "Food", prompt: "What is the main ingredient in guacamole?", choices: ["Avocado", "Cucumber", "Peas", "Spinach"], answer: "Avocado" },
  { id: "f2", category: "Food", prompt: "Sushi is most closely associated with which country?", choices: ["Thailand", "China", "Japan", "Vietnam"], answer: "Japan" },
  { id: "f3", category: "Food", prompt: "Tofu is traditionally made from what?", choices: ["Rice", "Soybeans", "Potatoes", "Corn"], answer: "Soybeans" },
  { id: "f4", category: "Food", prompt: "Which country is famous for the croissant?", choices: ["France", "Spain", "Greece", "Mexico"], answer: "France" },
  { id: "f5", category: "Food", prompt: "Which fruit is dried to make a prune?", choices: ["Grape", "Plum", "Fig", "Date"], answer: "Plum" },
  { id: "p1", category: "Philippines", prompt: "What is the capital of the Philippines?", choices: ["Cebu City", "Davao City", "Manila", "Baguio"], answer: "Manila" },
  { id: "p2", category: "Philippines", prompt: "What is the currency of the Philippines?", choices: ["Baht", "Peso", "Ringgit", "Rupiah"], answer: "Peso" },
  { id: "p3", category: "Philippines", prompt: "What is the largest island in the Philippines?", choices: ["Mindanao", "Palawan", "Luzon", "Samar"], answer: "Luzon" },
  { id: "p4", category: "Philippines", prompt: "Philippine Independence Day is celebrated on which date?", choices: ["June 12", "July 4", "August 21", "December 30"], answer: "June 12" },
  { id: "p5", category: "Philippines", prompt: "Which city is known as the Summer Capital of the Philippines?", choices: ["Tagaytay", "Baguio", "Vigan", "Iloilo"], answer: "Baguio" }
];

const QUESTION_LOOKUP = Object.fromEntries(QUESTIONS.map((question) => [question.id, question]));
const CATEGORIES = ["Mixed", ...new Set(QUESTIONS.map((question) => question.category))];

function cleanName(value) {
  return value.trim().replace(/\s+/g, " ").slice(0, 18);
}

function randomRoomCode() {
  return Array.from({ length: 4 }, () => ROOM_LETTERS[Math.floor(Math.random() * ROOM_LETTERS.length)]).join("");
}

function roomRef(code) {
  return doc(db, "rooms", code);
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function formatClock(milliseconds) {
  return String(Math.max(0, Math.ceil(milliseconds / 1000))).padStart(2, "0");
}

export default function TriviaRoom({ onBack }) {
  const [playerId, setPlayerId] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const revealLock = useRef(false);

  const players = useMemo(
    () => Object.values(room?.players || {}).sort((a, b) => a.joinedAt - b.joinedAt),
    [room?.players]
  );
  const isHost = room?.hostId === playerId;
  const question = QUESTION_LOOKUP[room?.currentQuestionId];
  const timeLeft = room?.questionEndsAt ? room.questionEndsAt - now : 0;
  const myAnswer = room?.answers?.[playerId];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    ensureAnonymousUser()
      .then((user) => {
        setPlayerId(user.uid);
        setAuthReady(true);
      })
      .catch(() => setError("Enable Anonymous sign-in in Firebase Authentication."));
  }, []);

  useEffect(() => {
    if (!roomCode) return undefined;
    const unsubscribe = onSnapshot(
      roomRef(roomCode),
      (snapshot) => {
        if (!snapshot.exists()) {
          setRoom(null);
          setRoomCode("");
          setError("That room has been closed.");
          return;
        }
        setRoom(snapshot.data());
      },
      () => setError("The live room connection was interrupted.")
    );
    return unsubscribe;
  }, [roomCode]);

  useEffect(() => {
    if (!room || room.phase !== "question" || !isHost || revealLock.current) return;
    const answerCount = Object.keys(room.answers || {}).length;
    if (timeLeft > 0 && answerCount < players.length) return;

    revealLock.current = true;
    const scores = { ...(room.scores || {}) };
    players.forEach((player) => {
      if (room.answers?.[player.id] === question?.answer) {
        scores[player.id] = (scores[player.id] || 0) + 1;
      }
    });
    updateDoc(roomRef(room.code), {
      phase: "answer",
      scores,
      updatedAt: serverTimestamp()
    }).catch(() => {
      revealLock.current = false;
    });
  }, [isHost, players, question?.answer, room, timeLeft]);

  useEffect(() => {
    if (room?.phase !== "question") revealLock.current = false;
  }, [room?.phase]);

  async function createRoom() {
    const name = cleanName(playerName);
    if (!authReady || !playerId) return setError("Connecting to Firebase. Try again in a moment.");
    if (!name) return setError("Enter your player name first.");

    setBusy(true);
    setError("");
    try {
      let code = randomRoomCode();
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const existingRoom = await getDoc(roomRef(code));
        if (!existingRoom.exists()) break;
        code = randomRoomCode();
      }

      await setDoc(roomRef(code), {
        code,
        game: "trivia",
        phase: "lobby",
        hostId: playerId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        settings: { category: "Mixed", roundCount: 5, answerSeconds: 20 },
        players: {
          [playerId]: { id: playerId, name, isHost: true, joinedAt: Date.now() }
        },
        questionIds: [],
        currentRound: 0,
        currentQuestionId: null,
        questionEndsAt: null,
        answers: {},
        scores: { [playerId]: 0 }
      });
      setRoomCode(code);
    } catch {
      setError("Could not create the room. Check Firebase setup and rules.");
    } finally {
      setBusy(false);
    }
  }

  async function joinRoom() {
    const name = cleanName(playerName);
    const code = joinCode.trim().toUpperCase();
    if (!authReady || !playerId) return setError("Connecting to Firebase. Try again in a moment.");
    if (!name) return setError("Enter your player name first.");
    if (!/^[A-Z]{4}$/.test(code)) return setError("Enter a 4-letter room code.");

    setBusy(true);
    setError("");
    try {
      const snapshot = await getDoc(roomRef(code));
      if (!snapshot.exists()) return setError("No room found with that code.");
      if (snapshot.data().game !== "trivia") return setError("That code belongs to a different game.");
      if (snapshot.data().phase !== "lobby") return setError("That game has already started.");

      await updateDoc(roomRef(code), {
        [`players.${playerId}`]: {
          id: playerId,
          name,
          isHost: snapshot.data().hostId === playerId,
          joinedAt: Date.now()
        },
        [`scores.${playerId}`]: 0,
        updatedAt: serverTimestamp()
      });
      setRoomCode(code);
    } catch {
      setError("Could not join. Check the room code and Firebase rules.");
    } finally {
      setBusy(false);
    }
  }

  async function leaveRoom() {
    if (!room) return;
    if (isHost) {
      await deleteDoc(roomRef(room.code)).catch(() => {});
    } else {
      await updateDoc(roomRef(room.code), {
        [`players.${playerId}`]: deleteField(),
        [`scores.${playerId}`]: deleteField(),
        [`answers.${playerId}`]: deleteField(),
        updatedAt: serverTimestamp()
      }).catch(() => {});
    }
    setRoom(null);
    setRoomCode("");
    setJoinCode("");
  }

  async function updateSetting(key, value) {
    if (!room || !isHost) return;
    await updateDoc(roomRef(room.code), {
      [`settings.${key}`]: value,
      updatedAt: serverTimestamp()
    });
  }

  async function startGame() {
    if (!room || !isHost) return;
    if (players.length < 2) return setError("Use at least 2 players for Trivia Party.");

    const pool = room.settings.category === "Mixed"
      ? QUESTIONS
      : QUESTIONS.filter((item) => item.category === room.settings.category);
    const questionIds = shuffle(pool)
      .slice(0, Number(room.settings.roundCount))
      .map((item) => item.id);
    const scores = Object.fromEntries(players.map((player) => [player.id, 0]));

    setError("");
    await updateDoc(roomRef(room.code), {
      phase: "question",
      questionIds,
      currentRound: 0,
      currentQuestionId: questionIds[0],
      questionEndsAt: Date.now() + Number(room.settings.answerSeconds) * 1000,
      answers: {},
      scores,
      updatedAt: serverTimestamp()
    });
  }

  async function submitAnswer(answer) {
    if (!room || room.phase !== "question" || myAnswer) return;
    await updateDoc(roomRef(room.code), {
      [`answers.${playerId}`]: answer,
      updatedAt: serverTimestamp()
    });
  }

  async function nextRound() {
    if (!room || !isHost) return;
    const nextRoundIndex = room.currentRound + 1;
    if (nextRoundIndex >= room.questionIds.length) {
      await updateDoc(roomRef(room.code), {
        phase: "final",
        questionEndsAt: null,
        updatedAt: serverTimestamp()
      });
      return;
    }
    await updateDoc(roomRef(room.code), {
      phase: "question",
      currentRound: nextRoundIndex,
      currentQuestionId: room.questionIds[nextRoundIndex],
      questionEndsAt: Date.now() + Number(room.settings.answerSeconds) * 1000,
      answers: {},
      updatedAt: serverTimestamp()
    });
  }

  async function playAgain() {
    if (!room || !isHost) return;
    await updateDoc(roomRef(room.code), {
      phase: "lobby",
      questionIds: [],
      currentRound: 0,
      currentQuestionId: null,
      questionEndsAt: null,
      answers: {},
      scores: Object.fromEntries(players.map((player) => [player.id, 0])),
      updatedAt: serverTimestamp()
    });
  }

  if (!roomCode || !room) {
    return (
      <section className="hero-panel online-entry-panel">
        <button className="back-link" type="button" onClick={onBack}>Back to game modes</button>
        <p className="eyebrow">Online room code</p>
        <h1>Trivia Party</h1>
        <p className="lead">Create a live room, share the four-letter code, and answer together from everyone&apos;s phone.</p>

        <div className="online-game-card">
          <img src="/icons/mafia/detective.png" alt="" />
          <span>
            <small>Online exclusive</small>
            <strong>Trivia Party</strong>
            <em>Quick questions, live answer reveals, and a final leaderboard.</em>
          </span>
        </div>

        <div className="entry-grid">
          <label>
            Player name
            <input value={playerName} onChange={(event) => setPlayerName(event.target.value)} placeholder="Your name" maxLength={18} />
          </label>
          <button className="primary-btn" type="button" disabled={busy || !authReady} onClick={createRoom}>Create room</button>
          <div className="join-row">
            <input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} placeholder="CODE" maxLength={4} />
            <button className="secondary-btn" type="button" disabled={busy || !authReady} onClick={joinRoom}>Join</button>
          </div>
        </div>
        {error && <p className="alert">{error}</p>}
      </section>
    );
  }

  return (
    <>
      <RoomHeader room={room} isHost={isHost} onLeave={leaveRoom} />
      {room.phase === "lobby" && (
        <Lobby room={room} players={players} isHost={isHost} error={error} onSetting={updateSetting} onStart={startGame} />
      )}
      {room.phase === "question" && (
        <Question room={room} question={question} timeLeft={timeLeft} answer={myAnswer} onAnswer={submitAnswer} />
      )}
      {room.phase === "answer" && (
        <RoundResult room={room} players={players} question={question} isHost={isHost} onNext={nextRound} />
      )}
      {room.phase === "final" && (
        <FinalLeaderboard room={room} players={players} isHost={isHost} onPlayAgain={playAgain} />
      )}
    </>
  );
}

function RoomHeader({ room, isHost, onLeave }) {
  return (
    <header className="room-header">
      <div>
        <span className="status-dot">Trivia Party</span>
        <strong>{room.code}</strong>
      </div>
      <div>
        {isHost && <span className="host-pill">Host</span>}
        <button className="ghost-btn" type="button" onClick={onLeave}>Leave</button>
      </div>
    </header>
  );
}

function Lobby({ room, players, isHost, error, onSetting, onStart }) {
  return (
    <section className="mission-panel">
      <p className="eyebrow">Lobby</p>
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

      <div className="settings-card">
        <h3>Game setup</h3>
        <label>
          Category
          <select disabled={!isHost} value={room.settings.category} onChange={(event) => onSetting("category", event.target.value)}>
            {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>
        <div className="split-settings">
          <label>
            Questions
            <select disabled={!isHost} value={room.settings.roundCount} onChange={(event) => onSetting("roundCount", Number(event.target.value))}>
              <option value={3}>3 rounds</option>
              <option value={5}>5 rounds</option>
            </select>
          </label>
          <label>
            Answer time
            <select disabled={!isHost} value={room.settings.answerSeconds} onChange={(event) => onSetting("answerSeconds", Number(event.target.value))}>
              <option value={10}>10 sec</option>
              <option value={15}>15 sec</option>
              <option value={20}>20 sec</option>
              <option value={30}>30 sec</option>
            </select>
          </label>
        </div>
      </div>

      {isHost
        ? <button className="primary-btn" type="button" onClick={onStart}>Start trivia</button>
        : <p className="waiting-copy">Waiting for the host to start.</p>}
      {error && <p className="alert">{error}</p>}
    </section>
  );
}

function Question({ room, question, timeLeft, answer, onAnswer }) {
  if (!question) return null;
  const answeredCount = Object.keys(room.answers || {}).length;
  return (
    <section className="mission-panel question-panel">
      <div className="round-meta">
        <span>Question {room.currentRound + 1} of {room.questionIds.length}</span>
        <span>{question.category}</span>
      </div>
      <span className={`timer-chip ${timeLeft <= 5000 ? "timer-danger" : ""}`}>{formatClock(timeLeft)}</span>
      <h2 className="question-title">{question.prompt}</h2>
      <div className="choice-grid">
        {question.choices.map((choice, index) => (
          <button
            className={`choice-btn ${answer === choice ? "selected" : ""}`}
            disabled={Boolean(answer) || timeLeft <= 0}
            key={choice}
            onClick={() => onAnswer(choice)}
            type="button"
          >
            <span>{String.fromCharCode(65 + index)}</span>
            {choice}
          </button>
        ))}
      </div>
      <p className="waiting-copy">
        {answer ? "Answer locked. Waiting for everyone else." : `${answeredCount} of ${Object.keys(room.players).length} answered`}
      </p>
    </section>
  );
}

function RoundResult({ room, players, question, isHost, onNext }) {
  if (!question) return null;
  const answerCounts = Object.fromEntries(question.choices.map((choice) => [choice, 0]));
  Object.values(room.answers || {}).forEach((answer) => {
    if (answerCounts[answer] !== undefined) answerCounts[answer] += 1;
  });
  const isLastRound = room.currentRound + 1 >= room.questionIds.length;

  return (
    <section className="mission-panel">
      <p className="eyebrow">Answer reveal</p>
      <h2 className="answer-title">{question.answer}</h2>
      <div className="answer-breakdown">
        {question.choices.map((choice) => (
          <div className={`answer-row ${choice === question.answer ? "correct" : ""}`} key={choice}>
            <span>{choice}</span>
            <strong>{answerCounts[choice]}</strong>
          </div>
        ))}
      </div>
      <Scoreboard players={players} scores={room.scores} />
      {isHost
        ? <button className="primary-btn" type="button" onClick={onNext}>{isLastRound ? "Final leaderboard" : "Next question"}</button>
        : <p className="waiting-copy">Waiting for the host.</p>}
    </section>
  );
}

function Scoreboard({ players, scores }) {
  const rankedPlayers = [...players].sort((first, second) => (scores?.[second.id] || 0) - (scores?.[first.id] || 0));
  return (
    <div className="scoreboard">
      <h3>Scoreboard</h3>
      {rankedPlayers.map((player, index) => (
        <div className="score-row" key={player.id}>
          <span>{index + 1}</span>
          <strong>{player.name}</strong>
          <em>{scores?.[player.id] || 0} pts</em>
        </div>
      ))}
    </div>
  );
}

function FinalLeaderboard({ room, players, isHost, onPlayAgain }) {
  const topScore = Math.max(...players.map((player) => room.scores?.[player.id] || 0));
  const winners = players.filter((player) => (room.scores?.[player.id] || 0) === topScore);
  return (
    <section className="mission-panel final-panel">
      <div className="burst" />
      <p className="eyebrow">Game complete</p>
      <h2>{winners.map((player) => player.name).join(" & ")}</h2>
      <p className="winner-copy">{winners.length > 1 ? "It is a tie!" : "Trivia champion"} with <span>{topScore} points</span>.</p>
      <Scoreboard players={players} scores={room.scores} />
      {isHost
        ? <button className="primary-btn" type="button" onClick={onPlayAgain}>Play again</button>
        : <p className="waiting-copy">The host can start another game.</p>}
    </section>
  );
}
