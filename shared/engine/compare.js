export function calculatePower(player, format) {
  const formatKey = format === 'IPL' ? 'T20' : format;
  const stats = player?.stats?.[formatKey] || player?.stats?.T20;
  const role = player?.role;

  if (!stats) return 0;

  let power = 0;

  if (role === 'Batsman') {
    power =
      stats.battingAvg * 0.45 +
      stats.strikeRate * 0.45 +
      stats.overall * 0.1;
  } else if (role === 'Bowler') {
    const economyScore = 100 - stats.economy * 10;
    power =
      economyScore * 0.5 +
      stats.wickets * 0.4 +
      stats.overall * 0.1;
  } else if (role === 'All-Rounder') {
    const batting =
      stats.battingAvg * 0.4 +
      stats.strikeRate * 0.4;

    const bowling =
      (100 - stats.economy * 10) * 0.5 +
      stats.wickets * 0.3;

    power =
      batting * 0.45 +
      bowling * 0.45 +
      stats.overall * 0.1;
  } else if (role === 'WK') {
    power =
      stats.battingAvg * 0.4 +
      stats.strikeRate * 0.3 +
      stats.dismissals * 0.2 +
      stats.overall * 0.1;
  }

  // Slight randomness only
  power += Math.random() * 3;

  return Math.round(power * 100) / 100;
}

export function decideWinner(p1, p2, format = 'T20') {
  const p1Power = calculatePower(p1, format);
  const p2Power = calculatePower(p2, format);

  return {
    winner: p1Power > p2Power ? p1 : p2,
    p1Power,
    p2Power,
  };
}

