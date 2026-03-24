"use client"

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

// --- Tiptap Node Extensions ---
import { HorizontalRule } from "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node-extension"

// --- Custom Block Extensions ---
import { CurrentlyBlock } from "@/components/tiptap-extension/currently-block/currently-block-extension"
import { TechStackBlock } from "@/components/tiptap-extension/tech-stack-block/tech-stack-block-extension"
import { GitHubBlock } from "@/components/tiptap-extension/github-block/github-block-extension"
import { ContactBlockExtension } from "@/components/tiptap-extension/contact-block"
import { EducationBlock } from "@/components/tiptap-extension/education-block/education-block-extension"
import { HeroBlock } from "@/components/tiptap-extension/hero-block/hero-block-extension"

// --- Node Styles ---
import "@/components/tiptap-node/blockquote-node/blockquote-node.scss"
import "@/components/tiptap-node/code-block-node/code-block-node.scss"
import "@/components/tiptap-node/horizontal-rule-node/horizontal-rule-node.scss"
import "@/components/tiptap-node/list-node/list-node.scss"
import "@/components/tiptap-node/image-node/image-node.scss"
import "@/components/tiptap-node/heading-node/heading-node.scss"
import "@/components/tiptap-node/paragraph-node/paragraph-node.scss"

// --- Custom Block Styles ---
import "@/components/tiptap-extension/currently-block/currently-block.scss"
import "@/components/tiptap-extension/tech-stack-block/tech-stack-block.scss"
import "@/components/tiptap-extension/contact-block/contact-block.scss"
import "@/components/tiptap-extension/education-block/education-block.scss"
import "@/components/tiptap-extension/github-block/github-block.scss"
import "@/components/tiptap-extension/hero-block/hero-block.scss"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ProfileRendererProps {
  content: string
  className?: string
}

// ─── ProfileRenderer Component ──────────────────────────────────────────────────

/**
 * Read-only tiptap renderer for public profile pages.
 *
 * Uses the same extensions and NodeView components as the profile editor
 * (`tiptap-editor.tsx`) so that custom blocks (TechStack, GitHub, Contact,
 * Education, Currently) render their display-mode views via
 * `editor.isEditable === false`.
 */
export function ProfileRenderer({ content, className }: ProfileRendererProps) {
  const editor = useEditor({
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "profile-renderer",
      },
    },
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        link: {
          openOnClick: true,
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
      // Custom profile blocks
      CurrentlyBlock,
      TechStackBlock,
      GitHubBlock,
      ContactBlockExtension,
      EducationBlock,
      HeroBlock,
    ],
    content: content || "",
  })

  return (
    <EditorContext.Provider value={{ editor }}>
      <EditorContent
        editor={editor}
        role="presentation"
        className={className}
      />
    </EditorContext.Provider>
  )
}
