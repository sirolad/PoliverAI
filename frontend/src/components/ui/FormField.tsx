import * as React from 'react'
import ErrorText from './ErrorText'

type Props = {
  id: string
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  error?: string | boolean | undefined
}

export default function FormField({ id, label, icon, children, error }: Props) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400">{icon}</span>
        ) : null}
        {children}
      </div>
      <ErrorText error={error} />
    </div>
  )
}
