import { ReloadOutlined } from '@ant-design/icons'
import { Button, Input, Space } from 'antd'
import type { ReactNode } from 'react'

export interface ListToolbarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (value: string) => void
  onRefresh: () => void
  refreshing?: boolean
  placeholder?: string
  /** 搜索框左侧的额外筛选项（如角色下拉） */
  children?: ReactNode
}

/** 列表页工具栏：筛选项 + 关键字搜索 + 刷新（BTD §10 列表页通用结构） */
export function ListToolbar({
  value,
  onChange,
  onSearch,
  onRefresh,
  refreshing,
  placeholder = '搜索关键字',
  children,
}: ListToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <Space size={12} wrap>
        {children}
        <Input.Search
          allowClear
          className="w-[300px]"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onSearch={onSearch}
          enterButton
        />
      </Space>
      <Button icon={<ReloadOutlined />} loading={refreshing} onClick={onRefresh}>
        刷新
      </Button>
    </div>
  )
}
