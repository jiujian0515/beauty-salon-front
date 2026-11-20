import { http } from './http'
import type { BackendPageResult, PageResult } from '@/types/api'

/** 用户关联的角色（后端 RoleResponse 的子集） */
export interface UserRole {
  id: string
  name: string
  code: string
}

/** 后端 UserResponse（Long 已序列化为字符串） */
interface UserDto {
  id: string
  phone: string
  nickname: string | null
  roles: UserRole[] | null
  status: number
  merchantId: string | null
  createdAt: string
}

export interface SysUser {
  id: string
  phone: string
  nickname: string
  /** 角色列表：用户与角色多对多（后端 user_role 关联表） */
  roles: UserRole[]
  /** 1 启用 / 0 停用 */
  status: number
  /** 后台账号必绑商户；顾客已独立成 customer 表 */
  merchantId: string | null
  createdAt: string
}

export interface UserPageQuery {
  page: number
  size: number
  keyword?: string
  /** 按角色代码筛选 */
  role?: string
}

export interface UserCreatePayload {
  phone: string
  password: string
  nickname: string
  /** 角色 id 列表：用户与角色多对多，至少选择一个 */
  roleIds: string[]
  status?: number
}

export type UserUpdatePayload = Partial<
  Pick<UserCreatePayload, 'phone' | 'nickname' | 'roleIds' | 'status'>
>

function toSysUser(dto: UserDto): SysUser {
  return {
    id: dto.id,
    phone: dto.phone,
    nickname: dto.nickname ?? '',
    roles: (dto.roles ?? []).map((role) => ({
      id: role.id,
      name: role.name,
      code: role.code,
    })),
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
