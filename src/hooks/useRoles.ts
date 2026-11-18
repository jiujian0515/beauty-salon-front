import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryClient'
import { fetchRoles } from '@/api/role'

/** 角色字典：低频变更，5 分钟内复用缓存；用户管理页的角色下拉也复用它 */
export function useRolesQuery() {
  return useQuery({
    queryKey: queryKeys.roles(),
    queryFn: fetchRoles,
    staleTime: 5 * 60_000,
  })
}
