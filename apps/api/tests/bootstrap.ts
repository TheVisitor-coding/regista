import { execSync } from 'node:child_process'
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import app from '@adonisjs/core/services/app'
import type { Config } from '@japa/runner/types'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import testUtils from '@adonisjs/core/services/test_utils'
import { redis, bullmqRedis } from '#services/redis'

export const plugins: Config['plugins'] = [
  assert(),
  apiClient(),
  pluginAdonisJS(app),
]

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [
    async () => {
      // Run Drizzle migrations against the test database
      execSync('pnpm --filter @regista/db db:migrate', {
        stdio: 'inherit',
        env: {
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
        },
      })

      // Connect Redis clients (lazyConnect: true requires explicit connect)
      await redis.connect()
      await bullmqRedis.connect()
    },
  ],
  teardown: [
    async () => {
      const { sqlClient } = await import('@regista/db')
      await sqlClient.end()
      await redis.quit()
      await bullmqRedis.quit()
    },
  ],
}

export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    suite.setup(async () => {
      // Flush Redis to clear rate limit keys from previous runs
      await redis.flushdb()
      return testUtils.httpServer().start()
    })
  }
}
