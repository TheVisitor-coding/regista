import { defineConfig } from '@adonisjs/core/bodyparser'

export default defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: {
    convertEmptyStringsToNull: true,
    encoding: 'utf-8',
    limit: '1mb',
    types: ['application/x-www-form-urlencoded'],
  },

  json: {
    convertEmptyStringsToNull: true,
    encoding: 'utf-8',
    limit: '1mb',
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  multipart: {
    autoProcess: true,
    convertEmptyStringsToNull: true,
    encoding: 'utf-8',
    limit: '20mb',
    types: ['multipart/form-data'],
  },

  raw: {
    encoding: 'utf-8',
    limit: '1mb',
    types: ['text/*'],
  },
})
