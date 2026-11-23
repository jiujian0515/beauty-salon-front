import { http } from './http'
import type { BackendPageResult, PageResult } from '@/types/api'
import type { ServiceCategory } from '@/types/domain'

/** 后端 ServiceItemResponse（Long 已序列化为字符串） */
interface ServiceItemDto {
  id: string
  merchantId: string
  name: string
  /** 服务分类 code，可为空（历史数据） */
  category: string | null
  description: string | null
  durationMinutes: number
  priceCents: string
  depositCents: string
  status: number
  createdAt: string
  updatedAt: string
}

/** 页面消费的服务项目视图模型（金额已归一为整数分） */
export interface ServiceItem {
  id: string
  name: string
  /** 服务分类 code，空串表示未分类 */
  category: string
  description: string
  durationMinutes: number
  priceCents: number
  depositCents: number
  /** 1 上架 / 0 下架 */
  status: number
  createdAt: string
  updatedAt: string
}

export interface ServiceItemPageQuery {
  page: number
  size: number
  keyword?: string
  status?: number
  /** 按分类 code 精确筛选 */
  category?: ServiceCategory
}

export interface ServiceItemCreatePayload {
  name: string
  category: ServiceCategory
  description: string
  durationMinutes: number
  priceCents: number
  depositCents: number
  status?: number
}

/** 编辑为局部更新：只传需要修改的字段，未传的保持原值 */
export type ServiceItemUpdatePayload = Partial<ServiceItemCreatePayload>

function toServiceItem(dto: ServiceItemDto): ServiceItem {
  return {
    id: dto.id,
    name: dto.name,
    category: dto.category ?? '',
    description: dto.description ?? '',
    durationMinutes: dto.durationMinutes,
    priceCents: Number(dto.priceCents),
    depositCents: Number(dto.depositCents),
    status: dto.status,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export async function fetchServiceItemPage(
  query: ServiceItemPageQuery,
): Promise<PageResult<ServiceItem>> {
  const dto = await http.get<BackendPageResult<ServiceItemDto>>('/admin/service-items', {
    query: {
      page: query.page,
      size: query.size,
      keyword: query.keyword,
      status: query.status,
      category: query.category,
    },
  })
  return {
    records: dto.records.map(toServiceItem),
    total: Number(dto.total),
    page: Number(dto.page),
    size: Number(dto.size),
  }
}

export async function createServiceItem(payload: ServiceItemCreatePayload): Promise<ServiceItem> {
  return toServiceItem(await http.post<ServiceItemDto>('/admin/service-items', payload))
}

export async function updateServiceItem(
  id: string,
  payload: ServiceItemUpdatePayload,
): Promise<ServiceItem> {
  return toServiceItem(await http.put<ServiceItemDto>(`/admin/service-items/${id}`, payload))
}

export async function deleteServiceItem(id: string): Promise<void> {
  await http.delete<void>(`/admin/service-items/${id}`)
}
