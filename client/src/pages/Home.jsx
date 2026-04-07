import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { ROOM_PRESETS, IPL_TEAMS, INTERNATIONAL_TEAMS, DEFAULT_MONEY_CR, CUSTOM_LIMITS } from '../../../shared/types.js';

export default function Home() {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const [roomType, setRoomType] = useState(null);
  const [format, setFormat] = useState('IPL');
  const [subFormat, setSubFormat] = useState('T20');
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState('');
  const [teamId, setTeamId] = useState(null);
  const [custom, setCustom] = useState({
    money: DEFAULT_MONEY_CR,
    squadSize: 12,
    auctionTimer: 30,
    matchRounds: 'bestOf7',
    minBowlers: 3,
    minBatsmen: 3,
    minWK: 1,
    maxAllRounders: 5,
  });

  const createRoom = () => {
    if (!playerName.trim()) return setError('Enter your name');
    if (!roomType) return setError('Select a room type');
    if (roomType !== 'custom' && !format) return setError('Select format');
    if (format === 'International' && !subFormat) return setError('Select Test/T20/ODI');
    if (!teamId) return setError('Select a team');
    setError('');
    socket.emit('player:setName', playerName.trim());
    const payload =
      roomType === 'custom'
        ? {
            roomType: 'custom',
            format: format === 'International' ? 'International' : format,
            subFormat: format === 'International' ? subFormat : null,
            teamId,
            ...custom,
          }
        : {
            roomType,
            format: format === 'International' ? 'International' : format,
            subFormat: format === 'International' ? subFormat : null,
            teamId,
          };
    socket.emit('room:create', payload);
  };

  const joinRoom = () => {
    if (!playerName.trim()) return setError('Enter your name');
    if (!roomId.trim()) return setError('Enter room ID');
    if (!teamId) return setError('Select a team');
    setError('');
    socket.emit('player:setName', playerName.trim());
    socket.emit('room:join', { roomId: roomId.trim().toUpperCase(), teamId });
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('room:created', (room) => navigate(`/room/${room.id}`, { state: { room } }));
    socket.on('room:joinFailed', ({ msg }) => setError(msg));
    socket.on('room:update', (room) => room?.id && navigate(`/room/${room.id}`, { state: { room } }));
    socket.on('room:kicked', () => navigate('/'));
    return () => {
      socket.off('room:created');
      socket.off('room:joinFailed');
      socket.off('room:update');
      socket.off('room:kicked');
    };
  }, [socket, navigate]);

  const presetLabels = {
    QUICK: 'Quick Match',
    STANDARD: 'Standard Match',
    PRO: 'Pro League',
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <header className="text-center mb-10">
        <h1 className="text-5xl md:text-7xl text-cricket-gold font-display tracking-wider">CRICKET AUCTION</h1>
        <p className="text-xl text-emerald-200 mt-2">Strategy Game</p>
        {connected ? (
          <span className="inline-block mt-4 px-3 py-1 bg-emerald-900/50 text-emerald-400 rounded-full text-sm">● Live</span>
        ) : (
          <span className="inline-block mt-4 px-3 py-1 bg-amber-900/50 text-amber-400 rounded-full text-sm">Connecting...</span>
        )}
      </header>

      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <label className="block text-emerald-200 text-sm mb-2">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter name"
            className="w-full px-4 py-3 bg-emerald-950/50 border border-emerald-700 rounded-lg text-white placeholder-emerald-600"
          />
        </div>

        <div>
          <p className="text-emerald-200 text-sm mb-3">Format</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFormat('IPL')}
              className={`px-4 py-2 rounded-lg text-sm ${format === 'IPL' ? 'bg-cricket-gold text-cricket-dark' : 'bg-emerald-900/40 text-emerald-200'}`}
            >
              IPL
            </button>
            <button
              onClick={() => setFormat('International')}
              className={`px-4 py-2 rounded-lg text-sm ${format === 'International' ? 'bg-cricket-gold text-cricket-dark' : 'bg-emerald-900/40 text-emerald-200'}`}
            >
              International
            </button>
          </div>
          {format === 'International' && (
            <div className="mt-2 flex gap-2">
              {['Test', 'T20', 'ODI'].map((sf) => (
                <button key={sf} onClick={() => setSubFormat(sf)} className={`px-3 py-1 rounded text-sm ${subFormat === sf ? 'bg-amber-600' : 'bg-emerald-800/50'}`}>
                  {sf}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-emerald-200 text-sm mb-3">Your Team</p>
          <div className="flex flex-wrap gap-2">
            {(format === 'IPL' ? IPL_TEAMS : INTERNATIONAL_TEAMS).map((t) => (
              <button
                key={t.id}
                onClick={() => setTeamId(t.id)}
                className={`px-3 py-2 rounded-full text-xs border flex items-center gap-2 ${
                  teamId === t.id ? 'bg-cricket-gold text-cricket-dark border-cricket-gold' : 'bg-emerald-900/40 text-emerald-200 border-emerald-700'
                }`}
              >
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span>{t.short}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-emerald-200 text-sm mb-3">Room Type</p>
          <div className="grid grid-cols-2 gap-3">
            {['QUICK', 'STANDARD', 'PRO'].map((t) => (
              <button
                key={t}
                onClick={() => setRoomType(t)}
                className={`p-4 rounded-xl border-2 text-left ${roomType === t ? 'border-cricket-gold bg-emerald-900/40' : 'border-emerald-800 hover:border-emerald-600'}`}
              >
                <p className="font-semibold text-white">{presetLabels[t]}</p>
                <p className="text-emerald-400 text-xs mt-1">
                  ₹{ROOM_PRESETS[t].money} Cr • {ROOM_PRESETS[t].squadSize} squad • {ROOM_PRESETS[t].auctionTimer}s auction
                </p>
              </button>
            ))}
            <button
              onClick={() => setRoomType('custom')}
              className={`p-4 rounded-xl border-2 text-left ${roomType === 'custom' ? 'border-cricket-gold bg-emerald-900/40' : 'border-emerald-800 hover:border-emerald-600'}`}
            >
              <p className="font-semibold text-white">Custom Mode</p>
              <p className="text-emerald-400 text-xs mt-1">Full control</p>
            </button>
          </div>
        </div>

        {roomType === 'custom' && (
          <div className="bg-emerald-950/30 rounded-xl p-6 border border-emerald-700 space-y-4">
            <h4 className="text-cricket-gold font-semibold">Custom Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-emerald-400 text-xs">Money (Cr)</label>
                <input type="number" min={CUSTOM_LIMITS.money.min} max={CUSTOM_LIMITS.money.max} step={CUSTOM_LIMITS.money.step} value={custom.money} onChange={(e) => setCustom((c) => ({ ...c, money: +e.target.value }))} className="w-full px-3 py-2 bg-emerald-950 rounded text-white" />
              </div>
              <div>
                <label className="text-emerald-400 text-xs">Squad (8-15)</label>
                <input type="number" min={8} max={15} value={custom.squadSize} onChange={(e) => setCustom((c) => ({ ...c, squadSize: +e.target.value }))} className="w-full px-3 py-2 bg-emerald-950 rounded text-white" />
              </div>
              <div>
                <label className="text-emerald-400 text-xs">Auction Timer (15-45s)</label>
                <input type="number" min={15} max={45} value={custom.auctionTimer} onChange={(e) => setCustom((c) => ({ ...c, auctionTimer: +e.target.value }))} className="w-full px-3 py-2 bg-emerald-950 rounded text-white" />
              </div>
              <div>
                <label className="text-emerald-400 text-xs">Match Rounds</label>
                <select value={custom.matchRounds} onChange={(e) => setCustom((c) => ({ ...c, matchRounds: e.target.value }))} className="w-full px-3 py-2 bg-emerald-950 rounded text-white">
                  <option value="bestOf5">Best of 5</option>
                  <option value="bestOf7">Best of 7</option>
                  <option value="bestOf9">Best of 9</option>
                  <option value="fullSquad">Full Squad</option>
                </select>
              </div>
              <div>
                <label className="text-emerald-400 text-xs">Min Bowlers (2-5)</label>
                <input type="number" min={2} max={5} value={custom.minBowlers} onChange={(e) => setCustom((c) => ({ ...c, minBowlers: +e.target.value }))} className="w-full px-3 py-2 bg-emerald-950 rounded text-white" />
              </div>
              <div>
                <label className="text-emerald-400 text-xs">Min Batsmen (2-5)</label>
                <input type="number" min={2} max={5} value={custom.minBatsmen} onChange={(e) => setCustom((c) => ({ ...c, minBatsmen: +e.target.value }))} className="w-full px-3 py-2 bg-emerald-950 rounded text-white" />
              </div>
              <div>
                <label className="text-emerald-400 text-xs">Min WK (1-2)</label>
                <input type="number" min={1} max={2} value={custom.minWK} onChange={(e) => setCustom((c) => ({ ...c, minWK: +e.target.value }))} className="w-full px-3 py-2 bg-emerald-950 rounded text-white" />
              </div>
              <div>
                <label className="text-emerald-400 text-xs">Max All-Rounders (3-6)</label>
                <input type="number" min={3} max={6} value={custom.maxAllRounders} onChange={(e) => setCustom((c) => ({ ...c, maxAllRounders: +e.target.value }))} className="w-full px-3 py-2 bg-emerald-950 rounded text-white" />
              </div>
            </div>
            {custom.minBowlers + custom.minBatsmen + custom.minWK > custom.squadSize && (
              <p className="text-amber-400 text-sm">Min roles exceed squad size. Reduce requirements.</p>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-emerald-950/30 rounded-xl p-6 border border-emerald-800">
            <h3 className="text-lg font-semibold text-cricket-gold mb-4">Create Room</h3>
            <button onClick={createRoom} disabled={!connected} className="w-full py-3 bg-cricket-gold text-cricket-dark font-semibold rounded-lg hover:bg-amber-400 disabled:opacity-50">
              Create Room
            </button>
          </div>
          <div className="bg-emerald-950/30 rounded-xl p-6 border border-emerald-800">
            <h3 className="text-lg font-semibold text-cricket-gold mb-4">Join Room</h3>
            <input type="text" value={roomId} onChange={(e) => setRoomId(e.target.value.toUpperCase())} placeholder="Room ID" maxLength={8} className="w-full px-4 py-2 mb-3 bg-emerald-950/50 border border-emerald-700 rounded-lg text-white" />
            <button onClick={joinRoom} disabled={!connected} className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-500 disabled:opacity-50">
              Join Room
            </button>
          </div>
        </div>
        {error && <p className="text-amber-400 text-center">{error}</p>}
      </div>
    </div>
  );
}
