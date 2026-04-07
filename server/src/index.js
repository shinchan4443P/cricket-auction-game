import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { setupGameHandlers } from './game/socketHandlers.js';
import { GAME_PHASES, DEFAULT_MONEY_CR } from '../../shared/types.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const rooms = new Map();
const players = new Map();

function getRoom(roomId) {
  return rooms.get(roomId);
}

function createRoom(hostId, config) {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  const money = config.money ?? DEFAULT_MONEY_CR;
  const room = {
    id: roomId,
    format: config.format,
    hostId,
    config,
    phase: GAME_PHASES.LOBBY,
    players: [{
      socketId: hostId,
      name: players.get(hostId)?.name || 'Player',
      money,
      squad: [],
      team: config.teamId || null,
      ready: false,
    }],
    auction: { currentPlayerIndex: 0, playerPool: [], timeLeft: config.auctionTimer ?? 30 },
    match: { bracket: [], currentRound: 0, matchups: [], roundResults: {} },
  };
  rooms.set(roomId, room);
  return room;
}

function joinRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room || room.phase !== GAME_PHASES.LOBBY) return null;
  const p = players.get(socketId);
  const money = room.config?.money ?? DEFAULT_MONEY_CR;
  room.players.push({
    socketId,
    name: p?.name || 'Player',
    money,
    squad: [],
    team: null,
    ready: false,
  });
  return room;
}

function removePlayerFromRoom(socketId, io) {
  const p = players.get(socketId);
  if (!p?.roomId) return;
  const room = rooms.get(p.roomId);
  if (!room) {
    p.roomId = null;
    return;
  }

  room.players = room.players.filter((pl) => pl.socketId !== socketId);

  // Reassign host if needed
  if (room.hostId === socketId && room.players.length > 0) {
    room.hostId = room.players[0].socketId;
  }

  // Remove room if empty
  if (room.players.length === 0) {
    rooms.delete(room.id);
  } else {
    io.to(room.id).emit('room:update', room);
  }

  const sock = io.sockets.sockets.get(socketId);
  if (sock) {
    sock.leave(room.id);
  }

  p.roomId = null;
}

io.on('connection', (socket) => {
  players.set(socket.id, { roomId: null, name: 'Player' });
  console.log('Player connected:', socket.id);

  setupGameHandlers(io, socket, { rooms, players, getRoom, createRoom, joinRoom });

  socket.on('room:leave', () => {
    removePlayerFromRoom(socket.id, io);
    socket.emit('room:left');
  });

  socket.on('disconnect', () => {
    removePlayerFromRoom(socket.id, io);
    players.delete(socket.id);
    console.log('Player disconnected:', socket.id);
  });
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
