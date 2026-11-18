import { useMutation } from '@tanstack/react-query'
import { queryKeys } from '@/api/queryClient'
import { createUser, deleteUser, fetchUserPage, resetUserPassword, updateUser } from '@/api/user'
import type { SysUser, UserCreatePayload, UserUpdatePayload } from '@/api/user'
import { useInvalidate } from '@/hooks/useInvalidate'
import { useListPage } from '@/hooks/useListPage'

/** 用户分页列表：支持关键字 + 角色筛选，参数全部同步到 URL */
export function useUserListPage() {
  return useListPage<SysUser>({
    extraKeys: ['role'],
    key: (params) =>
      queryKeys.users({
        page: params.page,
        size: params.size,
        keyword: params.keyword,
        role: params.filters.role ?? '',
      }),
    query: (params) =>
      fetchUserPage({
        page: params.page,
        size: params.size,
        keyword: params.keyword || undefined,
        role: params.filters.role || undefined,
      }),
  })
}

export function useCreateUser() {
  const invalidate = useInvalidate('users')
  return useMutation({
    mutationFn: (payload: UserCreatePayload) => createUser(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateUser() {
  const invalidate = useInvalidate('users')
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserUpdatePayload }) =>
      updateUser(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteUser() {
  const invalidate = useInvalidate('users')
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: invalidate,
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resetUserPassword(id, newPassword),
  })
}
