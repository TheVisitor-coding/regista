import env from '#start/env'
import { Secret } from '@adonisjs/core/helpers'

export default {
  appKey: new Secret(env.get('APP_KEY')),

  http: {
    generateRequestId: true,
    allowMethodSpoofing: false,
    useAsyncLocalStorage: false,
  },
}
