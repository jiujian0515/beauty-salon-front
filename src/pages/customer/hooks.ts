import { useMutation } from '@tanstack/react-query'
import {
  createCustomer,
  deleteCustomer,
  fetchCustomerPage,
  resetCustomerPassword,
  updateCustomer,
} from '@/api/customer'
import type { Customer, CustomerCreatePayload, CustomerUpdatePayload } from '@/api/customer'
import { queryKeys } from '@/api/queryClient'
import { useInvalidate } from '@/hooks/useInvalidate'
import { useListPage } from '@/hooks/useListPage'

/** 顾客分页列表：关键字匹配姓名或手机号，参数同步到 URL */
export function useCustomerListPage() {
  return useListPage<Customer>({
    key: (params) =>
      queryKeys.customers({
        page: params.page,
        size: params.size,
        keyword: params.keyword,
      }),
    query: (params) =>
      fetchCustomerPage({
        page: params.page,
        size: params.size,
        keyword: params.keyword || undefined,
      }),
  })
}

export function useCreateCustomer() {
  const invalidate = useInvalidate('customers')
  return useMutation({
    mutationFn: (payload: CustomerCreatePayload) => createCustomer(payload),
    onSuccess: invalidate,
  })
}

export function useUpdateCustomer() {
  const invalidate = useInvalidate('customers')
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerUpdatePayload }) =>
      updateCustomer(id, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteCustomer() {
  const invalidate = useInvalidate('customers')
  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: invalidate,
  })
}

export function useResetCustomerPassword() {
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      resetCustomerPassword(id, newPassword),
  })
}
