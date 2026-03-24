"use client"

import { useCallback, useEffect, useState } from "react"
import type { Editor } from "@tiptap/react"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- Icons ---
import { GitHubIcon } from "@/components/tiptap-icons/github-icon"

// --- UI Utils ---
import { isNodeInSchema } from "@/lib/tiptap-utils"

/**
 * Configuration for the GitHub block functionality
 */
export interface UseGitHubBlockConfig {
  /**
   * The Tiptap editor instance.
   */
  editor?: Editor | null
  /**
   * Whether the button should hide when GitHub block is not available.
   * @default false
   */
  hideWhenUnavailable?: boolean
  /**
   * Callback function called after a successful insertion.
   */
  onInserted?: () => void
}

/**
 * Checks if a GitHub block can be inserted in the current editor state
 */
export function canInsertGitHubBlock(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!isNodeInSchema("githubBlock", editor)) return false
  return true
}

/**
 * Inserts a GitHub block into the editor
 */
export function insertGitHubBlock(editor: Editor | null): boolean {
  if (!editor || !editor.isEditable) return false
  if (!canInsertGitHubBlock(editor)) return false

  try {
    editor.chain().focus().setGitHubBlock().run()
    return true
  } catch {
    return false
  }
}

/**
 * Determines if the GitHub block button should be shown
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

  if (!isNodeInSchema("githubBlock", editor)) return false

  return canInsertGitHubBlock(editor)
}

/**
 * Custom hook that provides GitHub block functionality for Tiptap editor
 *
 * @example
 * ```tsx
 * // Simple usage
 * function MyGitHubButton() {
 *   const { isVisible, handleInsert, canInsert } = useGitHubBlock()
 *
 *   if (!isVisible) return null
 *
 *   return <button onClick={handleInsert} disabled={!canInsert}>GitHub</button>
 * }
 *
 * // Advanced usage with configuration
 * function MyAdvancedGitHubButton() {
 *   const { isVisible, handleInsert, canInsert, label } = useGitHubBlock({
 *     editor: myEditor,
 *     hideWhenUnavailable: true,
 *     onInserted: () => console.log('GitHub block inserted!')
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
 *       Insert GitHub Contributions
 *     </MyButton>
 *   )
 * }
 * ```
 */
export function useGitHubBlock(config?: UseGitHubBlockConfig) {
  const {
    editor: providedEditor,
    hideWhenUnavailable = false,
    onInserted,
  } = config || {}

  const { editor } = useTiptapEditor(providedEditor)
  const [isVisible, setIsVisible] = useState<boolean>(true)
  const canInsert = canInsertGitHubBlock(editor)
  const isActive = editor?.isActive("githubBlock") || false

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

    const success = insertGitHubBlock(editor)
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
    label: "GitHub Contributions",
    Icon: GitHubIcon,
  }
}
