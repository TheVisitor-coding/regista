/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import { authMiddleware } from '../app/middleware/auth_middleware.js'
import { rateLimit } from '../app/middleware/rate_limit_middleware.js'

const HealthController = () => import('#controllers/health_controller')
const AuthController = () => import('../app/auth/auth_controller.js')
const UserController = () => import('../app/users/user_controller.js')
const ClubController = () => import('../app/clubs/club_controller.js')
const DashboardController = () => import('../app/dashboard/dashboard_controller.js')
const NotificationController = () => import('../app/notifications/notification_controller.js')
const FinanceController = () => import('../app/finances/finance_controller.js')
const SquadController = () => import('../app/squad/squad_controller.js')
const CompetitionController = () => import('../app/competition/competition_controller.js')
const MatchController = () => import('../app/competition/match_controller.js')
const SettingsController = () => import('../app/settings/settings_controller.js')
const MatchDetailController = () => import('../app/match/match_detail_controller.js')
const TrainingController = () => import('../app/training/training_controller.js')
const MarketController = () => import('../app/transfers/market_controller.js')
const OfferController = () => import('../app/transfers/offer_controller.js')
const TacticsController = () => import('../app/tactics/tactics_controller.js')
const ModerationController = () => import('../app/moderation/moderation_controller.js')
const OnboardingController = () => import('../app/onboarding/onboarding_controller.js')
const StatsController = () => import('../app/stats/stats_controller.js')

const registerRL = rateLimit({ maxAttempts: 3, windowSeconds: 3600, keyPrefix: 'register' })
const loginRL = rateLimit({ maxAttempts: 5, windowSeconds: 900, keyPrefix: 'login' })
const forgotRL = rateLimit({ maxAttempts: 3, windowSeconds: 3600, keyPrefix: 'forgot' })
const resendRL = rateLimit({ maxAttempts: 3, windowSeconds: 3600, keyPrefix: 'resend' })
const refreshRL = rateLimit({ maxAttempts: 30, windowSeconds: 900, keyPrefix: 'refresh' })

router.get('/health', [HealthController, 'check'])

// Auth routes (public)
router.group(() => {
  router.post('/register', [AuthController, 'register']).use(registerRL)
  router.post('/login', [AuthController, 'login']).use(loginRL)
  router.post('/refresh', [AuthController, 'refresh']).use(refreshRL)
  router.post('/verify-email', [AuthController, 'verifyEmail'])
  router.post('/resend-verification', [AuthController, 'resendVerification']).use(resendRL)
  router.post('/forgot-password', [AuthController, 'forgotPassword']).use(forgotRL)
  router.post('/reset-password', [AuthController, 'resetPassword'])
  router.get('/check-username', [AuthController, 'checkUsername'])
  router.get('/check-email', [AuthController, 'checkEmail'])
}).prefix('/auth')

// Auth routes (protected)
router.group(() => {
  router.post('/logout', [AuthController, 'logout'])
}).prefix('/auth').use(authMiddleware)

// User routes (protected)
router.group(() => {
  router.get('/me', [UserController, 'me'])
  router.patch('/me/username', [UserController, 'updateUsername'])
  router.patch('/me/email', [UserController, 'updateEmail'])
  router.patch('/me/password', [UserController, 'updatePassword'])
  router.delete('/me', [UserController, 'deleteAccount'])
  router.get('/me/sessions', [UserController, 'getSessions'])
  router.delete('/me/sessions', [UserController, 'revokeSessions'])
}).prefix('/users').use(authMiddleware)

router.get('/dashboard', [DashboardController, 'show']).use(authMiddleware)

// Club routes
router.group(() => {
  router.post('/', [ClubController, 'create'])
  router.get('/mine', [ClubController, 'mine'])
  router.patch('/mine', [ClubController, 'updateMine'])
  router.get('/check-name', [ClubController, 'checkName'])
}).prefix('/clubs').use(authMiddleware)

router.get('/clubs/:id', [ClubController, 'show'])

// Notification routes (protected)
router.group(() => {
  router.get('/', [NotificationController, 'index'])
  router.patch('/:id/read', [NotificationController, 'markRead'])
  router.patch('/read-all', [NotificationController, 'markAllRead'])
  router.get('/unread-count', [NotificationController, 'unreadCount'])
}).prefix('/notifications').use(authMiddleware)

// Finance routes (protected)
router.group(() => {
  router.get('/', [FinanceController, 'summary'])
  router.get('/transactions', [FinanceController, 'transactions'])
  router.get('/salary-breakdown', [FinanceController, 'salaryBreakdown'])
}).prefix('/finances').use(authMiddleware)

