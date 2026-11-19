import type { ReactNode } from 'react'
import { Outlet } from 'react-router'

/** 无外壳布局：登录页等不需要侧边导航的页面使用，页面自行负责整屏排版 */
export function BlankLayout({ children }: { children?: ReactNode }) {
  return <div className="min-h-screen bg-[var(--color-page)]">{children ?? <Outlet />}</div>
}
