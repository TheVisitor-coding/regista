import env from '#start/env'
import { defineConfig } from '@adonisjs/core/logger'

export default defineConfig({
    default: 'app',
    loggers: {
        app: {
            enabled: true,
            name: 'regista-api',
            level: env.get('LOG_LEVEL', 'info'),
            transport: {
                targets:
                    env.get('NODE_ENV') === 'development'
                        ? [{ target: 'pino-pretty', level: 'info' }]
                        : [],
            },
        },
    },
})
