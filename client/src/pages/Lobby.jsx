import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { IPL_TEAMS, INTERNATIONAL_TEAMS } from '../../../shared/types.js';

export default function Lobby() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [room, setRoom] = useState(location.state?.room ?? null);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (r) => setRoom(r);
    socket.on('room:update', onUpdate);
    socket.on('auction:start', (r) => {
      setRoom(r);
      navigate(`/room/${roomId}/auction`, { state: { room: r } });
    });
    socket.on('room:left', () => navigate('/'));
    socket.on('room:kicked', () => navigate('/'));
    return () => {
      socket.off('room:update', onUpdate);
      socket.off('auction:start');
      socket.off('room:left');
      socket.off('room:kicked');
    };
  }, [socket, roomId, navigate]);

  useEffect(() => {
    if (!room) return;
  }, [room]);

  const startGame = () => {
    if (!socket || !room) return;
    if (room.hostId !== socket.id) return;
    socket.emit('room:start');
  };

  const isHost = room?.hostId === socket?.id;
  const me = room?.players?.find((p) => p.socketId === socket?.id);
  const allReady = room?.players?.length >= 2 && room.players.every((p) => p.ready);

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit('room:leave');
  };

  const toggleReady = () => {
    if (!socket || !room || !me) return;
    socket.emit('room:ready', { ready: !me.ready });
  };

  const allTeams = [...IPL_TEAMS, ...INTERNATIONAL_TEAMS];
  const getTeam = (id) => allTeams.find((t) => t.id === id);

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-emerald-950/40 rounded-2xl border border-emerald-700 p-8">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl text-cricket-gold font-display">Room {roomId}</h2>
          <button
            onClick={leaveRoom}
            className="text-emerald-300 text-xs border border-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-800/60"
          >
            Leave
          </button>
        </div>
        <p className="text-emerald-300 text-center text-sm mb-1">Format: {room?.format || '-'}</p>
        {room?.config && (
          <p className="text-emerald-500 text-xs text-center mb-4">
            ₹{room.config.money} Cr • {room.config.squadSize} squad • {room.config.auctionTimer}s auction
          </p>
        )}
        <div className="space-y-2 mb-6">
          {room?.players?.map((p) => {
            const team = getTeam(p.team);
            return (
              <div key={p.socketId} className="flex items-center justify-between py-2 px-4 bg-emerald-900/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {team && (
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border border-emerald-700"
                      style={{ backgroundColor: `${team.color}20`, color: team.color }}
                    >
                      {team.short}
                    </span>
                  )}
                  <div>
                    <span className="text-white text-sm">{p.name}</span>
                    {team && <p className="text-emerald-400 text-xs">{team.name}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${p.ready ? 'bg-emerald-400' : 'bg-amber-500'}`}
                    title={p.ready ? 'Ready' : 'Not ready'}
                  />
                  {p.socketId === room.hostId && <span className="text-cricket-gold text-xs">Host</span>}
                  {isHost && p.socketId !== room.hostId && (
                    <button
                      onClick={() => socket.emit('room:kick', { targetSocketId: p.socketId })}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                    >
                      Kick
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-emerald-400 text-sm text-center mb-4">
          Players: {room?.players?.length || 0} / 8
        </p>
        <div className="space-y-3">
          <button
            onClick={toggleReady}
            disabled={!room}
            className={`w-full py-2 rounded-lg text-sm font-semibold ${
              me?.ready
                ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                : 'bg-emerald-900/60 text-emerald-200 hover:bg-emerald-800'
            }`}
          >
            {me?.ready ? 'Ready ✔' : 'Click to Ready'}
          </button>
          {isHost && (
            <div className="space-y-2">
              <button
                onClick={startGame}
                disabled={!allReady}
                className="w-full py-3 bg-cricket-gold text-cricket-dark font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Auction (all players ready)
              </button>
              <button
                onClick={() => socket.emit('room:forceStartMatch')}
                disabled={!room?.players?.length || room.players.length < 2}
                className="w-full py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Match Directly (skip auction)
              </button>
            </div>
          )}
          {!isHost && (
            <p className="text-center text-emerald-400 text-sm">
              Waiting for host to start once everyone is ready...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
