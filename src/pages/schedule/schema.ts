import { z } from 'zod'

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '请选择日期')

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '请选择时间')

const capacitySchema = z
  .number({ message: '请输入容量' })
  .int('容量必须为整数')
  .min(1, '容量至少为 1')

const slotMinutesSchema = z
  .number({ message: '请输入拆分步长' })
  .int('拆分步长必须为整数')
  .min(5, '拆分步长至少 5 分钟')
  .max(480, '拆分步长最多 480 分钟')

const statusSchema = z.union([z.literal(1), z.literal(0)])

function minutesOf(time: string): number {
  const [hour = '0', minute = '0'] = time.split(':')
  return Number(hour) * 60 + Number(minute)
}

/** 校验窗口：开始早于结束，且时长是拆分步长的整数倍 */
function checkWindow(
  values: { startTime: string; endTime: string; slotMinutes: number },
  ctx: z.RefinementCtx,
): void {
  const start = minutesOf(values.startTime)
  const end = minutesOf(values.endTime)
  if (start >= end) {
    ctx.addIssue({ code: 'custom', path: ['endTime'], message: '结束时间必须晚于开始时间' })
    return
  }
  if ((end - start) % values.slotMinutes !== 0) {
    ctx.addIssue({
      code: 'custom',
      path: ['slotMinutes'],
      message: `窗口时长需为拆分步长 ${values.slotMinutes} 分钟的整数倍`,
    })
  }
}

const baseScheduleSchema = z.object({
  resourceId: z.string().min(1, '请选择资源'),
  scheduleDate: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  capacity: capacitySchema,
  slotMinutes: slotMinutesSchema,
  status: statusSchema,
})

export const scheduleSchema = baseScheduleSchema.superRefine(checkWindow)

export type ScheduleForm = z.infer<typeof baseScheduleSchema>

const baseBatchScheduleSchema = z.object({
  resourceId: z.string().min(1, '请选择资源'),
  startDate: dateSchema,
  endDate: dateSchema,
  weekdays: z.array(z.number().int().min(1).max(7)),
  startTime: timeSchema,
  endTime: timeSchema,
  capacity: capacitySchema,
  slotMinutes: slotMinutesSchema,
  status: statusSchema,
})

export const batchScheduleSchema = baseBatchScheduleSchema.superRefine((values, ctx) => {
  if (values.endDate < values.startDate) {
    ctx.addIssue({ code: 'custom', path: ['endDate'], message: '结束日期不能早于开始日期' })
    return
  }
  checkWindow(values, ctx)
})

export type BatchScheduleForm = z.infer<typeof baseBatchScheduleSchema>

/** 批量排班的星期选项：1=周一 ... 7=周日（与后端一致） */
export const WEEKDAY_OPTIONS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 7 },
]
