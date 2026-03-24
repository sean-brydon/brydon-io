"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { EducationIcon } from "@/components/tiptap-icons/education-icon"

// --- UI Utils ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

/**
 * Configuration for the education block functionality
 */
export interface UseEducationBlockConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when education block is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful insertion.
   */
  onInserted?: () => void
}

/**
 * Checks if an education block can be inserted in the current editor state
 */
export function canInsertEducationBlock(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("educationBlock", editor)) return false
  return true
}

/**
 * Inserts an education block into the editor
 */
export function insertEducationBlock(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertEducationBlock(editor)) return false

  try {
    editor.chain().focus().setEducationBlock().run()
    return true
  } catch {
    return false
  }
}

/**
 * Determines if the education block button should be shown
 */
export function shouldShowButton(props: {
  editor: Editor | null
  hideWhenUnavailable: boolean
}): boolean {
  const { editor, hideWhenUnavailable } = props

  if (!editor) return false

  if (!hideWhenUnavailable) {
    return true
  }

  if (!editor.isEditable) return false

  if (!isNodeInSchema("educationBlock", editor)) return false

  return canInsertEducationBlock(editor)
}

/**
 * Custom hook that provides education block functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyEducationButton() {
 *   const { isVisible, handleInsert, canInsert } = useEducationBlock()
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleInsert} disabled={!canInsert}>Education</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedEducationButton() {
 *   const { isVisible, handleInsert, canInsert, label } = useEducationBlock({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onInserted: () => console.log('Education block inserted!')
 *   })
 *
 *   if (!isVisible) return null
 *
 *   return (
 *     <MyButton
 *       onClick={handleInsert}
 *       aria-label={label}
 *       disabled={!canInsert}
 *     >
 *       Insert Education
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useEducationBlock(config?: UseEducationBlockConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canInsert = canInsertEducationBlock(editor)
  const isActive = editor?.isActive("educationBlock") || false

  useEffect(() => {
    if (!editor) return

    const handleSelectionUpdate = () => {
      setIsVisible(shouldShowButton({ editor, hideWhenUnavailable }))
    }

    handleSelectionUpdate()

    editor.on("selectionUpdate", handleSelectionUpdate)

    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate)
    }
  }, [editor, hideWhenUnavailable])

  const handleInsert = useCallback(() => {
    if (!editor) return false

    const success = insertEducationBlock(editor)
    if (success) {
      onInserted?.()
    }
    return success
  }, [editor, onInserted])

  return {
    isVisible,
    isActive,
    handleInsert,
    canInsert,
    label: "Education",
    Icon: EducationIcon,
  }
}
