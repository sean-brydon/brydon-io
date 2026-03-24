"use client"

import { forwardRef, useCallback } from "react"

// --- Tiptap UI ---
import type { UseGitHubBlockConfig } from "@/components/tiptap-ui/github-block-button"
import { useGitHubBlock } from "@/components/tiptap-ui/github-block-button"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

export interface GitHubBlockButtonProps
  extends Omit<ButtonProps, "type">,
    UseGitHubBlockConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
}

/**
 * Button component for inserting a GitHub contributions block in a Tiptap editor.
 *
 * For custom button implementations, use the `useGitHubBlock` hook instead.
 */
export const GitHubBlockButton = forwardRef<
  HTMLButtonElement,
  GitHubBlockButtonProps
>(
  (
    {
      editor: providedEditor,
      text,
      hideWhenUnavailable = false,
      onInserted,
      onClick,
      children,
      ...buttonProps
    },
    ref
  ) => {
    const { editor } = useTiptapEditor(providedEditor)
    const { isVisible, canInsert, isActive, handleInsert, label, Icon } =
      useGitHubBlock({
        editor,
        hideWhenUnavailable,
        onInserted,
      })

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        handleInsert()
      },
      [handleInsert, onClick]
    )

    if (!isVisible) {
      return null
    }

    return (
      <Button
        type="button"
        variant="ghost"
        data-active-state={isActive ? "on" : "off"}
        role="button"
        tabIndex={-1}
        disabled={!canInsert}
        data-disabled={!canInsert}
        aria-label={label}
        tooltip="GitHub Contributions"
        onClick={handleClick}
        {...buttonProps}
        ref={ref}
      >
        {children ?? (
          <>
            <Icon className="tiptap-button-icon" />
            {text && <span className="tiptap-button-text">{text}</span>}
          </>
        )}
      </Button>
    )
  }
)

GitHubBlockButton.displayName = "GitHubBlockButton"
