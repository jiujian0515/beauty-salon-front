import { http } from './http'
import type { BackendPageResult, PageResult } from '@/types/api'
import type { ResourceType } from '@/types/domain'

/** 后端 ScheduleResponse（Long 已序列化为字符串，时间已格式化为 HH:mm） */
export interface ScheduleDto {
  id: string
  merchantId: string
  resourceId: string
  resourceName: string | null
  resourceType: ResourceType | null
  scheduleDate: string
  startTime: string
  endTime: string
  capacity: number
  slotMinutes: number
  status: number
  slotCount: number
  totalCapacity: number
  usedCount: number
  availableCount: number
  lockedCount: number
  createdAt: string
  updatedAt: string
}

export interface Schedule {
  id: string
  merchantId: string
  resourceId: string
  resourceName: string
  /** 资源被删除时为 null */
  resourceType: ResourceType | null
  /** yyyy-MM-dd */
  scheduleDate: string
  /** HH:mm */
  startTime: string
  /** HH:mm */
  endTime: string
  capacity: number
  /** 库存拆分步长（分钟） */
  slotMinutes: number
  /** 1 有效 / 0 无效 */
  status: number
  slotCount: number
  totalCapacity: number
  usedCount: number
  availableCount: number
  lockedCount: number
  createdAt: string
  updatedAt: string
}

export interface SlotPageQuery {
  page: number
  size: number
  resourceId?: string
  startDate?: string
  endDate?: string
  status?: number
}

interface SlotInventoryDto {
  id: string
  merchantId: string
  resourceId: string
  resourceName: string | null
  slotDate: string
  startTime: string
  endTime: string
  total: number
  used: number
  available: number
  version: number
  status: number
  createdAt: string
}

export interface ScheduleSlot {
  id: string
  resourceId: string
  resourceName: string
  slotDate: string
  startTime: string
  endTime: string
  total: number
  used: number
  available: number
  version: number
  /** 1 可售 / 0 锁定 */
  status: number
  createdAt: string
}

export interface SchedulePageQuery {
  page: number
  size: number
  resourceId?: string
  startDate?: string
  endDate?: string
  status?: number
}

export interface ScheduleCreatePayload {
  resourceId: string
  scheduleDate: string
  startTime: string
  endTime: string
  capacity?: number
  slotMinutes?: number
  status?: number
}

/** 编辑为局部更新；资源不可更换 */
export type ScheduleUpdatePayload = Partial<Omit<ScheduleCreatePayload, 'resourceId'>>

export interface ScheduleBatchCreatePayload {
  resourceId: string
  startDate: string
  endDate: string
  /** 1=周一 ... 7=周日；为空表示每天 */
  weekdays?: number[]
  startTime: string
  endTime: string
  capacity?: number
  slotMinutes?: number
  status?: number
}

export interface ScheduleBatchSkippedItem {
  date: string
  reason: string
}

export interface ScheduleBatchResult {
  createdCount: number
  skippedCount: number
  skipped: ScheduleBatchSkippedItem[]
}

export interface ScheduleBatchDeleteResult {
  deletedCount: number
  skippedCount: number
  skipped: Array<{ id: string; reason: string }>
}

export function toSchedule(dto: ScheduleDto): Schedule {
  return {
    id: dto.id,
    merchantId: dto.merchantId,
    resourceId: dto.resourceId,
    resourceName: dto.resourceName ?? '',
    resourceType: dto.resourceType,
    scheduleDate: dto.scheduleDate,
    startTime: dto.startTime,
    endTime: dto.endTime,
    capacity: dto.capacity,
    slotMinutes: dto.slotMinutes,
    status: dto.status,
    slotCount: dto.slotCount,
    totalCapacity: dto.totalCapacity,
    usedCount: dto.usedCount,
    availableCount: dto.availableCount,
    lockedCount: dto.lockedCount,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  }
}

export function toSlot(dto: SlotInventoryDto): ScheduleSlot {
  return {
    id: dto.id,
    resourceId: dto.resourceId,
    resourceName: dto.resourceName ?? '',
    slotDate: dto.slotDate,
    startTime: dto.startTime,
    endTime: dto.endTime,
    total: dto.total,
    used: dto.used,
    available: dto.available,
    version: dto.version,
    status: dto.status,
    createdAt: dto.createdAt,
  }
}

export async function fetchSchedulePage(query: SchedulePageQuery): Promise<PageResult<Schedule>> {
  const dto = await http.get<BackendPageResult<ScheduleDto>>('/admin/schedules', {
    query: {
      page: query.page,
      size: query.size,
      resourceId: query.resourceId,
      startDate: query.startDate,
      endDate: query.endDate,
      status: query.status,
    },
  })
  return {
    records: dto.records.map(toSchedule),
    total: Number(dto.total),
    page: Number(dto.page),
    size: Number(dto.size),
  }
}

export async function createSchedule(payload: ScheduleCreatePayload): Promise<Schedule> {
  return toSchedule(await http.post<ScheduleDto>('/admin/schedules', payload))
}

export async function batchCreateSchedules(
  payload: ScheduleBatchCreatePayload,
): Promise<ScheduleBatchResult> {
  const dto = await http.post<{
    createdCount: number
    skippedCount: number
    skipped: Array<{ date: string; reason: string }>
  }>('/admin/schedules/batch', payload)
  return {
    createdCount: dto.createdCount,
    skippedCount: dto.skippedCount,
    skipped: dto.skipped ?? [],
  }
}

export async function updateSchedule(
  id: string,
  payload: ScheduleUpdatePayload,
): Promise<Schedule> {
  return toSchedule(await http.put<ScheduleDto>(`/admin/schedules/${id}`, payload))
}

export async function deleteSchedule(id: string): Promise<void> {
  await http.delete<void>(`/admin/schedules/${id}`)
}

/** 批量删除：有占用或预约历史的排班会被跳过并返回原因 */
export async function batchDeleteSchedules(ids: string[]): Promise<ScheduleBatchDeleteResult> {
  const dto = await http.post<{
    deletedCount: number
    skippedCount: number
    skipped: Array<{ id: string; reason: string }>
  }>('/admin/schedules/batch-delete', { ids })
  return {
    deletedCount: dto.deletedCount,
    skippedCount: dto.skippedCount,
    skipped: dto.skipped ?? [],
  }
}

export async function fetchScheduleSlots(id: string): Promise<ScheduleSlot[]> {
  const records = await http.get<SlotInventoryDto[]>(`/admin/schedules/${id}/slots`)
  return records.map(toSlot)
}

/** 时段库存分页（日历日视图一次取回当天全部时段） */
export async function fetchSlotPage(query: SlotPageQuery): Promise<PageResult<ScheduleSlot>> {
  const dto = await http.get<BackendPageResult<SlotInventoryDto>>('/admin/slots', {
    query: {
      page: query.page,
      size: query.size,
      resourceId: query.resourceId,
      startDate: query.startDate,
      endDate: query.endDate,
      status: query.status,
    },
  })
  return {
    records: dto.records.map(toSlot),
    total: Number(dto.total),
    page: Number(dto.page),
    size: Number(dto.size),
  }
}

export async function lockSlot(id: string): Promise<ScheduleSlot> {
  return toSlot(await http.post<SlotInventoryDto>(`/admin/slots/${id}/lock`))
}

export async function unlockSlot(id: string): Promise<ScheduleSlot> {
  return toSlot(await http.post<SlotInventoryDto>(`/admin/slots/${id}/unlock`))
}
