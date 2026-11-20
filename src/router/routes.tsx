import {
  AppstoreOutlined,
  AuditOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  ScissorOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

export interface RouteMeta {
  path: string
  label: string
  icon: ReactNode
}

/** 导航与路由共用的元信息：菜单直接由本表派生 */
export const ROUTE_META: readonly RouteMeta[] = [
  { path: '/calendar', label: '日历', icon: <CalendarOutlined /> },
  { path: '/dashboard', label: '今日概览', icon: <DashboardOutlined /> },
  { path: '/reservations', label: '预约单', icon: <UnorderedListOutlined /> },
  { path: '/schedules', label: '排班', icon: <ScheduleOutlined /> },
  { path: '/services', label: '服务项目', icon: <ScissorOutlined /> },
  { path: '/resources', label: '资源', icon: <AppstoreOutlined /> },
  { path: '/deposits', label: '定金流水', icon: <DollarOutlined /> },
  { path: '/users', label: '用户', icon: <UserOutlined /> },
  { path: '/customers', label: '顾客', icon: <TeamOutlined /> },
  { path: '/roles', label: '角色', icon: <SafetyCertificateOutlined /> },
  { path: '/audit-logs', label: '审计日志', icon: <AuditOutlined /> },
]
