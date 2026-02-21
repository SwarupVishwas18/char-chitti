"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { usePartyRoom } from "@/hooks/usePartyRoom";
import { Lobby } from "@/components/Lobby";
import { GameBoard } from "@/components/GameBoard";
import { WinnerScreen } from "@/components/WinnerScreen";
import styles from "./room.module.css";

export default function RoomPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const roomId = (params.roomId as string) || "";
  const playerName = searchParams.get("name") || "Player";
  const isOwner = searchParams.get("owner") === "1";

  const { state, send } = usePartyRoom(roomId, playerName);
  const { roomState, myHand, error, connected } = state;

  // Find my player
  const myPlayer = roomState?.players.find(
    (p) => p.name === playerName
  ) || null;

  const amOwner = myPlayer?.isOwner ?? isOwner;

  if (!connected || !roomState) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}>🎴</div>
        <p>Connecting to room <strong>{roomId}</strong>...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/")}>
          ← Home
        </button>
        <div className={styles.roomInfo}>
          <span className={styles.roomName}>{roomState.settings.roomName}</span>
          <span className={styles.roomId}>#{roomId}</span>
        </div>
        <div className={`${styles.dot} ${connected ? styles.dotGreen : styles.dotRed}`} />
      </header>

      {error && (
        <div className={styles.errorBanner}>{error}</div>
      )}

      {roomState.phase === "lobby" && (
        <Lobby
          roomState={roomState}
          roomId={roomId}
          myName={playerName}
          isOwner={amOwner}
          send={send}
        />
      )}

      {roomState.phase === "playing" && (
        <GameBoard
          roomState={roomState}
          myHand={myHand}
          myName={playerName}
          send={send}
        />
      )}

      {roomState.phase === "finished" && (
        <WinnerScreen
          roomState={roomState}
          myName={playerName}
          isOwner={amOwner}
          send={send}
        />
      )}
    </div>
  );
}
