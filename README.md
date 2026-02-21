# 🎴 Char-Chitti | चार चिठ्ठी

A real-time multiplayer party game built with **Next.js** + **PartyKit**, deployable for free on **Vercel** + **PartyKit Cloud**.

---

## 🎮 How to Play

1. One player **creates a room** and sets a Room ID
2. Others **join with the Room ID**
3. Owner customizes **entity names** (Lion, Tiger, etc.) and **max players**
4. Owner clicks **Start Game** — each player gets 4 random chits
5. Players **pass one chit clockwise** per turn
6. First to collect **4 identical chits** clicks **CLAIM WIN!**
7. Winner gets a point — play again!

---

## 🛠️ Tech Stack

| Part | Technology |
|------|-----------|
| Frontend | Next.js 14 (App Router) |
| Real-time | PartyKit (WebSockets) |
| Styling | CSS Modules |
| Frontend Deploy | Vercel (free) |
| Backend Deploy | PartyKit Cloud (free) |

---

## 🚀 Setup & Local Dev

### 1. Clone & Install
```bash
git clone <your-repo>
cd char-chitti
npm install
```

### 2. Run locally (two terminals)

**Terminal 1 — PartyKit server:**
```bash
npx partykit dev
# Runs on http://localhost:1999
```

**Terminal 2 — Next.js frontend:**
```bash
npm run dev
# Runs on http://localhost:3000
```

Open `http://localhost:3000` and start playing!

---

## 🌐 Deploy to Production (Free)

### Step 1: Deploy PartyKit Server
```bash
npx partykit login       # Login with GitHub
npx partykit deploy      # Deploys to YOUR_USERNAME.partykit.dev
```

After deploy, note your PartyKit host: `char-chitti.YOUR_USERNAME.partykit.dev`

### Step 2: Deploy Next.js to Vercel
```bash
npm i -g vercel
vercel
```

When Vercel asks for environment variables, add:
```
NEXT_PUBLIC_PARTYKIT_HOST = char-chitti.YOUR_USERNAME.partykit.dev
```

Or go to **Vercel Dashboard → Project → Settings → Environment Variables** and add it there, then redeploy.

---

## ⚙️ Environment Variables

| Variable | Local | Production |
|----------|-------|-----------|
| `NEXT_PUBLIC_PARTYKIT_HOST` | `localhost:1999` | `char-chitti.USERNAME.partykit.dev` |

---

## 📁 Project Structure

```
char-chitti/
├── app/
│   ├── page.tsx              # Home — Create or Join room
│   ├── page.module.css
│   ├── layout.tsx
│   ├── globals.css
│   └── room/[roomId]/
│       ├── page.tsx          # Game room (dynamic route)
│       └── room.module.css
├── components/
│   ├── Lobby.tsx             # Waiting room + settings editor
│   ├── Lobby.module.css
│   ├── GameBoard.tsx         # Active game — chit passing
│   ├── GameBoard.module.css
│   ├── WinnerScreen.tsx      # Winner + scoreboard
│   └── WinnerScreen.module.css
├── hooks/
│   └── usePartyRoom.ts       # WebSocket hook
├── lib/
│   └── types.ts              # Shared types (Client + Server)
├── party/
│   └── index.ts              # PartyKit server (game logic)
├── partykit.json
├── next.config.js
└── package.json
```

---

## ✨ Features

- ✅ Create room with custom Room ID (shareable)
- ✅ Owner sets entity names (Lion, Tiger, Mango, etc.)
- ✅ Owner sets max players (2–8)
- ✅ Real-time player list in lobby
- ✅ Animated chit cards — tap to select & pass
- ✅ Server-side win validation (no cheating)
- ✅ Persistent scoreboard across rounds
- ✅ Play again without rejoining
- ✅ Mobile-friendly design

---

## 🔧 Customization Ideas

- Add **auto-pass timer** (already in settings as "Auto" mode — wire it up!)
- Add **sound effects** on pass/win
- Add **chat** during game
- Add **emoji reactions**
- Add **custom categories** (Bollywood actors, cricket teams, etc.)
