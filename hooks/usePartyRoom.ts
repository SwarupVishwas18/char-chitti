"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import PartySocket from "partysocket";
import type {
  ClientMessage,
  Player,
  RoomSettings,
  RoomState,
  ServerMessage,
} from "@/lib/types";

interface GameState {
  roomState: RoomState | null;
  myHand: string[];
  error: string;
  connected: boolean;
}

export function usePartyRoom(roomId: string, playerName: string) {
  const socketRef = useRef<PartySocket | null>(null);
  const [state, setState] = useState<GameState>({
    roomState: null,
    myHand: [],
    error: "",
    connected: false,
  });

  const send = useCallback((msg: ClientMessage) => {
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  useEffect(() => {
    if (!roomId || !playerName) return;

    const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";

    const socket = new PartySocket({
      host,
      room: roomId,
      party: "main",
    });

    socketRef.current = socket;

    socket.addEventListener("open", () => {
      setState((s) => ({ ...s, connected: true, error: "" }));
      // Join the room
      socket.send(JSON.stringify({ type: "join", name: playerName } as ClientMessage));
    });

    socket.addEventListener("close", () => {
      setState((s) => ({ ...s, connected: false }));
    });

    socket.addEventListener("error", () => {
      setState((s) => ({ ...s, error: "Connection error. Trying to reconnect..." }));
    });

    socket.addEventListener("message", (event) => {
      const msg: ServerMessage = JSON.parse(event.data);

      switch (msg.type) {
        case "room_state":
          setState((s) => ({ ...s, roomState: msg.state }));
          break;
        case "your_hand":
          setState((s) => ({ ...s, myHand: msg.hand }));
          break;
        case "error":
          setState((s) => ({ ...s, error: msg.message }));
          setTimeout(() => setState((s) => ({ ...s, error: "" })), 3000);
          break;
        case "winner":
          // room_state broadcast will handle UI update
          break;
      }
    });

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [roomId, playerName]);

  return { state, send };
}
