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
