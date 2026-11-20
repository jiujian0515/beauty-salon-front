import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryClient'
import {
  createResource,
  deleteResource,
  fetchResourcePage,
  fetchStaffCandidates,
  toResourceType,
  updateResource,
} from '@/api/resource'
import type { Resource, ResourceCreatePayload, ResourceUpdatePayload } from '@/api/resource'
import { useInvalidate } from '@/hooks/useInvalidate'
import { useListPage } from '@/hooks/useListPage'

/** 资源分页列表：type 由 Tab 控制（缺省为技师），支持关键字与启停筛选，参数同步到 URL */
export function useResourceListPage() {
  return useListPage<Resource>({
    extraKeys: ['type', 'status'],
    key: (params) =>
      queryKeys.resources({
        page: params.page,
        size: params.size,
        keyword: params.keyword,
        type: toResourceType(params.filters.type),
        status: params.filters.status ?? '',
      }),
    query: (params) =>
      fetchResourcePage({
        page: params.page,
        size: params.size,
        keyword: params.keyword || undefined,
        type: toResourceType(params.filters.type),
        status: params.filters.status ? Number(params.filters.status) : undefined,
      }),
  })
}

/** 技师候选用户：抽屉打开且类型为技师时才请求，编辑时带上资源 id 保留已绑定用户 */
export function useStaffCandidates(resourceId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.resourceStaffCandidates(resourceId),
    queryFn: () => fetchStaffCandidates(resourceId ?? undefined),
    enabled,
    staleTime: 30_000,
  })
}

export function useCreateResource() {
  const invalidate = useInvalidate('resources')
  return useMutation({
    mutationFn: (payload: ResourceCreatePayload) => createResource(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateResource() {
  const invalidate = useInvalidate('resources')
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ResourceUpdatePayload }) =>
      updateResource(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteResource() {
  const invalidate = useInvalidate('resources')
  return useMutation({
    mutationFn: (id: string) => deleteResource(id),
    onSuccess: invalidate,
  })
}
