import { useMutation } from '@tanstack/react-query'
import { createRole, deleteRole, updateRole } from '@/api/role'
import type { RoleCreatePayload, RoleUpdatePayload } from '@/api/role'
import { useInvalidate } from '@/hooks/useInvalidate'

/** 角色变更后同时失效角色字典与用户列表（用户列表要显示角色名称） */
function useInvalidateRoleRelated() {
  const invalidateRoles = useInvalidate('roles')
  const invalidateUsers = useInvalidate('users')
  return () => {
    void invalidateRoles()
    void invalidateUsers()
  }
}

export function useCreateRole() {
  const invalidate = useInvalidateRoleRelated()
  return useMutation({
    mutationFn: (payload: RoleCreatePayload) => createRole(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateRole() {
  const invalidate = useInvalidateRoleRelated()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RoleUpdatePayload }) =>
      updateRole(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteRole() {
  const invalidate = useInvalidateRoleRelated()
  return useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: invalidate,
  })
}
