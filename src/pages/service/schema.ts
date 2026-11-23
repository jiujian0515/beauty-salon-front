import { z } from 'zod'
import { MAX_AMOUNT_FEN } from '@/constants/constants'
import { parseYuanToFen } from '@/utils/money'
import { SERVICE_CATEGORY } from '@/types/domain'

const nameSchema = z.string().trim().min(1, '请输入服务名称').max(128, '服务名称最长 128 个字符')

/** 分类必填：界面展示中文名，提交时只传 code */
const categorySchema = z
  .enum([SERVICE_CATEGORY.SPA_BODY, SERVICE_CATEGORY.SPA_FACE])
  .nullable()
  .superRefine((value, ctx) => {
    if (value === null) {
      ctx.addIssue({ code: 'custom', message: '请选择服务分类' })
    }
  })

const descriptionSchema = z.string().trim().max(512, '服务描述最长 512 个字符')

const durationSchema = z
  .number({ message: '请输入服务时长' })
  .int('时长须为整数')
  .min(1, '服务时长至少 1 分钟')

const moneySchema = z
  .string()
  .trim()
  .min(1, '请输入金额')
  .refine((value) => {
    const fen = parseYuanToFen(value)
    return fen !== null && fen >= 0 && fen <= MAX_AMOUNT_FEN
  }, '请输入 0 ~ 100000 元之间的金额')

const statusSchema = z.union([z.literal(1), z.literal(0)])

/** 新增与编辑共用字段结构，保证表单类型统一 */
export const serviceItemSchema = z.object({
  name: nameSchema,
  category: categorySchema,
  description: descriptionSchema,
  durationMinutes: durationSchema,
  price: moneySchema,
  deposit: moneySchema,
  status: statusSchema,
})

export type ServiceItemForm = z.infer<typeof serviceItemSchema>
