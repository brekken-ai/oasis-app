// src/design/components/IconButton.tsx
// Square icon-only button with accessible label. Variants: ghost | default. Sizes: sm | md.
// Consumed by: toolbars, icon rails, inline action menus throughout the app.
// Depends on: design tokens (var(--card), var(--card-2), etc.) defined in src/design/tokens.css.
import { ButtonHTMLAttributes, forwardRef } from 'react'
import { LucideIcon } from 'lucide-react'
import styles from './IconButton.module.css'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon
  label: string
  size?: 'sm' | 'md'
  variant?: 'default' | 'ghost'
}

const iconSizeMap: Record<'sm' | 'md', number> = {
  sm: 14,
  md: 16,
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, label, size = 'md', variant = 'ghost', className, ...rest }, ref) => {
    const cls = [styles.iconButton, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ')
    return (
      <button ref={ref} className={cls} aria-label={label} title={label} {...rest}>
        <Icon size={iconSizeMap[size]} strokeWidth={1.75} />
      </button>
    )
  },
)
IconButton.displayName = 'IconButton'
