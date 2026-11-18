import { http } from './http'
import type { BackendPageResult, PageResult } from '@/types/api'

/** 后端 UserResponse（Long 已序列化为字符串） */
interface UserDto {
  id: string
  phone: string
  nickname: string | null
  role: string
  status: number
  merchantId: string | null
  createdAt: string
}

export interface SysUser {
  id: string
  phone: string
  nickname: string
  /** 角色代码，对应角色字典的 code（ADMIN / STAFF / CUSTOMER / 自定义） */
  role: string
  /** 1 启用 / 0 停用 */
  status: number
  /** 顾客为 null（全局共享），管理员/员工为当前商户 */
  merchantId: string | null
  createdAt: string
}

export interface UserPageQuery {
  page: number
  size: number
  keyword?: string
  role?: string
}

export interface UserCreatePayload {
  phone: string
  password: string
  nickname: string
  role: string
  status?: number
}

export type UserUpdatePayload = Partial<
  Pick<UserCreatePayload, 'phone' | 'nickname' | 'role' | 'status'>
>

function toSysUser(dto: UserDto): SysUser {
  return {
    id: dto.id,
    phone: dto.phone,
    nickname: dto.nickname ?? '',
    role: dto.role,
    status: dto.status,
    merchantId: dto.merchantId ?? null,
    createdAt: dto.createdAt,
  }
}

export async function fetchUserPage(query: UserPageQuery): Promise<PageResult<SysUser>> {
  const dto = await http.get<BackendPageResult<UserDto>>('/admin/users', {
    query: {
      page: query.page,
      size: query.size,
      keyword: query.keyword,
      role: query.role,
    },
  })
  return {
    records: dto.records.map(toSysUser),
    total: Number(dto.total),
    page: Number(dto.page),
    size: Number(dto.size),
  }
}

export async function createUser(payload: UserCreatePayload): Promise<SysUser> {
  return toSysUser(await http.post<UserDto>('/admin/users', payload))
}

export async function updateUser(id: string, payload: UserUpdatePayload): Promise<SysUser> {
  return toSysUser(await http.put<UserDto>(`/admin/users/${id}`, payload))
}

export async function deleteUser(id: string): Promise<void> {
  await http.delete<void>(`/admin/users/${id}`)
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await http.put<void>(`/admin/users/${id}/password`, { newPassword })
}
