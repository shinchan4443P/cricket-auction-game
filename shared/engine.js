// Shared game engine: used by both server and client.
// Keep logic deterministic interface-wise; randomness is applied only when `variance` is enabled.

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function roleAdvantageBonus(playerRole, opponentRole) {
  // Bonuses are relative to opponentRole.
  if (!playerRole || !opponentRole) return 0;

  if (playerRole === 'All-Rounder') return 2;
  if (playerRole === 'WK' && opponentRole === 'Bowler') return 3;

  if (playerRole === 'Batsman' && opponentRole === 'Bowler') return 5;
  if (playerRole === 'Bowler' && opponentRole === 'Batsman') return 5;

  return 0;
}

function econScore(economy) {
  // Lower economy is better, convert to positive.
  // Example: economy 7.5 -> 92.5
  if (economy == null || Number.isNaN(economy)) return 50;
  return clamp(100 - economy, 0, 100);
}

function bowlingAvgScore(bowlingAvg) {
  // Lower bowling average is better, convert to positive.
  if (bowlingAvg == null || Number.isNaN(bowlingAvg)) return 50;
  return clamp(100 - bowlingAvg, 0, 100);
}

function getFormatKey(format) {
  if (!format) return 'T20';
  if (format === 'IPL') return 'T20';
  return format; // 'T20' | 'ODI' | 'Test'
}

/**
 * Calculate a power score for a single player card for a given match format.
 *
 * @param {object} player - card/player. Must include `role` and `stats[formatKey]`.
 * @param {string} format - 'T20' | 'ODI' | 'Test' | 'IPL'
 * @param {string} opponentRole - role string of opponent card
 * @param {object} options - { variance: boolean }
 */
export function calculatePower(player, format, opponentRole, options = {}) {
  const { variance = true } = options;
  const key = getFormatKey(format);

  const stats = player?.stats?.[key] || {};
  const role = player?.role;

  const battingAvg = stats.battingAvg ?? 30;
  const strikeRate = stats.strikeRate ?? 100;
  const economy = stats.economy ?? 8;
  const wickets = stats.wickets ?? 0;
  const dismissals = stats.dismissals ?? 0;

  const overall = stats.overall ?? 70;
  const bowlingAvg = stats.bowlingAvg ?? undefined;

  const battingComponent = clamp(battingAvg * 0.7 + strikeRate * 0.35, 0, 200);

  // Bowling component uses positive economy score and wickets.
  const eco = econScore(economy);
  const bowlingComponentBase = clamp(eco * 0.7 + wickets * 2.0, 0, 200);

  // Test bowlingAvg contribution (if present)
  const bavg = bowlingAvgScore(bowlingAvg);

  let score = 0;

  if (key === 'T20') {
    // T20 focus: strikeRate + economy.
    const bowlingContribution = clamp(eco * 0.8 + wickets * 1.6, 0, 200);
    const battingContribution = clamp(strikeRate * 0.7 + battingAvg * 0.4, 0, 200);

    if (role === 'All-Rounder') {
      score = battingContribution * 0.4 + bowlingContribution * 0.4 + overall * 0.2;
    } else if (role === 'WK') {
      score = battingContribution * 0.85 + dismissals * 1.4 + overall * 0.15;
    } else if (role === 'Bowler') {
      score = bowlingContribution * 0.85 + battingAvg * 0.15 + overall * 0.0;
    } else {
      // Batsman default
      score = battingContribution * 0.9 + eco * 0.05 + overall * 0.05;
    }
  } else if (key === 'ODI') {
    // ODI focus: strikeRate + economy (slightly more bowling weight).
    const bowlingContribution = clamp(eco * 0.75 + wickets * 1.8, 0, 200);
    const battingContribution = clamp(strikeRate * 0.6 + battingAvg * 0.5, 0, 200);

    if (role === 'All-Rounder') {
      score = battingContribution * 0.4 + bowlingContribution * 0.4 + overall * 0.2;
    } else if (role === 'WK') {
      score = battingContribution * 0.8 + dismissals * 1.4 + overall * 0.2;
    } else if (role === 'Bowler') {
      score = bowlingContribution * 0.9 + battingAvg * 0.1;
    } else {
      score = battingContribution * 0.9 + eco * 0.1;
    }
  } else if (key === 'Test') {
    // Test focus: battingAvg + bowlingAvg (converted) + wickets.
    const bowlingContribution = clamp(bavg * 0.75 + wickets * 2.0, 0, 200);
    const battingContribution = clamp(battingAvg * 1.1, 0, 200);

    if (role === 'All-Rounder') {
      score = battingContribution * 0.4 + bowlingContribution * 0.4 + overall * 0.2;
    } else if (role === 'WK') {
      score = battingContribution * 0.8 + dismissals * 1.6 + overall * 0.2;
    } else if (role === 'Bowler') {
      score = bowlingContribution * 0.92 + battingAvg * 0.08;
    } else {
      score = battingContribution * 0.95 + eco * 0.05;
    }
  }

  // IPL adds an extra clutch boost (only when randomness enabled)
  if (format === 'IPL' && variance) {
    const clutch = 1 + Math.random() * 0.15; // 0% - 15%
    score *= clutch;
  }

  // Role advantage bonus (deterministic)
  score += roleAdvantageBonus(role, opponentRole);

  // Small variance 0..5
  if (variance) {
    score += Math.random() * 5;
  }

  // Ensure nice display numbers
  return Math.round(score * 10) / 10;
}

