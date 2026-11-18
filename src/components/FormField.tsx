import type { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  extra?: string
  children: ReactNode
}

/** 通用表单字段：标签 + 必填标记 + 错误文案（BTD §12.2） */
export function FormField({ label, required, error, extra, children }: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-700">
        {required ? <span className="mr-1 text-red-500">*</span> : null}
        {label}
      </span>
      {children}
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
      {!error && extra ? <span className="mt-1 block text-xs text-slate-400">{extra}</span> : null}
    </label>
  )
}
