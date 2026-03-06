/*
|--------------------------------------------------------------------------
| Environment variables validation
|--------------------------------------------------------------------------
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string.optional(),

  APP_KEY: Env.schema.string(),
  JWT_SECRET: Env.schema.string(),

  DATABASE_URL: Env.schema.string(),
  REDIS_URL: Env.schema.string(),

  CORS_ORIGIN: Env.schema.string.optional(),
})
