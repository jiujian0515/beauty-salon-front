const rawEnv = import.meta.env

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const env = {
  apiBaseUrl: (rawEnv.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, ''),
  appEnv: rawEnv.VITE_APP_ENV ?? 'dev',
  sentryDsn: rawEnv.VITE_SENTRY_DSN ?? '',
  pollIntervalMs: toNumber(rawEnv.VITE_POLL_INTERVAL_MS, 30_000),
  slotGrainMinutes: toNumber(rawEnv.VITE_SLOT_GRAIN_MINUTES, 15),
  appVersion: rawEnv.VITE_APP_VERSION ?? '0.0.0',
  /** 与后端 sa-token.token-name 一致：Authorization */
  authHeader: 'Authorization',
} as const

export const isProduction = env.appEnv === 'prod'
