"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { EditorContent, EditorContext, useEditor } from "@tiptap/react"

// --- Tiptap Core Extensions ---
import { StarterKit } from "@tiptap/starter-kit"
import { Image } from "@tiptap/extension-image"
import { TaskItem, TaskList } from "@tiptap/extension-list"
import { TextAlign } from "@tiptap/extension-text-align"
import { Typography } from "@tiptap/extension-typography"
import { Highlight } from "@tiptap/extension-highlight"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Selection } from "@tiptap/extensions"

// --- Custom Block Extensions ---
import { CurrentlyBlock } from "@/components/tiptap-extension/currently-block/currently-block-extension"
import { TechStackBlock } from "@/components/tiptap-extension/tech-stack-block/tech-stack-block-extension"
import { GitHubBlock } from "@/components/tiptap-extension/github-block/github-block-extension"
import { ContactBlockExtension } from "@/components/tiptap-extension/contact-block/contact-block-extension"
import { EducationBlock } from "@/components/tiptap-extension/education-block/education-block-extension"
import { HeroBlock } from "@/components/tiptap-extension/hero-block/hero-block-extension"
import { getDefaultProfileContent } from "@/lib/default-profile-content"

// --- UI Primitives ---
import { Button } from "@/components/tiptap-ui-primitive/button"
import { Spacer } from "@/components/tiptap-ui-primitive/spacer"
import {
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
} from "@/components/tiptap-ui-primitive/toolbar"

// --- Tiptap Node ---
import { ImageUploadNode } from "@/components/tiptap-node/image-upload-node/image-upload-node-extension"
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Custom Block SCSS ---
import "@/components/tiptap-extension/currently-block/currently-block.scss"
import "@/components/tiptap-extension/tech-stack-block/tech-stack-block.scss"
import "@/components/tiptap-extension/github-block/github-block.scss"
import "@/components/tiptap-extension/contact-block/contact-block.scss"
import "@/components/tiptap-extension/education-block/education-block.scss"
import "@/components/tiptap-extension/hero-block/hero-block.scss"

// --- Tiptap UI ---
import { HeadingDropdownMenu } from "@/components/tiptap-ui/heading-dropdown-menu"
import { ImageUploadButton } from "@/components/tiptap-ui/image-upload-button"
import { ListDropdownMenu } from "@/components/tiptap-ui/list-dropdown-menu"
import { BlockquoteButton } from "@/components/tiptap-ui/blockquote-button"
import { CodeBlockButton } from "@/components/tiptap-ui/code-block-button"
import {
  ColorHighlightPopover,
  ColorHighlightPopoverContent,
  ColorHighlightPopoverButton,
} from "@/components/tiptap-ui/color-highlight-popover"
import {
  LinkPopover,
  LinkContent,
  LinkButton,
} from "@/components/tiptap-ui/link-popover"
import { MarkButton } from "@/components/tiptap-ui/mark-button"
import { TextAlignButton } from "@/components/tiptap-ui/text-align-button"
import { UndoRedoButton } from "@/components/tiptap-ui/undo-redo-button"

// --- Custom Block Toolbar Buttons ---
import { TechStackBlockButton } from "@/components/tiptap-ui/tech-stack-block-button"
import { GitHubBlockButton } from "@/components/tiptap-ui/github-block-button"
import { EducationBlockButton } from "@/components/tiptap-ui/education-block-button"
import { HeroBlockButton } from "@/components/tiptap-ui/hero-block-button"

// --- Icons ---
import { ArrowLeftIcon } from "@/components/tiptap-icons/arrow-left-icon"
import { HighlighterIcon } from "@/components/tiptap-icons/highlighter-icon"
import { LinkIcon } from "@/components/tiptap-icons/link-icon"

// --- Hooks ---
import { useIsBreakpoint } from "@/hooks/use-is-breakpoint"
import { useWindowSize } from "@/hooks/use-window-size"
import { useCursorVisibility } from "@/hooks/use-cursor-visibility"

// --- Lib ---
import { handleImageUpload, MAX_FILE_SIZE } from "@/lib/tiptap-utils"

// --- Styles ---
import "./profile-editor.scss"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ProfileEditorProps {
  initialContent: string
}

// ─── Sections Dropdown ──────────────────────────────────────────────────────────

function SectionsDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="profile-editor-sections-dropdown" ref={ref}>
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        aria-label="Insert section"
        tooltip="Sections"
        data-active-state={open ? "on" : "off"}
      >
        <span style={{ fontSize: 14 }}>⊞</span>
        <span className="tiptap-button-text">Sections</span>
      </Button>

      {open && (
        <div className="profile-editor-sections-menu">
          <SectionMenuItem
            emoji="✨"
            label="Hero"
            onClose={() => setOpen(false)}
            insertType="hero"
          />
          <SectionMenuItem
            emoji="📋"
            label="Currently"
            onClose={() => setOpen(false)}
            insertType="currently"
          />
          <SectionMenuItem
            emoji="💻"
            label="Tech Stack"
            onClose={() => setOpen(false)}
            insertType="techStack"
          />
          <SectionMenuItem
            emoji="🐙"
            label="GitHub"
            onClose={() => setOpen(false)}
            insertType="github"
          />
          <SectionMenuItem
            emoji="📅"
            label="Contact"
            onClose={() => setOpen(false)}
            insertType="contact"
          />
          <SectionMenuItem
            emoji="🎓"
            label="Education"
            onClose={() => setOpen(false)}
            insertType="education"
          />
        </div>
      )}
    </div>
  )
}

function SectionMenuItem({
  emoji,
  label,
  onClose,
  insertType,
}: {
  emoji: string
  label: string
  onClose: () => void
  insertType: "hero" | "currently" | "techStack" | "github" | "contact" | "education"
}) {
  // We can't use useCurrentEditor here since we're outside EditorContext consumer,
  // but this component is rendered inside EditorContext.Provider.
  // We'll use a custom event to communicate with the editor.
  return (
    <button
      type="button"
      onClick={() => {
        // Dispatch a custom event that the editor component listens to
        window.dispatchEvent(
          new CustomEvent("profile-editor-insert-block", {
            detail: { type: insertType },
          })
        )
        onClose()
      }}
    >
      <span className="sections-menu-emoji">{emoji}</span>
      {label}
    </button>
  )
}

// ─── Toolbar ────────────────────────────────────────────────────────────────────

const MainToolbarContent = ({
  onHighlighterClick,
  onLinkClick,
  isMobile,
}: {
  onHighlighterClick: () => void
  onLinkClick: () => void
  isMobile: boolean
}) => (
  <>
    <Spacer />

    <ToolbarGroup>
      <UndoRedoButton action="undo" />
      <UndoRedoButton action="redo" />
    </ToolbarGroup>

    <ToolbarSeparator />

    <ToolbarGroup>
      <HeadingDropdownMenu modal={false} levels={[1, 2, 3, 4]} />
      <ListDropdownMenu
        modal={false}
        types={["bulletList", "orderedList", "taskList"]}
      />
      <BlockquoteButton />
      <CodeBlockButton />
    </ToolbarGroup>

    <ToolbarSeparator />

    <ToolbarGroup>
      <MarkButton type="bold" />
      <MarkButton type="italic" />
      <MarkButton type="strike" />
      <MarkButton type="code" />
      <MarkButton type="underline" />
      {!isMobile ? (
        <ColorHighlightPopover />
      ) : (
        <ColorHighlightPopoverButton onClick={onHighlighterClick} />
      )}
      {!isMobile ? <LinkPopover /> : <LinkButton onClick={onLinkClick} />}
    </ToolbarGroup>

    <ToolbarSeparator />

    <ToolbarGroup>
      <MarkButton type="superscript" />
      <MarkButton type="subscript" />
    </ToolbarGroup>

    <ToolbarSeparator />

    <ToolbarGroup>
      <TextAlignButton align="left" />
      <TextAlignButton align="center" />
      <TextAlignButton align="right" />
      <TextAlignButton align="justify" />
    </ToolbarGroup>

    <ToolbarSeparator />

    <ToolbarGroup>
      <ImageUploadButton text="Add" />
    </ToolbarGroup>

    <ToolbarSeparator />

    {/* ── Sections: custom block insert buttons ── */}
    <ToolbarGroup>
      <SectionsDropdown />
    </ToolbarGroup>

    <ToolbarSeparator />

    {/* Individual custom block buttons (for quick access) */}
    <ToolbarGroup>
      <HeroBlockButton />
      <TechStackBlockButton />
      <GitHubBlockButton />
      <EducationBlockButton />
    </ToolbarGroup>

    <Spacer />
  </>
)

const MobileToolbarContent = ({
  type,
  onBack,
}: {
  type: "highlighter" | "link"
  onBack: () => void
}) => (
  <>
    <ToolbarGroup>
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeftIcon className="tiptap-button-icon" />
        {type === "highlighter" ? (
          <HighlighterIcon className="tiptap-button-icon" />
        ) : (
          <LinkIcon className="tiptap-button-icon" />
        )}
      </Button>
    </ToolbarGroup>

    <ToolbarSeparator />

    {type === "highlighter" ? (
      <ColorHighlightPopoverContent />
    ) : (
      <LinkContent />
    )}
  </>
)

// ─── ProfileEditor Component ────────────────────────────────────────────────────

