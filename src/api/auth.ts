/*
 * @Author: liukui
 * @Date: 2026-11-18 03:51:28
 * @LastEditors: liukui
 * @LastEditTime: 2026-11-18 05:09:09
 * @Description:
 */
import { http } from './http'
import { AppError } from './errors'
import type { Role } from '@/constants/permissions'
import type { SessionUser } from '@/stores/session'

export interface LoginPayload {
  phone: string
  password: string
}

/**
 * 登录只负责换取凭证；用户信息（昵称、角色、商户）统一由 fetchMe 拉取，
 * 保证「用户信息只有一个来源」（见后端 AuthServiceImpl.login）。
 */
export interface LoginResult {
  token: string
}

/** GET /api/v1/auth/me 的返回体（后端 UserInfoResponse，Long 已序列化为字符串） */
interface UserInfoDto {
  userId: string
  merchantId: string | null
  phone: string
  nickname: string | null
  role: string
  status: number
}

export function login(payload: LoginPayload): Promise<LoginResult> {
  return http.post<LoginResult>('/auth/login', payload)
}

/**
 * 后端角色为字符串（CUSTOMER/STAFF/ADMIN），商户后台只接受 STAFF 与 ADMIN。
 * 顾客账号或未知角色一律拒绝，避免按错误角色渲染菜单与按钮。
 */
function toMerchantRole(rawRole: string): Role {
  if (rawRole === 'ADMIN') return 'ADMIN'
  if (rawRole === 'STAFF') return 'STAFF'
  throw new AppError({
    kind: 'forbidden',
    message: '该账号没有商户后台访问权限，请联系商户管理员',
  })
}

export async function fetchMe(): Promise<SessionUser> {
  const dto = await http.get<UserInfoDto>('/auth/me')
  return {
    id: dto.userId,
    name: dto.nickname || dto.phone,
    role: toMerchantRole(dto.role),
    merchantId: dto.merchantId ?? null,
    phone: dto.phone,
  }
}

export function logout(): Promise<void> {
  return http.post<void>('/auth/logout')
}
