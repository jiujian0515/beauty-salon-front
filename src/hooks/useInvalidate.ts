import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

/**
 * 按资源根 key 失效查询（BTD §6.4）：`useInvalidate('users')` 会失效所有 `['users', ...]`。
 */
export function useInvalidate(rootKey: string) {
  const queryClient = useQueryClient()
  return useCallback(
    () => queryClient.invalidateQueries({ queryKey: [rootKey] }),
    [queryClient, rootKey],
  )
}
