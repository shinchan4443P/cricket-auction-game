import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import VSCard from '../components/VSCard';

const PHASE = { SELECT: 'select', FLIP: 'flip', COMPARE: 'compare', WINNER: 'winner', NEXT: 'next' };

export default function Match() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const [room, setRoom] = useState(location.state?.room ?? null);
  const [phase, setPhase] = useState(PHASE.SELECT);
  const [roundResult, setRoundResult] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectionError, setSelectionError] = useState('');
  const [roundSummary, setRoundSummary] = useState(null);

  useEffect(() => {
    if (!socket) return;
    const handlers = {
      'match:start': (r) => {
        setRoom(r);
        setRoundResult(null);
        setSelectedId(null);
        setSelectionError('');
        setRoundSummary(null);
        setPhase(PHASE.SELECT);
      },
      'match:roundResult': (data) => {
        setRoundResult(data);
        setRoom(data.room);
        setSelectedId(null);
        setSelectionError('');
        setRoundSummary({
          winnerName: data.roundWinnerName,
          score: data.score,
          roundNumber: (data.room?.match?.currentRound ?? 1),
        });
        setPhase(PHASE.FLIP);
        setTimeout(() => setPhase(PHASE.COMPARE), 900);
        setTimeout(() => setPhase(PHASE.WINNER), 1900);
        setTimeout(() => {
          setPhase(PHASE.SELECT);
          setRoundResult(null);
        }, 3200);
      },
      'match:complete': (r) => {
        setRoom(r);
        navigate(`/room/${roomId}/results`, { state: { room: r } });
      },
      'room:left': () => navigate('/'),
      'room:kicked': () => navigate('/'),
      'match:invalidSelection': ({ msg }) => setSelectionError(msg || 'Invalid role for this round'),
    };
    Object.entries(handlers).forEach(([ev, fn]) => socket.on(ev, fn));
    return () => Object.keys(handlers).forEach((ev) => socket.off(ev));
  }, [socket, roomId, navigate]);

  const me = room?.players?.find((p) => p.socketId === socket?.id);
  const isActive = room?.match?.activePlayers?.includes(socket?.id);
  const round = room?.match?.currentRound ?? 0;
  const effectiveRounds = room?.match?.effectiveRounds ?? 7;
  const usedCards = room?.match?.usedCards?.[socket?.id] || [];
  const availableCards = me?.squad?.filter((c) => !usedCards.includes(c.id)) || [];
  const formatKey = room?.format === 'IPL' ? 'T20' : room?.format;
  const p1 = room?.match?.activePlayers?.[0];
  const p2 = room?.match?.activePlayers?.[1];
  const p1Data = room?.players?.find((p) => p.socketId === p1);
  const p2Data = room?.players?.find((p) => p.socketId === p2);
  const isP1Winner = roundResult?.roundWinner === p1;
  const requiredRole = room?.match?.currentRequiredRole || 'Any';

  const leaveRoom = () => {
    if (!socket) return;
    socket.emit('room:leave');
  };

  const selectCard = (playerId) => {
    if (!socket || !room || !isActive || selectedId || phase !== PHASE.SELECT) return;
    setSelectionError('');
    setSelectedId(playerId);
    socket.emit('match:select', { playerId });
  };

  if (!room) return <div className="min-h-screen flex items-center justify-center"><p className="text-emerald-400">Loading...</p></div>;

  if (!isActive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <p className="text-emerald-400 text-xl mb-4">Spectating</p>
        <div className="text-center text-emerald-300">Round {round + 1} / {effectiveRounds}</div>
        {roundResult && phase !== PHASE.SELECT && (
          <div className="mt-6 flex gap-8">
            <div className={`p-4 rounded-xl border-2 ${isP1Winner ? 'border-cricket-gold bg-amber-900/30' : 'border-emerald-700'}`}>
              <p className="text-white">{roundResult.card1?.name}</p>
              <p className="text-cricket-gold font-bold">{roundResult.card1?.value}</p>
            </div>
            <p className="text-2xl self-center">VS</p>
            <div className={`p-4 rounded-xl border-2 ${!isP1Winner ? 'border-cricket-gold bg-amber-900/30' : 'border-emerald-700'}`}>
              <p className="text-white">{roundResult.card2?.name}</p>
              <p className="text-cricket-gold font-bold">{roundResult.card2?.value}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl text-cricket-gold font-display">MATCH BATTLE</h2>
          <button
            onClick={leaveRoom}
            className="text-emerald-300 text-xs border border-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-800/60"
          >
            Leave
          </button>
          <div className="flex gap-4 text-lg">
            <span>Round {round + 1} / {effectiveRounds}</span>
            {p1Data && p2Data && (
              <span className="text-emerald-400">
                {(room.match?.score?.player1 ?? room.match?.scores?.[p1] ?? 0)} - {(room.match?.score?.player2 ?? room.match?.scores?.[p2] ?? 0)}
              </span>
            )}
          </div>
        </div>

        {(phase === PHASE.FLIP || phase === PHASE.COMPARE || phase === PHASE.WINNER) && roundResult && (
          <div className="mb-8">
            <VSCard
              p1Name={p1Data?.name}
              p2Name={p2Data?.name}
              card1={roundResult.card1}
              card2={roundResult.card2}
              phase={phase}
            />
            {phase === PHASE.WINNER && (
              <div className="text-center mt-3">
                <p className="text-cricket-gold font-semibold">
                  Round {roundSummary?.roundNumber} Winner: {roundSummary?.winnerName}
                </p>
                <p className="text-emerald-300 text-sm">
                  Score: {roundSummary?.score?.player1 ?? 0} - {roundSummary?.score?.player2 ?? 0}
                </p>
              </div>
            )}
          </div>
        )}

        {phase === PHASE.SELECT && (
          <>
            <p className="text-emerald-400 text-center mb-4">
              {selectedId ? 'Waiting for opponent...' : `Select a ${requiredRole === 'Any' ? 'card' : requiredRole} for round ${round + 1}`}
            </p>
            {selectionError && (
              <p className="text-amber-400 text-center mb-3 text-sm">{selectionError}</p>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {availableCards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => selectCard(card.id)}
                  disabled={!!selectedId || (requiredRole !== 'Any' && card.role !== requiredRole)}
                  className={`p-4 rounded-xl border-2 transition text-left ${
                    selectedId === card.id ? 'border-cricket-gold bg-emerald-900/50' : 'border-emerald-700 hover:border-emerald-500 bg-emerald-950/50'
                  } ${selectedId || (requiredRole !== 'Any' && card.role !== requiredRole) ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <p className="font-semibold text-white truncate">{card.name}</p>
                  <p className="text-emerald-400 text-sm">{card.role}</p>
              <p className="text-cricket-gold text-sm">{card.stats?.[formatKey]?.overall ?? card.stats?.T20?.overall ?? 70}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
