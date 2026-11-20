import { useMutation, useQueryClient } from '@tanstack/react-query'
import { lockSlot, unlockSlot } from '@/api/schedule'
import type { ScheduleSlot } from '@/api/schedule'
import type { PageResult } from '@/types/api'

type SlotPage = PageResult<ScheduleSlot>

/**
 * 时段锁定/释放：对 `['slots', ...]` 分页数据做乐观更新，失败回滚；
 * 成功后同时失效排班与日历汇总，保证列表与余量统计一致。
 */
function useSlotStatusMutation(targetStatus: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => (targetStatus === 1 ? unlockSlot(id) : lockSlot(id)),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ['slots'] })
      const snapshots = queryClient.getQueriesData<SlotPage>({ queryKey: ['slots'] })
      queryClient.setQueriesData<SlotPage>({ queryKey: ['slots'] }, (old) =>
        old
          ? {
              ...old,
              records: old.records.map((slot) =>
                slot.id === id ? { ...slot, status: targetStatus } : slot,
              ),
            }
          : old,
      )
      return { snapshots }
    },
    onError: (_error, _id, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data))
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['slots'] })
      void queryClient.invalidateQueries({ queryKey: ['schedules'] })
      void queryClient.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}

export function useLockSlot() {
  return useSlotStatusMutation(0)
}

export function useUnlockSlot() {
  return useSlotStatusMutation(1)
}
