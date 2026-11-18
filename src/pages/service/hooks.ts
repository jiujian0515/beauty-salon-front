import { useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryClient'
import {
  createServiceItem,
  deleteServiceItem,
  fetchServiceItemPage,
  updateServiceItem,
} from '@/api/serviceItem'
import type {
  ServiceItem,
  ServiceItemCreatePayload,
  ServiceItemUpdatePayload,
} from '@/api/serviceItem'
import { useInvalidate } from '@/hooks/useInvalidate'
import { useListPage } from '@/hooks/useListPage'

/** 服务项目分页列表：支持关键字 + 上下架筛选，参数全部同步到 URL */
export function useServiceItemListPage() {
  return useListPage<ServiceItem>({
    extraKeys: ['status'],
    key: (params) =>
      queryKeys.services({
        page: params.page,
        size: params.size,
        keyword: params.keyword,
        status: params.filters.status ?? '',
      }),
    query: (params) =>
      fetchServiceItemPage({
        page: params.page,
        size: params.size,
        keyword: params.keyword || undefined,
        status: params.filters.status ? Number(params.filters.status) : undefined,
      }),
  })
}

export function useCreateServiceItem() {
  const invalidate = useInvalidate('services')
  return useMutation({
    mutationFn: (payload: ServiceItemCreatePayload) => createServiceItem(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateServiceItem() {
  const invalidate = useInvalidate('services')
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ServiceItemUpdatePayload }) =>
      updateServiceItem(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteServiceItem() {
  const invalidate = useInvalidate('services')
  return useMutation({
    mutationFn: (id: string) => deleteServiceItem(id),
    onSuccess: invalidate,
  })
}
