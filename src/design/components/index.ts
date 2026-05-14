// src/design/components/index.ts
// Single export point for design primitives.
// Consumed by: any UI component (import { Button } from '@/design/components').
//
// This is the ONLY barrel file allowed under the codebase conventions. All other
// modules use named exports from specific files.
export { Button } from './Button'
export type { ButtonProps } from './Button'
export { IconButton } from './IconButton'
export type { IconButtonProps } from './IconButton'
export { Modal } from './Modal'
export type { ModalProps } from './Modal'
export { Popover } from './Popover'
export type { PopoverProps, PopoverPlacement } from './Popover'
export { ContextMenu } from './ContextMenu'
export type { ContextMenuProps, ContextMenuItem } from './ContextMenu'
export { Tooltip } from './Tooltip'
export type { TooltipProps } from './Tooltip'
