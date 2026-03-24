"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
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
// Node-specific SCSS for proper rendering of tiptap content blocks.
// We intentionally do NOT import simple-editor.scss here — it sets
// global body/html styles that conflict with the dashboard layout.
// Instead we use our own scoped post-editor.scss.
import "./post-editor.scss"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PostEditorProps {
  mode: "new" | "edit"
  post?: {
    id: string
    slug: string
    title: string
    description: string | null
    content: string
    status: string
    coverImage: string | null
    tags: string[] | null
    publishedAt: string | null
  }
  username?: string
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// ─── Toolbar (extracted from SimpleEditor, ThemeToggle removed) ─────────────────

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

// ─── PostEditor Component ───────────────────────────────────────────────────────

export function PostEditor({ mode, post, username }: PostEditorProps) {
  const router = useRouter()
  const isMobile = useIsBreakpoint()
  const { height } = useWindowSize()
  const [mobileView, setMobileView] = useState<"main" | "highlighter" | "link">(
    "main"
  )
  const toolbarRef = useRef<HTMLDivElement>(null)

  // ── Form state ──────────────────────────────────────────────────────
  const [title, setTitle] = useState(post?.title ?? "")
  const [slug, setSlug] = useState(post?.slug ?? "")
  const [slugManual, setSlugManual] = useState(mode === "edit")
  const [description, setDescription] = useState(post?.description ?? "")
  const [tags, setTags] = useState(post?.tags?.join(", ") ?? "")
  const [status, setStatus] = useState(post?.status ?? "draft")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metaOpen, setMetaOpen] = useState(false)

  // ── Tiptap Editor ───────────────────────────────────────────────────
  const editor = useEditor({
    immediatelyRender: false,
    editorProps: {
      attributes: {
        autocomplete: "off",
        autocorrect: "off",
        autocapitalize: "off",
        "aria-label": "Post content editor",
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
    ],
    content: post?.content ?? "",
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

  // ── Auto-slug from title (only in new mode, only if not manually edited) ────
  const handleTitleChange = useCallback(
    (value: string) => {
      setTitle(value)
      if (!slugManual) {
        setSlug(slugify(value))
      }
    },
    [slugManual]
  )

  const handleSlugChange = useCallback((value: string) => {
    setSlugManual(true)
    setSlug(slugify(value))
  }, [])

  // ── Parse tags ──────────────────────────────────────────────────────
  const parseTags = useCallback((): string[] => {
    return tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  }, [tags])

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (targetStatus: "draft" | "published") => {
      if (!editor) return
      if (!title.trim()) {
        setError("Title is required")
        return
      }
      if (!slug.trim()) {
        setError("Slug is required")
        return
      }

      setSaving(true)
      setError(null)

      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
        content: editor.getHTML(),
        status: targetStatus,
        tags: parseTags(),
      }

      try {
        if (mode === "new") {
          const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || `Failed to create post (${res.status})`)
          }

          const created = await res.json()
          router.push(`/dashboard/posts/${created.id}/edit`)
        } else if (post) {
          const res = await fetch(`/api/posts/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

          if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.error || `Failed to update post (${res.status})`)
          }

          setStatus(targetStatus)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setSaving(false)
      }
    },
    [editor, title, slug, description, parseTags, mode, post, router]
  )

  // ── Delete ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    if (!post) return
    if (!confirm("Delete this post? This cannot be undone.")) return

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Failed to delete post (${res.status})`)
      }

      router.push("/dashboard/posts")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setDeleting(false)
    }
  }, [post, router])

  // ── Handle title keydown (Enter → focus editor) ─────────────────────
  const handleTitleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        editor?.commands.focus("start")
      }
    },
    [editor]
  )

  const isDisabled = saving || deleting
  const [saveSuccess, setSaveSuccess] = useState(false)

  // ── Keyboard shortcut: Ctrl/Cmd+S saves draft ──────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave(status === "published" ? "published" : "draft").then(() => {
          setSaveSuccess(true)
          setTimeout(() => setSaveSuccess(false), 2000)
        })
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handleSave, status])

  return (
    <div className="post-editor-overlay fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg)" }}>
      {/* ── Header Bar ────────────────────────────────────────────────── */}
      <header
        className="shrink-0 flex items-center gap-3 px-4 h-12 border-b"
        style={{ borderColor: "var(--border)", background: "var(--bg)" }}
      >
        <Link
          href="/dashboard/posts"
          className="text-xs no-underline flex items-center gap-1"
          style={{ color: "var(--text-muted)" }}
        >
          ← posts
        </Link>

        <div className="mx-2 h-4 w-px" style={{ background: "var(--border)" }} />

        {/* Slug display */}
        <span
          className="text-[11px] font-mono truncate max-w-[200px] hidden sm:inline"
          style={{ color: "var(--text-muted)" }}
          title={slug || "no-slug"}
        >
          /{slug || "…"}
        </span>

        <div className="flex-1" />

        {/* Status badge */}
        <span
          className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded"
          style={{
            background: status === "published" ? "var(--accent)" : "var(--card-bg)",
            color: status === "published" ? "#fff" : "var(--text-muted)",
            border: status !== "published" ? "1px solid var(--border)" : "none",
          }}
        >
          {status}
        </span>

        {/* Error indicator */}
        {error && (
          <span className="text-[11px] text-red-500 max-w-[200px] truncate" title={error}>
            {error}
          </span>
        )}

        {/* Save success flash */}
        {saveSuccess && !error && (
          <span className="text-[11px] text-green-500">saved ✓</span>
        )}

        {/* Meta toggle */}
        <button
          type="button"
          onClick={() => setMetaOpen((o) => !o)}
          className="text-[11px] px-2 py-1 rounded transition-colors"
          style={{
            color: "var(--text-muted)",
            background: metaOpen ? "var(--card-bg)" : "transparent",
            border: "1px solid var(--border)",
          }}
        >
          {metaOpen ? "hide meta" : "meta"}
        </button>

        {/* Save as draft */}
        <button
          type="button"
          onClick={() => handleSave("draft")}
          disabled={isDisabled}
          className="text-[11px] px-3 py-1 rounded transition-colors disabled:opacity-50"
          style={{
            color: "var(--text-muted)",
            border: "1px solid var(--border)",
            background: "var(--card-bg)",
          }}
        >
          {saving ? "saving…" : "save draft"}
        </button>

        {/* Publish */}
        <button
          type="button"
          onClick={() => handleSave("published")}
          disabled={isDisabled}
          className="text-[11px] px-3 py-1 rounded transition-colors disabled:opacity-50"
          style={{
            background: "var(--accent)",
            color: "#fff",
            border: "none",
          }}
        >
          {saving ? "saving…" : "publish"}
        </button>

        {/* Delete (edit mode only) */}
        {mode === "edit" && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDisabled}
            className="text-[11px] px-2 py-1 rounded transition-colors disabled:opacity-50"
            style={{
              color: "#ef4444",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              background: "transparent",
            }}
          >
            {deleting ? "deleting…" : "delete"}
          </button>
        )}
      </header>

      {/* ── Collapsible Metadata Panel ───────────────────────────────── */}
      {metaOpen && (
        <div
          className="post-editor-meta shrink-0 px-4 py-3 border-b grid grid-cols-1 sm:grid-cols-2 gap-3"
          style={{ borderColor: "var(--border)", background: "var(--card-bg)" }}
        >
          {/* Slug */}
          <div>
            <label
              className="block text-[10px] uppercase tracking-wider mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              slug
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="post-slug"
              className="w-full text-xs px-2 py-1.5 rounded font-mono"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label
              className="block text-[10px] uppercase tracking-wider mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description…"
              className="w-full text-xs px-2 py-1.5 rounded"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
          </div>

          {/* Tags */}
          <div className="sm:col-span-2">
            <label
              className="block text-[10px] uppercase tracking-wider mb-1"
              style={{ color: "var(--text-muted)" }}
            >
              tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="next.js, react, tutorial"
              className="w-full text-xs px-2 py-1.5 rounded"
              style={{
                background: "var(--bg)",
                color: "var(--text)",
                border: "1px solid var(--border)",
              }}
            />
          </div>
        </div>
      )}

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

          {/* Title + Content */}
          <div className="max-w-[720px] mx-auto w-full px-6 py-8">
            {/* Title field */}
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              placeholder="Untitled"
              className="post-editor-title w-full text-3xl md:text-4xl bg-transparent border-none outline-none mb-6"
              style={{
                color: "var(--text)",
              }}
              autoFocus={mode === "new"}
            />

            {/* Tiptap editor content */}
            <EditorContent
              editor={editor}
              role="presentation"
              className="post-editor-content"
            />
          </div>
        </EditorContext.Provider>
      </div>
    </div>
  )
}
