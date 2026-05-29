'use client'

/**
 * Editable — generic dispatcher for inline-editable content.
 *
 * Phase 1 supports text/multiline (delegates to EditableText). `image` is added
 * in Phase 2 (EditableImage). Keeping a single entry point means call sites use
 * one consistent API and future kinds slot in without touching them.
 */

import React, { ElementType } from 'react'
import { EditableText } from './EditableText'

type CommonProps = {
  id?: string
  label: string
  className?: string
}

type TextProps = CommonProps & {
  kind?: 'text' | 'multiline'
  value: string
  onSave: (next: string) => Promise<void>
  as?: ElementType
  placeholder?: string
  renderDisplay?: (value: string) => React.ReactNode
  editorNote?: React.ReactNode
  editorAction?: { label: string; onClick: () => void | Promise<void> }
}

export type EditableProps = TextProps

export function Editable(props: EditableProps) {
  const { kind = 'text', ...rest } = props
  return <EditableText {...rest} multiline={kind === 'multiline'} />
}

export { EditableText }
