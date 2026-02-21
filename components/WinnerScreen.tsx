"use client";

import type { RoomState, ClientMessage } from "@/lib/types";
import styles from "./WinnerScreen.module.css";

interface Props {
  roomState: RoomState;
  myName: string;
  isOwner: boolean;
  send: (msg: ClientMessage) => void;
}

const ENTITY_EMOJIS: Record<string, string> = {
  lion: "🦁", tiger: "🐯", elephant: "🐘", monkey: "🐒",
  cat: "🐱", dog: "🐶", rabbit: "🐰", bear: "🐻",
  mango: "🥭", apple: "🍎", banana: "🍌", grapes: "🍇",
};

function getEmoji(name: string): string {
  return ENTITY_EMOJIS[name?.toLowerCase()] || "🎴";
}

export function WinnerScreen({ roomState, myName, isOwner, send }: Props) {
  const iAmWinner = roomState.winnerName === myName;
  const players = roomState.players.filter((p) => p.isConnected);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className={styles.screen}>
      <div className="container">
        {/* Winner announcement */}
        <div className={`${styles.winnerCard} ${iAmWinner ? styles.myWin : ""}`}>
          <div className={styles.confetti}>
            {["🎉", "🎊", "✨", "🌟", "🎈"].map((e, i) => (
              <span key={i} className={styles.confettiItem} style={{ animationDelay: `${i * 0.15}s` }}>
                {e}
              </span>
            ))}
          </div>

          <div className={styles.trophy}>🏆</div>
          <h1 className={styles.winnerName}>
            {iAmWinner ? "You Won!" : `${roomState.winnerName} Won!`}
          </h1>
          {roomState.winnerEntity && (
            <div className={styles.winningEntity}>
              <span className={styles.entityEmoji}>
                {getEmoji(roomState.winnerEntity)}
              </span>
              <span className={styles.entityText}>
                4× {roomState.winnerEntity}
              </span>
            </div>
          )}
          <p className={styles.roundInfo}>Round {roomState.round} complete</p>
        </div>

        {/* Scoreboard */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🏅 Scoreboard</h2>
          <div className={styles.scoreList}>
            {sortedPlayers.map((p, i) => (
              <div
                key={p.id}
                className={`${styles.scoreRow} ${p.name === roomState.winnerName ? styles.winner : ""}`}
              >
                <span className={styles.rank}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>
                <span className={styles.scoreName}>
                  {p.name}
                  {p.name === myName && " (You)"}
                </span>
                <span className={styles.scorePoints}>{p.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isOwner ? (
          <button
            className="btn-primary"
            style={{ fontSize: 16, padding: 16 }}
            onClick={() => send({ type: "play_again" })}
          >
            🔄 Play Again
          </button>
        ) : (
          <div className={styles.waitingMsg}>
            <div className={styles.dots}>
              <span /><span /><span />
            </div>
            Waiting for host to start next round...
          </div>
        )}
      </div>
    </div>
  );
}
