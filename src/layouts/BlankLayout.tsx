import type { ReactNode } from 'react'
import { Outlet } from 'react-router'

/** 无外壳布局：登录页等不需要侧边导航的页面使用 */
export function BlankLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-page)] px-4">
      {children ?? <Outlet />}
    </div>
  )
}
