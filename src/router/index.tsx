import type { ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/layouts/AppLayout'
import { BlankLayout } from '@/layouts/BlankLayout'
import { Forbidden } from '@/pages/error/Forbidden'
import { NotFound } from '@/pages/error/NotFound'
import { RouteError } from '@/pages/error/RouteError'
import { RequireAuth, RequireRole } from './guards'

interface PageModule {
  default: ComponentType
}

/** 路由级懒加载：页面以 default 导出，运行时映射为路由 Component（BTD §4.4） */
const page = (loader: () => Promise<PageModule>) => async () => ({
  Component: (await loader()).default,
})

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <BlankLayout />,
    errorElement: <RouteError />,
    children: [{ index: true, lazy: page(() => import('@/pages/login')) }],
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Navigate to="/calendar" replace /> },
      { path: 'calendar', lazy: page(() => import('@/pages/calendar')) },
      { path: 'dashboard', lazy: page(() => import('@/pages/dashboard')) },
      { path: 'reservations', lazy: page(() => import('@/pages/reservation')) },
      { path: 'reservations/:id', lazy: page(() => import('@/pages/reservation/detail')) },
      { path: 'schedules', lazy: page(() => import('@/pages/schedule')) },
      { path: 'services', lazy: page(() => import('@/pages/service')) },
      { path: 'resources', lazy: page(() => import('@/pages/resource')) },
      { path: 'deposits', lazy: page(() => import('@/pages/deposit')) },
      {
        element: <RequireRole roles={['ADMIN']} />,
        children: [
          { path: 'users', lazy: page(() => import('@/pages/user')) },
          { path: 'roles', lazy: page(() => import('@/pages/role')) },
          { path: 'audit-logs', lazy: page(() => import('@/pages/audit')) },
        ],
      },
    ],
  },
  { path: '/403', element: <Forbidden /> },
  { path: '*', element: <NotFound /> },
])
