/** Duration of a standard match in real-time minutes */
export const MATCH_DURATION_MINUTES = 90;

/** How many real seconds represent one simulated minute */
export const SECONDS_PER_SIMULATED_MINUTE = 60;

/** Maximum substitutions allowed per match */
export const MAX_SUBSTITUTIONS = 5;

/** Minimum interval between tactical changes (in simulated minutes) */
export const TACTICAL_CHANGE_COOLDOWN_MINUTES = 5;

/** Number of teams in a league */
export const LEAGUE_SIZE = 20;

/** Match frequency in days */
export const MATCH_FREQUENCY_DAYS = 3;

/** Squad limits */
export const SQUAD_MAX_PLAYERS = 25;
export const MATCHDAY_SQUAD_MAX_PLAYERS = 18;
export const MATCHDAY_STARTING_XI = 11;
export const MATCHDAY_BENCH_SIZE = 7;

/** Finance defaults (stored in cents) */
export const INITIAL_CLUB_BUDGET_CENTS = 500_000_000;

/** Salary formula */
export const SALARY_BASE_PER_OVERALL = 500;
export const SALARY_RANDOM_BONUS_MAX = 2_000;

/** Auth */
export const ACCESS_TOKEN_EXPIRY_MINUTES = 15;
export const REFRESH_TOKEN_EXPIRY_DAYS = 30;
export const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
export const PASSWORD_RESET_EXPIRY_HOURS = 1;
export const BCRYPT_SALT_ROUNDS = 12;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

/** Reserved usernames */
export const RESERVED_USERNAMES = [
  'admin', 'system', 'regista', 'support', 'mod',
  'moderator', 'staff', 'root', 'api', 'www',
] as const;

/** Morale */
export const MORALE_INITIAL = 60;
export const MORALE_MIN = 0;
export const MORALE_MAX = 100;

/** Finance thresholds (in cents) */
export const FINANCE_ALERT_THRESHOLD = 50_000_000;
export const FINANCE_CRITICAL_THRESHOLD = 0;

/** Squad generation */
export const SQUAD_INITIAL_SIZE = 22;
export const SQUAD_INITIAL_OVERALL_MIN = 55;
export const SQUAD_INITIAL_OVERALL_MAX = 65;
export const SQUAD_INITIAL_CONTRACT_MATCHES = 40;

/** Club name */
export const CLUB_NAME_MIN = 2;
export const CLUB_NAME_MAX = 30;

/** Color presets for club onboarding */
export const COLOR_PRESETS = [
  '#DC2626', '#EA580C', '#D97706', '#CA8A04',
  '#65A30D', '#16A34A', '#059669', '#0D9488',
  '#0891B2', '#0284C7', '#2563EB', '#4F46E5',
  '#7C3AED', '#9333EA', '#C026D3', '#DB2777',
  '#E11D48', '#1E293B', '#475569', '#FFFFFF',
] as const;

/** Logo preset IDs for club onboarding */
export const LOGO_PRESETS = [
  'shield-01', 'shield-02', 'shield-03', 'shield-04', 'shield-05',
  'circle-01', 'circle-02', 'circle-03', 'circle-04', 'circle-05',
  'diamond-01', 'diamond-02', 'diamond-03', 'diamond-04', 'diamond-05',
  'crest-01', 'crest-02', 'crest-03', 'crest-04', 'crest-05',
  'emblem-01', 'emblem-02', 'emblem-03', 'emblem-04', 'emblem-05',
  'badge-01', 'badge-02', 'badge-03', 'badge-04', 'badge-05',
] as const;

/** Competition */
export const DIVISIONS_PER_LEAGUE = 3;
export const CLUBS_PER_DIVISION = 20;
export const TOTAL_MATCHDAYS = 38;
export const SEASON_DURATION_DAYS = 114;
export const OFFSEASON_DURATION_DAYS = 5;
export const POINTS_WIN = 3;
export const POINTS_DRAW = 1;
export const POINTS_LOSS = 0;
export const PROMOTION_ZONE = 3;
export const RELEGATION_ZONE_START = 18;

/** AI club overall ranges per division level */
export const AI_OVERALL_RANGES: Record<number, [number, number]> = {
  1: [70, 80],
  2: [60, 70],
  3: [50, 65],
};

/** Prize money by final position (in cents) */
export const PRIZE_MONEY: Record<number, number> = {
  1: 200_000_000,
  2: 150_000_000,
  3: 120_000_000,
  4: 100_000_000,
  5: 80_000_000,
  6: 70_000_000,
  7: 60_000_000,
  8: 55_000_000,
  9: 50_000_000,
  10: 45_000_000,
  11: 40_000_000,
  12: 38_000_000,
  13: 36_000_000,
  14: 34_000_000,
  15: 32_000_000,
  16: 30_000_000,
  17: 28_000_000,
  18: 26_000_000,
  19: 24_000_000,
  20: 22_000_000,
};

