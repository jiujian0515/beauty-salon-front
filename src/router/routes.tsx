import {
  AppstoreOutlined,
  AuditOutlined,
  CalendarOutlined,
  DashboardOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  ScissorOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import type { Role } from '@/constants/permissions'

export interface RouteMeta {
  path: string
  label: string
  icon: ReactNode
  roles: readonly Role[]
}

/** 导航与路由共用的元信息：菜单由「本表 ∩ 当前角色」派生（BTD §11.2） */
export const ROUTE_META: readonly RouteMeta[] = [
  { path: '/calendar', label: '日历', icon: <CalendarOutlined />, roles: ['STAFF', 'ADMIN'] },
  { path: '/dashboard', label: '今日概览', icon: <DashboardOutlined />, roles: ['STAFF', 'ADMIN'] },
  {
    path: '/reservations',
    label: '预约单',
    icon: <UnorderedListOutlined />,
    roles: ['STAFF', 'ADMIN'],
  },
  { path: '/schedules', label: '排班', icon: <ScheduleOutlined />, roles: ['STAFF', 'ADMIN'] },
  { path: '/services', label: '服务项目', icon: <ScissorOutlined />, roles: ['STAFF', 'ADMIN'] },
  { path: '/resources', label: '资源', icon: <AppstoreOutlined />, roles: ['STAFF', 'ADMIN'] },
  { path: '/deposits', label: '定金流水', icon: <DollarOutlined />, roles: ['STAFF', 'ADMIN'] },
  { path: '/users', label: '用户', icon: <UserOutlined />, roles: ['ADMIN'] },
  { path: '/roles', label: '角色', icon: <SafetyCertificateOutlined />, roles: ['ADMIN'] },
  { path: '/audit-logs', label: '审计日志', icon: <AuditOutlined />, roles: ['ADMIN'] },
]
