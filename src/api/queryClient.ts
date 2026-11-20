import { QueryClient } from '@tanstack/react-query'
import { isAppError } from './errors'
import type { ErrorKind } from './errors'

const NON_RETRYABLE: ReadonlySet<ErrorKind> = new Set<ErrorKind>([
  'unauthorized',
  'forbidden',
  'notFound',
  'validation',
  'conflict',
  'business',
])

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        if (isAppError(error) && NON_RETRYABLE.has(error.kind)) return false
        return failureCount < 1
      },
    },
    mutations: {
      retry: false,
    },
  },
})

type Params = Record<string, unknown>

/** Query Key 工厂（BTD §6.2），参数对象的键顺序由调用方保持一致 */
export const queryKeys = {
  session: ['session', 'me'] as const,
  dashboardToday: (date: string) => ['dashboard', 'today', date] as const,
  calendar: (params: Params) => ['calendar', params] as const,
  slots: (params: Params) => ['slots', params] as const,
  services: (params: Params) => ['services', params] as const,
  serviceDetail: (id: string) => ['services', 'detail', id] as const,
  resources: (params: Params) => ['resources', params] as const,
  resourceStaffCandidates: (resourceId: string | null) =>
    ['resources', 'staff-candidates', resourceId ?? 'create'] as const,
  schedules: (params: Params) => ['schedules', params] as const,
  reservations: (params: Params) => ['reservations', params] as const,
  reservationDetail: (id: string) => ['reservations', 'detail', id] as const,
  deposits: (params: Params) => ['deposits', params] as const,
  users: (params: Params) => ['users', params] as const,
  customers: (params: Params) => ['customers', params] as const,
  roles: () => ['roles'] as const,
  auditLogs: (params: Params) => ['audit', params] as const,
}
