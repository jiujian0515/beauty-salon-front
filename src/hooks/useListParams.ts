import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { PAGE_SIZE } from '@/constants/constants'

/** 列表页通用的查询参数：分页 + 关键字 + 额外筛选（如 role），全部与 URL 同步 */
export interface ListParams {
  page: number
  size: number
  keyword: string
  /** 额外筛选条件，值为空表示不筛选 */
  filters: Record<string, string>
}

export interface ListParamsPatch {
  page?: number
  size?: number
  keyword?: string
  /** 与现有筛选合并；传空字符串表示清除该筛选项 */
  filters?: Record<string, string>
}

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

/**
 * 列表页参数与 URL 双向同步（BTD §4.4）：刷新、分享、返回时视图一致。
 *
 * @param extraKeys 除 page/size/keyword 外需要同步到 URL 的筛选项（如 `['role']`）
 */
export function useListParams(
  extraKeys: readonly string[] = [],
): readonly [ListParams, (patch: ListParamsPatch) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  // 调用方通常传字面量数组，用字符串签名避免每次渲染都重建
  const signature = extraKeys.join(',')

  const params = useMemo<ListParams>(() => {
    const keys = signature ? signature.split(',') : []
    const filters: Record<string, string> = {}
    for (const key of keys) {
      const value = searchParams.get(key)
      if (value) filters[key] = value
    }
    return {
      page: toPositiveInt(searchParams.get('page'), 1),
      size: toPositiveInt(searchParams.get('size'), PAGE_SIZE),
      keyword: searchParams.get('keyword') ?? '',
      filters,
    }
  }, [searchParams, signature])

  const patchParams = useCallback(
    (patch: ListParamsPatch) => {
      setSearchParams(
        (prev) => {
          const keys = signature ? signature.split(',') : []
          const next = new URLSearchParams(prev)

          for (const key of keys) {
            const incoming = patch.filters?.[key]
            const value = incoming === undefined ? (prev.get(key) ?? '') : incoming
            if (value) next.set(key, value)
            else next.delete(key)
          }

          const keyword = patch.keyword ?? prev.get('keyword') ?? ''
          if (keyword) next.set('keyword', keyword)
          else next.delete('keyword')

          next.set('page', String(patch.page ?? toPositiveInt(prev.get('page'), 1)))
          next.set('size', String(patch.size ?? toPositiveInt(prev.get('size'), PAGE_SIZE)))
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams, signature],
  )

  return [params, patchParams] as const
}