// Squad routes (protected)
router.group(() => {
  router.get('/', [SquadController, 'index'])
  router.get('/compare', [SquadController, 'compare'])
  router.get('/:playerId', [SquadController, 'show'])
  router.get('/:playerId/history', [SquadController, 'history'])
  router.get('/:playerId/valuation', [SquadController, 'valuation'])
  router.post('/:playerId/extend-contract', [SquadController, 'extendContract'])
}).prefix('/squad').use(authMiddleware)

// Competition routes (protected)
router.group(() => {
  router.get('/', [CompetitionController, 'info'])
  router.get('/standings', [CompetitionController, 'standings'])
  router.get('/matchday/:number', [CompetitionController, 'matchday'])
  router.get('/scorers', [CompetitionController, 'scorers'])
  router.get('/position-history', [CompetitionController, 'positionHistory'])
  router.get('/seasons', [CompetitionController, 'seasonHistory'])
}).prefix('/competition').use(authMiddleware)

// Stats routes (protected)
router.get('/stats/club', [StatsController, 'clubStats']).use(authMiddleware)

// Match routes (protected)
router.group(() => {
  router.get('/', [MatchController, 'index'])
  router.get('/:matchId', [MatchController, 'show'])
  router.get('/:matchId/events', [MatchDetailController, 'events'])
  router.get('/:matchId/lineups', [MatchDetailController, 'lineups'])
  router.get('/:matchId/stats', [MatchDetailController, 'stats'])
  router.get('/:matchId/summary', [MatchDetailController, 'summary'])
  router.get('/:matchId/player-stats', [MatchDetailController, 'playerStatsDetail'])
  router.post('/:matchId/tactics', [MatchDetailController, 'updateTactics'])
}).prefix('/matches').use(authMiddleware)

// Settings routes (protected)
router.group(() => {
  router.get('/notifications', [SettingsController, 'getNotificationPreferences'])
  router.put('/notifications', [SettingsController, 'updateNotificationPreferences'])
}).prefix('/settings').use(authMiddleware)

// Training routes (protected)
router.group(() => {
  router.get('/', [TrainingController, 'show'])
  router.put('/', [TrainingController, 'update'])
}).prefix('/training').use(authMiddleware)

// Market routes (protected)
router.group(() => {
  router.get('/', [MarketController, 'index'])
  router.get('/my-listings', [MarketController, 'myListings'])
  router.get('/free-agents', [MarketController, 'freeAgentsList'])
  router.get('/:listingId', [MarketController, 'show'])
  router.post('/buy/:listingId', [MarketController, 'buy'])
  router.post('/sell', [MarketController, 'sell'])
  router.delete('/listings/:listingId', [MarketController, 'withdraw'])
  router.post('/free-agents/:id/sign', [MarketController, 'signFreeAgent'])
}).prefix('/market').use(authMiddleware)

// Offer routes (protected)
router.group(() => {
  router.post('/', [OfferController, 'create'])
  router.get('/sent', [OfferController, 'sent'])
  router.get('/received', [OfferController, 'received'])
  router.post('/:id/accept', [OfferController, 'accept'])
  router.post('/:id/reject', [OfferController, 'reject'])
  router.post('/:id/counter', [OfferController, 'counter'])
  router.delete('/:id', [OfferController, 'cancel'])
}).prefix('/offers').use(authMiddleware)

// Release player (protected)
router.post('/squad/:playerId/release', [MarketController, 'releasePlayer']).use(authMiddleware)

// Tactics routes (protected)
router.group(() => {
  router.get('/', [TacticsController, 'show'])
  router.put('/', [TacticsController, 'update'])
  router.get('/presets', [TacticsController, 'listPresets'])
  router.post('/presets', [TacticsController, 'createPreset'])
  router.put('/presets/:id', [TacticsController, 'updatePreset'])
  router.delete('/presets/:id', [TacticsController, 'deletePreset'])
  router.post('/presets/:id/apply', [TacticsController, 'applyPreset'])
  router.post('/auto-lineup', [TacticsController, 'autoLineup'])
  router.get('/composition', [TacticsController, 'getComposition'])
  router.put('/composition', [TacticsController, 'saveComposition'])
  router.patch('/auto-adjustment', [TacticsController, 'toggleAutoAdjustment'])
  router.get('/analysis/:matchId', [TacticsController, 'analysis'])
}).prefix('/tactics').use(authMiddleware)

// Moderation routes
router.post('/names/validate', [ModerationController, 'validateName'])
router.post('/reports', [ModerationController, 'createReport']).use(authMiddleware)

// Onboarding routes (protected)
router.group(() => {
  router.get('/status', [OnboardingController, 'status'])
  router.post('/missions/:missionKey/complete', [OnboardingController, 'completeMission'])
  router.post('/missions/:missionKey/claim', [OnboardingController, 'claimReward'])
}).prefix('/onboarding').use(authMiddleware)
