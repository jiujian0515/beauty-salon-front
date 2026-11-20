import { http } from './http'
import type { BackendPageResult, PageResult } from '@/types/api'

/** 后端 CustomerResponse（Long 已序列化为字符串） */
interface CustomerDto {
  id: string
  phone: string
  nickname: string | null
  status: number
  createdAt: string
}

export interface Customer {
  id: string
  phone: string
  nickname: string
  /** 1 启用 / 0 禁用 */
  status: number
  createdAt: string
}

export interface CustomerPageQuery {
  page: number
  size: number
  keyword?: string
}

export interface CustomerCreatePayload {
  phone: string
  password: string
  nickname: string
  status?: number
}

export type CustomerUpdatePayload = Partial<
  Pick<CustomerCreatePayload, 'phone' | 'nickname' | 'status'>
>

function toCustomer(dto: CustomerDto): Customer {
  return {
    id: dto.id,
    phone: dto.phone,
    nickname: dto.nickname ?? '',
    status: dto.status,
    createdAt: dto.createdAt,
  }
}

export async function fetchCustomerPage(query: CustomerPageQuery): Promise<PageResult<Customer>> {
  const dto = await http.get<BackendPageResult<CustomerDto>>('/admin/customers', {
    query: {
      page: query.page,
      size: query.size,
      keyword: query.keyword,
    },
  })
  return {
    records: dto.records.map(toCustomer),
    total: Number(dto.total),
    page: Number(dto.page),
    size: Number(dto.size),
  }
}

export async function createCustomer(payload: CustomerCreatePayload): Promise<Customer> {
  return toCustomer(await http.post<CustomerDto>('/admin/customers', payload))
}

export async function updateCustomer(
  id: string,
  payload: CustomerUpdatePayload,
): Promise<Customer> {
  return toCustomer(await http.put<CustomerDto>(`/admin/customers/${id}`, payload))
}

export async function deleteCustomer(id: string): Promise<void> {
  await http.delete<void>(`/admin/customers/${id}`)
}

export async function resetCustomerPassword(id: string, newPassword: string): Promise<void> {
  await http.put<void>(`/admin/customers/${id}/password`, { newPassword })
}
