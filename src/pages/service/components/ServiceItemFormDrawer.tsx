import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, Drawer, Input, InputNumber, Radio, Select, Space } from 'antd'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { errorMessage } from '@/api/errors'
import type { ServiceItem } from '@/api/serviceItem'
import { FormField } from '@/components'
import { SERVICE_DURATION_STEP } from '@/constants/constants'
import { SERVICE_CATEGORY_OPTIONS } from '@/constants/status'
import { isServiceCategory } from '@/types/domain'
import { fenToYuanInput, parseYuanToFen } from '@/utils/money'
import { useCreateServiceItem, useUpdateServiceItem } from '../hooks'
import { serviceItemSchema } from '../schema'
import type { ServiceItemForm } from '../schema'

export interface ServiceItemFormDrawerProps {
  open: boolean
  /** null 表示新增 */
  record: ServiceItem | null
  onClose: () => void
}

const EMPTY_FORM: ServiceItemForm = {
  name: '',
  category: null,
  description: '',
  durationMinutes: 60,
  price: '0.00',
  deposit: '0.00',
  status: 1,
}

export function ServiceItemFormDrawer({ open, record, onClose }: ServiceItemFormDrawerProps) {
  const { message } = App.useApp()
  const isEdit = record !== null
  const createMutation = useCreateServiceItem()
  const updateMutation = useUpdateServiceItem()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceItemForm>({
    resolver: zodResolver(serviceItemSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!open) return
    reset(
      record
        ? {
            name: record.name,
            category: isServiceCategory(record.category) ? record.category : null,
            description: record.description,
            durationMinutes: record.durationMinutes,
            price: fenToYuanInput(record.priceCents),
            deposit: fenToYuanInput(record.depositCents),
            status: record.status === 1 ? 1 : 0,
          }
        : EMPTY_FORM,
    )
  }, [open, record, reset])

  const submitting = createMutation.isPending || updateMutation.isPending

  const submit = handleSubmit((values) => {
    const onError = (error: unknown) => message.error(errorMessage(error))
    // 校验已保证必填，这里仅用于收窄类型
    const category = values.category
    if (!category) return

    const payload = {
      name: values.name.trim(),
      category,
      description: values.description.trim(),
      durationMinutes: values.durationMinutes,
      priceCents: parseYuanToFen(values.price) ?? 0,
      depositCents: parseYuanToFen(values.deposit) ?? 0,
      status: values.status,
    }

    if (record) {
      updateMutation.mutate(
        { id: record.id, payload },
        {
          onSuccess: () => {
            message.success('服务项目已更新')
            onClose()
          },
          onError,
        },
      )
      return
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        message.success('服务项目已创建')
        onClose()
      },
      onError,
    })
  })

  return (
    <Drawer
      title={isEdit ? '编辑服务项目' : '新增服务项目'}
      width={480}
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
        <FormField label="服务名称" required error={errors.name?.message}>
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                maxLength={128}
                placeholder="请输入服务名称"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        <FormField label="服务分类" required error={errors.category?.message}>
          <Controller
            control={control}
            name="category"
            render={({ field, fieldState }) => (
              <Select
                value={field.value ?? undefined}
                onChange={(value) => field.onChange(value ?? null)}
                onBlur={field.onBlur}
                options={SERVICE_CATEGORY_OPTIONS}
                placeholder="请选择服务分类"
                status={fieldState.error ? 'error' : undefined}
                className="w-full"
              />
            )}
          />
        </FormField>

        <FormField label="服务描述" error={errors.description?.message}>
          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <Input.TextArea
                {...field}
                rows={3}
                maxLength={512}
                showCount
                placeholder="请输入服务描述"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        <FormField
          label="服务时长"
          required
          error={errors.durationMinutes?.message}
          extra={`以 ${SERVICE_DURATION_STEP} 分钟为步进，影响可售时段的拆分粒度`}
        >
          <Controller
            control={control}
            name="durationMinutes"
            render={({ field, fieldState }) => (
              <InputNumber
                value={field.value}
                onChange={(value) => field.onChange(value ?? Number.NaN)}
                min={1}
                step={SERVICE_DURATION_STEP}
                addonAfter="分钟"
                className="w-full"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        <FormField
          label="价格"
          required
          error={errors.price?.message}
          extra="以元录入，按分存储；修改不影响已创建预约"
        >
          <Controller
            control={control}
            name="price"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                addonBefore="¥"
                placeholder="0.00"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        <FormField
          label="定金"
          required
          error={errors.deposit?.message}
          extra="以元录入，按分存储；修改不影响已创建预约"
        >
          <Controller
            control={control}
            name="deposit"
            render={({ field, fieldState }) => (
              <Input
                {...field}
                addonBefore="¥"
                placeholder="0.00"
                status={fieldState.error ? 'error' : undefined}
              />
            )}
          />
        </FormField>

        <FormField label="状态" required error={errors.status?.message}>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Radio.Group
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                options={[
                  { label: '上架', value: 1 },
                  { label: '下架', value: 0 },
                ]}
              />
            )}
          />
        </FormField>
      </form>
    </Drawer>
  )
}
