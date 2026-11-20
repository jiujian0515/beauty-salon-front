import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryClient'
import { fetchResourcePage } from '@/api/resource'
import type { Resource } from '@/api/resource'
import {
  batchCreateSchedules,
  createSchedule,
  deleteSchedule,
  fetchSchedulePage,
  fetchScheduleSlots,
  lockSlot,
  unlockSlot,
  updateSchedule,
} from '@/api/schedule'
import type {
  ScheduleBatchCreatePayload,
  ScheduleCreatePayload,
  ScheduleUpdatePayload,
} from '@/api/schedule'
import { RESOURCE_TYPE_META } from '@/constants/status'
import { useInvalidate } from '@/hooks/useInvalidate'
import { useListPage } from '@/hooks/useListPage'

/** 排班分页列表：资源、日期区间、状态筛选全部同步到 URL */
export function useScheduleListPage() {
  return useListPage({
    extraKeys: ['resourceId', 'startDate', 'endDate', 'status'],
    key: (params) =>
      queryKeys.schedules({
        page: params.page,
        size: params.size,
        resourceId: params.filters.resourceId ?? '',
        startDate: params.filters.startDate ?? '',
        endDate: params.filters.endDate ?? '',
        status: params.filters.status ?? '',
      }),
    query: (params) =>
      fetchSchedulePage({
        page: params.page,
        size: params.size,
        resourceId: params.filters.resourceId || undefined,
        startDate: params.filters.startDate || undefined,
        endDate: params.filters.endDate || undefined,
        status: params.filters.status ? Number(params.filters.status) : undefined,
      }),
  })
}

/** 资源下拉：一次取前 100 条，资源变更后随 `resources` 根 key 一起失效 */
export function useResourceOptions() {
  return useQuery({
    queryKey: queryKeys.resources({ scope: 'options' }),
    queryFn: async (): Promise<Resource[]> => {
      const page = await fetchResourcePage({ page: 1, size: 100 })
      return page.records
    },
    staleTime: 5 * 60_000,
  })
}

/** 资源下拉选项：`onlyActive` 用于新增排班（后端只允许启用资源） */
export function useResourceSelectOptions(onlyActive = false) {
  const query = useResourceOptions()
  const options = (query.data ?? [])
    .filter((resource) => !onlyActive || resource.status === 1)
    .map((resource) => ({
      value: resource.id,
      label: `${resource.name}（${RESOURCE_TYPE_META[resource.type].label}${
        resource.status === 1 ? '' : '·已停用'
      }）`,
    }))
  return { options, loading: query.isLoading }
}

export function useScheduleSlots(scheduleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.scheduleSlots(scheduleId ?? ''),
    queryFn: () => fetchScheduleSlots(scheduleId ?? ''),
    enabled: enabled && scheduleId !== null,
  })
}

export function useCreateSchedule() {
  const invalidate = useInvalidate('schedules')
  return useMutation({
    mutationFn: (payload: ScheduleCreatePayload) => createSchedule(payload),
    onSuccess: invalidate,
  })
}

export function useBatchCreateSchedules() {
  const invalidate = useInvalidate('schedules')
  return useMutation({
    mutationFn: (payload: ScheduleBatchCreatePayload) => batchCreateSchedules(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateSchedule() {
  const invalidate = useInvalidate('schedules')
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ScheduleUpdatePayload }) =>
      updateSchedule(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteSchedule() {
  const invalidate = useInvalidate('schedules')
  return useMutation({
    mutationFn: (id: string) => deleteSchedule(id),
    onSuccess: invalidate,
  })
}

export function useLockSlot() {
  const invalidate = useInvalidate('schedules')
  return useMutation({
    mutationFn: (id: string) => lockSlot(id),
    onSuccess: invalidate,
  })
}

export function useUnlockSlot() {
  const invalidate = useInvalidate('schedules')
  return useMutation({
    mutationFn: (id: string) => unlockSlot(id),
    onSuccess: invalidate,
  })
}
