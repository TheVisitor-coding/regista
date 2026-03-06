import server from '@adonisjs/core/services/server'
import { Server } from 'socket.io'
import env from '#start/env'

class Ws {
  io: Server | undefined
  private booted = false

  boot() {
    if (this.booted) return

    this.booted = true
    this.io = new Server(server.getNodeServer(), {
      cors: {
        origin: env.get('CORS_ORIGIN', 'http://localhost:3000'),
        credentials: true,
      },
    })
  }
}

export const ws = new Ws()
