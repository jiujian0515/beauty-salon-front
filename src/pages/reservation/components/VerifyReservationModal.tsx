import { App, Input, Modal } from 'antd'
import { useEffect, useState } from 'react'
import { errorMessage } from '@/api/errors'
import type { ReservationVerifyResult } from '@/api/reservation'
import { useVerifyReservation } from '../hooks'

export interface VerifyReservationModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: (result: ReservationVerifyResult) => void
}

/** 核销弹窗：按 6 位核销码核销，仅 CONFIRMED → COMPLETED */
export function VerifyReservationModal({ open, onClose, onSuccess }: VerifyReservationModalProps) {
  const { message } = App.useApp()
  const verifyMutation = useVerifyReservation()
  const [code, setCode] = useState('')

  useEffect(() => {
    if (!open) setCode('')
  }, [open])

  const submit = () => {
    if (!/^\d{6}$/.test(code)) {
      message.warning('请输入 6 位数字核销码')
      return
    }
    verifyMutation.mutate(code, {
      onSuccess: (result) => {
        message.success(`「${result.reservationNo}」核销成功`)
        onSuccess?.(result)
        onClose()
      },
      onError: (error) => message.error(errorMessage(error)),
    })
  }

  return (
    <Modal
      title="核销预约"
      open={open}
      onCancel={onClose}
      onOk={submit}
      okText="确认核销"
      cancelText="取消"
      confirmLoading={verifyMutation.isPending}
      destroyOnHidden
    >
      <p className="mb-3 text-sm text-slate-500">
        请顾客出示预约核销码；核销后预约状态变为「已完成」，不可撤销。
      </p>
      <Input
        autoFocus
        size="large"
        maxLength={6}
        placeholder="请输入 6 位核销码"
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
        onPressEnter={submit}
      />
    </Modal>
  )
}
