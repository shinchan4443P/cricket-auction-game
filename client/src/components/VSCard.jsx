function isBetter(a, b, type) {
  if (type === 'economy') return a < b;
  return a > b;
}

function StatRow({ label, left, right, type = 'normal' }) {
  const leftBetter = isBetter(left, right, type);
  const rightBetter = isBetter(right, left, type);

  return (
    <div className="grid grid-cols-3 gap-2 items-center text-sm">
      <p className={`text-right ${leftBetter ? 'text-emerald-400 font-semibold' : 'text-emerald-200'}`}>{left ?? '-'}</p>
      <p className="text-center text-emerald-500">{label}</p>
      <p className={`${rightBetter ? 'text-emerald-400 font-semibold' : 'text-emerald-200'}`}>{right ?? '-'}</p>
    </div>
  );
}

export default function VSCard({ p1Name, p2Name, card1, card2, phase }) {
  const s1 = card1?.stats || {};
  const s2 = card2?.stats || {};

  return (
    <div className="bg-emerald-950/50 rounded-xl border border-emerald-700 p-5 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-left">
          <p className="text-emerald-400 text-xs">{p1Name}</p>
          <p className="text-white font-semibold">{card1?.name || 'Hidden'}</p>
          <p className="text-emerald-300 text-xs">{card1?.role || '-'}</p>
        </div>
        <p className="text-cricket-gold text-2xl font-display">VS</p>
        <div className="text-right">
          <p className="text-emerald-400 text-xs">{p2Name}</p>
          <p className="text-white font-semibold">{card2?.name || 'Hidden'}</p>
          <p className="text-emerald-300 text-xs">{card2?.role || '-'}</p>
        </div>
      </div>

      {phase === 'flip' && (
        <p className="text-center text-amber-400 animate-pulse">Revealing cards...</p>
      )}

      {phase !== 'flip' && (
        <div className="space-y-2">
          <StatRow label="Bat Avg" left={s1.battingAvg} right={s2.battingAvg} />
          <StatRow label="Strike Rate" left={s1.strikeRate} right={s2.strikeRate} />
          <StatRow label="Economy" left={s1.economy} right={s2.economy} type="economy" />
          <StatRow label="Wickets" left={s1.wickets} right={s2.wickets} />
        </div>
      )}
    </div>
  );
}

