import { useCallback, useEffect, useMemo, useState } from 'react'
import { PAGE_SIZE_OPTIONS } from '@/constants/constants'
import { useListParams } from './useListParams'
import type { ListParams, ListParamsPatch } from './useListParams'
import { usePaginatedQuery } from './usePaginatedQuery'
import type { PaginatedQueryOptions } from './usePaginatedQuery'

export interface ListPageOptions<T> extends PaginatedQueryOptions<T> {
  extraKeys?: readonly string[]
}

/**
 * 列表页通用组合 hook：URL 参数 + 分页查询 + 搜索框草稿 + 分页配置 + 删末条回退。
 * 目的是让各业务列表页只写「列定义 + 表单」，不再重复这套胶水代码。
 */
export function useListPage<T>(options: ListPageOptions<T>) {
  const [params, patchParams] = useListParams(options.extraKeys)
  const query = usePaginatedQuery(params, options)

  // 搜索框草稿：回车/点击才提交，避免每次输入都发请求
  const [keywordDraft, setKeywordDraft] = useState(params.keyword)
  useEffect(() => {
    setKeywordDraft(params.keyword)
  }, [params.keyword])

  const search = useCallback(
    (value?: string) => {
      patchParams({ keyword: (value ?? keywordDraft).trim(), page: 1 })
    },
    [patchParams, keywordDraft],
  )

  const setFilter = useCallback(
    (key: string, value: string) => {
      patchParams({ filters: { [key]: value }, page: 1 })
    },
    [patchParams],
  )

  const patch = useCallback((next: ListParamsPatch) => patchParams(next), [patchParams])

  const pagination = useMemo(
    () => ({
      current: params.page,
      pageSize: params.size,
      total: query.data?.total ?? 0,
      showSizeChanger: true,
      pageSizeOptions: PAGE_SIZE_OPTIONS.map(String),
      showTotal: (total: number) => `共 ${total} 条`,
      onChange: (page: number, size: number) => patchParams({ page, size }),
    }),
    [params.page, params.size, query.data?.total, patchParams],
  )

  /** 删除本页最后一条后自动回退一页，避免停在空页 */
  const handleDeleted = useCallback(() => {
    const records = query.data?.records
    if (records && records.length === 1 && params.page > 1) {
      patchParams({ page: params.page - 1 })
      return
    }
    void query.refetch()
  }, [query, params.page, patchParams])

  return {
    ...query,
    params,
    patch,
    keywordDraft,
    setKeywordDraft,
    search,
    setFilter,
    pagination,
    handleDeleted,
  }
}

export type { ListParams, ListParamsPatch }
