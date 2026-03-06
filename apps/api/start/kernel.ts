/*
|--------------------------------------------------------------------------
| HTTP kernel
|--------------------------------------------------------------------------
*/

import server from '@adonisjs/core/services/server'

server.errorHandler(() => import('#exceptions/handler'))

server.use([
  () => import('#middleware/security_headers_middleware'),
  () => import('@adonisjs/cors/cors_middleware'),
  () => import('@adonisjs/core/bodyparser_middleware'),
])
