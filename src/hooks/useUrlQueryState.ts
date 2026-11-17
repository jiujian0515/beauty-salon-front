import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

/**
 * 把列表筛选写进 URL（BTD §4.4）：刷新、分享、返回时视图保持一致。
 */
export function useUrlQueryState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (next: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams()
  const raw = searchParams.get(key)
  const value = (raw ?? defaultValue) as T

  const setValue = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev)
          params.set(key, next)
          return params
        },
        { replace: true },
      )
    },
    [key, setSearchParams],
  )

  return [value, setValue]
}
