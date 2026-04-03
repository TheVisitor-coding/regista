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

  // Match room management
  ws.io?.on('connection', (socket) => {
    socket.on('match:join', (data: { matchId: string }) => {
      socket.join(`match:${data.matchId}`)
    })
    socket.on('match:leave', (data: { matchId: string }) => {
      socket.leave(`match:${data.matchId}`)
    })
  })
})
