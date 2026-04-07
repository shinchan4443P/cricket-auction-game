// Player database with consistent per-format stats.

const COPIES = 12;

// 🔥 FIXED REALISTIC IPL DATA
const baseIPL = [
  // 🏏 BATSMEN
  { id: 'ipl1', name: 'Virat Kohli', role: 'Batsman', ipl: { rating: 94, battingAvg: 38, strikeRate: 135 } },
  { id: 'ipl2', name: 'Rohit Sharma', role: 'Batsman', ipl: { rating: 92, battingAvg: 32, strikeRate: 140 } },
  { id: 'ipl3', name: 'Shubman Gill', role: 'Batsman', ipl: { rating: 91, battingAvg: 34, strikeRate: 140 } },
  { id: 'ipl4', name: 'Suryakumar Yadav', role: 'Batsman', ipl: { rating: 95, battingAvg: 30, strikeRate: 165 } },
  { id: 'ipl5', name: 'David Warner', role: 'Batsman', ipl: { rating: 91, battingAvg: 33, strikeRate: 142 } },
  { id: 'ipl6', name: 'Faf du Plessis', role: 'Batsman', ipl: { rating: 89, battingAvg: 31, strikeRate: 140 } },
  { id: 'ipl7', name: 'Devon Conway', role: 'Batsman', ipl: { rating: 88, battingAvg: 32, strikeRate: 138 } },
  { id: 'ipl8', name: 'Ruturaj Gaikwad', role: 'Batsman', ipl: { rating: 88, battingAvg: 33, strikeRate: 136 } },
  { id: 'ipl9', name: 'KL Rahul', role: 'Batsman', ipl: { rating: 90, battingAvg: 34, strikeRate: 135 } },
  { id: 'ipl10', name: 'Shreyas Iyer', role: 'Batsman', ipl: { rating: 87, battingAvg: 30, strikeRate: 135 } },
  { id: 'ipl11', name: 'Nitish Rana', role: 'Batsman', ipl: { rating: 84, battingAvg: 28, strikeRate: 135 } },
  { id: 'ipl12', name: 'Rahul Tripathi', role: 'Batsman', ipl: { rating: 85, battingAvg: 29, strikeRate: 140 } },
  { id: 'ipl13', name: 'Mayank Agarwal', role: 'Batsman', ipl: { rating: 83, battingAvg: 28, strikeRate: 132 } },
  { id: 'ipl14', name: 'Prithvi Shaw', role: 'Batsman', ipl: { rating: 84, battingAvg: 27, strikeRate: 145 } },
  { id: 'ipl15', name: 'Ishan Kishan', role: 'Batsman', ipl: { rating: 85, battingAvg: 28, strikeRate: 145 } },
  { id: 'ipl16', name: 'Tilak Varma', role: 'Batsman', ipl: { rating: 86, battingAvg: 32, strikeRate: 140 } },
  { id: 'ipl17', name: 'Rinku Singh', role: 'Batsman', ipl: { rating: 88, battingAvg: 34, strikeRate: 150 } },
  { id: 'ipl18', name: 'Ajinkya Rahane', role: 'Batsman', ipl: { rating: 82, battingAvg: 28, strikeRate: 135 } },
  { id: 'ipl19', name: 'Harry Brook', role: 'Batsman', ipl: { rating: 87, battingAvg: 30, strikeRate: 150 } },
  { id: 'ipl20', name: 'Glenn Phillips', role: 'Batsman', ipl: { rating: 86, battingAvg: 28, strikeRate: 155 } },

  // 🧤 WICKET KEEPERS
  { id: 'ipl21', name: 'MS Dhoni', role: 'WK', ipl: { rating: 91, battingAvg: 34, strikeRate: 135, dismissals: 65 } },
  { id: 'ipl22', name: 'Jos Buttler', role: 'WK', ipl: { rating: 93, battingAvg: 36, strikeRate: 145, dismissals: 55 } },
  { id: 'ipl23', name: 'Rishabh Pant', role: 'WK', ipl: { rating: 89, battingAvg: 30, strikeRate: 150, dismissals: 50 } },
  { id: 'ipl24', name: 'Quinton de Kock', role: 'WK', ipl: { rating: 90, battingAvg: 32, strikeRate: 145, dismissals: 55 } },
  { id: 'ipl25', name: 'Sanju Samson', role: 'WK', ipl: { rating: 88, battingAvg: 30, strikeRate: 145, dismissals: 45 } },
  { id: 'ipl26', name: 'Rahmanullah Gurbaz', role: 'WK', ipl: { rating: 84, battingAvg: 27, strikeRate: 150, dismissals: 40 } },
  { id: 'ipl27', name: 'Nicholas Pooran', role: 'WK', ipl: { rating: 89, battingAvg: 30, strikeRate: 155, dismissals: 42 } },

  // 🔁 ALL-ROUNDERS
  { id: 'ipl28', name: 'Hardik Pandya', role: 'All-Rounder', ipl: { rating: 92, battingAvg: 28, strikeRate: 150, economy: 8.5, wickets: 60 } },
  { id: 'ipl29', name: 'Ravindra Jadeja', role: 'All-Rounder', ipl: { rating: 91, battingAvg: 27, strikeRate: 140, economy: 7.2, wickets: 150 } },
  { id: 'ipl30', name: 'Andre Russell', role: 'All-Rounder', ipl: { rating: 95, battingAvg: 29, strikeRate: 170, economy: 9.0, wickets: 110 } },
  { id: 'ipl31', name: 'Axar Patel', role: 'All-Rounder', ipl: { rating: 88, battingAvg: 25, strikeRate: 135, economy: 7.2, wickets: 120 } },
  { id: 'ipl32', name: 'Washington Sundar', role: 'All-Rounder', ipl: { rating: 85, battingAvg: 24, strikeRate: 130, economy: 7.5, wickets: 90 } },
  { id: 'ipl33', name: 'Marcus Stoinis', role: 'All-Rounder', ipl: { rating: 87, battingAvg: 27, strikeRate: 150, economy: 8.8, wickets: 60 } },
  { id: 'ipl34', name: 'Glenn Maxwell', role: 'All-Rounder', ipl: { rating: 92, battingAvg: 28, strikeRate: 165, economy: 8.5, wickets: 70 } },
  { id: 'ipl35', name: 'Sam Curran', role: 'All-Rounder', ipl: { rating: 89, battingAvg: 26, strikeRate: 140, economy: 8.2, wickets: 80 } },
  { id: 'ipl36', name: 'Cameron Green', role: 'All-Rounder', ipl: { rating: 88, battingAvg: 28, strikeRate: 145, economy: 8.5, wickets: 50 } },
  { id: 'ipl37', name: 'Mitchell Marsh', role: 'All-Rounder', ipl: { rating: 90, battingAvg: 30, strikeRate: 150, economy: 8.8, wickets: 60 } },

  // 🎯 BOWLERS (VERY IMPORTANT - REALISTIC)
  { id: 'ipl38', name: 'Jasprit Bumrah', role: 'Bowler', ipl: { rating: 95, economy: 6.5, wickets: 150, battingAvg: 10, strikeRate: 90 } },
  { id: 'ipl39', name: 'Rashid Khan', role: 'Bowler', ipl: { rating: 95, economy: 6.2, wickets: 250, battingAvg: 18, strikeRate: 140 } },
  { id: 'ipl40', name: 'Mohammed Shami', role: 'Bowler', ipl: { rating: 91, economy: 7.2, wickets: 180, battingAvg: 12, strikeRate: 95 } },
  { id: 'ipl41', name: 'Yuzvendra Chahal', role: 'Bowler', ipl: { rating: 90, economy: 7.5, wickets: 200, battingAvg: 12, strikeRate: 100 } },
  { id: 'ipl42', name: 'Bhuvneshwar Kumar', role: 'Bowler', ipl: { rating: 89, economy: 7.0, wickets: 170, battingAvg: 11, strikeRate: 90 } },
  { id: 'ipl43', name: 'Trent Boult', role: 'Bowler', ipl: { rating: 90, economy: 7.2, wickets: 180, battingAvg: 10, strikeRate: 85 } },
  { id: 'ipl44', name: 'Kagiso Rabada', role: 'Bowler', ipl: { rating: 91, economy: 7.4, wickets: 190, battingAvg: 11, strikeRate: 90 } },
  { id: 'ipl45', name: 'Arshdeep Singh', role: 'Bowler', ipl: { rating: 86, economy: 7.5, wickets: 110, battingAvg: 10, strikeRate: 85 } },
  { id: 'ipl46', name: 'Deepak Chahar', role: 'Bowler', ipl: { rating: 87, economy: 7.3, wickets: 120, battingAvg: 12, strikeRate: 95 } },
  { id: 'ipl47', name: 'Mohit Sharma', role: 'Bowler', ipl: { rating: 84, economy: 7.8, wickets: 100, battingAvg: 10, strikeRate: 85 } },
  { id: 'ipl48', name: 'Kuldeep Yadav', role: 'Bowler', ipl: { rating: 88, economy: 7.4, wickets: 140, battingAvg: 12, strikeRate: 90 } },
  { id: 'ipl49', name: 'Noor Ahmad', role: 'Bowler', ipl: { rating: 85, economy: 7.2, wickets: 110, battingAvg: 10, strikeRate: 85 } },
  { id: 'ipl50', name: 'Varun Chakravarthy', role: 'Bowler', ipl: { rating: 87, economy: 7.1, wickets: 130, battingAvg: 10, strikeRate: 85 } }
];