/** Formations: name → position array (GK always first) */
export const FORMATIONS: Record<string, string[]> = {
  '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
  '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'RW', 'ST', 'LW'],
  '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'RW', 'CAM', 'LW', 'ST'],
  '3-4-3': ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CM', 'LM', 'RW', 'ST', 'LW'],
  '4-5-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CDM', 'CM', 'LM', 'ST'],
  '5-4-1': ['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST'],
  '5-3-2': ['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'CM', 'CDM', 'CM', 'ST', 'ST'],
  '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CDM', 'CM', 'LM', 'ST', 'ST'],
};

/** AI profile → preferred formations (in order of preference) */
export const AI_PROFILE_FORMATIONS: Record<string, string[]> = {
  offensive: ['4-3-3', '4-2-3-1', '3-4-3'],
  balanced: ['4-4-2', '4-2-3-1', '4-5-1'],
  defensive: ['5-4-1', '5-3-2', '4-5-1'],
};

/** AI profile → default tactical parameters */
export const AI_PROFILE_TACTICS: Record<string, {
  mentality: string
  pressing: string
  passingStyle: string
  width: string
  tempo: string
  defensiveLine: string
}> = {
  offensive: { mentality: 'offensive', pressing: 'high', passingStyle: 'long', width: 'wide', tempo: 'fast', defensiveLine: 'high' },
  balanced: { mentality: 'balanced', pressing: 'medium', passingStyle: 'mixed', width: 'normal', tempo: 'normal', defensiveLine: 'medium' },
  defensive: { mentality: 'defensive', pressing: 'low', passingStyle: 'short', width: 'narrow', tempo: 'slow', defensiveLine: 'low' },
};

/** Position aliases for formation matching (some formations use RM/LM which map to wider roles) */
export const FORMATION_POSITION_ALIASES: Record<string, string[]> = {
  RM: ['RW', 'CM', 'CAM'],
  LM: ['LW', 'CM', 'CAM'],
};

/** Training: stats targeted by each focus */
export const TRAINING_FOCUS_STATS: Record<string, string[]> = {
  physical: ['pace', 'stamina', 'strength', 'agility'],
  technical: ['passing', 'shooting', 'dribbling', 'crossing', 'heading'],
  mental: ['vision', 'composure', 'workRate', 'positioning'],
  defensive: ['tackling', 'marking'],
  set_pieces: ['penalties', 'freeKick'],
  rest: [],
};

/** GK training: stats targeted by each focus */
export const GK_TRAINING_FOCUS_STATS: Record<string, string[]> = {
  reflexes: ['reflexes', 'diving'],
  distribution: ['kicking', 'communication'],
  placement: ['handling', 'positioning'],
  rest: [],
};

/** Fatigue cost per training focus */
export const TRAINING_FATIGUE_COST: Record<string, number> = {
  physical: 7,
  technical: 5,
  mental: 3,
  defensive: 5,
  set_pieces: 4,
  rest: -10,
  reflexes: 5,
  distribution: 4,
  placement: 4,
};

/** Base training gain per session (before modifiers) */
export const TRAINING_BASE_GAIN = 0.3;

/** Natural fatigue recovery between matchdays (per 3-day cycle) */
export const FATIGUE_RECOVERY_PER_CYCLE = 15;

/** Transfers */
export const MIN_SQUAD_SIZE = 16;
export const MAX_SIMULTANEOUS_LISTINGS = 5;
export const MAX_OUTGOING_OFFERS = 3;
export const OFFER_EXPIRY_HOURS = 48;
export const MIN_LISTING_PRICE_CENTS = 1_000_000; // 10,000 G$
export const MIN_OFFER_AMOUNT_CENTS = 1_000_000;
export const STANDARD_CONTRACT_MATCHES = 20;
export const FREE_AGENT_MAX_DAYS = 14;
export const FREE_AGENT_PENALTY_DAY = 7;
export const FREE_AGENT_PENALTY_OVERALL = 2;
export const AI_MARKET_TARGET_COUNT = 50;
export const AI_MARKET_EXPIRY_DAYS = 7;
export const RELEASE_CLAUSE_MULTIPLIER_PURCHASE = 1.5;
export const RELEASE_CLAUSE_MULTIPLIER_DEFAULT = 2.0;
export const RELEASE_CLAUSE_MULTIPLIER_FREE = 1.5;
