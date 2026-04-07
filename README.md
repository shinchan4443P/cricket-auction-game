# 🏏 Cricket Auction Strategy Game

A real-time multiplayer cricket auction game where players bid on cricketers, build a 12-player squad, and compete in strategy card battles.

## Features

- **Format Selection**: IPL, Test, T20, ODI
- **Create/Join Rooms**: 2–8 players per room, 100 Cr each
- **Live Auction**: 30-second timer per player, one bid per player, highest wins
- **Match Phase**: Best-of-5 card battles comparing stats (Strike Rate, Economy, etc.)
- **Winner System**: Bonus money, results screen

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express, Socket.io
- **Real-time**: WebSockets for multiplayer sync

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run dev server (client + backend)
npm run dev
```

- **Client**: http://localhost:5173
- **Server**: http://localhost:3001

## Project Structure

```
├── client/          # React frontend
├── server/          # Node.js + Socket.io backend
├── shared/          # Types, constants, player data
└── package.json     # Root scripts
```

## Game Flow

1. **Home** → Enter name, select format (IPL / International → Test/T20/ODI), Create or Join room
2. **Lobby** → Host starts auction when 2+ players ready
3. **Auction** → 30s per player, bid once, highest wins; collect 12 players
4. **Match** → Semi-finals style brackets; select 1 card per round; compare stats; best of 5
5. **Results** → Winner gets bonus money; back to home
