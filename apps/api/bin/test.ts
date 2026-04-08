/*
|--------------------------------------------------------------------------
| Test runner entrypoint
|--------------------------------------------------------------------------
|
| The "bin/test.ts" file is the entrypoint executed by the assembler
| (spawned as a child process by `node ace test`). It MUST use
| `.testRunner()` — NOT `.ace().handle(['test'])` — to avoid an
| infinite recursion where ace spawns bin/test.js which spawns ace again.
|
*/

process.env.NODE_ENV = 'test'

import 'reflect-metadata'
import { Ignitor } from '@adonisjs/core'
import { configure, processCLIArgs, run } from '@japa/runner'

const APP_ROOT = new URL('../', import.meta.url)

const IMPORTER = (filePath: string) => {
  if (filePath.startsWith('./') || filePath.startsWith('../')) {
    return import(new URL(filePath, APP_ROOT).href)
  }
  return import(filePath)
}

new Ignitor(APP_ROOT, { importer: IMPORTER })
  .tap((app) => {
    app.booting(async () => {
      await import('#start/env')
    })
    app.listen('SIGTERM', () => app.terminate())
    app.listenIf(app.managedByPm2, 'SIGINT', () => app.terminate())
  })
  .testRunner()
  .configure(async (app) => {
    const { runnerHooks, plugins, configureSuite } = await import('#tests/bootstrap')

    processCLIArgs(process.argv.splice(2))
    configure({
      ...app.rcFile.tests,
      ...runnerHooks,
      plugins,
      configureSuite,
    })
  })
  .run(() => run())
