import { formatMoney } from '@/utils/money'

export interface MoneyTextProps {
  value: number | null | undefined
  className?: string
}

/** 金额统一出口：整数分进，格式化后出（BTD §8.1） */
export function MoneyText({ value, className }: MoneyTextProps) {
  return <span className={className}>{formatMoney(value)}</span>
}
