import { http } from './http'
import type { SessionUser } from '@/stores/session'

export interface LoginPayload {
  account: string
  password: string
}

export interface LoginResult {
  token: string
  user: SessionUser
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return http.post<LoginResult>('/merchant/auth/login', payload)
}

export function fetchMe(): Promise<SessionUser> {
  return http.get<SessionUser>('/merchant/auth/me')
}

export function logout(): Promise<void> {
  return http.post<void>('/merchant/auth/logout')
}
