import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { PageResult } from '@/types/api'
import type { ListParams } from './useListParams'

export interface PaginatedQueryOptions<T> {
  /** query key 工厂，通常来自 `queryKeys`（BTD §6.2） */
  key: (params: ListParams) => readonly unknown[]
  /** 实际请求；参数已包含分页、关键字与筛选项 */
  query: (params: ListParams) => Promise<PageResult<T>>
}

/**
 * 通用分页查询：翻页时保留上一页数据（keepPreviousData），避免整表闪白（BTD §12.1）。
 */
export function usePaginatedQuery<T>(params: ListParams, options: PaginatedQueryOptions<T>) {
  return useQuery({
    queryKey: options.key(params),
    queryFn: () => options.query(params),
    placeholderData: keepPreviousData,
  })
}
