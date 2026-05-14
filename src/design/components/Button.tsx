// src/design/components/Button.tsx
// Primary action button. Variants: primary | secondary | ghost | danger. Sizes: sm | md.
// Consumed by: any UI that needs a clickable button.
// Depends on: design tokens (var(--primary), var(--card), etc.) defined in src/design/tokens.css.
import { ButtonHTMLAttributes, forwardRef } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...rest }, ref) => {
    const cls = [styles.button, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ')
    return (
      <button ref={ref} className={cls} {...rest}>
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'
