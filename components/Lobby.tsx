"use client";

import { useState } from "react";
import type { RoomState, ClientMessage, RoomSettings } from "@/lib/types";
import { DEFAULT_ENTITIES } from "@/lib/types";
import styles from "./Lobby.module.css";

interface Props {
  roomState: RoomState;
  roomId: string;
  myName: string;
  isOwner: boolean;
  send: (msg: ClientMessage) => void;
}

export function Lobby({ roomState, roomId, myName, isOwner, send }: Props) {
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [settingsForm, setSettingsForm] = useState<RoomSettings>(roomState.settings);

  const { settings, players } = roomState;
  const connectedPlayers = players.filter((p) => p.isConnected);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/room/${roomId}?name=YourName`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveSettings = () => {
    send({ type: "update_settings", settings: settingsForm });
    setEditing(false);
  };

  const addEntity = () => {
    if (settingsForm.entityNames.length >= 10) return;
    setSettingsForm((s) => ({ ...s, entityNames: [...s.entityNames, ""] }));
  };

  const updateEntity = (i: number, val: string) => {
    setSettingsForm((s) => {
      const names = [...s.entityNames];
      names[i] = val;
      return { ...s, entityNames: names };
    });
  };

  const removeEntity = (i: number) => {
    setSettingsForm((s) => ({
      ...s,
      entityNames: s.entityNames.filter((_, idx) => idx !== i),
    }));
  };

  const canStart = connectedPlayers.length >= 2;

  return (
    <div className={styles.lobby}>
      <div className="container">
        {/* Room Share Card */}
        <div className={`card ${styles.shareCard}`}>
          <div className={styles.shareTop}>
            <div>
              <div className={styles.shareLabel}>Room ID</div>
              <div className={styles.bigRoomId}>{roomId}</div>
            </div>
            <div className={styles.shareButtons}>
              <button className="btn-secondary" onClick={copyId}>
                {copied ? "✓ Copied!" : "📋 Copy ID"}
              </button>
              <button className="btn-secondary" onClick={copyLink}>
                🔗 Share Code
              </button>
            </div>
          </div>
          <div className={styles.shareHint}>
            Share the Room ID with friends to invite them
          </div>
        </div>

        {/* Players */}
        <div className={`card ${styles.playersCard}`}>
          <div className={styles.cardHeader}>
            <h2>Players</h2>
            <span className={styles.count}>
              {connectedPlayers.length} / {settings.maxPlayers}
            </span>
          </div>
          <div className={styles.playerList}>
            {connectedPlayers.map((p) => (
              <div key={p.id} className={styles.playerRow}>
                <div className={styles.playerAvatar}>
                  {p.name[0].toUpperCase()}
                </div>
                <span className={styles.playerName}>
                  {p.name}
                  {p.name === myName && " (You)"}
                </span>
                {p.isOwner && <span className={styles.ownerBadge}>👑 Host</span>}
              </div>
            ))}
            {Array.from({ length: settings.maxPlayers - connectedPlayers.length }).map((_, i) => (
              <div key={`empty-${i}`} className={`${styles.playerRow} ${styles.emptySlot}`}>
                <div className={`${styles.playerAvatar} ${styles.emptyAvatar}`}>?</div>
                <span>Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className={`card ${styles.settingsCard}`}>
          <div className={styles.cardHeader}>
            <h2>Game Settings</h2>
            {isOwner && !editing && (
              <button
                className="btn-secondary"
                style={{ width: "auto", padding: "6px 14px" }}
                onClick={() => { setSettingsForm(roomState.settings); setEditing(true); }}
              >
                ✏️ Edit
              </button>
            )}
          </div>

          {!editing ? (
            <div className={styles.settingsView}>
              <div className={styles.settingRow}>
                <span className={styles.settingKey}>Max Players</span>
                <span className={styles.settingVal}>{settings.maxPlayers}</span>
              </div>
              <div className={styles.settingRow}>
                <span className={styles.settingKey}>Pass Mode</span>
                <span className={styles.settingVal}>{settings.passSpeed === "manual" ? "Manual ✋" : "Auto ⚡"}</span>
              </div>
              <div className={styles.settingRow}>
                <span className={styles.settingKey}>Entities</span>
                <div className={styles.entityChips}>
                  {settings.entityNames.map((e) => (
                    <span key={e} className={styles.chip}>{e}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.settingsEdit}>
              <div className={styles.field2}>
                <label>Room Name</label>
                <input
                  value={settingsForm.roomName}
                  onChange={(e) => setSettingsForm((s) => ({ ...s, roomName: e.target.value }))}
                  maxLength={40}
                />
              </div>
              <div className={styles.field2}>
                <label>Max Players (2–8)</label>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={settingsForm.maxPlayers}
                  onChange={(e) =>
                    setSettingsForm((s) => ({ ...s, maxPlayers: Math.min(8, Math.max(2, Number(e.target.valueAsNumber))) }))
                  }
                />
              </div>
              <div className={styles.field2}>
                <label>Pass Mode</label>
                <div className={styles.toggleRow}>
                  {(["manual", "auto"] as const).map((mode) => (
                    <button
                      key={mode}
                      className={`${styles.toggleBtn} ${settingsForm.passSpeed === mode ? styles.toggleActive : ""}`}
                      onClick={() => setSettingsForm((s) => ({ ...s, passSpeed: mode }))}
                    >
                      {mode === "manual" ? "✋ Manual" : "⚡ Auto"}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.field2}>
                <label>Entity Names (min 2, max 8)</label>
                <div className={styles.entityList}>
                  {settingsForm.entityNames.map((e, i) => (
                    <div key={i} className={styles.entityRow}>
                      <input
                        value={e}
                        onChange={(ev) => updateEntity(i, ev.target.value)}
                        placeholder={`Entity ${i + 1}`}
                        maxLength={20}
                      />
                      <button
                        onClick={() => removeEntity(i)}
                        className={styles.removeBtn}
                        disabled={settingsForm.entityNames.length <= 2}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {settingsForm.entityNames.length < 8 && (
                    <button className={styles.addEntityBtn} onClick={addEntity}>
                      + Add Entity
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.editActions}>
                <button className="btn-secondary" style={{ width: "auto" }} onClick={() => setEditing(false)}>Cancel</button>
                <button className="btn-primary" style={{ width: "auto" }} onClick={saveSettings}>Save Settings</button>
              </div>
            </div>
          )}
        </div>

        {/* Start Button */}
        {isOwner ? (
          <div className={styles.startArea}>
            {!canStart && (
              <p className="text-muted" style={{ textAlign: "center", marginBottom: 8 }}>
                Need at least 2 players to start
              </p>
            )}
            <button
              className="btn-primary"
              disabled={!canStart}
              onClick={() => send({ type: "start_game" })}
              style={{ fontSize: 17, padding: "16px" }}
            >
              🎮 Start Game ({connectedPlayers.length} players)
            </button>
          </div>
        ) : (
          <div className={styles.waitingMsg}>
            <div className={styles.waitingDots}>
              <span />
              <span />
              <span />
            </div>
            Waiting for host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
