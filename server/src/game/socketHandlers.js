import { players } from '../../../shared/players.js';
import { GAME_PHASES, ROOM_PRESETS, MATCH_ROUND_OPTIONS, MIN_PLAYERS, DEFAULT_MONEY_CR, AUCTION_BASE_PRICE_CR } from '../../../shared/types.js';
import { decideWinner } from '../../../shared/engine/compare.js';

let auctionTimerInterval = null;

function getRoomConfig(room) {
  return room.config || {};
}

function countRole(squad, role) {
  return (squad || []).filter((c) => c.role === role).length;
}

function canBidOnPlayer(playerData, currentPlayer, room) {
  if (!playerData || !currentPlayer) return false;
  const cfg = getRoomConfig(room);
  const squadSize = cfg.squadSize ?? 12;
  const minB = cfg.minBowlers ?? 3;
  const minBat = cfg.minBatsmen ?? 3;
  const minWK = cfg.minWK ?? 1;
  const maxAR = cfg.maxAllRounders ?? 5;

  if (playerData.squad.length >= squadSize) return false;

  const role = currentPlayer.role;

  // Counts after adding this card.
  let bowlers = countRole(playerData.squad, 'Bowler');
  let batsmen = countRole(playerData.squad, 'Batsman');
  let wks = countRole(playerData.squad, 'WK');
  let allRounders = countRole(playerData.squad, 'All-Rounder');

  if (role === 'Bowler') bowlers++;
  if (role === 'Batsman') batsmen++;
  if (role === 'WK') wks++;
  if (role === 'All-Rounder') allRounders++;

  // Hard constraint: do not exceed AR limit.
  if (allRounders > maxAR) return false;

  const filledAfter = playerData.squad.length + 1;
  const remainingAfter = squadSize - filledAfter;

  // Feasibility constraint: still possible to reach minimums with remaining slots.
  const canReachBowlers = bowlers + remainingAfter >= minB;
  const canReachBatsmen = batsmen + remainingAfter >= minBat;
  const canReachWK = wks + remainingAfter >= minWK;

  return canReachBowlers && canReachBatsmen && canReachWK;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Match scoring is handled by shared/engine/compare.js.

export function setupGameHandlers(io, socket, { rooms, players, getRoom, createRoom, joinRoom }) {
  socket.on('player:setName', (name) => {
    const p = players.get(socket.id);
    if (p) p.name = name || 'Player';
  });

  socket.on('room:create', (payload) => {
    const config = buildRoomConfig(payload);
    const room = createRoom(socket.id, config);
    const p = players.get(socket.id);
    p.roomId = room.id;
    socket.join(room.id);
    socket.emit('room:created', room);
  });

  socket.on('room:join', ({ roomId, teamId }) => {
    const existing = getRoom(roomId);
    if (!existing || existing.phase !== GAME_PHASES.LOBBY) {
      return socket.emit('room:joinFailed', { msg: 'Room not found or already started' });
    }
    if (teamId && existing.players.some((pl) => pl.team === teamId)) {
      return socket.emit('room:joinFailed', { msg: 'Team already taken in this room' });
    }
    const room = joinRoom(roomId, socket.id);
    if (!room) return socket.emit('room:joinFailed', { msg: 'Room join failed' });
    const p = players.get(socket.id);
    p.roomId = room.id;
    socket.join(room.id);
    // Assign team to the new player
    if (teamId) {
      const playerEntry = room.players.find((pl) => pl.socketId === socket.id);
      if (playerEntry) playerEntry.team = teamId;
    }
    io.to(room.id).emit('room:update', room);
  });

  socket.on('room:ready', ({ ready }) => {
    const p = players.get(socket.id);
    const room = getRoom(p?.roomId);
    if (!room) return;
    const playerEntry = room.players.find((pl) => pl.socketId === socket.id);
    if (!playerEntry) return;
    playerEntry.ready = !!ready;
    io.to(room.id).emit('room:update', room);
  });

  socket.on('room:kick', ({ targetSocketId }) => {
    const p = players.get(socket.id);
    const room = getRoom(p?.roomId);
    if (!room || room.hostId !== socket.id) return;
    if (targetSocketId === socket.id) return;
    const target = room.players.find((pl) => pl.socketId === targetSocketId);
    if (!target) return;
    room.players = room.players.filter((pl) => pl.socketId !== targetSocketId);
    const targetPlayer = players.get(targetSocketId);
    if (targetPlayer) targetPlayer.roomId = null;
    io.to(targetSocketId).emit('room:kicked', { msg: 'You were kicked by host' });
    io.sockets.sockets.get(targetSocketId)?.leave(room.id);
    io.to(room.id).emit('room:update', room);
  });

  socket.on('room:start', () => {
    const p = players.get(socket.id);
    const room = getRoom(p?.roomId);
    if (!room || room.hostId !== socket.id || room.players.length < MIN_PLAYERS) return;
    // All players must be ready
    const allReady = room.players.length >= MIN_PLAYERS && room.players.every((pl) => pl.ready);
    if (!allReady) return;
    const cfg = getRoomConfig(room);
    const playerPool = shuffleArray([...(players || [])]);
    room.auction.playerPool = playerPool;
    room.auction.currentPlayerIndex = 0;
    room.auction.bidsMap = {};
    room.auction.bidsThisRound = new Set();
    room.auction.revealedWinner = null;
    room.auction.lastSold = null;
    room.phase = GAME_PHASES.AUCTION;
    room.auction.timeLeft = cfg.auctionTimer ?? 30;
    startAuctionTimer(io, room);
    io.to(room.id).emit('auction:start', sanitizeRoomForAuction(room));
  });

  socket.on('room:forceStartMatch', () => {
    const p = players.get(socket.id);
    const room = getRoom(p?.roomId);
    if (!room || room.hostId !== socket.id) return;
    if (room.phase !== GAME_PHASES.AUCTION && room.phase !== GAME_PHASES.LOBBY) return;
    if (room.phase === GAME_PHASES.LOBBY && room.players.length < MIN_PLAYERS) return;
    if (auctionTimerInterval) {
      clearInterval(auctionTimerInterval);
      auctionTimerInterval = null;
    }
    room.phase = GAME_PHASES.MATCH;
    ensureMinSquadForMatch(room);
    buildMatchBracket(room);
    io.to(room.id).emit('match:start', room);
  });

  socket.on('auction:forceNext', () => {
    const p = players.get(socket.id);
    const room = getRoom(p?.roomId);
    if (!room || room.hostId !== socket.id || room.phase !== GAME_PHASES.AUCTION) return;
    if (auctionTimerInterval) {
      clearInterval(auctionTimerInterval);
      auctionTimerInterval = null;
    }
    room.auction.timeLeft = 0;
    finalizeAuctionPlayer(io, room);
  });

  socket.on('auction:bid', ({ amount }) => {
    const p = players.get(socket.id);
    const room = getRoom(p?.roomId);
    if (!room || room.phase !== GAME_PHASES.AUCTION) return;
    const playerData = room.players.find((pl) => pl.socketId === socket.id);
    const currentPlayerCard = room.auction.playerPool?.[room.auction.currentPlayerIndex];
    const cfg = getRoomConfig(room);
    const squadSize = cfg.squadSize ?? 12;
    const minBid = AUCTION_BASE_PRICE_CR;
    const bidAmount = Number(amount);
    if (!Number.isFinite(bidAmount)) return;
    if (!playerData || playerData.money < bidAmount || room.auction.bidsThisRound?.has(socket.id)) return;
    if (playerData.squad.length >= squadSize) return;
    if (!canBidOnPlayer(playerData, currentPlayerCard, room)) return;
    room.auction.bidsMap = room.auction.bidsMap || {};
    if (bidAmount < minBid) return;
    room.auction.bidsMap[socket.id] = bidAmount;
    room.auction.bidsThisRound.add(socket.id);
    io.to(socket.id).emit('auction:bidPlaced', { amount });
    io.to(room.id).emit('auction:update', sanitizeRoomForAuction(room));
  });

  socket.on('match:select', ({ playerId }) => {
    const p = players.get(socket.id);
    const room = getRoom(p?.roomId);
    if (!room || room.phase !== GAME_PHASES.MATCH) return;
    const usedCards = room.match.usedCards || {};
    const myUsed = usedCards[socket.id] || [];
    if (myUsed.includes(playerId)) return;
    const playerEntry = room.players.find((pl) => pl.socketId === socket.id);
    const selectedCard = playerEntry?.squad?.find((c) => c.id === playerId);
    if (!selectedCard) return;
    const requiredRole = room.match.currentRequiredRole || 'Any';
    if (requiredRole !== 'Any' && selectedCard.role !== requiredRole) {
      socket.emit('match:invalidSelection', { msg: `Select a ${requiredRole}` });
      return;
    }
    room.match.currentSelections = room.match.currentSelections || {};
    room.match.currentSelections[socket.id] = playerId;
    io.to(room.id).emit('match:selectionReceived', { socketId: socket.id });
    const allSelected = room.match.activePlayers?.every((pid) => room.match.currentSelections[pid]);
    if (allSelected && room.match.activePlayers?.length === 2) {
      resolveRound(io, room);
    }
  });
}

function buildRoomConfig(payload) {
  if (payload.roomType === 'custom') {
    const fmt = payload.format || 'IPL';
    const subFmt = payload.subFormat;
    const format = fmt === 'International' ? (subFmt || 'T20') : fmt;
    const minRoles = (payload.minBowlers ?? 3) + (payload.minBatsmen ?? 3) + (payload.minWK ?? 1);
    const squadSize = Math.min(15, Math.max(8, payload.squadSize ?? 12));
    if (minRoles > squadSize) {
      return buildRoomConfig({ ...payload, minBowlers: 2, minBatsmen: 2, minWK: 1, squadSize });
    }
    return {
      format,
      money: Math.min(500, Math.max(10, payload.money ?? DEFAULT_MONEY_CR)),
      squadSize,
      auctionTimer: Math.min(45, Math.max(15, payload.auctionTimer ?? 30)),
      matchRounds: payload.matchRounds ?? 'bestOf7',
      minBowlers: payload.minBowlers ?? 3,
      minBatsmen: payload.minBatsmen ?? 3,
      minWK: payload.minWK ?? 1,
      maxAllRounders: payload.maxAllRounders ?? 5,
      teamId: payload.teamId || null,
    };
  }
  const preset = ROOM_PRESETS[payload.roomType] || ROOM_PRESETS.STANDARD;
  const fmt = payload.format || 'IPL';
  const subFmt = payload.subFormat;
  const format = fmt === 'International' ? (subFmt || 'T20') : fmt;
  return {
    format,
    money: preset.money ?? DEFAULT_MONEY_CR,
    squadSize: preset.squadSize,
    auctionTimer: preset.auctionTimer,
    matchRounds: preset.matchRounds,
    minBowlers: 3,
    minBatsmen: 3,
    minWK: 1,
    maxAllRounders: 5,
    teamId: payload.teamId || null,
  };
}

function sanitizeRoomForAuction(room) {
  const r = JSON.parse(JSON.stringify(room));
  if (r.auction) {
    delete r.auction.bidsMap;
    if (!r.auction.revealedWinner) {
      r.auction.highestBid = null;
      r.auction.highestBidder = null;
    }
  }
  return r;
}

function getEffectiveRounds(room) {
  const cfg = getRoomConfig(room);
  const opt = cfg.matchRounds ?? 'bestOf7';
  if (opt === 'fullSquad') return cfg.squadSize ?? 12;
  const n = MATCH_ROUND_OPTIONS[opt];
  return n ?? 7;
}

function buildRoundRequirements(room, rounds) {
  const cfg = getRoomConfig(room);
  const minBowlers = Math.max(0, cfg.minBowlers ?? 0);
  const minBatsmen = Math.max(0, cfg.minBatsmen ?? 0);
  const minWK = Math.max(0, cfg.minWK ?? 0);

  const req = [];
  for (let i = 0; i < minBatsmen; i++) req.push('Batsman');
  for (let i = 0; i < minBowlers; i++) req.push('Bowler');
  for (let i = 0; i < minWK; i++) req.push('WK');

  const capped = req.slice(0, rounds);
  while (capped.length < rounds) capped.push('Any');
  return shuffleArray(capped);
}

function ensureMinSquadForMatch(room) {
  const cfg = getRoomConfig(room);
  const rounds = getEffectiveRounds(room);
  room.players.forEach((p) => {
    if (!p.squad) p.squad = [];
    while (p.squad.length < rounds) {
      p.squad.push({
        id: `auto_${p.socketId}_${p.squad.length}`,
        name: `Auto ${p.squad.length + 1}`,
        role: 'Batsman',
        stats: {
          T20: { battingAvg: 35, strikeRate: 120, economy: 9.0, wickets: 0, dismissals: 0, overall: 70, bowlingAvg: 54 },
          ODI: { battingAvg: 38, strikeRate: 90, economy: 9.0, wickets: 0, dismissals: 0, overall: 68, bowlingAvg: 54 },
          Test: { battingAvg: 45, strikeRate: 55, economy: 3.2, wickets: 0, dismissals: 0, overall: 66, bowlingAvg: 24 },
        },
      });
    }
  });
}

function startAuctionTimer(io, room) {
  if (auctionTimerInterval) clearInterval(auctionTimerInterval);
  const cfg = getRoomConfig(room);
  room.auction.timeLeft = cfg.auctionTimer ?? 30;
  room.auction.bidsThisRound = new Set();
  room.auction.bidsMap = {};
  room.auction.revealedWinner = null;

  const tick = () => {
    room.auction.timeLeft--;
    io.to(room.id).emit('auction:tick', sanitizeRoomForAuction(room));
    if (room.auction.timeLeft <= 0) {
      clearInterval(auctionTimerInterval);
      auctionTimerInterval = null;
      finalizeAuctionPlayer(io, room);
    }
  };
  auctionTimerInterval = setInterval(tick, 1000);
}

function finalizeAuctionPlayer(io, room) {
  const cfg = getRoomConfig(room);
  const squadSize = cfg.squadSize ?? 12;
  const bidsMap = room.auction.bidsMap || {};
  let winner = null;
  let winningAmount = 0;
  const entries = Object.entries(bidsMap).filter(([sid, amt]) => {
    const pd = room.players.find((p) => p.socketId === sid);
    return pd && pd.money >= amt && pd.squad.length < squadSize && canBidOnPlayer(pd, room.auction.playerPool?.[room.auction.currentPlayerIndex], room);
  });
  if (entries.length > 0) {
    entries.sort((a, b) => b[1] - a[1]);
    const [first] = entries;
    winner = first[0];
    winningAmount = first[1];
  }
  const playerCard = room.auction.playerPool[room.auction.currentPlayerIndex];
  if (winner && playerCard) {
    const winnerData = room.players.find((p) => p.socketId === winner);
    if (winnerData && winnerData.squad.length < squadSize) {
      winnerData.money -= winningAmount;
      winnerData.squad.push({ ...playerCard, bid: winningAmount });
      room.auction.lastSold = { player: winnerData.name, team: winnerData.team || null, card: playerCard, amount: winningAmount };
    }
  }
  room.auction.revealedWinner = winner ? { socketId: winner, amount: winningAmount } : null;

  // Append to auction history (who bid, how much, who won)
  room.auction.history = room.auction.history || [];
  const roundHistory = {
    player: playerCard?.name,
    bids: entries.map(([sid, amt]) => {
      const bidder = room.players.find((p) => p.socketId === sid);
      return { player: bidder?.name || 'Player', team: bidder?.team || null, amount: amt };
    }),
    winner: (() => {
      if (!winner) return null;
      const w = room.players.find((p) => p.socketId === winner);
      return { player: w?.name || 'Player', team: w?.team || null, amount: winningAmount };
    })(),
  };
  room.auction.history.push(roundHistory);

  room.auction.currentPlayerIndex++;
  const allSquadsFull = room.players.every((p) => p.squad.length >= squadSize);
  const poolExhausted = room.auction.currentPlayerIndex >= room.auction.playerPool.length;

  io.to(room.id).emit('auction:roundEnd', sanitizeRoomForAuction(room));

  if (allSquadsFull || poolExhausted) {
    room.phase = GAME_PHASES.MATCH;
    buildMatchBracket(room);
    io.to(room.id).emit('match:start', room);
    return;
  }
  startAuctionTimer(io, room);
  io.to(room.id).emit('auction:next', sanitizeRoomForAuction(room));
}

function buildMatchBracket(room) {
  const ids = room.players.map((p) => p.socketId);
  const matchups = [];
  for (let i = 0; i < ids.length; i += 2) {
    if (i + 1 < ids.length) matchups.push([ids[i], ids[i + 1]]);
    else matchups.push([ids[i]]);
  }
  room.match.matchups = matchups;
  room.match.currentMatchupIndex = 0;
  room.match.scores = Object.fromEntries(ids.map((id) => [id, 0]));
  startNextMatch(room);
}

function startNextMatch(room) {
  const m = room.match.matchups[room.match.currentMatchupIndex];
  if (!m || m.length < 2) {
    room.phase = GAME_PHASES.RESULTS;
    return;
  }
  room.match.activePlayers = m;
  room.match.currentRound = 0;
  room.match.currentSelections = {};
  room.match.roundWinners = [];
  room.match.usedCards = room.match.usedCards || {};
  m.forEach((pid) => { if (!room.match.usedCards[pid]) room.match.usedCards[pid] = []; });
  const s1 = room.players.find((p) => p.socketId === m[0]);
  const s2 = room.players.find((p) => p.socketId === m[1]);
  const effRounds = getEffectiveRounds(room);
  room.match.effectiveRounds = Math.min(effRounds, s1?.squad?.length ?? 12, s2?.squad?.length ?? 12);
  room.match.score = { player1: 0, player2: 0 };
  room.match.roundRequirements = buildRoundRequirements(room, room.match.effectiveRounds);
  room.match.currentRequiredRole = room.match.roundRequirements[0] || 'Any';
}

function resolveRound(io, room) {
  const [p1, p2] = room.match.activePlayers;
  const s1 = room.players.find((p) => p.socketId === p1);
  const s2 = room.players.find((p) => p.socketId === p2);
  const card1Id = room.match.currentSelections[p1];
  const card2Id = room.match.currentSelections[p2];
  const card1 = s1?.squad?.find((c) => c.id === card1Id);
  const card2 = s2?.squad?.find((c) => c.id === card2Id);

  room.match.usedCards = room.match.usedCards || {};
  if (!room.match.usedCards[p1]) room.match.usedCards[p1] = [];
  if (!room.match.usedCards[p2]) room.match.usedCards[p2] = [];
  room.match.usedCards[p1].push(card1Id);
  room.match.usedCards[p2].push(card2Id);

  const result = decideWinner(card1, card2, room.format);
  const v1 = result.p1Power;
  const v2 = result.p2Power;
  const winner = result.winner?.id === card1?.id ? p1 : p2;
  room.match.roundWinners = room.match.roundWinners || [];
  room.match.roundWinners.push(winner);
  room.match.scores[winner] = (room.match.scores[winner] || 0) + 1;

  // Round-based point system (explicit player1/player2 score object)
  if (!room.match.score) room.match.score = { player1: 0, player2: 0 };
  if (winner === p1) room.match.score.player1 += 1;
  else room.match.score.player2 += 1;

  room.match.currentRound++;
  room.match.currentRequiredRole = room.match.roundRequirements?.[room.match.currentRound] || 'Any';
  room.match.currentSelections = {};

  io.to(room.id).emit('match:roundResult', {
    room: JSON.parse(JSON.stringify(room)),
    roundWinner: winner,
    roundWinnerName: winner === p1 ? s1?.name : s2?.name,
    score: { ...room.match.score },
    card1: card1 ? { ...card1, value: v1 } : null,
    card2: card2 ? { ...card2, value: v2 } : null,
  });

  const effectiveRounds = room.match.effectiveRounds ?? 7;
  if (room.match.currentRound >= effectiveRounds) {
    const winnerId = room.match.score.player1 > room.match.score.player2 ? p1 : p2;
    room.match.matchWinner = winnerId;
    const winnerData = room.players.find((p) => p.socketId === winnerId);
    if (winnerData) winnerData.money += 10;
    io.to(room.id).emit('match:complete', room);
    room.match.currentMatchupIndex++;
    startNextMatch(room);
    if (room.phase === GAME_PHASES.MATCH) io.to(room.id).emit('match:start', room);
  }
}
