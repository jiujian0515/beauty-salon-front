import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryClient'
import { fetchReservationDetail, fetchReservationPage, verifyReservation } from '@/api/reservation'
import type { ReservationAdmin } from '@/api/reservation'
import { useInvalidate } from '@/hooks/useInvalidate'
import { useListPage } from '@/hooks/useListPage'
import { isReservationStatus } from '@/types/domain'

/** 预约单分页列表：状态 / 日期范围 / 关键字筛选，参数全部同步到 URL */
export function useReservationListPage() {
  return useListPage<ReservationAdmin>({
    extraKeys: ['status', 'startDate', 'endDate'],
    key: (params) =>
      queryKeys.reservations({
        page: params.page,
        size: params.size,
        keyword: params.keyword,
        status: params.filters.status ?? '',
        startDate: params.filters.startDate ?? '',
        endDate: params.filters.endDate ?? '',
      }),
    query: (params) =>
      fetchReservationPage({
        page: params.page,
        size: params.size,
        status: isReservationStatus(params.filters.status) ? params.filters.status : undefined,
        keyword: params.keyword || undefined,
        startDate: params.filters.startDate || undefined,
        endDate: params.filters.endDate || undefined,
      }),
  })
}

export function useReservationDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.reservationDetail(id ?? ''),
    queryFn: () => fetchReservationDetail(id ?? ''),
    enabled: Boolean(id),
  })
}

export function useVerifyReservation() {
  const invalidate = useInvalidate('reservations')
  return useMutation({
    mutationFn: (verifyCode: string) => verifyReservation(verifyCode),
    onSuccess: invalidate,
  })
}
