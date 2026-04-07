// Shared game types (used by both client and server)

export const PLAYER_ROLES = {
  BATSMAN: 'Batsman',
  BOWLER: 'Bowler',
  ALL_ROUNDER: 'All-Rounder',
  WK: 'WK',
};

export const FORMATS = {
  IPL: 'IPL',
  TEST: 'Test',
  T20: 'T20',
  ODI: 'ODI',
};

export const GAME_PHASES = {
  LOBBY: 'lobby',
  AUCTION: 'auction',
  MATCH: 'match',
  RESULTS: 'results',
};

// Team metadata for IPL and International formats
export const IPL_TEAMS = [
  { id: 'MI', name: 'Mumbai Indians', short: 'MI', color: '#004BA0' },
  { id: 'CSK', name: 'Chennai Super Kings', short: 'CSK', color: '#F1CD00' },
  { id: 'RCB', name: 'Royal Challengers Bengaluru', short: 'RCB', color: '#D71920' },
  { id: 'SRH', name: 'Sunrisers Hyderabad', short: 'SRH', color: '#F26522' },
  { id: 'KKR', name: 'Kolkata Knight Riders', short: 'KKR', color: '#3B215D' },
  { id: 'DC', name: 'Delhi Capitals', short: 'DC', color: '#17479E' },
  { id: 'RR', name: 'Rajasthan Royals', short: 'RR', color: '#EA1A8E' },
  { id: 'PBKS', name: 'Punjab Kings', short: 'PBKS', color: '#ED1B24' },
  { id: 'GT', name: 'Gujarat Titans', short: 'GT', color: '#1B2133' },
  { id: 'LSG', name: 'Lucknow Super Giants', short: 'LSG', color: '#00A0E2' },
];

export const INTERNATIONAL_TEAMS = [
  { id: 'IND', name: 'India', short: 'IND', color: '#1C4E80' },
  { id: 'AUS', name: 'Australia', short: 'AUS', color: '#F5AF00' },
  { id: 'ENG', name: 'England', short: 'ENG', color: '#C8102E' },
  { id: 'NZ', name: 'New Zealand', short: 'NZ', color: '#111111' },
  { id: 'PAK', name: 'Pakistan', short: 'PAK', color: '#115740' },
  { id: 'SA', name: 'South Africa', short: 'SA', color: '#006651' },
  { id: 'SL', name: 'Sri Lanka', short: 'SL', color: '#0033A0' },
  { id: 'BAN', name: 'Bangladesh', short: 'BAN', color: '#006A4E' },
  { id: 'AFG', name: 'Afghanistan', short: 'AFG', color: '#007F46' },
  { id: 'WI', name: 'West Indies', short: 'WI', color: '#7F0037' },
];

export const ROOM_PRESETS = {
  QUICK: { money: 100, squadSize: 8, auctionTimer: 20, matchRounds: 'bestOf5' },
  STANDARD: { money: 100, squadSize: 12, auctionTimer: 30, matchRounds: 'bestOf7' },
  PRO: { money: 100, squadSize: 15, auctionTimer: 40, matchRounds: 'bestOf9' },
};

export const MATCH_ROUND_OPTIONS = {
  bestOf5: 5,
  bestOf7: 7,
  bestOf9: 9,
  fullSquad: null, // Use squad size
};

export const ROLE_LIMITS = {
  minBowlers: { min: 2, max: 5, default: 3 },
  minBatsmen: { min: 2, max: 5, default: 3 },
  minWK: { min: 1, max: 2, default: 1 },
  maxAllRounders: { min: 3, max: 6, default: 5 },
};

export const CUSTOM_LIMITS = {
  money: { min: 10, max: 500, step: 1, default: 100 },
  squadSize: { min: 8, max: 15, default: 12 },
  auctionTimer: { min: 15, max: 45, default: 30 },
};

export const DEFAULT_MONEY_CR = 100;
export const AUCTION_BASE_PRICE_CR = 2;

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 8;
