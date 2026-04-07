import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { IPL_TEAMS, INTERNATIONAL_TEAMS, AUCTION_BASE_PRICE_CR } from '../../../shared/types.js';

export default function Auction() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [room, setRoom] = useState(location.state?.room ?? null);
  const [bidAmount, setBidAmount] = useState(0);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [bidError, setBidError] = useState('');

  useEffect(() => {
    if (!socket) return;
    const handlers = {
      'auction:start': (r) => { setRoom(r); setBidAmount(0); setBidError(''); },
      'auction:next': (r) => { setRoom(r); setBidAmount(0); setBidError(''); },
      'auction:update': (r) => setRoom(r),
      'auction:tick': (r) => setRoom(r),
      'auction:roundEnd': (r) => setRoom(r),
      'auction:bidRejected': ({ msg }) => setBidError(msg || 'Invalid bid'),
      'match:start': (r) => {
        setRoom(r);
        navigate(`/room/${roomId}/match`, { state: { room: r } });
      },
      'room:left': () => navigate('/'),
      'room:kicked': () => navigate('/'),
    };
    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));
    return () => Object.keys(handlers).forEach((ev) => socket.off(ev));
  }, [socket, roomId, navigate]);

  const cfg = room?.config || {};
  const squadSize = cfg.squadSize ?? 12;
  const currentPlayer = room?.auction?.playerPool?.[room.auction.currentPlayerIndex];
  const me = room?.players?.find((p) => p.socketId === socket?.id);
  const basePrice = AUCTION_BASE_PRICE_CR;
  const isHost = room?.hostId === socket?.id;
  const lastSold = room?.auction?.lastSold;

  const placeBid = () => {
    if (!socket || !room) return;
    const amt = parseInt(bidAmount, 10) || basePrice;
    const currentHighest = room?.auction?.highestBid || 0;
    if (amt <= currentHighest) {
      setBidError(`Bid must be higher than ₹${currentHighest} Cr`);
      return;
    }
    if (me && me.money >= amt && amt >= basePrice && (room?.auction?.timeLeft ?? 0) > 0) {
      setBidError('');
      socket.emit('auction:bid', { amount: amt });
    } else if (me && me.money < amt) {
      setBidError('Insufficient money');
    }
  };

  const countRole = (squad, role) => (squad || []).filter((c) => c.role === role).length;
  const roleReq = () => `B:${cfg.minBowlers ?? 3} Bat:${cfg.minBatsmen ?? 3} WK:${cfg.minWK ?? 1} AR≤${cfg.maxAllRounders ?? 5}`;
  const allTeams = [...IPL_TEAMS, ...INTERNATIONAL_TEAMS];
  const getTeam = (id) => allTeams.find((t) => t.id === id);

  const formatKey = room?.format === 'IPL' ? 'T20' : room?.format;
  const currentOverall = currentPlayer?.stats?.[formatKey]?.overall ?? currentPlayer?.stats?.T20?.overall ?? 70;
  const currentStats = currentPlayer?.stats?.[formatKey] || currentPlayer?.stats?.T20 || {};
  const highestBidder = room?.players?.find((p) => p.socketId === room?.auction?.highestBidder);
  const roleEmoji = currentPlayer?.role === 'Bowler' ? '🎯' : currentPlayer?.role === 'All-Rounder' ? '⚡' : currentPlayer?.role === 'WK' ? '🧤' : '🏏';

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit('room:leave');
  };

  if (!room) return <div className="min-h-screen flex items-center justify-center"><p className="text-emerald-400">Loading...</p></div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-cricket-gold font-display">AUCTION</h2>
          <button
            onClick={leaveRoom}
            className="text-emerald-300 text-xs border border-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-800/60 mr-3"
          >
            Leave
          </button>
          <div className="flex items-center gap-2">
            <span className="text-cricket-gold font-semibold">₹</span>
            <span className="font-semibold">{me?.money ?? 0} Cr</span>
          </div>
        </div>

        {lastSold && (
          <div className="bg-amber-900/30 border border-amber-600 rounded-lg p-3 mb-4 text-center">
            <p className="text-amber-300 text-sm">Last sold: <span className="font-bold">{lastSold.card?.name}</span> to {lastSold.player} for ₹{lastSold.amount} Cr</p>
          </div>
        )}

        {currentPlayer ? (
          <div className="bg-emerald-950/50 rounded-2xl border border-emerald-700 p-8 mb-4">
            <div className="text-center mb-5">
              <h3 className="text-3xl text-white font-bold tracking-wide">{currentPlayer.name}</h3>
              <p className="text-emerald-300 text-lg mt-1">{roleEmoji} {currentPlayer.role}</p>
              <div className="mt-3 text-sm text-emerald-200">
                {(currentPlayer.role === 'Batsman' || currentPlayer.role === 'WK') && (
                  <p>Avg: {currentStats.battingAvg ?? '-'} | SR: {currentStats.strikeRate ?? '-'}</p>
                )}
                {currentPlayer.role === 'Bowler' && (
                  <p>Wkts: {currentStats.wickets ?? '-'} | Eco: {currentStats.economy ?? '-'}</p>
                )}
                {currentPlayer.role === 'All-Rounder' && (
                  <p>Avg: {currentStats.battingAvg ?? '-'} | SR: {currentStats.strikeRate ?? '-'} | Wkts: {currentStats.wickets ?? '-'}</p>
                )}
              </div>
              <p className="inline-block mt-3 px-3 py-1 rounded-full bg-amber-900/40 text-cricket-gold text-sm font-semibold">
                Overall: {currentOverall}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-center">
              <div className="bg-emerald-900/30 rounded-lg py-2">
                <p className="text-emerald-400 text-xs">Base Price</p>
                <p className="text-cricket-gold font-bold">₹{basePrice} Cr</p>
              </div>
              <div className="bg-emerald-900/30 rounded-lg py-2">
                <p className="text-emerald-400 text-xs">Current Bid</p>
                <p className="text-cricket-gold font-bold">
                  ₹{room.auction?.highestBid || basePrice} Cr{highestBidder ? ` by ${highestBidder.name}` : ''}
                </p>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-900/50 text-xl font-bold text-cricket-gold">{room.auction?.timeLeft ?? 0}</div>
              <p className="text-emerald-400 text-xs mt-1">seconds left</p>
            </div>
            <div className="flex gap-3">
              <input
                type="number"
                value={bidAmount || ''}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={String((room.auction?.highestBid || basePrice) + 1)}
                min={(room.auction?.highestBid || basePrice) + 1}
                className="flex-1 px-4 py-3 bg-emerald-950 border border-emerald-700 rounded-lg text-white"
              />
              <button
                onClick={placeBid}
                disabled={(room?.auction?.timeLeft ?? 0) <= 0 || me?.money < (parseInt(bidAmount, 10) || ((room.auction?.highestBid || basePrice) + 1))}
                className="px-6 py-3 bg-cricket-gold text-cricket-dark font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50"
              >
                BID
              </button>
            </div>
            {bidError && <p className="text-amber-400 text-sm text-center mt-2">{bidError}</p>}
            {isHost && room.auction?.timeLeft > 0 && (
              <button onClick={() => socket.emit('auction:forceNext')} className="mt-3 w-full py-2 bg-amber-600 text-white text-sm rounded-lg">End bid (Admin)</button>
            )}
          </div>
        ) : (
          <p className="text-center text-emerald-400 mb-4">Auction complete. Moving to match...</p>
        )}
        {isHost && currentPlayer && (
          <button onClick={() => socket.emit('room:forceStartMatch')} className="mb-4 w-full py-2 bg-emerald-600 text-white text-sm rounded-lg">Start Match Now (Admin)</button>
        )}

        <p className="text-emerald-500 text-xs mb-2">Squad: {squadSize} max. Requirements: {roleReq()}</p>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            {room.players?.map((p) => {
              const bowlers = countRole(p.squad, 'Bowler');
              const batsmen = countRole(p.squad, 'Batsman');
              const wks = countRole(p.squad, 'WK');
              const ar = countRole(p.squad, 'All-Rounder');
              const isExpanded = expandedTeam === p.socketId;
              const team = getTeam(p.team);
              return (
                <div key={p.socketId} className="bg-emerald-900/30 rounded-lg overflow-hidden">
                  <button onClick={() => setExpandedTeam(isExpanded ? null : p.socketId)} className="w-full flex items-center justify-between p-3 text-left">
                    <div className="flex items-center gap-3">
                      {team && (
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold border border-emerald-700"
                          style={{ backgroundColor: `${team.color}20`, color: team.color }}
                        >
                          {team.short}
                        </span>
                      )}
                      <div>
                        <span className="text-white font-medium">{p.name}</span>
                        <span className="text-emerald-400 text-xs ml-2">₹{p.money} Cr</span>
                        <p className="text-emerald-500 text-[11px]">
                          {p.squad?.length || 0}/{squadSize} • B:{bowlers} Bat:{batsmen} WK:{wks} AR:{ar}
                        </p>
                      </div>
                    </div>
                    <span className="text-emerald-400">{isExpanded ? '▼' : '▶'}</span>
                  </button>
                  {isExpanded && (
                    <div className="px-3 pb-3 flex flex-wrap gap-2">
                      {(p.squad || []).map((c) => (
                        <div key={c.id} className="px-3 py-2 bg-emerald-950/50 rounded-lg text-sm border border-emerald-700">
                          <p className="text-white font-medium truncate">{c.name}</p>
                          <p className="text-emerald-400 text-xs">{c.role} • ₹{c.bid} Cr</p>
                        </div>
                      ))}
                      {(!p.squad || p.squad.length === 0) && <p className="text-emerald-500 text-sm">No players yet</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="space-y-2 bg-emerald-950/40 border border-emerald-800 rounded-lg p-3">
            <p className="text-cricket-gold text-sm font-semibold mb-1">Auction History</p>
            <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
              {(room.auction?.history || []).slice(-8).reverse().map((h, idx) => (
                <div key={idx} className="bg-emerald-900/40 rounded p-2">
                  <p className="text-emerald-300">Player: <span className="text-white">{h.player}</span></p>
                  {h.winner && (
                    <p className="text-emerald-400">
                      Won by <span className="text-cricket-gold">{h.winner.player}</span> for ₹{h.winner.amount} Cr
                    </p>
                  )}
                  {h.bids?.length > 0 && (
                    <p className="text-emerald-500 mt-1">
                      Bids:{' '}
                      {h.bids.map((b) => `${b.player}(₹${b.amount}Cr)`).join(', ')}
                    </p>
                  )}
                </div>
              ))}
              {(room.auction?.history || []).length === 0 && (
                <p className="text-emerald-500 text-xs">No bids yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
