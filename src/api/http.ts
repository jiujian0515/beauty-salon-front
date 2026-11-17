import { env } from '@/config/env'
import type { ApiResponse } from '@/types/api'
import { AppError, fromBusinessCode, fromHttpStatus } from './errors'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

export interface RequestOptions {
  method?: Method
  query?: QueryParams
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
  idempotencyKey?: string
  headers?: Record<string, string>
}

interface HttpAuthBinding {
  getToken: () => string | null
  onUnauthorized: () => void
}

let authBinding: HttpAuthBinding = {
  getToken: () => null,
  onUnauthorized: () => undefined,
}

let unauthorizedHandled = false

export function configureHttpAuth(binding: HttpAuthBinding): void {
  authBinding = binding
}

function handleUnauthorized(): void {
  if (unauthorizedHandled) return
  unauthorizedHandled = true
  window.setTimeout(() => {
    unauthorizedHandled = false
  }, 1000)
  authBinding.onUnauthorized()
}

function buildUrl(path: string, query?: QueryParams): string {
  const url = new URL(`${env.apiBaseUrl}${path}`, window.location.origin)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

async function parseBody(response: Response): Promise<ApiResponse<unknown> | null> {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as ApiResponse<unknown>
  } catch {
    return null
  }
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const timeoutMs = options.timeoutMs ?? (method === 'GET' ? 10_000 : 20_000)
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)

  const externalSignal = options.signal
  const abortFromExternal = () => controller.abort()
  externalSignal?.addEventListener('abort', abortFromExternal, { once: true })

  const headers: Record<string, string> = { Accept: 'application/json', ...options.headers }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = authBinding.getToken()
  if (token) headers[env.authHeader] = token
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method,
      headers,
      signal: controller.signal,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })

    const payload = await parseBody(response)

    if (response.status === 401) {
      handleUnauthorized()
      throw new AppError({
        kind: 'unauthorized',
        message: '登录状态已失效，请重新登录',
        httpStatus: 401,
      })
    }

    if (!response.ok) {
      throw fromHttpStatus(response.status, payload?.message)
    }

    if (payload && typeof payload.code === 'number' && payload.code !== 0) {
      throw fromBusinessCode(payload.code, payload.message)
    }

    return (payload?.data ?? undefined) as T
  } catch (error) {
    if (error instanceof AppError) throw error
    if (controller.signal.aborted) {
      if (externalSignal?.aborted) {
        throw new AppError({ kind: 'network', message: '请求已取消' })
      }
      throw new AppError({ kind: 'timeout', message: '请求超时，请稍后重试' })
    }
    throw new AppError({ kind: 'network', message: '网络不可用，请检查网络后重试' })
  } finally {
    window.clearTimeout(timer)
    externalSignal?.removeEventListener('abort', abortFromExternal)
  }
}

type ReadOptions = Omit<RequestOptions, 'method' | 'body'>

export const http = {
  get: <T>(path: string, options?: ReadOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ReadOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: ReadOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: ReadOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: ReadOptions): Promise<T> =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
