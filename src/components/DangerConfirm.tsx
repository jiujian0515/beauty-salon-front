import { Modal } from 'antd'
import type { ReactNode } from 'react'

export interface DangerConfirmProps {
  open: boolean
  title: string
  description?: ReactNode
  okText?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** 危险操作二次确认：必须说明影响面（BTD §12.3） */
export function DangerConfirm({
  open,
  title,
  description,
  okText = '确认',
  danger = true,
  loading,
  onConfirm,
  onCancel,
}: DangerConfirmProps) {
  return (
    <Modal
      open={open}
      title={title}
      okText={okText}
      cancelText="取消"
      okButtonProps={{ danger, loading }}
      onOk={onConfirm}
      onCancel={onCancel}
    >
      {description}
    </Modal>
  )
}
