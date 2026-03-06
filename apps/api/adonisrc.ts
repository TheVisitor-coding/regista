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
    () => import('#start/infra'),
    () => import('#start/ws'),
  ],

  metaFiles: [
    {
      pattern: 'start/routes.ts',
      reloadServer: false,
    },
  ],

  directories: {
    controllers: 'app/controllers',
    middleware: 'app/middleware',
    providers: 'providers',
    start: 'start',
    config: 'config',
    tests: 'tests',
  },
})
