import { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';

export default function Results() {
  const { roomId } = useParams();
  const location = useLocation();
  const { socket } = useSocket();
  const [room, setRoom] = useState(location.state?.room ?? null);

  useEffect(() => {
    if (!socket) return;
    const onUpdate = (r) => setRoom(r);
    socket.on('room:update', onUpdate);
    socket.on('match:complete', onUpdate);
    return () => {
      socket.off('room:update', onUpdate);
      socket.off('match:complete');
    };
  }, [socket]);

  const me = room?.players?.find((p) => p.socketId === socket?.id);
  const matchWinner = room?.match?.matchWinner;
  const isWinner = matchWinner === socket?.id;

  return (
    <div className="min-h-screen p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg bg-emerald-950/50 rounded-2xl border border-emerald-700 p-8 text-center">
        <h2 className="text-3xl text-cricket-gold font-display mb-6">MATCH COMPLETE</h2>
        {matchWinner && (
          <p className={`text-xl mb-4 ${isWinner ? 'text-cricket-gold' : 'text-emerald-300'}`}>
            {isWinner ? '🏆 You Won!' : 'Winner: ' + (room.players?.find((p) => p.socketId === matchWinner)?.name || 'Unknown')}
          </p>
        )}
        <div className="space-y-2 mb-8">
          {room?.players?.map((p) => (
            <div key={p.socketId} className="flex justify-between py-2 px-4 bg-emerald-900/30 rounded-lg">
              <span>{p.name}</span>
              <span className="text-cricket-gold">₹{p.money} Cr</span>
            </div>
          ))}
        </div>
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-cricket-gold text-cricket-dark font-semibold rounded-lg hover:bg-amber-400 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
