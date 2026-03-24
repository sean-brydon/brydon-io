"use client"

import { forwardRef, useCallback } from "react"

// --- Tiptap UI ---
import type { UseTechStackBlockConfig } from "@/components/tiptap-ui/tech-stack-block-button"
import { useTechStackBlock } from "@/components/tiptap-ui/tech-stack-block-button"

// --- Hooks ---
import { useTiptapEditor } from "@/hooks/use-tiptap-editor"

// --- UI Primitives ---
import type { ButtonProps } from "@/components/tiptap-ui-primitive/button"
import { Button } from "@/components/tiptap-ui-primitive/button"

export interface TechStackBlockButtonProps
  extends Omit<ButtonProps, "type">,
    UseTechStackBlockConfig {
  /**
   * Optional text to display alongside the icon.
   */
  text?: string
}

/**
 * Button component for inserting a tech stack block in a Tiptap editor.
 *
 * For custom button implementations, use the `useTechStackBlock` hook instead.
 */
export const TechStackBlockButton = forwardRef<
  HTMLButtonElement,
  TechStackBlockButtonProps
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
      useTechStackBlock({
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
        tooltip="Tech Stack"
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

TechStackBlockButton.displayName = "TechStackBlockButton"
