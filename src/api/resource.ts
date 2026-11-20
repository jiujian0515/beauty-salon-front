import { http } from './http'
import type { BackendPageResult, PageResult } from '@/types/api'
import { RESOURCE_TYPE } from '@/types/domain'
import type { ResourceType } from '@/types/domain'

/** 后端 ResourceResponse（Long 已序列化为字符串） */
interface ResourceDto {
  id: string
  merchantId: string
  type: ResourceType
  userId: string | null
  userName: string | null
  userPhone: string | null
  name: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface Resource {
  id: string
  merchantId: string
  type: ResourceType
  /** 仅 STAFF 有值 */
  userId: string | null
  userName: string
  userPhone: string
  name: string
  /** 1 启用 / 0 停用 */
  status: number
  createdAt: string
  updatedAt: string
}

/** 技师候选用户（后端已排除管理员、已停用与已绑定其他资源的用户） */
export interface StaffCandidate {
  id: string
  nickname: string
  phone: string
}

export interface ResourcePageQuery {
  page: number
  size: number
  keyword?: string
  type?: ResourceType
  status?: number
}

export interface ResourceCreatePayload {
  type: ResourceType
  /** STAFF 可不传，后端默认取绑定用户昵称 */
  name?: string
  /** 仅 STAFF 传 */
  userId?: string
  status?: number
}

/** 编辑为局部更新：未传的字段保持原值（类型创建后不可修改） */
export type ResourceUpdatePayload = Partial<ResourceCreatePayload>

/** URL 中的 type 参数归一：仅 ROOM 视为床位，其余回落到技师 */
export function toResourceType(value: string | undefined | null): ResourceType {
  return value === RESOURCE_TYPE.ROOM ? RESOURCE_TYPE.ROOM : RESOURCE_TYPE.STAFF
}

function toResource(dto: ResourceDto): Resource {
  return {
    id: dto.id,
    merchantId: dto.merchantId,
    type: dto.type,
    userId: dto.userId,
    userName: dto.userName ?? '',
    userPhone: dto.userPhone ?? '',
    name: dto.name,
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export async function fetchResourcePage(query: ResourcePageQuery): Promise<PageResult<Resource>> {
  const dto = await http.get<BackendPageResult<ResourceDto>>('/admin/resources', {
    query: {
      page: query.page,
      size: query.size,
      keyword: query.keyword,
      type: query.type,
      status: query.status,
    },
  })
  return {
    records: dto.records.map(toResource),
    total: Number(dto.total),
    page: Number(dto.page),
    size: Number(dto.size),
  }
}

export async function fetchStaffCandidates(resourceId?: string): Promise<StaffCandidate[]> {
  const records = await http.get<
    Array<{ id: string; nickname: string | null; phone: string | null }>
  >('/admin/resources/staff-candidates', {
    query: { resourceId },
  })
  return records.map((item) => ({
    id: item.id,
    nickname: item.nickname ?? '',
    phone: item.phone ?? '',
  }))
}

export async function createResource(payload: ResourceCreatePayload): Promise<Resource> {
  return toResource(await http.post<ResourceDto>('/admin/resources', payload))
}

export async function updateResource(
  id: string,
  payload: ResourceUpdatePayload,
): Promise<Resource> {
  return toResource(await http.put<ResourceDto>(`/admin/resources/${id}`, payload))
}

export async function deleteResource(id: string): Promise<void> {
  await http.delete<void>(`/admin/resources/${id}`)
}
