import { zodResolver } from '@hookform/resolvers/zod'
import {
  App,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  InputNumber,
  Radio,
  Select,
  Space,
  TimePicker,
} from 'antd'
import { useEffect } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { errorMessage } from '@/api/errors'
import { FormField } from '@/components'
import { dayjs, today } from '@/utils/datetime'
import { useBatchCreateSchedules, useResourceSelectOptions } from '../hooks'
import { batchScheduleSchema, WEEKDAY_OPTIONS } from '../schema'
import type { BatchScheduleForm } from '../schema'

export interface BatchScheduleDrawerProps {
  open: boolean
  onClose: () => void
}

function defaultForm(): BatchScheduleForm {
  return {
    resourceId: '',
    startDate: today(),
    endDate: dayjs(today()).add(6, 'day').format('YYYY-MM-DD'),
    weekdays: [],
    startTime: '09:00',
    endTime: '12:00',
    capacity: 1,
    slotMinutes: 60,
    status: 1,
  }
}

function toTimeValue(value: string) {
  return value ? dayjs(`2000-01-01 ${value}`) : null
}

export function BatchScheduleDrawer({ open, onClose }: BatchScheduleDrawerProps) {
  const { message, notification } = App.useApp()
  const batchMutation = useBatchCreateSchedules()
  const { options: resourceOptions, loading: resourcesLoading } = useResourceSelectOptions(true)

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<BatchScheduleForm>({
    resolver: zodResolver(batchScheduleSchema),
    defaultValues: defaultForm(),
  })

  const startDate = useWatch({ control, name: 'startDate' })
  const endDate = useWatch({ control, name: 'endDate' })

  useEffect(() => {
    if (open) reset(defaultForm())
  }, [open, reset])

  const submit = handleSubmit((values) => {
    batchMutation.mutate(
      {
        resourceId: values.resourceId,
        startDate: values.startDate,
        endDate: values.endDate,
        weekdays: values.weekdays,
        startTime: values.startTime,
        endTime: values.endTime,
        capacity: values.capacity,
        slotMinutes: values.slotMinutes,
        status: values.status,
      },
      {
        onSuccess: (result) => {
          const hasSkipped = result.skippedCount > 0
          const skippedText = result.skipped
            .slice(0, 5)
            .map((item) => `${item.date}：${item.reason}`)
            .join('；')
          notification[hasSkipped ? 'warning' : 'success']({
            message: `批量排班完成：成功 ${result.createdCount} 天，跳过 ${result.skippedCount} 天`,
            description: hasSkipped
              ? `${skippedText}${result.skipped.length > 5 ? ' …' : ''}`
              : undefined,
          })
          onClose()
        },
        onError: (error) => message.error(errorMessage(error)),
      },
    )
  })

  return (
    <Drawer
      title="批量排班"
      width={560}
      open={open}
      onClose={onClose}
      destroyOnHidden
      footer={
        <div className="flex justify-end">
          <Space>
            <Button onClick={onClose} disabled={batchMutation.isPending}>
              取消
            </Button>
            <Button type="primary" loading={batchMutation.isPending} onClick={submit}>
              生成排班
            </Button>
          </Space>
        </div>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={submit}>
        <FormField label="资源" required error={errors.resourceId?.message}>
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
          label="日期范围"
          required
          error={errors.startDate?.message ?? errors.endDate?.message}
          extra="一次最多 90 天，日期不能早于今天"
        >
          <DatePicker.RangePicker
            value={startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : null}
            onChange={(values) => {
              setValue('startDate', values?.[0]?.format('YYYY-MM-DD') ?? '', {
                shouldValidate: true,
              })
              setValue('endDate', values?.[1]?.format('YYYY-MM-DD') ?? '', { shouldValidate: true })
            }}
            allowClear={false}
            disabledDate={(current) => current.isBefore(dayjs().startOf('day'))}
            style={{ width: '100%' }}
          />
        </FormField>

        <FormField
          label="重复星期"
          error={errors.weekdays?.message}
          extra="不选表示范围内每天都生成；已有排班的日期会被跳过"
        >
          <Controller
            control={control}
            name="weekdays"
            render={({ field }) => (
              <Checkbox.Group
                value={field.value}
                onChange={(values) => field.onChange(values as number[])}
                options={WEEKDAY_OPTIONS}
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
          extra="无效状态会锁定生成的所有时段"
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
