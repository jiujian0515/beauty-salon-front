import { useQuery } from '@tanstack/react-query'
import { fetchCalendar } from '@/api/calendar'
import type { CalendarQuery } from '@/api/calendar'
import { queryKeys } from '@/api/queryClient'
import { fetchSlotPage } from '@/api/schedule'
import { CALENDAR_POLL_MS } from '@/constants/constants'

/** 日历汇总：默认 30 秒轮询，页面隐藏时暂停（`refetchIntervalInBackground: false`） */
export function useCalendarQuery(query: CalendarQuery) {
  return useQuery({
    queryKey: queryKeys.calendar({
      startDate: query.startDate ?? '',
      endDate: query.endDate ?? '',
      resourceId: query.resourceId ?? '',
    }),
    queryFn: () => fetchCalendar(query),
    refetchInterval: CALENDAR_POLL_MS,
    refetchIntervalInBackground: false,
  })
}

/** 日视图：一次取回当天全部时段（分页接口，size 取足够大以覆盖单日窗口） */
export function useDaySlotsQuery(date: string, resourceId: string, enabled: boolean) {
  const page = 1
  const size = 1000

  return useQuery({
    queryKey: queryKeys.slots({
      page,
      size,
      startDate: date,
      endDate: date,
      resourceId: resourceId || '',
    }),
    queryFn: () =>
      fetchSlotPage({
        page,
        size,
        startDate: date,
        endDate: date,
        resourceId: resourceId || undefined,
      }),
    enabled,
    refetchInterval: CALENDAR_POLL_MS,
    refetchIntervalInBackground: false,
  })
}