export function ProfileEditor({ initialContent }: ProfileEditorProps) {
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)

  // ── Save state ──────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Tiptap Editor ───────────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Profile content editor",
        class: "simple-editor",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: false,
          enableClickSelection: true,
        },
      }),
      HorizontalRule,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      Image,
      Typography,
      Superscript,
      Subscript,
      Selection,
      ImageUploadNode.configure({
        accept: "image/*",
        maxSize: MAX_FILE_SIZE,
        limit: 3,
        upload: handleImageUpload,
        onError: (error) => console.error("Upload failed:", error),
      }),
      // Custom block extensions
      CurrentlyBlock,
      TechStackBlock,
      GitHubBlock,
      ContactBlockExtension,
      EducationBlock,
      HeroBlock,
    ],
    content: initialContent || getDefaultProfileContent(),
  })

  const rect = useCursorVisibility({
    editor,
    overlayHeight: toolbarRef.current?.getBoundingClientRect().height ?? 0,
  })

  useEffect(() => {
    if (!isMobile && mobileView !== "main") {
      setMobileView("main")
    }
  }, [isMobile, mobileView])

  // ── Listen for custom block insert events from SectionsDropdown ─────
  useEffect(() => {
    const handler = (e: Event) => {
      if (!editor) return
      const { type } = (e as CustomEvent).detail as { type: string }

      switch (type) {
        case "hero":
          editor.chain().focus().insertContent({
            type: "heroBlock",
            attrs: {
              shape1Type: "heart",
              shape2Type: "text",
              shape2Text: "SB",
              particleCount: 2000,
              height: 280,
              showBadge: true,
              badgeText: "click to morph",
            },
          }).run()
          break
        case "currently":
          editor.chain().focus().insertContent({
            type: "currentlyBlock",
            attrs: { categories: [] },
          }).run()
          break
        case "techStack":
          editor.chain().focus().insertContent({
            type: "techStackBlock",
            attrs: { groups: [{ label: "", skills: [] }] },
          }).run()
          break
        case "github":
          editor.chain().focus().insertContent({
            type: "githubBlock",
            attrs: { username: "" },
          }).run()
          break
        case "contact":
          editor.chain().focus().insertContent({
            type: "contactBlock",
            attrs: { calUsername: "", description: "" },
          }).run()
          break
        case "education":
          editor.chain().focus().insertContent({
            type: "educationBlock",
            attrs: { entries: [] },
          }).run()
          break
      }
    }

    window.addEventListener("profile-editor-insert-block", handler)
    return () => window.removeEventListener("profile-editor-insert-block", handler)
  }, [editor])

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!editor) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileHtml: editor.getHTML() }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to save profile (${res.status})`)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }, [editor])

  // ── Keyboard shortcut: Ctrl/Cmd+S saves ────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleSave])

  return (
    <div
      className="profile-editor-overlay fixed inset-0 z-50 flex flex-col"
      style={{ background: "var(--bg)" }}
    >
      {/* ── Header Bar ────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 h-12 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      >
        <Link
          href="/dashboard"
          className="text-xs no-underline flex items-center gap-1"
          style={{ color: "var(--text-muted)" }}
        >
          ← dashboard
        </Link>

        <div className="mx-2 h-4 w-px" style={{ background: "var(--border)" }} />

        <span
          className="text-xs font-medium"
          style={{ color: "var(--text)" }}
        >
          profile editor
        </span>

        <div className="flex-1" />

        {/* Error indicator */}
        {error && (
          <span
            className="text-[11px] text-red-500 max-w-[200px] truncate"
            title={error}
          >
            {error}
          </span>
        )}

        {/* Save success flash */}
        {saveSuccess && !error && (
          <span className="text-[11px] text-green-500">saved ✓</span>
        )}

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-[11px] px-3 py-1 rounded transition-colors disabled:opacity-50"
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
          }}
        >
          {saving ? "saving…" : "save"}
        </button>
      </header>

      {/* ── Editor Area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <EditorContext.Provider value={{ editor }}>
          {/* Toolbar */}
          <Toolbar
            ref={toolbarRef}
            style={{
              position: "sticky",
              top: 0,
              zIndex: 10,
              ...(isMobile
                ? {
                    bottom: `calc(100% - ${height - rect.y}px)`,
                  }
                : {}),
            }}
          >
            {mobileView === "main" ? (
              <MainToolbarContent
                onHighlighterClick={() => setMobileView("highlighter")}
                onLinkClick={() => setMobileView("link")}
                isMobile={isMobile}
              />
            ) : (
              <MobileToolbarContent
                type={mobileView === "highlighter" ? "highlighter" : "link"}
                onBack={() => setMobileView("main")}
              />
            )}
          </Toolbar>

          {/* Content */}
          <div className="max-w-[720px] mx-auto w-full px-6 py-8">
            <EditorContent
              editor={editor}
              role="presentation"
              className="profile-editor-content"
            />
          </div>
        </EditorContext.Provider>
      </div>
    </div>
  )
}
