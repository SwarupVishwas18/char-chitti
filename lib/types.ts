export type GamePhase = "lobby" | "playing" | "finished";

export interface Player {
  id: string;
  name: string;
  isOwner: boolean;
  isConnected: boolean;
  hand: string[]; // 4 chit values
  score: number;
}

export interface RoomSettings {
  roomName: string;
  maxPlayers: number;
  entityNames: string[]; // e.g. ["Lion", "Tiger", "Elephant", "Monkey"]
  passSpeed: "manual" | "auto";
}

export interface RoomState {
  roomId: string;
  settings: RoomSettings;
  players: Player[];
  phase: GamePhase;
  winner: string | null; // player id
  winnerName: string | null;
  winnerEntity: string | null;
  round: number;
  ownerId: string;
  playerOrder: string[]; // fixed clockwise order of player IDs
  pendingPasses: string[]; // player IDs who have selected a chit to pass
  passRound: number; // which pass round we're on
}

// Messages Client → Server
export type ClientMessage =
  | { type: "join"; name: string }
  | { type: "update_settings"; settings: Partial<RoomSettings> }
  | { type: "start_game" }
  | { type: "pass_chit"; chitIndex: number }
  | { type: "claim_win" }
  | { type: "play_again" };

// Messages Server → Client
export type ServerMessage =
  | { type: "room_state"; state: RoomState }
  | { type: "your_hand"; hand: string[] }
  | { type: "error"; message: string }
  | { type: "game_started" }
  | { type: "winner"; playerId: string; playerName: string; entity: string }
  | { type: "pass_executed"; passRound: number }; // notifies all that a round of passes happened

export const DEFAULT_ENTITIES = ["Lion", "Tiger", "Elephant", "Monkey"];
export const DEFAULT_SETTINGS: RoomSettings = {
  roomName: "Char-Chitti Room",
  maxPlayers: 4,
  entityNames: DEFAULT_ENTITIES,
  passSpeed: "manual",
};
