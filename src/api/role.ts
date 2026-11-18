import { http } from './http'

/** 后端 RoleResponse（Long 已序列化为字符串） */
interface RoleDto {
  id: string
  name: string
  code: string
  createdAt: string
}

export interface Role {
  id: string
  name: string
  code: string
  createdAt: string
}

export interface RoleCreatePayload {
  name: string
  code: string
}

export type RoleUpdatePayload = Partial<RoleCreatePayload>

function toRole(dto: RoleDto): Role {
  return { id: dto.id, name: dto.name, code: dto.code, createdAt: dto.createdAt }
}

/** 角色为全局字典，后端一次性返回全部（不分页） */
export async function fetchRoles(): Promise<Role[]> {
  const dto = await http.get<RoleDto[]>('/admin/roles')
  return dto.map(toRole)
}

export async function createRole(payload: RoleCreatePayload): Promise<Role> {
  return toRole(await http.post<RoleDto>('/admin/roles', payload))
}

export async function updateRole(id: string, payload: RoleUpdatePayload): Promise<Role> {
  return toRole(await http.put<RoleDto>(`/admin/roles/${id}`, payload))
}

export async function deleteRole(id: string): Promise<void> {
  await http.delete<void>(`/admin/roles/${id}`)
}
