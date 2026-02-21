"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  const handleCreate = () => {
    if (!name.trim()) { setError("Enter your name"); return; }
    const id = generateRoomId();
    router.push(`/room/${id}?name=${encodeURIComponent(name.trim())}&owner=1`);
  };

  const handleJoin = () => {
    if (!name.trim()) { setError("Enter your name"); return; }
    if (!roomId.trim()) { setError("Enter a room ID"); return; }
    router.push(`/room/${roomId.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.emoji}>🎴</div>
        <h1 className={styles.title}>Char-Chitti1</h1>
        <p className={styles.subtitle}>चार चिठ्ठी · The Fast-Paced Party Game</p>
        <p className={styles.tagline}>Collect 4 matching chits before anyone else!</p>
      </div>

      <div className="container">
        <div className="card">
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${tab === "create" ? styles.tabActive : ""}`}
              onClick={() => { setTab("create"); setError(""); }}
            >
              🏠 Create Room
            </button>
            <button
              className={`${styles.tab} ${tab === "join" ? styles.tabActive : ""}`}
              onClick={() => { setTab("join"); setError(""); }}
            >
              🚪 Join Room
            </button>
          </div>

          <div className={styles.formArea}>
            <div className={styles.field}>
              <label className={styles.label}>Your Name</label>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="e.g. Rahul, Priya..."
                maxLength={20}
                onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? handleCreate() : handleJoin())}
              />
            </div>

            {tab === "join" && (
              <div className={styles.field}>
                <label className={styles.label}>Room ID</label>
                <input
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(""); }}
                  placeholder="e.g. AB1C2D"
                  maxLength={10}
                  style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                />
              </div>
            )}

            {error && <div className="error-msg">{error}</div>}

            <button
              className="btn-primary"
              onClick={tab === "create" ? handleCreate : handleJoin}
            >
              {tab === "create" ? "🎉 Create Room" : "🚀 Join Game"}
            </button>
          </div>
        </div>

        <div className={styles.howTo}>
          <h3>How to Play</h3>
          <div className={styles.steps}>
            <div className={styles.step}><span>1</span> Create a room & share the Room ID</div>
            <div className={styles.step}><span>2</span> Owner sets entity names (Lion, Tiger...)</div>
            <div className={styles.step}><span>3</span> Everyone passes chits clockwise ⟳</div>
            <div className={styles.step}><span>4</span> First to collect 4 matching chits wins! 🏆</div>
          </div>
        </div>
      </div>
    </div>
  );
}
