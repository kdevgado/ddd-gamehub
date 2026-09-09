import { lazy, Suspense, useState } from "react";
import GameHub from "./hub/GameHub.jsx";
import "./hub/hub.css";
import "./hub/motion.css";

const TriviaRoom = lazy(() => import("./TriviaRoom.jsx"));

export default function App() {
  const [roomEntry, setRoomEntry] = useState(null);

  function openRoom(game = "uno", action = "create") {
    setRoomEntry({ game, action });
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  if (roomEntry) {
    return (
      <main className="app-shell">
        <div className="classified-bg" aria-hidden="true" />
        <Suspense fallback={<div className="lounge-room-loading" role="status">Getting the room ready…</div>}>
          <TriviaRoom
            initialGame={roomEntry.game}
            initialEntryMode={roomEntry.action}
            onBack={() => setRoomEntry(null)}
          />
        </Suspense>
      </main>
    );
  }

  return <GameHub onOpenRoom={openRoom} />;
}
