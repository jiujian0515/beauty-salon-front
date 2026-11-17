import { env } from '@/config/env'

let started = false

/**
 * Sentry 仅在配置了 DSN 时按需加载，避免未接入环境额外下载（BTD §13.1）。
 */
export function initObservability(): void {
  if (started || !env.sentryDsn) return
  started = true
  void import('@sentry/react').then((Sentry) => {
    Sentry.init({
      dsn: env.sentryDsn,
      environment: env.appEnv,
      release: env.appVersion,
      tracesSampleRate: 0.1,
      ignoreErrors: ['ResizeObserver loop limit exceeded', /请求已取消/],
    })
  })
}