// 🔥 DEFAULTS FIXED FOR T20
function getRoleDefaults(role) {
  if (role === 'Bowler') return { battingAvg: 10, strikeRate: 90, economy: 7.0, wickets: 120, dismissals: 0 };
  if (role === 'WK') return { battingAvg: 32, strikeRate: 135, economy: 8.5, wickets: 0, dismissals: 40 };
  if (role === 'All-Rounder') return { battingAvg: 26, strikeRate: 140, economy: 8.0, wickets: 80, dismissals: 0 };
  return { battingAvg: 32, strikeRate: 135, economy: 9.0, wickets: 0, dismissals: 0 };
}

function normalizeBaseStats(rawStats, role) {
  const def = getRoleDefaults(role);

  return {
    battingAvg: rawStats?.battingAvg ?? def.battingAvg,
    strikeRate: rawStats?.strikeRate ?? def.strikeRate,
    economy: rawStats?.economy ?? def.economy,
    wickets: rawStats?.wickets ?? def.wickets,
    dismissals: role === 'WK' ? (rawStats?.dismissals ?? def.dismissals) : 0,
    overall: rawStats?.rating ?? 70,
    bowlingAvg: Math.round((rawStats?.economy ?? def.economy) * 6),
  };
}

// 🔥 CRITICAL FIX — DO NOT MODIFY T20
function deriveStatsFromBase(base, fromKey, toKey) {
  if (toKey === 'T20') return { ...base };

  if (toKey === 'ODI') {
    return {
      ...base,
      battingAvg: base.battingAvg * 0.95,
      strikeRate: base.strikeRate * 0.85,
      economy: base.economy * 1.05,
    };
  }

  if (toKey === 'Test') {
    return {
      ...base,
      battingAvg: base.battingAvg * 1.1,
      strikeRate: base.strikeRate * 0.6,
      economy: base.economy * 0.85,
    };
  }

  return base;
}

function buildFullPlayer(raw, baseKey, baseStatsRaw) {
  const role = raw.role;
  const base = normalizeBaseStats(baseStatsRaw, role);

  const stats = {
    T20: deriveStatsFromBase(base, baseKey, 'T20'),
    ODI: deriveStatsFromBase(base, baseKey, 'ODI'),
    Test: deriveStatsFromBase(base, baseKey, 'Test'),
  };

  const tier = base.overall >= 90 ? 'A' : base.overall >= 80 ? 'B' : 'C';

  return {
    id: raw.id,
    name: raw.name,
    role: raw.role,
    tier,
    basePrice: 2,
    stats,
  };
}

function expandPool(rawList, baseKey, statsKey, copies = COPIES) {
  const basePlayers = rawList.map((raw) =>
    buildFullPlayer(raw, baseKey, raw[statsKey] || {})
  );

  return Array.from({ length: copies }, (_, i) =>
    basePlayers.map((p) => ({
      ...p,
      id: `${p.id}_${i}`,
    }))
  ).flat();
}

export function getPlayersForFormat(format) {
  return expandPool(baseIPL, 'T20', 'ipl', COPIES);
}

export const players = expandPool(baseIPL, 'T20', 'ipl', COPIES);