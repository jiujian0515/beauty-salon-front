import { useMemo } from 'react'
import type { CalendarDay } from '@/api/calendar'
import { QueryBoundary } from '@/components'
import { dayjs, now } from '@/utils/datetime'

export interface WeekViewProps {
  weekStart: string
  days: CalendarDay[]
  loading: boolean
  error?: unknown
  selectedDate: string
  onRetry: () => void
  onSelectDay: (date: string) => void
}

function DayCard({
  date,
  data,
  selected,
  isToday,
  onClick,
}: {
  date: string
  data?: CalendarDay
  selected: boolean
  isToday: boolean
  onClick: () => void
}) {
  const border = selected
    ? 'border-brand-400 ring-1 ring-brand-300'
    : isToday
      ? 'border-brand-300'
      : 'border-slate-200'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[132px] rounded-lg border bg-white p-3 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40 ${border}`}
    >
      <div className="flex items-baseline justify-between">
        <span className={`text-sm font-medium ${isToday ? 'text-brand-600' : 'text-slate-700'}`}>
          {dayjs(date).format('MM-DD')}
        </span>
        <span className="text-xs text-slate-400">{dayjs(date).format('ddd')}</span>
      </div>

      {data && data.scheduleCount > 0 ? (
        <>
          <div className="mt-2 text-xs text-slate-500">
            {data.scheduleCount} 条排班 · {data.slotCount} 个时段
          </div>
          <div className="mt-1 text-sm">
            <span className="font-medium text-emerald-600">可售 {data.availableCount}</span>
            <span className="text-slate-400"> / {data.totalCapacity}</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            已用 {data.usedCount}
            {data.lockedCount > 0 ? ` · 锁定 ${data.lockedCount}` : ''}
          </div>
        </>
      ) : (
        <div className="mt-4 text-xs text-slate-400">无排班</div>
      )}
    </button>
  )
}

export function WeekView({
  weekStart,
  days,
  loading,
  error,
  selectedDate,
  onRetry,
  onSelectDay,
}: WeekViewProps) {
  const dates = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        dayjs(weekStart).add(index, 'day').format('YYYY-MM-DD'),
      ),
    [weekStart],
  )
  const todayText = now().format('YYYY-MM-DD')

  return (
    <QueryBoundary loading={loading} error={error} onRetry={onRetry}>
      <div className="grid grid-cols-7 gap-3">
        {dates.map((date) => (
          <DayCard
            key={date}
            date={date}
            data={days.find((day) => day.date === date)}
            selected={date === selectedDate}
            isToday={date === todayText}
            onClick={() => onSelectDay(date)}
          />
        ))}
      </div>
    </QueryBoundary>
  )
}
