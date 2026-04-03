import env from '#start/env'
import { Secret } from '@adonisjs/core/helpers'

export default {
  appKey: new Secret(env.get('APP_KEY')),

  http: {
    generateRequestId: true,
    allowMethodSpoofing: false,
    useAsyncLocalStorage: false,
    qs: {
      parse: {
        depth: 5,
        parameterLimit: 1000,
        allowSparse: false,
        arrayLimit: 20,
        comma: true,
      },
      stringify: {
        encode: true,
        encodeValuesOnly: false,
        arrayFormat: 'indices' as const,
        skipNulls: false,
      },
    },
  },
}
