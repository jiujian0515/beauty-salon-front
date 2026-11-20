import { http } from './http'
import { toSchedule } from './schedule'
import type { Schedule, ScheduleDto } from './schedule'

/** 后端 CalendarDayResponse（按天汇总 + 当天排班列表） */
interface CalendarDayDto {
  date: string
  scheduleCount: number
  slotCount: number
  totalCapacity: number
  usedCount: number
  availableCount: number
  lockedCount: number
  schedules: ScheduleDto[]
}

export interface CalendarDay {
  /** yyyy-MM-dd */
  date: string
  scheduleCount: number
  slotCount: number
  totalCapacity: number
  usedCount: number
  availableCount: number
  lockedCount: number
  schedules: Schedule[]
}

export interface CalendarQuery {
  startDate?: string
  endDate?: string
  resourceId?: string
}

export async function fetchCalendar(query: CalendarQuery): Promise<CalendarDay[]> {
  const records = await http.get<CalendarDayDto[]>('/admin/calendar', {
    query: {
      startDate: query.startDate,
      endDate: query.endDate,
      resourceId: query.resourceId,
    },
  })
  return records.map((dto) => ({
    date: dto.date,
    scheduleCount: dto.scheduleCount,
    slotCount: dto.slotCount,
    totalCapacity: dto.totalCapacity,
    usedCount: dto.usedCount,
    availableCount: dto.availableCount,
    lockedCount: dto.lockedCount,
    schedules: (dto.schedules ?? []).map(toSchedule),
  }))
}
