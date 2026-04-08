import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  commands: [
    () => import('@adonisjs/core/commands'),
  ],

  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl', 'test'],
    },
    () => import('@adonisjs/cors/cors_provider'),
  ],

  preloads: [
    () => import('#start/routes'),
    () => import('#start/kernel'),
    {
      file: () => import('#start/infra'),
      environment: ['web'],
    },
    {
      file: () => import('#start/ws'),
      environment: ['web'],
    },
    {
      file: () => import('#start/workers'),
      environment: ['web'],
    },
  ],

  metaFiles: [
    {
      pattern: 'start/routes.ts',
      reloadServer: false,
    },
  ],

  tests: {
    suites: [
      {
        name: 'unit',
        files: ['tests/unit/**/*.spec.ts'],
      },
      {
        name: 'functional',
        files: ['tests/functional/**/*.spec.ts'],
      },
      {
        name: 'integration',
        files: ['tests/integration/**/*.spec.ts'],
      },
    ],
    timeout: 30_000,
  },

  directories: {
    controllers: 'app/controllers',
    middleware: 'app/middleware',
    providers: 'providers',
    start: 'start',
    config: 'config',
    tests: 'tests',
  },
})
