import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryClient'
import { fetchResourcePage } from '@/api/resource'
import type { Resource } from '@/api/resource'
import { RESOURCE_TYPE_META } from '@/constants/status'

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
