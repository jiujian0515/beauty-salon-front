import { useMemo } from 'react'
import type { CalendarDay } from '@/api/calendar'
import type { ScheduleSlot } from '@/api/schedule'
import { QueryBoundary } from '@/components'
import { dayjs, now } from '@/utils/datetime'

export interface DayViewProps {
  date: string
  summary?: CalendarDay
  slots: ScheduleSlot[]
  loading: boolean
  error?: unknown
  onRetry: () => void
  onSelectSlot: (slot: ScheduleSlot) => void
}

const LANE_WIDTH = 180
const TIME_COLUMN_WIDTH = 64
/** 1 分钟 = 1px，60 分钟窗口约一行文字高度 */
const PX_PER_MINUTE = 1

function minutesOf(time: string): number {
  const [hour = '0', minute = '0'] = time.split(':')
  return Number(hour) * 60 + Number(minute)
}

function slotClassName(slot: ScheduleSlot, isPast: boolean): string {
  const base =
    'absolute inset-x-1 overflow-hidden rounded-md border px-1.5 py-1 text-left text-xs transition-colors'
  if (slot.status === 0) {
    return `${base} border-slate-300 bg-slate-100 text-slate-500 hover:bg-slate-200`
  }
  if (isPast) {
    return `${base} border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100`
  }
  if (slot.used >= slot.total) {
    return `${base} border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100`
  }
  return `${base} border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`
}

interface Lane {
  resourceId: string
  resourceName: string
  slots: ScheduleSlot[]
}

export function DayView({
  date,
  summary,
  slots,
  loading,
  error,
  onRetry,
  onSelectSlot,
}: DayViewProps) {
  const { axisStart, axisEnd, hourMarks, lanes } = useMemo(() => {
    const startMinutes = slots.map((slot) => minutesOf(slot.startTime))
    const endMinutes = slots.map((slot) => minutesOf(slot.endTime))
    const start = startMinutes.length ? Math.floor(Math.min(...startMinutes) / 60) * 60 : 8 * 60
    const end = endMinutes.length ? Math.ceil(Math.max(...endMinutes) / 60) * 60 : 22 * 60

    const marks: number[] = []
    for (let minute = start; minute <= end; minute += 60) marks.push(minute)

    const laneMap = new Map<string, Lane>()
    for (const slot of slots) {
      const lane = laneMap.get(slot.resourceId)
      if (lane) {
        lane.slots.push(slot)
      } else {
        laneMap.set(slot.resourceId, {
          resourceId: slot.resourceId,
          resourceName: slot.resourceName,
          slots: [slot],
        })
      }
    }
    const laneList = [...laneMap.values()]
      .map((lane) => ({
        ...lane,
        slots: lane.slots.slice().sort((a, b) => minutesOf(a.startTime) - minutesOf(b.startTime)),
      }))
      .sort((a, b) => a.resourceName.localeCompare(b.resourceName, 'zh-CN'))

    return { axisStart: start, axisEnd: end, hourMarks: marks, lanes: laneList }
  }, [slots])

  const axisHeight = (axisEnd - axisStart) * PX_PER_MINUTE
  const isToday = date === now().format('YYYY-MM-DD')
  const nowMinutes = isToday ? now().hour() * 60 + now().minute() : null
  const nowTop =
    nowMinutes !== null && nowMinutes >= axisStart && nowMinutes <= axisEnd
      ? (nowMinutes - axisStart) * PX_PER_MINUTE
      : null

  const legend = (
    <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded-sm border border-emerald-300 bg-emerald-50" />
        可售
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded-sm border border-rose-300 bg-rose-50" />
        已约满
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded-sm border border-slate-300 bg-slate-100" />
        已锁定
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block h-3 w-3 rounded-sm border border-slate-200 bg-slate-50" />
        已结束
      </span>
    </div>
  )

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-4 text-sm text-slate-600">
        <span>
          排班 <span className="font-medium text-slate-900">{summary?.scheduleCount ?? 0}</span> 条
        </span>
        <span>
          时段 <span className="font-medium text-slate-900">{summary?.slotCount ?? 0}</span> 个
        </span>
        <span>
          可售 <span className="font-medium text-emerald-600">{summary?.availableCount ?? 0}</span>{' '}
          / {summary?.totalCapacity ?? 0}
        </span>
        <span>已用 {summary?.usedCount ?? 0}</span>
        {summary && summary.lockedCount > 0 ? <span>锁定 {summary.lockedCount}</span> : null}
      </div>

      {legend}

      <QueryBoundary
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={slots.length === 0}
        emptyText="当天暂无排班，请先到「排班管理」生成时段"
      >
        <div className="overflow-x-auto">
          <div style={{ minWidth: TIME_COLUMN_WIDTH + lanes.length * LANE_WIDTH }}>
            <div className="flex border-b border-slate-200">
              <div
                className="shrink-0 py-2 text-xs text-slate-400"
                style={{ width: TIME_COLUMN_WIDTH }}
              >
                时间
              </div>
              {lanes.map((lane) => (
                <div
                  key={lane.resourceId}
                  className="shrink-0 truncate border-l border-slate-200 px-2 py-2 text-sm font-medium text-slate-700"
                  style={{ width: LANE_WIDTH }}
                  title={lane.resourceName}
                >
                  {lane.resourceName || '—'}
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    {lane.slots.length} 段
                  </span>
                </div>
              ))}
            </div>

            <div className="flex">
              <div
                className="relative shrink-0"
                style={{ width: TIME_COLUMN_WIDTH, height: axisHeight }}
              >
                {hourMarks.map((minute) => (
                  <div
                    key={minute}
                    className="absolute right-2 -translate-y-1/2 text-xs text-slate-400"
                    style={{ top: (minute - axisStart) * PX_PER_MINUTE }}
                  >
                    {String(Math.floor(minute / 60)).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {lanes.map((lane) => (
                <div
                  key={lane.resourceId}
                  className="relative shrink-0 border-l border-slate-200"
                  style={{ width: LANE_WIDTH, height: axisHeight }}
                >
                  {hourMarks.map((minute) => (
                    <div
                      key={minute}
                      className="absolute inset-x-0 border-t border-slate-100"
                      style={{ top: (minute - axisStart) * PX_PER_MINUTE }}
                    />
                  ))}

                  {lane.slots.map((slot) => {
                    const start = minutesOf(slot.startTime)
                    const end = minutesOf(slot.endTime)
                    const height = Math.max((end - start) * PX_PER_MINUTE - 2, 12)
                    const isPast = dayjs(`${date} ${slot.endTime}`).isBefore(dayjs())
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => onSelectSlot(slot)}
                        className={slotClassName(slot, isPast)}
                        style={{ top: (start - axisStart) * PX_PER_MINUTE + 1, height }}
                        title={`${slot.startTime}–${slot.endTime} · ${
                          slot.status === 0 ? '已锁定' : `余 ${slot.available}/${slot.total}`
                        }`}
                      >
                        {height >= 40 ? (
                          <>
                            <div className="truncate font-medium">
                              {slot.startTime}–{slot.endTime}
                            </div>
                            <div className="truncate">
                              {slot.status === 0 ? '已锁定' : `余 ${slot.available}/${slot.total}`}
                            </div>
                          </>
                        ) : height >= 20 ? (
                          <div className="truncate">
                            {slot.status === 0 ? '锁定' : `余 ${slot.available}/${slot.total}`}
                          </div>
                        ) : null}
                      </button>
                    )
                  })}

                  {nowTop !== null ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-rose-500"
                      style={{ top: nowTop }}
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </QueryBoundary>
    </div>
  )
}
