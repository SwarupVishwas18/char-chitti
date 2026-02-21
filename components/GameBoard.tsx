"use client";

import { useState } from "react";
import type { RoomState, ClientMessage } from "@/lib/types";
import styles from "./GameBoard.module.css";

interface Props {
  roomState: RoomState;
  myHand: string[];
  myName: string;
  send: (msg: ClientMessage) => void;
}

const ENTITY_EMOJIS: Record<string, string> = {
  lion: "🦁", tiger: "🐯", elephant: "🐘", monkey: "🐒",
  cat: "🐱", dog: "🐶", rabbit: "🐰", bear: "🐻",
  mango: "🥭", apple: "🍎", banana: "🍌", grapes: "🍇",
  red: "🔴", blue: "🔵", green: "🟢", yellow: "🟡",
};

function getEmoji(name: string): string {
  return ENTITY_EMOJIS[name.toLowerCase()] || "🎴";
}

export function GameBoard({ roomState, myHand, myName, send }: Props) {
  const [selectedChit, setSelectedChit] = useState<number | null>(null);
  const [justPassed, setJustPassed] = useState(false);

  const players = roomState.players.filter((p) => p.isConnected);
  const myPlayer = players.find((p) => p.name === myName);

  const handleSelectChit = (idx: number) => {
    if (myHand.length !== 4) return;
    setSelectedChit(idx === selectedChit ? null : idx);
  };

  const handlePass = () => {
    if (selectedChit === null) return;
    send({ type: "pass_chit", chitIndex: selectedChit });
    setSelectedChit(null);
    setJustPassed(true);
    setTimeout(() => setJustPassed(false), 600);
  };

  const handleClaimWin = () => {
    send({ type: "claim_win" });
  };

  // Check if I can win
  const canWin = myHand.length === 4 && myHand.every((c) => c === myHand[0]);

  return (
    <div className={styles.board}>
      <div className="container">
        {/* Players overview */}
        <div className={styles.playersRow}>
          {players.map((p) => (
            <div
              key={p.id}
              className={`${styles.playerPill} ${p.name === myName ? styles.mePlayer : ""}`}
            >
              <span className={styles.pillAvatar}>{p.name[0].toUpperCase()}</span>
              <span className={styles.pillName}>{p.name === myName ? "You" : p.name}</span>
              <span className={styles.pillScore}>{p.score}pts</span>
            </div>
          ))}
        </div>

        {/* Passing direction indicator */}
        <div className={styles.passDirection}>
          <span>Pass direction:</span>
          <span className={styles.arrow}>⟳ Clockwise</span>
        </div>

        {/* Win button */}
        {canWin && (
          <div className={styles.winAlert}>
            <div className={styles.winAlertText}>🎉 You have 4 matching chits!</div>
            <button className="btn-success" onClick={handleClaimWin}>
              🏆 CLAIM WIN!
            </button>
          </div>
        )}

        {/* My hand */}
        <div className={styles.handSection}>
          <div className={styles.handHeader}>
            <h2>Your Hand</h2>
            <span className={styles.handCount}>{myHand.length}/4 chits</span>
          </div>

          {myHand.length === 0 ? (
            <div className={styles.waitingForDeal}>
              <div style={{ fontSize: 40, animation: "bounce 1s infinite" }}>🎴</div>
              <p>Waiting for your chits...</p>
            </div>
          ) : (
            <div className={styles.chitGrid}>
              {myHand.map((chit, idx) => (
                <button
                  key={idx}
                  className={`${styles.chit} ${selectedChit === idx ? styles.chitSelected : ""} ${justPassed ? styles.chitPassed : ""}`}
                  onClick={() => handleSelectChit(idx)}
                >
                  <span className={styles.chitEmoji}>{getEmoji(chit)}</span>
                  <span className={styles.chitName}>{chit}</span>
                  {selectedChit === idx && (
                    <span className={styles.chitLabel}>Selected</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {myHand.length > 0 && (
            <div className={styles.passArea}>
              {selectedChit !== null ? (
                <button className="btn-primary" onClick={handlePass}>
                  ➡️ Pass "{myHand[selectedChit]}" to next player
                </button>
              ) : (
                <p className={styles.passHint}>👆 Tap a chit to select it, then pass it</p>
              )}
            </div>
          )}
        </div>

        {/* Other players status */}
        <div className={styles.othersSection}>
          <h3>Other Players</h3>
          <div className={styles.othersList}>
            {players
              .filter((p) => p.name !== myName)
              .map((p, i) => (
                <div key={p.id} className={styles.otherPlayer}>
                  <div className={styles.otherAvatar}>{p.name[0].toUpperCase()}</div>
                  <div className={styles.otherInfo}>
                    <span className={styles.otherName}>{p.name}</span>
                    <div className={styles.otherChits}>
                      {[0, 1, 2, 3].map((j) => (
                        <span key={j} className={styles.hiddenChit}>🎴</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
