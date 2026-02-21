import type * as Party from "partykit/server";
import type {
  ClientMessage,
  Player,
  RoomSettings,
  RoomState,
  ServerMessage,
} from "../lib/types";
import { DEFAULT_SETTINGS } from "../lib/types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function dealChits(entities: string[], numPlayers: number): string[][] {
  // Create 4 chits per entity, one entity per player
  const allChits: string[] = [];
  for (let i = 0; i < numPlayers; i++) {
    const entity = entities[i % entities.length];
    for (let j = 0; j < 4; j++) {
      allChits.push(entity);
    }
  }
  const shuffled = shuffle(allChits);
  const hands: string[][] = [];
  for (let i = 0; i < numPlayers; i++) {
    hands.push(shuffled.slice(i * 4, i * 4 + 4));
  }
  return hands;
}

export default class CharChittiServer implements Party.Server {
  private players: Map<string, Player> = new Map();
  private settings: RoomSettings = { ...DEFAULT_SETTINGS };
  private phase: "lobby" | "playing" | "finished" = "lobby";
  private winner: string | null = null;
  private winnerName: string | null = null;
  private winnerEntity: string | null = null;
  private round: number = 1;
  private ownerId: string = "";
  // Fixed player order established at game start (clockwise)
  private playerOrder: string[] = [];
  // Index into playerOrder — whose turn it is to pass
  private currentTurnIndex: number = 0;
  // Current pass round number (increments after all players have passed once)
  private passRound: number = 0;

  constructor(readonly room: Party.Room) {}

  private getRoomState(): RoomState {
    return {
      roomId: this.room.id,
      settings: this.settings,
      players: Array.from(this.players.values()).map((p) => ({
        ...p,
        hand: [], // don't broadcast hands in room state
      })),
      phase: this.phase,
      winner: this.winner,
      winnerName: this.winnerName,
      winnerEntity: this.winnerEntity,
      round: this.round,
      ownerId: this.ownerId,
      playerOrder: this.playerOrder,
      currentTurnPlayerId: this.playerOrder.length > 0
        ? this.playerOrder[this.currentTurnIndex]
        : null,
      passRound: this.passRound,
    };
  }

  private broadcastRoomState() {
    const state = this.getRoomState();
    const msg: ServerMessage = { type: "room_state", state };
    this.room.broadcast(JSON.stringify(msg));
  }

  private sendHand(conn: Party.Connection, hand: string[]) {
    const msg: ServerMessage = { type: "your_hand", hand };
    conn.send(JSON.stringify(msg));
  }

  private sendError(conn: Party.Connection, message: string) {
    const msg: ServerMessage = { type: "error", message };
    conn.send(JSON.stringify(msg));
  }

  onConnect(conn: Party.Connection) {
    // Send current room state to new connection
    const state = this.getRoomState();
    conn.send(JSON.stringify({ type: "room_state", state }));
  }

  onClose(conn: Party.Connection) {
    const player = this.players.get(conn.id);
    if (player) {
      player.isConnected = false;
      // If owner disconnects, transfer ownership
      if (conn.id === this.ownerId) {
        const nextPlayer = Array.from(this.players.values()).find(
          (p) => p.id !== conn.id && p.isConnected
        );
        if (nextPlayer) {
          this.ownerId = nextPlayer.id;
          nextPlayer.isOwner = true;
          player.isOwner = false;
        }
      }
      // Remove from game if in lobby
      if (this.phase === "lobby") {
        this.players.delete(conn.id);
      }
      this.broadcastRoomState();
    }
  }

  onMessage(message: string, sender: Party.Connection) {
    const msg: ClientMessage = JSON.parse(message);

    switch (msg.type) {
      case "join":
        this.handleJoin(sender, msg.name);
        break;
      case "update_settings":
        this.handleUpdateSettings(sender, msg.settings);
        break;
      case "start_game":
        this.handleStartGame(sender);
        break;
      case "pass_chit":
        this.handlePassChit(sender, msg.chitIndex);
        break;
      case "claim_win":
        this.handleClaimWin(sender);
        break;
      case "play_again":
        this.handlePlayAgain(sender);
        break;
    }
  }

  private handleJoin(conn: Party.Connection, name: string) {
    if (this.phase !== "lobby") {
      this.sendError(conn, "Game already started");
      return;
    }
    if (this.players.size >= this.settings.maxPlayers) {
      this.sendError(conn, "Room is full");
      return;
    }

    const isFirst = this.players.size === 0;
    if (isFirst) this.ownerId = conn.id;

    const player: Player = {
      id: conn.id,
      name: name.trim().slice(0, 20) || "Player",
      isOwner: isFirst,
      isConnected: true,
      hand: [],
      score: 0,
    };

    this.players.set(conn.id, player);
    this.broadcastRoomState();
  }

