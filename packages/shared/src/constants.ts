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
