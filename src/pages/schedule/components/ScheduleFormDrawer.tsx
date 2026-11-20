import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  App,
  Button,
  DatePicker,
  Drawer,
  InputNumber,
  Radio,
  Select,
  Space,
  TimePicker,
} from 'antd'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { errorMessage } from '@/api/errors'
import type { Schedule } from '@/api/schedule'
import { FormField } from '@/components'
import { dayjs, today } from '@/utils/datetime'
import { useCreateSchedule, useResourceSelectOptions, useUpdateSchedule } from '../hooks'
import { scheduleSchema } from '../schema'
import type { ScheduleForm } from '../schema'

export interface ScheduleFormDrawerProps {
  open: boolean
  /** null 表示新增 */
  record: Schedule | null
  onClose: () => void
}

const EMPTY_FORM: ScheduleForm = {
  resourceId: '',
  scheduleDate: today(),
  startTime: '09:00',
  endTime: '12:00',
  capacity: 1,
  slotMinutes: 60,
  status: 1,
}

function toTimeValue(value: string) {
  return value ? dayjs(`2000-01-01 ${value}`) : null
}

export function ScheduleFormDrawer({ open, record, onClose }: ScheduleFormDrawerProps) {
  const { message } = App.useApp()
  const isEdit = record !== null
  const createMutation = useCreateSchedule()
  const updateMutation = useUpdateSchedule()
  const { options: resourceOptions, loading: resourcesLoading } = useResourceSelectOptions(!isEdit)

  /** 已有预约占用时，后端只允许改容量与状态 */
  const timeLocked = isEdit && record.usedCount > 0

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(
      record
        ? {
            resourceId: record.resourceId,
            scheduleDate: record.scheduleDate,
            startTime: record.startTime,
            endTime: record.endTime,
            capacity: record.capacity,
            slotMinutes: record.slotMinutes,
            status: record.status === 1 ? 1 : 0,
          }
        : EMPTY_FORM,
    )
  }, [open, record, reset])

  const submitting = createMutation.isPending || updateMutation.isPending

  const submit = handleSubmit((values) => {
    const onError = (error: unknown) => message.error(errorMessage(error))

    if (record) {
      updateMutation.mutate(
        {
          id: record.id,
          payload: {
            scheduleDate: values.scheduleDate,
            startTime: values.startTime,
            endTime: values.endTime,
            capacity: values.capacity,
            slotMinutes: values.slotMinutes,
            status: values.status,
          },
        },
        {
          onSuccess: (saved) => {
            message.success(`排班已更新，当前共 ${saved.slotCount} 个时段`)
            onClose()
          },
          onError,
        },
      )
      return
    }

    createMutation.mutate(
      {
        resourceId: values.resourceId,
        scheduleDate: values.scheduleDate,
        startTime: values.startTime,
        endTime: values.endTime,
        capacity: values.capacity,
        slotMinutes: values.slotMinutes,
        status: values.status,
      },
      {
        onSuccess: (saved) => {
          message.success(`排班已创建，共生成 ${saved.slotCount} 个时段`)
          onClose()
        },
        onError,
      },
    )
  })

  return (
    <Drawer
      title={isEdit ? '编辑排班' : '新增排班'}
      width={520}
      open={open}
      onClose={onClose}
      destroyOnHidden
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={onClose} disabled={submitting}>
              取消
            </Button>
            <Button type="primary" loading={submitting} onClick={submit}>
              保存
            </Button>
          </Space>
        </div>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        {timeLocked ? (
          <Alert
            type="warning"
            showIcon
            message="该窗口已有预约占用"
            description="仅可修改容量与状态；如需暂停售卖，请将状态改为无效，或到「时段」中锁定单个时段。"
          />
        ) : null}

        <FormField
          label="资源"
          required
          error={errors.resourceId?.message}
          extra={isEdit ? '排班创建后不能更换资源' : '仅可选择启用中的技师或床位'}
        >
          <Controller
            control={control}
            name="resourceId"
            render={({ field, fieldState }) => (
              <Select
                value={field.value || undefined}
                onChange={(value: string) => field.onChange(value)}
                onBlur={field.onBlur}
                showSearch
                optionFilterProp="label"
                placeholder="请选择资源"
                disabled={isEdit}
                loading={resourcesLoading}
                options={resourceOptions}
                notFoundContent="暂无可用于排班的资源"
                status={fieldState.error ? 'error' : undefined}
                style={{ width: '100%' }}
              />
            )}
          />
        </FormField>

        <FormField
          label="排班日期"
          required
          error={errors.scheduleDate?.message}
          extra="不能早于今天"
        >
          <Controller
            control={control}
            name="scheduleDate"
            render={({ field, fieldState }) => (
              <DatePicker
                value={field.value ? dayjs(field.value) : null}
                onChange={(value) => field.onChange(value ? value.format('YYYY-MM-DD') : '')}
                disabled={timeLocked}
                allowClear={false}
                disabledDate={(current) => current.isBefore(dayjs().startOf('day'))}
                status={fieldState.error ? 'error' : undefined}
                style={{ width: '100%' }}
              />
            )}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="开始时间" required error={errors.startTime?.message}>
            <Controller
              control={control}
              name="startTime"
              render={({ field, fieldState }) => (
                <TimePicker
                  value={toTimeValue(field.value)}
                  onChange={(value) => field.onChange(value ? value.format('HH:mm') : '')}
                  format="HH:mm"
                  minuteStep={5}
                  disabled={timeLocked}
                  allowClear={false}
                  status={fieldState.error ? 'error' : undefined}
                  style={{ width: '100%' }}
                />
              )}
            />
          </FormField>

          <FormField label="结束时间" required error={errors.endTime?.message}>
            <Controller
              control={control}
              name="endTime"
              render={({ field, fieldState }) => (
                <TimePicker
                  value={toTimeValue(field.value)}
                  onChange={(value) => field.onChange(value ? value.format('HH:mm') : '')}
                  format="HH:mm"
                  minuteStep={5}
                  disabled={timeLocked}
                  allowClear={false}
                  status={fieldState.error ? 'error' : undefined}
                  style={{ width: '100%' }}
                />
              )}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="容量" required error={errors.capacity?.message}>
            <Controller
              control={control}
              name="capacity"
              render={({ field, fieldState }) => (
                <InputNumber
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? Number.NaN)}
                  min={1}
                  precision={0}
                  addonAfter="单"
                  className="w-full"
                  status={fieldState.error ? 'error' : undefined}
                />
              )}
            />
          </FormField>

          <FormField
            label="拆分步长"
            required
            error={errors.slotMinutes?.message}
            extra="窗口按此步长拆分时段"
          >
            <Controller
              control={control}
              name="slotMinutes"
              render={({ field, fieldState }) => (
                <InputNumber
                  value={field.value}
                  onChange={(value) => field.onChange(value ?? Number.NaN)}
                  min={5}
                  max={480}
                  step={5}
                  precision={0}
                  disabled={timeLocked}
                  addonAfter="分钟"
                  className="w-full"
                  status={fieldState.error ? 'error' : undefined}
                />
              )}
            />
          </FormField>
        </div>

        <FormField
          label="状态"
          required
          error={errors.status?.message}
          extra="无效状态会锁定窗口内所有时段，可随时重新启用"
        >
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Radio.Group
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                options={[
                  { label: '有效', value: 1 },
                  { label: '无效', value: 0 },
                ]}
              />
            )}
          />
        </FormField>
      </form>
    </Drawer>
  )
}
