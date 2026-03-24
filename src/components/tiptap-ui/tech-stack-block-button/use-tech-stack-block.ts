"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { TechStackIcon } from "@/components/tiptap-icons/tech-stack-icon"

// --- UI Utils ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

/**
 * Configuration for the tech stack block functionality
 */
export interface UseTechStackBlockConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when tech stack block is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful insertion.
   */
  onInserted?: () => void
}

/**
 * Checks if a tech stack block can be inserted in the current editor state
 */
export function canInsertTechStackBlock(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("techStackBlock", editor)) return false
  return true
}

/**
 * Inserts a tech stack block into the editor
 */
export function insertTechStackBlock(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertTechStackBlock(editor)) return false

  try {
    editor.chain().focus().setTechStackBlock().run()
    return true
  } catch {
    return false
  }
}

/**
 * Determines if the tech stack block button should be shown
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

  if (!isNodeInSchema("techStackBlock", editor)) return false

  return canInsertTechStackBlock(editor)
}

/**
 * Custom hook that provides tech stack block functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyTechStackButton() {
 *   const { isVisible, handleInsert, canInsert } = useTechStackBlock()
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleInsert} disabled={!canInsert}>Tech Stack</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedTechStackButton() {
 *   const { isVisible, handleInsert, canInsert, label } = useTechStackBlock({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onInserted: () => console.log('Tech stack block inserted!')
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
 *       Insert Tech Stack
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useTechStackBlock(config?: UseTechStackBlockConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canInsert = canInsertTechStackBlock(editor)
  const isActive = editor?.isActive("techStackBlock") || false

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

    const success = insertTechStackBlock(editor)
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
    label: "Tech Stack",
    Icon: TechStackIcon,
  }
}
