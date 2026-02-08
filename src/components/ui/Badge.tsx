import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import type { RiskLevel } from '@/types'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline' | 'secondary' | 'info'
  size?: 'sm' | 'md'
}

const Badge = ({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: BadgeProps) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-risk-green-light text-green-800',
    warning: 'bg-risk-amber-light text-amber-800',
    danger: 'bg-risk-red-light text-red-800',
    outline: 'border border-slate-200 text-slate-600 bg-white',
    secondary: 'bg-slate-200 text-slate-600',
    info: 'bg-sky-100 text-sky-800',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}

// Risk level specific badge
export interface RiskBadgeProps extends Omit<BadgeProps, 'variant'> {
  level: RiskLevel
}

const RiskBadge = ({ level, className, ...props }: RiskBadgeProps) => {
  const variantMap: Record<RiskLevel, BadgeProps['variant']> = {
    green: 'success',
    amber: 'warning',
    red: 'danger',
  }

  const labelMap: Record<RiskLevel, string> = {
    green: 'Green',
    amber: 'Amber',
    red: 'Red',
  }

  return (
    <Badge variant={variantMap[level]} className={className} {...props}>
      <span
        className={cn(
          'w-2 h-2 rounded-full mr-1.5',
          level === 'green' && 'bg-risk-green',
          level === 'amber' && 'bg-risk-amber',
          level === 'red' && 'bg-risk-red'
        )}
      />
      {labelMap[level]}
    </Badge>
  )
}

export { Badge, RiskBadge }
