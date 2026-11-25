import { http } from './http'
import type { BackendPageResult, PageResult } from '@/types/api'
import type { ReservationStatus, ResourceType } from '@/types/domain'

/** 后端 ReservationAdminResponse（Long 已序列化为字符串） */
interface ReservationAdminDto {
  reservationId: string
  reservationNo: string
  verifyCode: string | null
  status: string
  isCourse: boolean | null
  depositCents: string
  appointmentTime: string
  customerId: string | null
  customerNickname: string | null
  customerPhone: string | null
  serviceItemId: string | null
  serviceItemName: string | null
  serviceItemDurationMinutes: number | null
  serviceItemCategory: string | null
  serviceItemPriceCents: string | null
  resourceId: string | null
  resourceName: string | null
  resourceType: string | null
  paidAt: string | null
  cancelledAt: string | null
  verifiedAt: string | null
  verifiedBy: string | null
  createdAt: string
}

/** 页面消费的预约单视图模型（金额已归一为整数分） */
export interface ReservationAdmin {
  id: string
  reservationNo: string
  /** 核销码，仅 CONFIRMED / COMPLETED 时由后端下发 */
  verifyCode: string
  status: ReservationStatus
  isCourse: boolean
  depositCents: number
  appointmentTime: string
  customerNickname: string
  customerPhone: string
  serviceItemName: string
  serviceItemDurationMinutes: number | null
  serviceItemCategory: string
  serviceItemPriceCents: number | null
  resourceName: string
  resourceType: ResourceType | null
  paidAt: string
  cancelledAt: string
  verifiedAt: string
  createdAt: string
}

export interface ReservationPageQuery {
  page: number
  size: number
  status?: string
  verifyCode?: string
  keyword?: string
  startDate?: string
  endDate?: string
}

export interface ReservationVerifyResult {
  reservationId: string
  reservationNo: string
  verifyCode: string
  status: ReservationStatus
  customerNickname: string
  customerPhone: string
  appointmentTime: string
  serviceItemName: string
  resourceName: string
  verifiedAt: string
}

function toNumber(value: string | null): number | null {
  return value === null || value === '' ? null : Number(value)
}

function toReservationAdmin(dto: ReservationAdminDto): ReservationAdmin {
  return {
    id: dto.reservationId,
    reservationNo: dto.reservationNo,
    verifyCode: dto.verifyCode ?? '',
    status: dto.status as ReservationStatus,
    isCourse: dto.isCourse ?? false,
    depositCents: Number(dto.depositCents),
    appointmentTime: dto.appointmentTime,
    customerNickname: dto.customerNickname ?? '',
    customerPhone: dto.customerPhone ?? '',
    serviceItemName: dto.serviceItemName ?? '',
    serviceItemDurationMinutes: dto.serviceItemDurationMinutes,
    serviceItemCategory: dto.serviceItemCategory ?? '',
    serviceItemPriceCents: toNumber(dto.serviceItemPriceCents),
    resourceName: dto.resourceName ?? '',
    resourceType: (dto.resourceType as ResourceType | null) ?? null,
    paidAt: dto.paidAt ?? '',
    cancelledAt: dto.cancelledAt ?? '',
    verifiedAt: dto.verifiedAt ?? '',
    createdAt: dto.createdAt,
  }
}

export async function fetchReservationPage(
  query: ReservationPageQuery,
): Promise<PageResult<ReservationAdmin>> {
  const dto = await http.get<BackendPageResult<ReservationAdminDto>>('/admin/reservations', {
    query: {
      page: query.page,
      size: query.size,
      status: query.status,
      verifyCode: query.verifyCode,
      keyword: query.keyword,
      startDate: query.startDate,
      endDate: query.endDate,
    },
  })
  return {
    records: dto.records.map(toReservationAdmin),
    total: Number(dto.total),
    page: Number(dto.page),
    size: Number(dto.size),
  }
}

export async function fetchReservationDetail(id: string): Promise<ReservationAdmin> {
  return toReservationAdmin(await http.get<ReservationAdminDto>(`/admin/reservations/${id}`))
}

export async function verifyReservation(verifyCode: string): Promise<ReservationVerifyResult> {
  const dto = await http.post<ReservationVerifyResult>('/admin/reservations/verify', {
    verifyCode,
  })
  return { ...dto, status: dto.status as ReservationStatus }
}
