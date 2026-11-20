import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Card, DatePicker, Segmented, Select, Space } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { PageHeader } from '@/components'
import { useResourceSelectOptions } from '@/hooks/useResourceOptions'
import { dayjs, formatDate, today } from '@/utils/datetime'
import { DayView } from './components/DayView'
import { CalendarSlotDrawer } from './components/SlotDrawer'
import { WeekView } from './components/WeekView'
import { useCalendarQuery, useDaySlotsQuery } from './hooks'

type CalendarView = 'day' | 'week'

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseDate(raw: string | null): string {
  if (raw && DATE_PATTERN.test(raw) && dayjs(raw).isValid()) return raw
  return today()
}

/** 以周一为一周起点 */
function weekStartOf(date: string): string {
  const current = dayjs(date)
  const weekday = current.day() === 0 ? 7 : current.day()
  return current.subtract(weekday - 1, 'day').format('YYYY-MM-DD')
}

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const date = parseDate(searchParams.get('date'))
  const view: CalendarView = searchParams.get('view') === 'week' ? 'week' : 'day'
  const resourceId = searchParams.get('resourceId') ?? ''

  const weekStart = weekStartOf(date)
  const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD')
  const rangeStart = view === 'day' ? date : weekStart
  const rangeEnd = view === 'day' ? date : weekEnd

  const patchQuery = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(updates)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const { options: resourceOptions, loading: resourcesLoading } = useResourceSelectOptions()

  const calendarQuery = useCalendarQuery({
    startDate: rangeStart,
    endDate: rangeEnd,
    resourceId: resourceId || undefined,
  })
  const slotsQuery = useDaySlotsQuery(date, resourceId, view === 'day')

  const slots = useMemo(() => slotsQuery.data?.records ?? [], [slotsQuery.data])
  const daySummary = view === 'day' ? calendarQuery.data?.[0] : undefined

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  useEffect(() => {
    setSelectedSlotId(null)
  }, [date, view, resourceId])

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) ?? null,
    [slots, selectedSlotId],
  )

  /** 时段所属排班无效时，后端不允许释放该时段 */
  const scheduleActive = useMemo(() => {
    if (!selectedSlot) return true
    const schedule = daySummary?.schedules.find(
      (item) =>
        item.resourceId === selectedSlot.resourceId &&
        item.startTime <= selectedSlot.startTime &&
        selectedSlot.startTime < item.endTime,
    )
    return schedule ? schedule.status === 1 : true
  }, [daySummary, selectedSlot])

  const step = view === 'day' ? 1 : 7
  const move = (days: number) =>
    patchQuery({ date: dayjs(date).add(days, 'day').format('YYYY-MM-DD') })

  const dayLoading = slotsQuery.isLoading || calendarQuery.isLoading
  const dayError = slotsQuery.error ?? calendarQuery.error

  return (
    <div>
      <PageHeader
        title="日历与时段库存"
        description="按资源泳道查看当天时段余量，支持锁定/释放；周视图查看每天的排班与可售汇总。"
        extra={
          <Link to="/schedules">
            <Button>排班管理</Button>
          </Link>
        }
      />

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Space size={12} wrap>
            <Segmented
              value={view}
              onChange={(value) => patchQuery({ view: String(value) })}
              options={[
                { label: '日视图', value: 'day' },
                { label: '周视图', value: 'week' },
              ]}
            />
            <Space.Compact>
              <Button icon={<LeftOutlined />} onClick={() => move(-step)} />
              <Button onClick={() => patchQuery({ date: today() })}>今天</Button>
              <Button icon={<RightOutlined />} onClick={() => move(step)} />
            </Space.Compact>
            <DatePicker
              value={dayjs(date)}
              allowClear={false}
              onChange={(value) => value && patchQuery({ date: value.format('YYYY-MM-DD') })}
            />
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              className="w-[220px]"
              placeholder="全部资源"
              loading={resourcesLoading}
              options={resourceOptions}
              value={resourceId || undefined}
              onChange={(value?: string) => patchQuery({ resourceId: value ?? '' })}
            />
          </Space>

          <span className="text-sm text-slate-500">
            {view === 'day'
              ? `${formatDate(date)} ${dayjs(date).format('ddd')}`
              : `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`}
          </span>
        </div>

        {view === 'day' ? (
          <DayView
            date={date}
            summary={daySummary}
            slots={slots}
            loading={dayLoading}
            error={dayError}
            onRetry={() => {
              void slotsQuery.refetch()
              void calendarQuery.refetch()
            }}
            onSelectSlot={(slot) => setSelectedSlotId(slot.id)}
          />
        ) : (
          <WeekView
            weekStart={weekStart}
            days={calendarQuery.data ?? []}
            loading={calendarQuery.isLoading}
            error={calendarQuery.error}
            selectedDate={date}
            onRetry={() => void calendarQuery.refetch()}
            onSelectDay={(value) => patchQuery({ date: value, view: 'day' })}
          />
        )}
      </Card>

      <CalendarSlotDrawer
        open={selectedSlot !== null}
        slot={selectedSlot}
        scheduleActive={scheduleActive}
        onClose={() => setSelectedSlotId(null)}
      />
    </div>
  )
}
