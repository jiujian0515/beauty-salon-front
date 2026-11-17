import {
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ReloadOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  App,
  Avatar,
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import { useMemo, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { logout } from '@/api/auth'
import { env, isProduction } from '@/config/env'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { ROUTE_META } from '@/router/routes'
import { useSessionStore } from '@/stores/session'
import { hasAnyRole } from '@/utils/permission'

const { Content, Header, Sider } = Layout

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const online = useOnlineStatus()
  const user = useSessionStore((state) => state.user)
  const clearSession = useSessionStore((state) => state.clear)

  const menuItems = useMemo(
    () =>
      ROUTE_META.filter((item) => hasAnyRole(user?.role, item.roles)).map((item) => ({
        key: item.path,
        icon: item.icon,
        label: item.label,
      })),
    [user?.role],
  )

  const activeItem = ROUTE_META.find((item) => location.pathname.startsWith(item.path))

  const handleLogout = async () => {
    try {
      await logout()
    } catch {
      // 登出接口失败不阻断本地清理
    }
    clearSession()
    queryClient.clear()
    navigate('/login', { replace: true })
  }

  const handleRefresh = () => {
    void queryClient.invalidateQueries()
    message.success('已刷新数据')
  }

  return (
    <Layout className="min-h-screen">
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={232}
        collapsedWidth={64}
        theme="dark"
      >
        <div className="flex h-14 items-center justify-center text-white">
          <Typography.Text strong style={{ color: '#fff' }}>
            {collapsed ? '美' : '美容院商户后台'}
          </Typography.Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={activeItem ? [activeItem.path] : []}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          className="flex items-center justify-between px-4"
          style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}
        >
          <Space size={12}>
            <Button
              type="text"
              aria-label={collapsed ? '展开导航' : '收起导航'}
              onClick={() => setCollapsed((prev) => !prev)}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            />
            <Typography.Text strong>{activeItem?.label ?? '商户后台'}</Typography.Text>
            {!isProduction ? <Tag color="orange">{env.appEnv.toUpperCase()}</Tag> : null}
          </Space>
          <Space size={8}>
            <Tooltip title="刷新当前页面数据">
              <Button
                type="text"
                aria-label="刷新数据"
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              />
            </Tooltip>
            <Typography.Text type="secondary" className="text-xs">
              v{env.appVersion}
            </Typography.Text>
            <Dropdown
              menu={{
                items: [
                  { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true },
                ],
                onClick: () => {
                  void handleLogout()
                },
              }}
            >
              <Space className="cursor-pointer">
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user?.name ?? '未登录'}</span>
                <Tag>{user?.role === 'ADMIN' ? '管理员' : '员工'}</Tag>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content className="p-6">
          {!online ? (
            <Alert
              className="mb-4"
              type="warning"
              showIcon
              message="网络已断开，恢复后将自动重试"
            />
          ) : null}
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
