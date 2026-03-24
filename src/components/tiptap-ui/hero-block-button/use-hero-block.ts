"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { HeroIcon } from "@/components/tiptap-icons/hero-icon"

// --- UI Utils ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

/**
 * Configuration for the Hero block functionality
 */
export interface UseHeroBlockConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when Hero block is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful insertion.
   */
  onInserted?: () => void
}

/**
 * Checks if a Hero block can be inserted in the current editor state
 */
export function canInsertHeroBlock(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("heroBlock", editor)) return false
  return true
}

/**
 * Inserts a Hero block into the editor
 */
export function insertHeroBlock(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertHeroBlock(editor)) return false

  try {
    editor.chain().focus().setHeroBlock().run()
    return true
  } catch {
    return false
  }
}

/**
 * Determines if the Hero block button should be shown
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

  if (!isNodeInSchema("heroBlock", editor)) return false

  return canInsertHeroBlock(editor)
}

/**
 * Custom hook that provides Hero block functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyHeroButton() {
 *   const { isVisible, handleInsert, canInsert } = useHeroBlock()
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleInsert} disabled={!canInsert}>Hero</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedHeroButton() {
 *   const { isVisible, handleInsert, canInsert, label } = useHeroBlock({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onInserted: () => console.log('Hero block inserted!')
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
 *       Insert Hero Section
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useHeroBlock(config?: UseHeroBlockConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canInsert = canInsertHeroBlock(editor)
  const isActive = editor?.isActive("heroBlock") || false

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

    const success = insertHeroBlock(editor)
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
    label: "Hero Section",
    Icon: HeroIcon,
  }
}
