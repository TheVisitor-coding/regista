/*
|--------------------------------------------------------------------------
| WebSocket preload
|--------------------------------------------------------------------------
|
| Initializes the Socket.io server and attaches it to the HTTP server.
*/

import app from '@adonisjs/core/services/app'
import { ws } from '#services/ws'

app.ready(async () => {
  ws.boot()
})
