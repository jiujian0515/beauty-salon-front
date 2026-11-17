import { formatDurationMinutes } from '@/utils/datetime'

export interface DurationTextProps {
  minutes: number | null | undefined
  className?: string
}

export function DurationText({ minutes, className }: DurationTextProps) {
  return <span className={className}>{formatDurationMinutes(minutes)}</span>
}
