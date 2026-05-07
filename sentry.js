const Sentry = require('@sentry/node')
Sentry.init({ dsn: 'https://fc2656294001486ba538444ae9bf6693@o404682.ingest.sentry.io/5269172' })

module.exports = Sentry
