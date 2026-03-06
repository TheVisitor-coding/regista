import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

export default defineConfig({
  enabled: true,
  origin: env.get('CORS_ORIGIN', 'http://localhost:3000'),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})
