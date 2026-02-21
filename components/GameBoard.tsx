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

  // Turn logic
  const playerOrder = roomState.playerOrder || [];
  const currentTurnPlayerId = roomState.currentTurnPlayerId;
  const isMyTurn = myPlayer ? myPlayer.id === currentTurnPlayerId : false;
  const currentTurnPlayer = players.find((p) => p.id === currentTurnPlayerId);
  const currentTurnName = currentTurnPlayer
    ? (currentTurnPlayer.name === myName ? "Your" : `${currentTurnPlayer.name}'s`)
    : "...";

  // Find who I pass to (next clockwise from me)
  const myOrderIndex = myPlayer ? playerOrder.indexOf(myPlayer.id) : -1;
  const nextPlayerId = myOrderIndex !== -1
    ? playerOrder[(myOrderIndex + 1) % playerOrder.length]
    : null;
  const nextPlayer = nextPlayerId
    ? players.find((p) => p.id === nextPlayerId)
    : null;
  const nextPlayerName = nextPlayer ? nextPlayer.name : "next player";

  const handleSelectChit = (idx: number) => {
    if (!isMyTurn) return; // block if not your turn
    setSelectedChit(idx === selectedChit ? null : idx);
  };

  const handlePass = () => {
    if (selectedChit === null || !isMyTurn) return;
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
        {/* Players overview - show turn indicator */}
        <div className={styles.playersRow}>
          {players.map((p) => {
            const isTurn = p.id === currentTurnPlayerId;
            return (
              <div
                key={p.id}
                className={`${styles.playerPill} ${p.name === myName ? styles.mePlayer : ""} ${isTurn ? styles.activeTurn : ""}`}
              >
                <span className={styles.pillAvatar}>{p.name[0].toUpperCase()}</span>
                <span className={styles.pillName}>{p.name === myName ? "You" : p.name}</span>
                <span className={styles.pillScore}>{p.score}pts</span>
                {isTurn && <span className={styles.turnBadge}>🎯</span>}
              </div>
            );
          })}
        </div>

        {/* Turn indicator */}
        <div className={styles.turnIndicator}>
          <div className={isMyTurn ? styles.myTurnBanner : styles.waitTurnBanner}>
            {isMyTurn
              ? `🎯 YOUR TURN — Select a chit to pass to ${nextPlayerName}`
              : `⏳ ${currentTurnName} turn — waiting...`
            }
          </div>
          <div className={styles.passDirection}>
            <span>Round {roomState.passRound || 1}</span>
            <span className={styles.arrow}>⟳ Clockwise</span>
          </div>
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
            <span className={styles.handCount}>{myHand.length} chits</span>
          </div>

          {myHand.length === 0 ? (
            <div className={styles.waitingForDeal}>
              <div style={{ fontSize: 40, animation: "bounce 1s infinite" }}>🎴</div>
              <p>Waiting for your chits...</p>
            </div>
          ) : (
            <div className={`${styles.chitGrid} ${!isMyTurn ? styles.chitGridDisabled : ""}`}>
              {myHand.map((chit, idx) => (
                <button
                  key={idx}
                  className={`${styles.chit} ${selectedChit === idx ? styles.chitSelected : ""} ${justPassed ? styles.chitPassed : ""} ${!isMyTurn ? styles.chitDisabled : ""}`}
                  onClick={() => handleSelectChit(idx)}
                  disabled={!isMyTurn}
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

          {myHand.length > 0 && isMyTurn && (
            <div className={styles.passArea}>
              {selectedChit !== null ? (
                <button className="btn-primary" onClick={handlePass}>
                  ➡️ Pass &quot;{myHand[selectedChit]}&quot; to {nextPlayerName}
                </button>
              ) : (
                <p className={styles.passHint}>👆 Tap a chit to select it, then pass it</p>
              )}
            </div>
          )}

          {myHand.length > 0 && !isMyTurn && (
            <div className={styles.passArea}>
              <p className={styles.passHint}>⏳ Wait for your turn...</p>
            </div>
          )}
        </div>

        {/* Other players status */}
        <div className={styles.othersSection}>
          <h3>Other Players</h3>
          <div className={styles.othersList}>
            {players
              .filter((p) => p.name !== myName)
              .map((p) => {
                const isTurn = p.id === currentTurnPlayerId;
                return (
                  <div key={p.id} className={`${styles.otherPlayer} ${isTurn ? styles.otherPlayerActive : ""}`}>
                    <div className={styles.otherAvatar}>{p.name[0].toUpperCase()}</div>
                    <div className={styles.otherInfo}>
                      <span className={styles.otherName}>{p.name}</span>
                      <span className={isTurn ? styles.readyBadge : styles.waitingBadge}>
                        {isTurn ? "🎯 Their turn" : "⏳ Waiting"}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