  private handleUpdateSettings(
    conn: Party.Connection,
    settings: Partial<RoomSettings>
  ) {
    if (conn.id !== this.ownerId) {
      this.sendError(conn, "Only owner can change settings");
      return;
    }
    if (this.phase !== "lobby") {
      this.sendError(conn, "Cannot change settings during game");
      return;
    }

    // Validate entity names
    if (settings.entityNames) {
      const cleaned = settings.entityNames
        .map((e) => e.trim())
        .filter((e) => e.length > 0)
        .slice(0, 10);
      if (cleaned.length < 2) {
        this.sendError(conn, "Need at least 2 entity names");
        return;
      }
      settings.entityNames = cleaned;
    }

    this.settings = { ...this.settings, ...settings };
    this.broadcastRoomState();
  }

  private handleStartGame(conn: Party.Connection) {
    if (conn.id !== this.ownerId) {
      this.sendError(conn, "Only owner can start the game");
      return;
    }
    const playerList = Array.from(this.players.values()).filter(
      (p) => p.isConnected
    );
    if (playerList.length < 2) {
      this.sendError(conn, "Need at least 2 players to start");
      return;
    }

    // Ensure enough entities
    while (this.settings.entityNames.length < playerList.length) {
      this.settings.entityNames.push(
        `Entity${this.settings.entityNames.length + 1}`
      );
    }

    const hands = dealChits(this.settings.entityNames, playerList.length);
    playerList.forEach((player, i) => {
      player.hand = hands[i];
      this.players.set(player.id, player);
    });

    // Lock the player order for clockwise passing
    this.playerOrder = playerList.map((p) => p.id);
    this.currentTurnIndex = 0;
    this.passRound = 1;

    this.phase = "playing";
    this.winner = null;
    this.winnerName = null;
    this.winnerEntity = null;

    this.broadcastRoomState();

    // Send each player their hand
    for (const [connId, player] of this.players) {
      const connection = this.room.getConnection(connId);
      if (connection) {
        this.sendHand(connection, player.hand);
      }
    }
  }

  private handlePassChit(conn: Party.Connection, chitIndex: number) {
    if (this.phase !== "playing") return;
    const player = this.players.get(conn.id);
    if (!player) return;
    if (chitIndex < 0 || chitIndex >= player.hand.length) return;

    // Only the current turn player can pass
    const currentPlayerId = this.playerOrder[this.currentTurnIndex];
    if (conn.id !== currentPlayerId) {
      this.sendError(conn, "It's not your turn!");
      return;
    }

    // Find the next player clockwise (receiver)
    const nextIndex = (this.currentTurnIndex + 1) % this.playerOrder.length;
    const nextPlayerId = this.playerOrder[nextIndex];
    const nextPlayer = this.players.get(nextPlayerId);
    if (!nextPlayer) return;

    // Remove chit from sender, add to receiver
    const [chitToPass] = player.hand.splice(chitIndex, 1);
    nextPlayer.hand.push(chitToPass);

    // Send updated hands to both players
    const senderConn = this.room.getConnection(conn.id);
    if (senderConn) this.sendHand(senderConn, player.hand);
    const receiverConn = this.room.getConnection(nextPlayerId);
    if (receiverConn) this.sendHand(receiverConn, nextPlayer.hand);

    // Advance turn to next player
    this.currentTurnIndex = nextIndex;

    // If we've gone full circle, bump the pass round
    if (this.currentTurnIndex === 0) {
      this.passRound += 1;
    }

    this.broadcastRoomState();
  }

  private handleClaimWin(conn: Party.Connection) {
    if (this.phase !== "playing") return;
    const player = this.players.get(conn.id);
    if (!player) return;

    // Validate: all 4 chits must be identical
    if (player.hand.length !== 4) return;
    const [first, ...rest] = player.hand;
    if (!rest.every((c) => c === first)) {
      this.sendError(conn, "Invalid win claim — not 4 matching chits!");
      return;
    }

    this.phase = "finished";
    this.winner = conn.id;
    this.winnerName = player.name;
    this.winnerEntity = first;
    player.score += 1;

    const winMsg: ServerMessage = {
      type: "winner",
      playerId: conn.id,
      playerName: player.name,
      entity: first,
    };
    this.room.broadcast(JSON.stringify(winMsg));
    this.broadcastRoomState();
  }

  private handlePlayAgain(conn: Party.Connection) {
    if (conn.id !== this.ownerId) return;
    if (this.phase !== "finished") return;

    this.phase = "lobby";
    this.winner = null;
    this.winnerName = null;
    this.winnerEntity = null;
    this.round += 1;

    // Clear hands
    for (const player of this.players.values()) {
      player.hand = [];
    }

    this.broadcastRoomState();
  }
}

CharChittiServer satisfies Party.Worker;
